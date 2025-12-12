import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserFileList from "./UserFileList";

/**
 * User page to download files uploaded by admin
 * Shows file integrity verification status:
 * - "No contamination detected" if file is unchanged
 * - "Contaminated" if file has been modified
 */
export default async function UserFilesPage() {
  const session = await auth();

  // Check authentication
  if (!session || !session.user) {
    redirect("/login");
  }

  // Get current user info
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  const isAdmin = currentUser?.role === "admin";
  const username = currentUser?.name || session.user.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Sikkerhedsapp
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/files"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Upload Filer
                </Link>
              )}
              <span className="text-sm text-gray-500">
                {username} {isAdmin && "(Admin)"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Download Filer
          </h2>
          <p className="text-gray-600 mb-6">
            Filer uploadet til din konto. Klik på &quot;Validate &amp; Download&quot; for at verificere filens integritet og downloade.
          </p>

          <UserFileList username={username!} />
        </div>
      </main>
    </div>
  );
}
