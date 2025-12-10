/**
 * Third-Party File Sender
 *
 * This simulates an external system sending encrypted files to our web app.
 * Implements:
 * - AES-256-CBC encryption with proper IV handling
 * - RSA key exchange (receives server's public key)
 * - HMAC-SHA256 for integrity verification (Encrypt-then-MAC)
 *
 * Usage: npx tsx send-file.ts <filepath>
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Configuration
const SERVER_URL = 'https://localhost:3000';
const PUBLIC_KEY_ENDPOINT = '/api/external/public-key';
const UPLOAD_ENDPOINT = '/api/external/upload';

// AES Configuration
const AES_ALGORITHM = 'aes-256-cbc';
const AES_KEY_LENGTH = 32; // 256 bits
const AES_IV_LENGTH = 16;  // 128 bits

// ============================================================
// ENCRYPTION FUNCTIONS
// ============================================================

/**
 * Generate a random AES key (256 bits)
 */
function generateAesKey(): string {
  return crypto.randomBytes(AES_KEY_LENGTH).toString('hex');
}

/**
 * Generate a random IV (16 bytes for AES)
 */
function generateIV(): string {
  return crypto.randomBytes(AES_IV_LENGTH).toString('hex');
}

/**
 * Encrypt data using AES-256-CBC
 */
function aesEncrypt(data: Buffer, keyHex: string, ivHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');

  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return encrypted.toString('base64');
}

/**
 * Encrypt AES key using RSA public key
 */
function rsaEncryptKey(aesKey: string, publicKeyPem: string): string {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(aesKey, 'utf-8')
  );

  return encrypted.toString('base64');
}

/**
 * Calculate HMAC-SHA256
 */
function calculateHmac(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

// ============================================================
// HTTP HELPER (with self-signed cert support)
// ============================================================

interface HttpResponse {
  status: number;
  data: any;
}

function httpsRequest(url: string, options: https.RequestOptions, body?: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      ...options,
      rejectUnauthorized: false, // Allow self-signed certificates
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 500,
            data: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode || 500,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// ============================================================
// MAIN SENDER LOGIC
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('THIRD-PARTY FILE SENDER');
  console.log('Hybrid Encryption: AES-256-CBC + RSA-2048 + HMAC-SHA256');
  console.log('='.repeat(60));

  // Get file path from command line
  const filePath = process.argv[2];

  if (!filePath) {
    // Create a test file if none provided
    const testFilePath = path.join(__dirname, 'test-file.txt');
    const testContent = `Test file created at ${new Date().toISOString()}\n\nThis is a test file for encrypted upload.\nThe content should be encrypted with AES-256-CBC\nand the AES key encrypted with RSA-2048.`;
    fs.writeFileSync(testFilePath, testContent);
    console.log('\nNo file specified, created test file:', testFilePath);
    console.log('Usage: npx tsx send-file.ts <filepath>\n');
    process.argv[2] = testFilePath;
  }

  const fileToSend = process.argv[2];

  if (!fs.existsSync(fileToSend)) {
    console.error('Error: File not found:', fileToSend);
    process.exit(1);
  }

  console.log('\n1. Reading file:', fileToSend);
  const fileBuffer = fs.readFileSync(fileToSend);
  const filename = path.basename(fileToSend);
  console.log(`   File size: ${fileBuffer.length} bytes`);

  // Step 1: Get server's public key and HMAC key
  console.log('\n2. Fetching server public key...');

  let publicKey: string;
  let hmacKey: string;

  try {
    const keyResponse = await httpsRequest(`${SERVER_URL}${PUBLIC_KEY_ENDPOINT}`, {
      method: 'GET',
    });

    if (keyResponse.status !== 200 || !keyResponse.data.success) {
      console.error('   Failed to get public key:', keyResponse.data);
      process.exit(1);
    }

    publicKey = keyResponse.data.publicKey;
    hmacKey = keyResponse.data.hmacKey;
    console.log('   Public key received (RSA-2048)');
    console.log('   HMAC key received');
    console.log('   Algorithm:', keyResponse.data.algorithm);
  } catch (error) {
    console.error('   Error fetching public key:', error);
    console.error('   Make sure the server is running at', SERVER_URL);
    process.exit(1);
  }

  // Step 2: Generate AES key and IV
  console.log('\n3. Generating encryption parameters...');
  const aesKey = generateAesKey();
  const iv = generateIV();
  console.log(`   AES Key: ${aesKey.substring(0, 16)}... (${aesKey.length * 4} bits)`);
  console.log(`   IV: ${iv} (${iv.length * 4} bits)`);

  // Step 3: Encrypt file with AES-256-CBC
  console.log('\n4. Encrypting file with AES-256-CBC...');
  const encryptedData = aesEncrypt(fileBuffer, aesKey, iv);
  console.log(`   Encrypted data size: ${encryptedData.length} bytes (base64)`);

  // Step 4: Encrypt AES key with RSA public key
  console.log('\n5. Encrypting AES key with RSA public key...');
  const encryptedKey = rsaEncryptKey(aesKey, publicKey);
  console.log(`   Encrypted key size: ${encryptedKey.length} bytes (base64)`);

  // Step 5: Calculate HMAC of encrypted data (Encrypt-then-MAC)
  console.log('\n6. Calculating HMAC-SHA256 of encrypted data...');
  const hmac = calculateHmac(encryptedData, hmacKey);
  console.log(`   HMAC: ${hmac.substring(0, 32)}...`);

  // Step 6: Send to server
  console.log('\n7. Sending encrypted payload to server...');

  const payload = {
    encryptedData,
    encryptedKey,
    iv,
    hmac,
    filename,
    senderInfo: 'Third-Party Sender v1.0',
  };

  try {
    const uploadResponse = await httpsRequest(`${SERVER_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, JSON.stringify(payload));

    console.log('\n' + '='.repeat(60));
    console.log('SERVER RESPONSE');
    console.log('='.repeat(60));

    if (uploadResponse.status === 200 && uploadResponse.data.success) {
      console.log('\nSUCCESS!');
      console.log('File ID:', uploadResponse.data.file.id);
      console.log('Stored as:', uploadResponse.data.file.filename);
      console.log('Size:', uploadResponse.data.file.size, 'bytes');
      console.log('Integrity:', uploadResponse.data.file.integrityStatus);
    } else {
      console.log('\nFAILED!');
      console.log('Status:', uploadResponse.status);
      console.log('Error:', uploadResponse.data.error || uploadResponse.data);
    }
  } catch (error) {
    console.error('\nError sending file:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('ENCRYPTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`
  Original File: ${filename}
  Original Size: ${fileBuffer.length} bytes

  Encryption:
  ├── Algorithm: AES-256-CBC
  ├── Key Size: 256 bits (randomly generated)
  ├── IV Size: 128 bits (randomly generated)
  └── Encrypted Size: ${encryptedData.length} bytes (base64)

  Key Exchange:
  ├── Algorithm: RSA-2048-OAEP-SHA256
  └── Encrypted Key Size: ${encryptedKey.length} bytes (base64)

  Integrity:
  ├── Algorithm: HMAC-SHA256
  └── Pattern: Encrypt-then-MAC
  `);
}

main().catch(console.error);
