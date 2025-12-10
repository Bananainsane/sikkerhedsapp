import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileService } from "@/lib/fileService";

/**
 * POST /api/files/upload
 * Admin-only endpoint to upload files to users
 * Files are hashed with HMAC-SHA256 for integrity verification
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    // Check admin role
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Kun administratorer kan uploade filer" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetUser = formData.get("targetUser") as string;

    if (!file || !targetUser) {
      return NextResponse.json(
        { error: "Fil og bruger er påkrævet" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file with HMAC hash (key is randomly generated, not hardcoded)
    const adminUsername = currentUser.name || session.user.email;
    const result = await FileService.uploadFile(
      buffer,
      file.name,
      targetUser,
      adminUsername
    );

    if (result.success) {
      return NextResponse.json({
        message: "Fil uploadet",
        fileId: result.fileId,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload fejlede" }, { status: 500 });
  }
}
