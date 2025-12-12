import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileService } from "@/lib/fileService";

/**
 * DELETE /api/files/delete
 * Admin-only endpoint to delete uploaded files
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    // Check admin role
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Kun administratorer kan slette filer" },
        { status: 403 }
      );
    }

    // Get file ID from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "Fil ID påkrævet" }, { status: 400 });
    }

    const adminUsername = currentUser.name || session.user.email;
    const deleted = FileService.deleteFile(fileId, adminUsername);

    if (deleted) {
      return NextResponse.json({ message: "Fil slettet" });
    } else {
      return NextResponse.json({ error: "Fil ikke fundet" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Sletning fejlede" }, { status: 500 });
  }
}
