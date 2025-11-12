/**
 * Script to promote a user to admin role
 * Usage: npx tsx scripts/promote-user-to-admin.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function promoteUserToAdmin(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️ User "${email}" is already an admin`);
      process.exit(0);
    }

    await db.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`✅ Successfully promoted "${email}" to admin role`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/promote-user-to-admin.ts <email>");
  process.exit(1);
}

promoteUserToAdmin(email);
