import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileService } from "@/lib/fileService";

/**
 * GET /api/files/download
 * Download a file with integrity verification
 * Returns "No contamination detected" or "Contaminated" status
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
      where: { id: session.user.id },
      select: { name: true },
    });

    const username = currentUser?.name || session.user.email;

    // Get file ID from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");
    const verifyOnly = searchParams.get("verify") === "true";

    if (!fileId) {
      return NextResponse.json({ error: "Fil ID påkrævet" }, { status: 400 });
    }

    // Verify and get file
    const result = FileService.verifyAndDownload(fileId, username);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // If only verifying, return status
    if (verifyOnly) {
      return NextResponse.json({
        valid: result.isValid,
        message: result.isValid ? "No contamination detected" : "Contaminated",
        filename: result.filename,
      });
    }

    // Return file with integrity status in header
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(result.fileBuffer!);

    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Integrity-Status": result.isValid
          ? "No contamination detected"
          : "Contaminated",
      },
    });

    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download fejlede" }, { status: 500 });
  }
}
