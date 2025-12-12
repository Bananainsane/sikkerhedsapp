# Sikkerhedsapp - Testing Guide

## Kryptografi: Hashing & Kryptering - Test og Bedømmelse

---

## Pre-requisites

### 1. Start Application
```bash
bun run dev
```
Server runs at: `https://localhost:3000`

### 2. Test Users (Pre-created)
| Role | Email | Password | Username |
|------|-------|----------|----------|
| Admin | demo@test.dk | Demo1234! | demoadmin |
| User | demo@test.dk | Demo1234! | demouser |

---

## Test 1: Email Hashing Verification

### What to Demonstrate
- Email is hashed in database with PBKDF2
- Salt stored per-user in database
- Pepper stored in `.env` (never in database)

### Steps
1. Open database viewer:
   ```bash
   sqlite3 prisma/dev.db "SELECT username, email, emailSalt FROM User;"
   ```

2. **Expected Output**:
   ```
   demoadmin|dfb5ad1c6a5a5cc...|25d7d882e156b381...
   ```
   - `email` column: Hashed (64 character hex string)
   - `emailSalt` column: Random salt (32 character hex string)

3. **Show Pepper Location**:
   ```bash
   grep EMAIL_PEPPER .env
   ```
   Output: `EMAIL_PEPPER="kryptografi-assignment-super-secret-pepper-2024"`

4. **Show Hashing Implementation** (`lib/hashing.ts:147-163`):
   - Uses PBKDF2 with 100,000 iterations
   - Combines salt (per-user) + pepper (global)
   - SHA-256 algorithm

### Assessment Checklist
- [ ] Email is hashed in database (not plain text)
- [ ] Salt is stored per-user in database
- [ ] Pepper is in .env file (not in database)
- [ ] Iterations configurable via EMAIL_HASH_ITERATIONS

---

## Test 2: Database Separation (Security)

### What to Demonstrate
- User data in SQLite (Prisma)
- File metadata in separate JSON database

### Steps
1. **Show User Database**:
   ```bash
   sqlite3 prisma/dev.db ".tables"
   ```
   Output: `Account  Session  User  VerificationToken`

2. **Show File Database**:
   ```bash
   cat data/fileMetadata.json
   ```
   Output: JSON array with file records

3. **Explain Security Benefit**:
   - Breach of one database doesn't expose all data
   - Different storage mechanisms add complexity for attackers

### Assessment Checklist
- [ ] User credentials in SQLite database
- [ ] File metadata in JSON file
- [ ] Two separate storage systems

---

## Test 3: Password Validation & Hashing

### What to Demonstrate
- Password requirements enforced
- Passwords hashed with bcrypt

### Steps
1. **Try Invalid Password** (on register page):
   - Too short: `test` → Error
   - No uppercase: `test1234!` → Error
   - No number: `TestTest!` → Error
   - No special char: `Test1234` → Error

2. **Valid Password**: `Test1234!` → Accepted

3. **Show Bcrypt Hash in Database**:
   ```bash
   sqlite3 prisma/dev.db "SELECT password FROM User LIMIT 1;"
   ```
   Output: `$2b$10$...` (bcrypt hash format)

### Assessment Checklist
- [ ] Min 8 characters enforced
- [ ] Uppercase required
- [ ] Number required
- [ ] Special character required
- [ ] Password stored as bcrypt hash

---

## Test 4: Role-Based Authorization (Admin)

### What to Demonstrate
- Only admin can upload files
- Users only see their own files

### Steps
1. **Login as Admin** (`demo@test.dk` / `Demo1234!`)
2. Navigate to: `/admin/files`
3. **Show**:
   - Dropdown with all users
   - File upload form
   - Uploaded files list

4. **Login as Regular User**
5. Navigate to: `/admin/files`
6. **Expected**: "Adgang nægtet" (Access denied)

7. Navigate to: `/files`
8. **Show**: Only files uploaded to this user

### Assessment Checklist
- [ ] Admin can access /admin/files
- [ ] Admin can upload to any user
- [ ] Regular user cannot access /admin/files
- [ ] User only sees own files at /files

---

## Test 5: File Integrity Verification (HMAC)

### What to Demonstrate
- Files get HMAC hash on upload
- HMAC key is randomly generated (not hardcoded)
- Tampering is detected on download

### Steps
1. **Admin uploads file** to a user
2. **Check file metadata**:
   ```bash
   cat data/fileMetadata.json | jq '.[-1]'
   ```
   Shows: `hash` and `hmacKey` fields

3. **Show HMAC Key is Random** (`lib/hashing.ts:117-121`):
   ```typescript
   static hashFileWithHmac(fileBuffer: Buffer): { hash: string; key: string } {
     const key = this.generateHmacKey(); // Random 32-byte key
     const hash = this.hmacSha256(fileBuffer, key);
     return { hash, key };
   }
   ```

4. **User downloads file** → "No contamination detected"

5. **Tamper with file**:
   ```bash
   echo "TAMPERED" >> Files/<username>/<fileId>_<filename>
   ```

6. **User downloads again** → "Contaminated"

