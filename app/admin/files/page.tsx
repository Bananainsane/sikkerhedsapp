import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import FileUploadForm from "./FileUploadForm";
import FileList from "./FileList";

/**
 * Admin-only page to upload files to users
 * Files are stored in Files/<username>/ folder
 * File metadata stored in separate JSON database (not SQLite)
 */
export default async function AdminFilesPage() {
  const session = await auth();

  // Check authentication
  if (!session || !session.user) {
    redirect("/login");
  }

  // Check authorization - must be admin
  const currentUser = await db.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true, name: true },
  });

  const isAdmin = currentUser?.role === "admin";

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Adgang nægtet
            </h2>
            <p className="text-gray-600 mb-6">
              Kun administratorer kan uploade filer til brugere.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Tilbage til Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get all users for dropdown
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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
              <Link
                href="/files"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mine Filer
              </Link>
              <span className="text-sm text-gray-500">
                {currentUser?.name || session.user.email} (Admin)
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Upload Fil
            </h2>
            <FileUploadForm
              users={allUsers}
              adminEmail={session.user.email!}
            />
          </div>

          {/* Files List Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Uploadede Filer
            </h2>
            <FileList />
          </div>
        </div>
      </main>
    </div>
  );
}
