"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authenticator } from "otplib";
import { TwoFactorCodeSchema } from "@/lib/validations";

// Generate a new 2FA secret and return QR code data
export async function generateTwoFactorSecret() {
  const session = await auth();

  if (!session || !session.user?.email) {
    return { error: "Not authenticated" };
  }

  // Generate a random secret
  const secret = authenticator.generateSecret();

  // Get user email for the QR code
  const userEmail = session.user.email;

  // Generate the OTP Auth URL for QR code
  const otpauth = authenticator.keyuri(
    userEmail,
    "Sikkerhedsapp",
    secret
  );

  // Store the secret temporarily (not yet enabled)
  await db.user.update({
    where: { email: userEmail },
    data: { twoFactorSecret: secret },
  });

  return {
    success: true,
    secret,
    otpauth,
  };
}

// Verify the 2FA code and enable 2FA
export async function enableTwoFactor(formData: FormData) {
  const session = await auth();

  if (!session || !session.user?.email) {
    return { error: "Not authenticated" };
  }

  const code = formData.get("code") as string;

  // Validate code format
  const validatedCode = TwoFactorCodeSchema.safeParse({ code });

  if (!validatedCode.success) {
    return { error: "Invalid code format. Must be 6 digits." };
  }

  // Get user with secret
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !user.twoFactorSecret) {
    return { error: "No 2FA secret found. Please try again." };
  }

  // Verify the code
  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { error: "Invalid code. Please try again." };
  }

  // Enable 2FA
  await db.user.update({
    where: { email: session.user.email },
    data: { twoFactorEnabled: true },
  });

  return { success: true };
}

// Disable 2FA
export async function disableTwoFactor() {
  const session = await auth();

  if (!session || !session.user?.email) {
    return { error: "Not authenticated" };
  }

  // Disable 2FA and remove secret
  await db.user.update({
    where: { email: session.user.email },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return { success: true };
}

// Verify 2FA code during login and complete sign in
export async function verifyTwoFactorLogin(email: string, password: string, code: string) {
  // Validate code format
  const validatedCode = TwoFactorCodeSchema.safeParse({ code });

  if (!validatedCode.success) {
    return { error: "Invalid code format. Must be 6 digits." };
  }

  // Get user
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { error: "2FA not enabled for this user." };
  }

  // Verify the code
  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { error: "Invalid code. Please try again." };
  }

  // 2FA verified! Now sign in the user
  const { signIn } = await import("@/auth");

  try {
    // Sign in with credentials - this will create the session
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    // NextAuth throws on redirect, which is expected
    throw error;
  }
}