### Assessment Checklist
- [ ] HMAC hash generated on upload
- [ ] HMAC key randomly generated per file
- [ ] "No contamination detected" for unmodified files
- [ ] "Contaminated" for modified files

---

## Test 6: Two-Factor Authentication (2FA)

### What to Demonstrate
- QR code generation for authenticator apps
- TOTP verification

### Steps
1. **Login** and navigate to: `/settings/security`
2. Click **"Aktiver 2FA"**
3. **Show QR Code** generated
4. Scan with Google Authenticator/Authy
5. Enter 6-digit code → "2FA enabled successfully!"
6. **Logout and Login again** → 2FA verification required

### Assessment Checklist
- [ ] QR code generated
- [ ] Can scan with authenticator app
- [ ] 6-digit code verification works
- [ ] Login requires 2FA when enabled

---

## Test 7: External Encrypted File Upload (Sprint 2)

### What to Demonstrate
- Third-party can send encrypted files
- AES-256-CBC encryption with IV
- RSA key exchange
- HMAC integrity verification

### Steps
1. **Get Public Key**:
   ```bash
   curl -k https://localhost:3000/api/external/public-key | jq
   ```
   Shows: RSA public key and HMAC key

2. **Run Third-Party Sender**:
   ```bash
   cd third-party-sender
   npx tsx send-file.ts ../test-file.txt
   ```

3. **Show Output**:
   - AES key generated
   - File encrypted with AES-256-CBC
   - AES key encrypted with RSA
   - HMAC calculated (Encrypt-then-MAC)
   - Server response: "No contamination detected"

4. **Check File Stored**:
   ```bash
   ls -la Files/uploads/
   cat data/fileMetadata.json | jq '.[] | select(.uploadedBy == "Third-Party Sender v1.0")'
   ```

5. **Admin Downloads External File** → Integrity verified

### Assessment Checklist
- [ ] External endpoint accepts encrypted files
- [ ] AES-256-CBC encryption used
- [ ] RSA used for key exchange
- [ ] HMAC verification on receipt
- [ ] File decrypted and stored
- [ ] New HMAC generated for storage
- [ ] Integrity check on admin download

---

## Test 8: Cryptography Implementation Review

### Files to Show

| File | Purpose |
|------|---------|
| `lib/hashing.ts` | SHA-2, HMAC, PBKDF2, bcrypt implementations |
| `lib/encryption.ts` | AES-256-CBC, RSA-2048, Hybrid encryption |
| `lib/keys.ts` | RSA key pair management |
| `lib/fileService.ts` | File upload/download with integrity |

### Key Code Sections

**Email Hashing** (`lib/hashing.ts:147-163`):
```typescript
static hashEmail(email, salt, pepper, iterations) {
  const combinedSalt = `${salt}${pepper}`;
  return this.pbkdf2(email, combinedSalt, iterations, 32, 'sha256');
}
```

**File HMAC** (`lib/hashing.ts:117-121`):
```typescript
static hashFileWithHmac(fileBuffer: Buffer) {
  const key = this.generateHmacKey(); // Random key
  const hash = this.hmacSha256(fileBuffer, key);
  return { hash, key };
}
```

**AES Encryption** (`lib/encryption.ts:45-54`):
```typescript
static aesEncrypt(data, keyHex, ivHex) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return encrypted.toString('base64');
}
```

**Hybrid Encryption** (`lib/encryption.ts:159-188`):
```typescript
static hybridEncrypt(fileBuffer, rsaPublicKey, hmacKey) {
  const aesKey = this.generateAesKey();
  const iv = this.generateIV();
  const encryptedData = this.aesEncrypt(fileBuffer, aesKey, iv);
  const encryptedKey = this.rsaEncrypt(aesKey, rsaPublicKey);
  const hmac = this.calculateHmac(encryptedData, hmacKey);
  return { encryptedData, encryptedKey, iv, hmac };
}
```

---

## Quick Test Commands

```bash
# Check email hashing in database
sqlite3 prisma/dev.db "SELECT username, substr(email,1,20)||'...' as email_hash, emailSalt FROM User;"

# Check file metadata
cat data/fileMetadata.json | jq

# Check pepper in .env
grep EMAIL_PEPPER .env

# Test external upload
cd third-party-sender && npx tsx send-file.ts test-file.txt

# Check uploaded files
ls -la Files/uploads/
```

---

## Known Issues & Fixes

### Issue: Auth redirect loop
If you see continuous 307 redirects, restart the server:
```bash
# Stop current server (Ctrl+C)
bun run dev
```

### Issue: Prisma validation error
Regenerate Prisma client:
```bash
npx prisma generate
# Restart server
```

---

## Summary Checklist for Assessment

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Email hashed with salt+pepper in database | ✅ |
| 2 | User data and file data in separate databases | ✅ |
| 3 | Only admin can upload files | ✅ |
| 4 | Users only see their own files | ✅ |
| 5 | File tampering detected ("Contaminated") | ✅ |
| 6 | 2FA with QR code and authenticator | ✅ |
| 7 | External encrypted upload (AES+RSA+HMAC) | ✅ |
| 8 | Third-party sender implementation | ✅ |

---

*Last Updated: 2024-12-12*
*Author: Generated for Serversideprogrammering III - Kryptografi*
