import crypto from 'crypto';

/**
 * EncryptionService - Backend class for cryptographic encryption operations
 * Implements AES-256-CBC, RSA-2048, and Hybrid encryption as per assignment requirements
 */
export class EncryptionService {
  // AES Configuration
  private static readonly AES_ALGORITHM = 'aes-256-cbc';
  private static readonly AES_KEY_LENGTH = 32; // 256 bits
  private static readonly AES_IV_LENGTH = 16;  // 128 bits (AES block size)

  // RSA Configuration
  private static readonly RSA_KEY_SIZE = 2048;
  private static readonly RSA_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;

  // ============================================================
  // AES SYMMETRIC ENCRYPTION
  // ============================================================

  /**
   * Generate a random AES key (256 bits)
   * @returns AES key as hex string
   */
  static generateAesKey(): string {
    return crypto.randomBytes(this.AES_KEY_LENGTH).toString('hex');
  }

  /**
   * Generate a random Initialization Vector (IV)
   * IV must be unique for each encryption operation
   * @returns IV as hex string
   */
  static generateIV(): string {
    return crypto.randomBytes(this.AES_IV_LENGTH).toString('hex');
  }

  /**
   * Encrypt data using AES-256-CBC
   * @param data - Data to encrypt (Buffer or string)
   * @param keyHex - AES key as hex string
   * @param ivHex - Initialization Vector as hex string
   * @returns Encrypted data as base64 string
   */
  static aesEncrypt(data: Buffer | string, keyHex: string, ivHex: string): string {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

    const cipher = crypto.createCipheriv(this.AES_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

    return encrypted.toString('base64');
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param encryptedBase64 - Encrypted data as base64 string
   * @param keyHex - AES key as hex string
   * @param ivHex - Initialization Vector as hex string
   * @returns Decrypted data as Buffer
   */
  static aesDecrypt(encryptedBase64: string, keyHex: string, ivHex: string): Buffer {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv(this.AES_ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decrypted;
  }

  // ============================================================
  // RSA ASYMMETRIC ENCRYPTION
  // ============================================================

  /**
   * Generate RSA key pair (2048 bits)
   * @returns Object containing publicKey and privateKey in PEM format
   */
  static generateRsaKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.RSA_KEY_SIZE,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt data using RSA public key
   * Note: RSA can only encrypt small amounts of data (< key size)
   * Used primarily for encrypting AES keys in hybrid encryption
   * @param data - Data to encrypt (typically an AES key)
   * @param publicKeyPem - RSA public key in PEM format
   * @returns Encrypted data as base64 string
   */
  static rsaEncrypt(data: string | Buffer, publicKeyPem: string): string {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: this.RSA_PADDING,
        oaepHash: 'sha256',
      },
      dataBuffer
    );

    return encrypted.toString('base64');
  }

  /**
   * Decrypt data using RSA private key
   * @param encryptedBase64 - Encrypted data as base64 string
   * @param privateKeyPem - RSA private key in PEM format
   * @returns Decrypted data as string
   */
  static rsaDecrypt(encryptedBase64: string, privateKeyPem: string): string {
    const encryptedData = Buffer.from(encryptedBase64, 'base64');

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: this.RSA_PADDING,
        oaepHash: 'sha256',
      },
      encryptedData
    );

    return decrypted.toString('utf-8');
  }

  // ============================================================
  // HYBRID ENCRYPTION (AES + RSA)
  // ============================================================

  /**
   * Encrypt file using hybrid encryption (AES for data, RSA for key)
   * Flow:
   * 1. Generate random AES key and IV
   * 2. Encrypt file with AES-CBC
   * 3. Encrypt AES key with RSA public key
   * 4. Calculate HMAC of encrypted data (Encrypt-then-MAC)
   *
   * @param fileBuffer - File content as Buffer
   * @param rsaPublicKeyPem - RSA public key for key exchange
   * @param hmacKey - Key for HMAC calculation
   * @returns Encrypted payload with all necessary components
   */
  static hybridEncrypt(
    fileBuffer: Buffer,
    rsaPublicKeyPem: string,
    hmacKey: string
  ): {
    encryptedData: string;
    encryptedKey: string;
    iv: string;
    hmac: string;
  } {
    // 1. Generate random AES key and IV
    const aesKey = this.generateAesKey();
    const iv = this.generateIV();

    // 2. Encrypt file with AES-256-CBC
    const encryptedData = this.aesEncrypt(fileBuffer, aesKey, iv);

    // 3. Encrypt AES key with RSA public key
    const encryptedKey = this.rsaEncrypt(aesKey, rsaPublicKeyPem);

    // 4. Calculate HMAC of encrypted data (Encrypt-then-MAC pattern)
    const hmac = this.calculateHmac(encryptedData, hmacKey);

    return {
      encryptedData,
      encryptedKey,
      iv,
      hmac,
    };
  }

  /**
   * Decrypt hybrid-encrypted payload
   * Flow:
   * 1. Verify HMAC for integrity
   * 2. Decrypt AES key with RSA private key
   * 3. Decrypt file with AES-CBC
   *
   * @param payload - Encrypted payload from sender
   * @param rsaPrivateKeyPem - RSA private key for decryption
   * @param hmacKey - Key for HMAC verification
   * @returns Decrypted file as Buffer, or null if integrity check fails
   */
  static hybridDecrypt(
    payload: {
      encryptedData: string;
      encryptedKey: string;
      iv: string;
      hmac: string;
    },
    rsaPrivateKeyPem: string,
    hmacKey: string
  ): { success: true; data: Buffer } | { success: false; error: string } {
    // 1. Verify HMAC first (reject tampered data before decryption)
    const calculatedHmac = this.calculateHmac(payload.encryptedData, hmacKey);
    if (!this.verifyHmac(payload.encryptedData, hmacKey, payload.hmac)) {
      return {
        success: false,
        error: 'HMAC verification failed - data has been tampered with',
      };
    }

    try {
      // 2. Decrypt AES key with RSA private key
      const aesKey = this.rsaDecrypt(payload.encryptedKey, rsaPrivateKeyPem);

      // 3. Decrypt file with AES-CBC
      const decryptedData = this.aesDecrypt(payload.encryptedData, aesKey, payload.iv);

      return { success: true, data: decryptedData };
    } catch (error) {
      return {
        success: false,
        error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================
  // HMAC FOR INTEGRITY
  // ============================================================

  /**
   * Calculate HMAC-SHA256 for data integrity
   * @param data - Data to authenticate
   * @param key - HMAC key
   * @returns HMAC as hex string
   */
  static calculateHmac(data: string | Buffer, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC using timing-safe comparison
   * @param data - Data to verify
   * @param key - HMAC key
   * @param expectedHmac - Expected HMAC value
   * @returns true if valid, false if tampered
   */
  static verifyHmac(data: string | Buffer, key: string, expectedHmac: string): boolean {
    const calculatedHmac = this.calculateHmac(data, key);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate a random HMAC key
   * @param length - Key length in bytes (default 32 = 256 bits)
   * @returns HMAC key as hex string
   */
  static generateHmacKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default EncryptionService;
