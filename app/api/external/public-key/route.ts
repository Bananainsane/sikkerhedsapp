import { NextResponse } from 'next/server';
import { keyManager } from '@/lib/keys';

/**
 * GET /api/external/public-key
 * Returns the server's RSA public key for third-party encryption
 * This endpoint is public - the public key can be safely shared
 */
export async function GET() {
  try {
    const publicKey = keyManager.getPublicKey();
    const hmacKey = keyManager.getHmacKey();

    return NextResponse.json({
      success: true,
      publicKey,
      hmacKey,
      algorithm: {
        asymmetric: 'RSA-2048-OAEP-SHA256',
        symmetric: 'AES-256-CBC',
        mac: 'HMAC-SHA256',
      },
      instructions: {
        step1: 'Generate a random AES-256 key and IV',
        step2: 'Encrypt your file using AES-256-CBC with the key and IV',
        step3: 'Encrypt the AES key using this RSA public key',
        step4: 'Calculate HMAC-SHA256 of the encrypted data using the hmacKey',
        step5: 'Send encrypted data, encrypted key, IV, and HMAC to /api/external/upload',
      },
    });
  } catch (error) {
    console.error('[API] Error getting public key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve public key' },
      { status: 500 }
    );
  }
}
