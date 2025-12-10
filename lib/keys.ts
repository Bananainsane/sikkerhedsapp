import { EncryptionService } from './encryption';
import fs from 'fs';
import path from 'path';

/**
 * KeyManager - Manages RSA key pairs for the application
 * Keys are generated once and stored in the keys directory
 */
class KeyManager {
  private static instance: KeyManager;
  private publicKey: string = '';
  private privateKey: string = '';
  private hmacKey: string = '';

  private readonly keysDir = path.join(process.cwd(), 'keys');
  private readonly publicKeyPath = path.join(this.keysDir, 'public.pem');
  private readonly privateKeyPath = path.join(this.keysDir, 'private.pem');
  private readonly hmacKeyPath = path.join(this.keysDir, 'hmac.key');

  private constructor() {
    this.initializeKeys();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  /**
   * Initialize or load keys
   */
  private initializeKeys(): void {
    // Create keys directory if it doesn't exist
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true });
    }

    // Check if keys exist
    const keysExist =
      fs.existsSync(this.publicKeyPath) &&
      fs.existsSync(this.privateKeyPath) &&
      fs.existsSync(this.hmacKeyPath);

    if (keysExist) {
      // Load existing keys
      this.publicKey = fs.readFileSync(this.publicKeyPath, 'utf-8');
      this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf-8');
      this.hmacKey = fs.readFileSync(this.hmacKeyPath, 'utf-8');
      console.log('[KeyManager] Loaded existing RSA keys');
    } else {
      // Generate new keys
      this.generateAndSaveKeys();
      console.log('[KeyManager] Generated new RSA key pair');
    }
  }

  /**
   * Generate and save new keys
   */
  private generateAndSaveKeys(): void {
    // Generate RSA key pair
    const { publicKey, privateKey } = EncryptionService.generateRsaKeyPair();
    this.publicKey = publicKey;
    this.privateKey = privateKey;

    // Generate HMAC key for integrity verification
    this.hmacKey = EncryptionService.generateHmacKey();

    // Save keys to files
    fs.writeFileSync(this.publicKeyPath, publicKey);
    fs.writeFileSync(this.privateKeyPath, privateKey);
    fs.writeFileSync(this.hmacKeyPath, this.hmacKey);

    // Set restrictive permissions on private key (Unix only)
    try {
      fs.chmodSync(this.privateKeyPath, 0o600);
      fs.chmodSync(this.hmacKeyPath, 0o600);
    } catch {
      // Ignore on Windows
    }
  }

  /**
   * Get the public key (can be shared with third parties)
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get the private key (NEVER share this)
   */
  getPrivateKey(): string {
    return this.privateKey;
  }

  /**
   * Get the HMAC key for integrity verification
   */
  getHmacKey(): string {
    return this.hmacKey;
  }

  /**
   * Regenerate all keys (for key rotation)
   */
  rotateKeys(): void {
    this.generateAndSaveKeys();
    console.log('[KeyManager] Keys rotated');
  }
}

// Export singleton instance
export const keyManager = KeyManager.getInstance();
export default keyManager;
