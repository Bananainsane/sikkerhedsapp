import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileService } from "@/lib/fileService";
import { FileDatabase } from "@/lib/fileDb";

/**
 * GET /api/files/list
 * List files for the current user, or all files for admin
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true },
    });

    const isAdmin = currentUser?.role === "admin";
    const username = currentUser?.name || session.user.email;

    // Check if admin is requesting all files
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get("admin") === "true";

    let files;
    if (isAdmin && adminView) {
      // Admin gets all files with uploadedFor info
      const allRecords = FileDatabase.getAll();
      files = allRecords.map((r) => ({
        id: r.id,
        filename: r.filename,
        filetype: r.filetype,
        uploadedAt: r.uploadedAt,
        uploadedBy: r.uploadedBy,
        uploadedFor: r.uploadedFor,
      }));
    } else {
      // Regular user gets only their files
      files = FileService.getFilesForUser(username);
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json({ error: "Kunne ikke hente filer" }, { status: 500 });
  }
}
