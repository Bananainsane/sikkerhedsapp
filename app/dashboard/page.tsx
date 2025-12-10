import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import ApiTestButton from "./ApiTestButton";

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button
        type="submit"
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        Log ud
      </button>
    </form>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Get user's 2FA status and role
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    select: {
      email: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Sikkerhedsapp</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/files"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mine Filer
              </Link>
              <Link
                href="/settings/security"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sikkerhed
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/files"
                    className="text-purple-700 hover:text-purple-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    📁 Upload Filer
                  </Link>
                  <Link
                    href="/admin/manage-users"
                    className="text-purple-700 hover:text-purple-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    👑 Admin
                  </Link>
                </>
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Dashboard
          </h2>

          {/* Role-based greeting (PDF requirement) */}
          <div className="mb-6 p-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg text-white">
            <h3 className="text-2xl font-bold mb-2">
              {isAdmin ? "Du er logget ind. Du er admin" : "Du er logget ind."}
            </h3>
            <p className="text-indigo-100">
              {isAdmin
                ? "Som administrator har du adgang til alle funktioner"
                : "Velkommen til din sikre konto"}
            </p>
          </div>

          {/* API Test Section (PDF requirement) */}
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Web API Endpoint
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Denne knap kalder API endpoint <code className="bg-gray-100 px-2 py-1 rounded">/api/hello</code>.
              {isAdmin
                ? " Som admin kan du få adgang til endpoint."
                : " Kun administratorer kan få adgang til denne endpoint."}
            </p>
            <ApiTestButton />
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Brugeroplysninger
            </h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Navn</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.name || "Ikke angivet"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rolle</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isAdmin ? "Administrator" : "Bruger"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Konto oprettet
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("da-DK")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Security Status Card */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sikkerhedsstatus
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  To-Faktor Godkendelse (2FA)
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {user.twoFactorEnabled
                    ? "Aktiveret - Din konto er beskyttet"
                    : "Deaktiveret - Overvej at aktivere for øget sikkerhed"}
                </p>
              </div>
              <div>
                {user.twoFactorEnabled ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Aktiveret
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    ⚠ Deaktiveret
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/settings/security"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {user.twoFactorEnabled
                  ? "Administrer 2FA"
                  : "Aktiver 2FA"}
              </Link>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Velkommen til Sikkerhedsapp! Dette er en demonstration af
              autentificering, to-faktor godkendelse og role-based authorization med Next.js og Auth.js.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
