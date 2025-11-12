"use client";

import { useState } from "react";

/**
 * Client component to test the /api/hello endpoint
 *
 * PDF Requirements:
 * - Button visible to all logged-in users
 * - Calls POST /api/hello
 * - Shows "Hello, World! From api" for admin users
 * - Shows "Adgang nægtet, du er ikke admin" for non-admin users
 */
export default function ApiTestButton() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResponse(null);
    setError(false);

    try {
      const res = await fetch("/api/hello", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        // API returned an error (403 for non-admin, 401 for not authenticated)
        setError(true);
        setResponse(data.error || "Der opstod en fejl");
      } else {
        // Success - user is admin
        setError(false);
        setResponse(data.message);
      }
    } catch (err) {
      setError(true);
      setResponse("Kunne ikke oprette forbindelse til API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={testApi}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Tester API..." : "Test API Endpoint"}
      </button>

      {/* Response Display */}
      {response && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            error
              ? "bg-red-50 border-2 border-red-200"
              : "bg-green-50 border-2 border-green-200"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {error ? (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  error ? "text-red-800" : "text-green-800"
                }`}
              >
                {error ? "Adgang nægtet" : "Success"}
              </h3>
              <div
                className={`mt-2 text-sm ${
                  error ? "text-red-700" : "text-green-700"
                }`}
              >
                <p>{response}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
