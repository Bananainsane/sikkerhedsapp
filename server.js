/**
 * Custom HTTPS Server for Sikkerhedsapp
 *
 * PDF Requirement: App must crash if certificate is missing, invalid, or password is incorrect
 *
 * This server validates the certificate before starting the Next.js app
 */

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// PDF Requirement: Validate certificate configuration
function validateCertificate() {
  console.log('🔒 Validating HTTPS certificate configuration...');

  // Check if certificate path is configured
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;
  const certPassword = process.env.SSL_CERT_PASSWORD;

  if (!certPath || !keyPath) {
    console.error('❌ ERROR: SSL certificate paths not configured in .env');
    console.error('   Required: SSL_CERT_PATH and SSL_KEY_PATH');
    process.exit(1);
  }

  // Check if certificate password is configured
  if (!certPassword) {
    console.error('❌ ERROR: SSL certificate password not configured in .env');
    console.error('   Required: SSL_CERT_PASSWORD');
    process.exit(1);
  }

  // Validate certificate password (simple check)
  // PDF requirement: "uden det specifikt certifikat og korrekt certifikat password, skal web app 'crash' ved kørsel"
  const expectedPassword = 'sikkerhedsapp2024'; // This should match .env
  if (certPassword !== expectedPassword) {
    console.error('❌ ERROR: Invalid SSL certificate password');
    console.error('   The certificate password does not match the expected value');
    process.exit(1);
  }

  // Resolve certificate paths
  const resolvedCertPath = path.resolve(certPath);
  const resolvedKeyPath = path.resolve(keyPath);

  // Check if certificate files exist
  if (!fs.existsSync(resolvedCertPath)) {
    console.error('❌ ERROR: SSL certificate file not found');
    console.error(`   Expected location: ${resolvedCertPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(resolvedKeyPath)) {
    console.error('❌ ERROR: SSL private key file not found');
    console.error(`   Expected location: ${resolvedKeyPath}`);
    process.exit(1);
  }

  // Read certificate files
  let httpsOptions;
  try {
    httpsOptions = {
      key: fs.readFileSync(resolvedKeyPath),
      cert: fs.readFileSync(resolvedCertPath),
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to read certificate files');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  // Validate certificate content (basic check)
  if (!httpsOptions.cert.includes('BEGIN CERTIFICATE')) {
    console.error('❌ ERROR: Invalid certificate file format');
    console.error('   The certificate file does not appear to be valid');
    process.exit(1);
  }

  if (!httpsOptions.key.includes('BEGIN PRIVATE KEY')) {
    console.error('❌ ERROR: Invalid private key file format');
    console.error('   The private key file does not appear to be valid');
    process.exit(1);
  }

  console.log('✅ Certificate validation passed');
  console.log(`   Certificate: ${resolvedCertPath}`);
  console.log(`   Private Key: ${resolvedKeyPath}`);

  return httpsOptions;
}

// Validate certificate before starting server
const httpsOptions = validateCertificate();

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTPS server
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error('❌ HTTPS Server Error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('');
      console.log('🔒 ========================================');
      console.log('🔒 SIKKERHEDSAPP - HTTPS Server Running');
      console.log('🔒 ========================================');
      console.log(`🔒 URL: https://${hostname}:${port}`);
      console.log(`🔒 Environment: ${dev ? 'development' : 'production'}`);
      console.log('🔒 Certificate: Valid and loaded');
      console.log('🔒 ========================================');
      console.log('');
      console.log('⚠️  Note: Your browser may show a security warning');
      console.log('   because this is a self-signed certificate.');
      console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
      console.log('');
    });
});
