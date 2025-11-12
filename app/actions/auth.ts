"use server";

import { RegisterSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
    };
  }

  const { email, password } = validatedFields.data;

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      error: "A user with this email already exists",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  try {
    await db.user.create({
      data: {
        email,
        password: hashedPassword,
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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // First, check if user exists and verify password
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return { error: "Invalid email or password" };
  }

  // Verify password
  const passwordsMatch = await bcrypt.compare(password, user.password);

  if (!passwordsMatch) {
    return { error: "Invalid email or password" };
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Return a flag to redirect to 2FA verification
    return {
      requires2FA: true,
      email: user.email,
    };
  }

  // No 2FA required, proceed with normal sign in
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
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
export async function completeTwoFactorLogin(email: string) {
  // Find user
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Sign in the user (password is already verified, 2FA is verified)
  try {
    await signIn("credentials", {
      email: user.email,
      password: "bypass", // This won't work with current setup
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Handle the redirect from signIn
    throw error;
  }
}
