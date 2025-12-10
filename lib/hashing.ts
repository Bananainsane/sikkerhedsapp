import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * HashingService - Backend class for cryptographic hashing operations
 * Implements SHA-2, HMAC, PBKDF2, and bcrypt as per assignment requirements
 */
export class HashingService {

  /**
   * SHA-256 Hash (Fast hash - for file integrity)
   * NOT for passwords - use bcrypt instead
   */
  static sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * SHA-512 Hash (Fast hash - for file integrity)
   */
  static sha512(data: string | Buffer): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * HMAC-SHA256 - Message Authentication Code
   * Used for file integrity verification with a secret key
   * @param data - Data to hash
   * @param key - Secret key for HMAC
   */
  static hmacSha256(data: string | Buffer, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * HMAC-SHA512 - Message Authentication Code (stronger)
   */
  static hmacSha512(data: string | Buffer, key: string): string {
    return crypto.createHmac('sha512', key).update(data).digest('hex');
  }

  /**
   * Generate a random key for HMAC
   * Key is NOT hardcoded - generated randomly per file as per assignment
   * @param length - Key length in bytes (default 32 = 256 bits)
   */
  static generateHmacKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * PBKDF2 - Password-Based Key Derivation Function 2
   * Slow hash - suitable for password hashing or key derivation
   * @param password - Password to hash
   * @param salt - Salt value
   * @param iterations - Number of iterations (higher = slower/more secure)
   * @param keyLength - Output key length in bytes
   * @param algorithm - Hash algorithm (sha256, sha512)
   */
  static pbkdf2(
    password: string,
    salt: string,
    iterations: number = 100000,
    keyLength: number = 64,
    algorithm: string = 'sha256'
  ): string {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, algorithm).toString('hex');
  }

  /**
   * Generate a random salt for PBKDF2
   * @param length - Salt length in bytes
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Bcrypt Hash - Slow hash for password storage
   * @param password - Password to hash
   * @param rounds - Cost factor (default 10)
   */
  static async bcryptHash(password: string, rounds: number = 10): Promise<string> {
    return bcrypt.hash(password, rounds);
  }

  /**
   * Bcrypt Verify - Compare password with bcrypt hash
   * @param password - Password to verify
   * @param hash - Stored bcrypt hash
   */
  static async bcryptVerify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verify HMAC - Check if data matches the stored HMAC
   * @param data - Data to verify
   * @param key - HMAC key
   * @param storedHmac - Previously computed HMAC
   * @returns true if valid, false if contaminated
   */
  static verifyHmac(data: string | Buffer, key: string, storedHmac: string): boolean {
    const computedHmac = this.hmacSha256(data, key);
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'hex'),
      Buffer.from(storedHmac, 'hex')
    );
  }

  /**
   * Hash a file buffer and return HMAC with generated key
   * @param fileBuffer - File content as Buffer
   * @returns Object with hash and key
   */
  static hashFileWithHmac(fileBuffer: Buffer): { hash: string; key: string } {
    const key = this.generateHmacKey();
    const hash = this.hmacSha256(fileBuffer, key);
    return { hash, key };
  }

  /**
   * Verify file integrity
   * @param fileBuffer - Current file content
   * @param storedHash - HMAC hash stored at upload time
   * @param key - HMAC key used at upload time
   * @returns true if "No contamination detected", false if "Contaminated"
   */
  static verifyFileIntegrity(fileBuffer: Buffer, storedHash: string, key: string): boolean {
    try {
      return this.verifyHmac(fileBuffer, key, storedHash);
    } catch {
      return false;
    }
  }

  /**
   * Hash email with salt and pepper using PBKDF2
   * Per assignment requirements: combines salt (per-user, stored in DB) + pepper (server secret, in .env)
   *
   * @param email - Plain text email address
   * @param salt - Per-user salt (stored in database)
   * @param pepper - Global pepper (from environment variable, NOT stored in DB)
   * @param iterations - Number of PBKDF2 iterations (default from .env or 100000)
   * @returns Hashed email (hex string)
   */
  static hashEmail(
    email: string,
    salt: string,
    pepper: string = process.env.EMAIL_PEPPER || 'default-pepper',
    iterations: number = parseInt(process.env.EMAIL_HASH_ITERATIONS || '100000')
  ): string {
    // Normalize email: lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Combine salt + pepper as the "salt" for PBKDF2
    // Salt is per-user (stored in DB), pepper is global (in .env, never stored in DB)
    const combinedSalt = `${salt}${pepper}`;

    // Use PBKDF2 with configurable iterations
    return this.pbkdf2(normalizedEmail, combinedSalt, iterations, 32, 'sha256');
  }

  /**
   * Generate a new salt for email hashing
   * @returns Random 16-byte salt as hex string (stored in user's record)
   */
  static generateEmailSalt(): string {
    return this.generateSalt(16);
  }

  /**
   * Verify an email matches a hashed email
   * @param email - Plain text email to verify
   * @param hashedEmail - Stored hashed email
   * @param salt - Per-user salt from database
   * @param pepper - Global pepper from environment
   * @returns true if email matches
   */
  static verifyEmail(
    email: string,
    hashedEmail: string,
    salt: string,
    pepper: string = process.env.EMAIL_PEPPER || 'default-pepper'
  ): boolean {
    const computedHash = this.hashEmail(email, salt, pepper);
    // Use timing-safe comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hashedEmail, 'hex')
      );
    } catch {
      return false;
    }
  }
}

export default HashingService;
