import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * POST /api/admin/promote
 *
 * Promote a user to admin role
 * Only accessible to existing admin users
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Du skal være logget ind" },
        { status: 401 }
      );
    }

    // Check authorization - must be admin
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Kun administratorer kan forfremme brugere" },
        { status: 403 }
      );
    }

    // Get userId from request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId er påkrævet" },
        { status: 400 }
      );
    }

    // Update user role to admin
    await db.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });

    return NextResponse.json(
      { success: true, message: "Bruger forfremmet til administrator" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Promote to admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
