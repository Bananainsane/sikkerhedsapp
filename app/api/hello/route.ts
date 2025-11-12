import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * POST /api/hello
 *
 * API endpoint that returns "Hello, World! From api"
 * Only accessible to authenticated users with Admin role
 *
 * Requirements from PDF:
 * - Requires authentication
 * - Requires Admin role
 * - Returns specific message for admin users
 * - Returns error message for non-admin users
 */
export async function POST(request: Request) {
  try {
    // Get session to check authentication and authorization
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Adgang nægtet, du skal være logget ind" },
        { status: 401 }
      );
    }

    // Check if user has Admin role
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Adgang nægtet, du er ikke admin" },
        { status: 403 }
      );
    }

    // User is authenticated AND has admin role - success!
    return NextResponse.json(
      { message: "Hello, World! From api" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
