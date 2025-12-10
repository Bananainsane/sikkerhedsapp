"use server";

import { RegisterSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { HashingService } from "@/lib/hashing";

export async function register(formData: FormData) {
  const data = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { username, email, password } = validatedFields.data;

  // Generate per-user salt for email hashing
  const emailSalt = HashingService.generateEmailSalt();

  // Hash email with salt + pepper (pepper from .env, never stored in DB)
  const hashedEmail = HashingService.hashEmail(email, emailSalt);

  // Check if user already exists (need to hash and compare)
  // Since email is hashed, we need to check all users and verify
  const allUsers = await db.user.findMany({
    select: { id: true, email: true, emailSalt: true },
  });

  for (const user of allUsers) {
    if (user.emailSalt && HashingService.verifyEmail(email, user.email, user.emailSalt)) {
      return {
        error: "A user with this email already exists",
      };
    }
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  try {
    await db.user.create({
      data: {
        email: hashedEmail,         // Hashed email
        emailSalt: emailSalt,       // Per-user salt (stored in DB)
        username: username,         // Plain text username for display
        password: hashedPassword,   // Bcrypt hashed password
      },
    });

    return {
      success: "Account created successfully! You can now log in.",
    };
  } catch (error) {
    return {
      error: "Failed to create account. Please try again.",
    };
  }
}

export async function login(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("[LOGIN] Attempting login for email:", email);

    // Since email is hashed, we need to find user by comparing hashes
    // Get all users and verify email against each
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        emailSalt: true,
        password: true,
        twoFactorEnabled: true,
      },
    });

    console.log("[LOGIN] Found", allUsers.length, "users to check");

    let user = null;
    for (const u of allUsers) {
      // Skip users without emailSalt (old users before migration)
      if (!u.emailSalt) {
        console.log("[LOGIN] Skipping user without emailSalt:", u.id);
        continue;
      }

      try {
        if (HashingService.verifyEmail(email, u.email, u.emailSalt)) {
          user = u;
          console.log("[LOGIN] Found matching user:", u.id);
          break;
        }
      } catch (verifyError) {
        console.log("[LOGIN] Error verifying email for user:", u.id, verifyError);
        continue;
      }
    }

    if (!user || !user.password) {
      console.log("[LOGIN] No user found or no password");
      return { error: "Invalid email or password" };
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      console.log("[LOGIN] Password mismatch");
      return { error: "Invalid email or password" };
    }

    console.log("[LOGIN] Password verified, 2FA enabled:", user.twoFactorEnabled);

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return a flag to redirect to 2FA verification
      // Use user ID instead of email since email is hashed
      return {
        requires2FA: true,
        userId: user.id,
      };
    }

    // No 2FA required, proceed with normal sign in
    console.log("[LOGIN] Calling signIn with userId:", user.id);
    await signIn("credentials", {
      userId: user.id,  // Pass user ID instead of email
      password,
      redirect: false,  // Don't auto-redirect, we'll handle it
    });

    return { success: true };
  } catch (error) {
    console.log("[LOGIN] Caught error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

// Complete login after 2FA verification
// Now accepts userId (since email is hashed) and password for re-auth
export async function completeTwoFactorLogin(userId: string, password: string) {
  // Find user by ID
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Sign in the user using userId
  try {
    await signIn("credentials", {
      userId: user.id,
      password: password,  // Still need to verify password
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Handle the redirect from signIn
    throw error;
  }
}
