import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const session = await auth();

  let displayMessage = "Hello, World!"; // Not authenticated (PDF requirement)
  let isAdmin = false;

  if (session && session.user) {
    // User is authenticated
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    isAdmin = user?.role === "admin";

    // Set display message based on role (PDF requirements)
    if (isAdmin) {
      displayMessage = "Du er logget ind. Du er admin";
    } else {
      displayMessage = "Du er logget ind.";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Sikkerhedsapp
        </h1>

        {/* PDF Requirement: Display message based on authentication/authorization status */}
        <div className={`text-center p-4 rounded-lg mb-6 ${
          session
            ? isAdmin
              ? "bg-purple-50 border-2 border-purple-200"
              : "bg-blue-50 border-2 border-blue-200"
            : "bg-gray-50 border-2 border-gray-200"
        }`}>
          <p className={`font-semibold ${
            session
              ? isAdmin
                ? "text-purple-800"
                : "text-blue-800"
              : "text-gray-800"
          }`}>
            {displayMessage}
          </p>
        </div>

        <p className="text-center text-gray-600 mb-8">
          Authentication, Authorization & Two-Factor Authentication Demo
        </p>

        {session ? (
          // Authenticated user - show link to dashboard
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full bg-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Gå til Dashboard
            </Link>
          </div>
        ) : (
          // Not authenticated - show login/register links
          <div className="space-y-4">
            <Link
              href="/register"
              className="block w-full bg-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Opret konto (Register)
            </Link>

            <Link
              href="/login"
              className="block w-full bg-gray-100 text-gray-800 text-center py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Log ind (Login)
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Features:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ User Registration with validation</li>
            <li>✓ Secure Login with hashed passwords</li>
            <li>✓ Role-based Authorization (Admin/User)</li>
            <li>✓ TOTP-based Two-Factor Authentication</li>
            <li>✓ QR Code setup for authenticator apps</li>
            <li>✓ Protected Web API endpoints</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
