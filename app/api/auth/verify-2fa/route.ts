import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticator } from "otplib";
import { signIn } from "@/auth";

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Verify the 2FA code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // 2FA verified successfully
    // Return success - the client will handle the actual sign in
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
