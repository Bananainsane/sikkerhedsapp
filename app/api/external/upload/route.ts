import { NextRequest, NextResponse } from 'next/server';
import { EncryptionService } from '@/lib/encryption';
import { HashingService } from '@/lib/hashing';
import { keyManager } from '@/lib/keys';
import { FileDatabase, FileRecord } from '@/lib/fileDb';
import fs from 'fs';
import path from 'path';

// External files go to Files/uploads folder
const UPLOADS_DIR = path.join(process.cwd(), 'Files', 'uploads');

/**
 * POST /api/external/upload
 * Receives encrypted files from third-party systems
 *
 * Expected payload:
 * {
 *   encryptedData: string,    // AES-encrypted file content (base64)
 *   encryptedKey: string,     // RSA-encrypted AES key (base64)
 *   iv: string,               // Initialization Vector (hex)
 *   hmac: string,             // HMAC-SHA256 of encrypted data (hex)
 *   filename: string,         // Original filename
 *   senderInfo?: string       // Optional sender identification
 * }
 */
export async function POST(request: NextRequest) {
  console.log('[External Upload] Received upload request');

  try {
    const body = await request.json();
    const { encryptedData, encryptedKey, iv, hmac, filename, senderInfo } = body;

    // Validate required fields
    if (!encryptedData || !encryptedKey || !iv || !hmac || !filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['encryptedData', 'encryptedKey', 'iv', 'hmac', 'filename'],
        },
        { status: 400 }
      );
    }

    console.log('[External Upload] Processing file:', filename);

    // Step 1: Verify HMAC for integrity (Encrypt-then-MAC)
    const serverHmacKey = keyManager.getHmacKey();
    const isIntegrityValid = EncryptionService.verifyHmac(encryptedData, serverHmacKey, hmac);

    if (!isIntegrityValid) {
      console.log('[External Upload] HMAC verification FAILED - data may be tampered');
      return NextResponse.json(
        {
          success: false,
          error: 'HMAC verification failed - file integrity compromised',
          status: 'Contaminated',
        },
        { status: 400 }
      );
    }

    console.log('[External Upload] HMAC verified - integrity OK');

    // Step 2: Decrypt AES key using RSA private key
    const privateKey = keyManager.getPrivateKey();
    let aesKey: string;

    try {
      aesKey = EncryptionService.rsaDecrypt(encryptedKey, privateKey);
      console.log('[External Upload] AES key decrypted successfully');
    } catch (error) {
      console.error('[External Upload] RSA decryption failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decrypt AES key - invalid RSA encryption',
        },
        { status: 400 }
      );
    }

    // Step 3: Decrypt file using AES-CBC
    let decryptedBuffer: Buffer;

    try {
      decryptedBuffer = EncryptionService.aesDecrypt(encryptedData, aesKey, iv);
      console.log('[External Upload] File decrypted successfully, size:', decryptedBuffer.length);
    } catch (error) {
      console.error('[External Upload] AES decryption failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decrypt file - invalid AES encryption or IV',
        },
        { status: 400 }
      );
    }

    // Step 4: Create uploads directory if it doesn't exist
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Step 5: Generate unique filename and save decrypted file
    const fileId = `ext_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFilename = `${fileId}_${safeFilename}`;
    const filePath = path.join(UPLOADS_DIR, storedFilename);

    fs.writeFileSync(filePath, decryptedBuffer);
    console.log('[External Upload] File saved to:', filePath);

    // Step 6: Generate NEW HMAC for stored file (for download verification)
    const storageHmacKey = HashingService.generateHmacKey();
    const storageHmac = HashingService.hmacSha256(decryptedBuffer, storageHmacKey);

    // Step 7: Save metadata to file database (using shared FileDatabase)
    const newFile: FileRecord = {
      id: fileId,
      filename: filename,
      filetype: path.extname(filename).toLowerCase() || 'unknown',
      hash: storageHmac,
      hmacKey: storageHmacKey,
      uploadedBy: senderInfo || 'external-system',
      uploadedFor: 'uploads', // External files go to uploads folder
      uploadedAt: new Date().toISOString(),
    };

    FileDatabase.create(newFile);

    console.log('[External Upload] Metadata saved to database');

    return NextResponse.json({
      success: true,
      message: 'File received, verified, decrypted and stored successfully',
      file: {
        id: fileId,
        filename: storedFilename,
        originalName: filename,
        size: decryptedBuffer.length,
        source: 'external',
        integrityStatus: 'No contamination detected',
      },
    });
  } catch (error) {
    console.error('[External Upload] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during file processing',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/external/upload
 * Returns information about the upload endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/external/upload',
    method: 'POST',
    description: 'Upload encrypted files from third-party systems',
    contentType: 'application/json',
    requiredFields: {
      encryptedData: 'AES-256-CBC encrypted file content (base64)',
      encryptedKey: 'RSA-encrypted AES key (base64)',
      iv: 'Initialization Vector (hex, 32 characters)',
      hmac: 'HMAC-SHA256 of encryptedData (hex, 64 characters)',
      filename: 'Original filename',
    },
    optionalFields: {
      senderInfo: 'Identifier for the sending system',
    },
    getPublicKey: '/api/external/public-key',
  });
}
