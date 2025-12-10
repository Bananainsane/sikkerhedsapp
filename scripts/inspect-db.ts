import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE INSPECTION - Email Hashing with Salt/Pepper');
  console.log('='.repeat(60));

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      emailSalt: true,
      username: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('\n📊 USER TABLE (Last 10 users):\n');
  console.log('Schema fields: id, email (hashed), emailSalt, username, name, role, twoFactorEnabled\n');

  for (const user of users) {
    console.log('-'.repeat(60));
    console.log(`ID:            ${user.id}`);
    console.log(`Username:      ${user.username || '(not set)'}`);
    console.log(`Email:         ${user.email.substring(0, 40)}...`);
    console.log(`               (${user.email.length} chars - ${user.emailSalt ? 'HASHED' : 'PLAIN TEXT'})`);
    console.log(`Email Salt:    ${user.emailSalt || '(not set - old user)'}`);
    console.log(`Role:          ${user.role}`);
    console.log(`2FA Enabled:   ${user.twoFactorEnabled}`);
    console.log(`Created:       ${user.createdAt}`);
  }

  // Show comparison between old and new users
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON: Old Users vs New Users (with hashed email)');
  console.log('='.repeat(60));

  const oldUsers = users.filter(u => !u.emailSalt);
  const newUsers = users.filter(u => u.emailSalt);

  console.log(`\n📌 Old users (plain text email): ${oldUsers.length}`);
  for (const u of oldUsers.slice(0, 3)) {
    console.log(`   - ${u.email} (readable)`);
  }

  console.log(`\n🔐 New users (hashed email): ${newUsers.length}`);
  for (const u of newUsers.slice(0, 3)) {
    console.log(`   - ${u.email.substring(0, 30)}... (not readable)`);
    console.log(`     Salt: ${u.emailSalt}`);
    console.log(`     Username: ${u.username}`);
  }

  // Environment info
  console.log('\n' + '='.repeat(60));
  console.log('ENVIRONMENT VARIABLES (Pepper stored here, NOT in DB)');
  console.log('='.repeat(60));
  console.log(`\nEMAIL_PEPPER:          ${process.env.EMAIL_PEPPER ? '✅ Set (hidden)' : '❌ Not set'}`);
  console.log(`EMAIL_HASH_ITERATIONS: ${process.env.EMAIL_HASH_ITERATIONS || '100000 (default)'}`);
  console.log(`\n⚠️  Pepper is NEVER stored in database - only in .env file`);
  console.log(`    This means: even if database is stolen, emails cannot be decrypted`);
  console.log(`    without the pepper from the server's environment.`);

  // Show the hashing formula
  console.log('\n' + '='.repeat(60));
  console.log('HASHING FORMULA');
  console.log('='.repeat(60));
  console.log(`
  hashedEmail = PBKDF2(
    password: normalizedEmail,
    salt: emailSalt + EMAIL_PEPPER,
    iterations: ${process.env.EMAIL_HASH_ITERATIONS || '100000'},
    keyLength: 32,
    algorithm: 'sha256'
  )

  Storage:
  ┌─────────────────────────────────────────────────────────┐
  │ DATABASE (SQLite)                                       │
  │ ├── email: "a7f3b2c1d4e5f6..." (hashed, 64 chars)      │
  │ └── emailSalt: "8a9b3c4d5e6f..." (per-user, 32 chars)  │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ .ENV FILE (Server only)                                 │
  │ └── EMAIL_PEPPER: "secret..." (global, never in DB)    │
  └─────────────────────────────────────────────────────────┘
  `);

  await prisma.$disconnect();
}

main().catch(console.error);
