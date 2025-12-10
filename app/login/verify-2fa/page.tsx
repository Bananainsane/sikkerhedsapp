"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyTwoFactorLogin } from "@/app/actions/twoFactor";
import { signIn } from "next-auth/react";

export default function Verify2FAPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get the email and userId from sessionStorage (set during login)
    const tempEmail = sessionStorage.getItem("tempLoginEmail");
    const tempUserId = sessionStorage.getItem("tempLoginUserId");
    if (!tempEmail || !tempUserId) {
      // If no email/userId, redirect to login
      router.push("/login");
    } else {
      setEmail(tempEmail);
      setUserId(tempUserId);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!userId) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    // Get stored password
    const password = sessionStorage.getItem("tempLoginPassword");
    if (!password) {
      setError("Session expired. Please log in again.");
      sessionStorage.removeItem("tempLoginEmail");
      sessionStorage.removeItem("tempLoginUserId");
      router.push("/login");
      return;
    }

    try {
      // Verify 2FA and complete login (now using userId)
      await verifyTwoFactorLogin(userId, password, code);

      // Clear temp storage
      sessionStorage.removeItem("tempLoginEmail");
      sessionStorage.removeItem("tempLoginPassword");
      sessionStorage.removeItem("tempLoginUserId");

      // If we get here without error, redirect happened
    } catch (error: any) {
      // Check if it's an actual error or just a redirect
      if (error?.message?.includes("NEXT_REDIRECT")) {
        // This is expected - NextAuth redirects after successful login
        sessionStorage.removeItem("tempLoginEmail");
        sessionStorage.removeItem("tempLoginPassword");
        sessionStorage.removeItem("tempLoginUserId");
        return;
      }

      // Real error occurred
      setError(error?.message || "Verification failed. Please try again.");
      setLoading(false);
    }
  }

  function handleCancel() {
    sessionStorage.removeItem("tempLoginEmail");
    sessionStorage.removeItem("tempLoginPassword");
    sessionStorage.removeItem("tempLoginUserId");
    router.push("/login");
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            To-Faktor Godkendelse
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Indtast koden fra din authenticator app
          </p>
          <p className="text-xs text-gray-500">
            Bruger: {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Verifikationskode
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              required
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Indtast den 6-cifrede kode fra din app
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verificerer..." : "Verificer"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuller
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Tip: Åbn din authenticator app (Google Authenticator, Authy,
            osv.) og find koden for Sikkerhedsapp.
          </p>
        </div>
      </div>
    </div>
  );
}
