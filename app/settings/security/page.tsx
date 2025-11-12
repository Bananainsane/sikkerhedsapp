"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
} from "@/app/actions/twoFactor";

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check current 2FA status
    fetch("/api/user/2fa-status")
      .then((res) => res.json())
      .then((data) => {
        setTwoFactorEnabled(data.twoFactorEnabled);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  async function handleEnableTwoFactor() {
    setLoading(true);
    setError("");

    const result = await generateTwoFactorSecret();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.otpauth && result.secret) {
      // Generate QR code from otpauth URL
      const qrCode = await QRCode.toDataURL(result.otpauth);
      setQrCodeUrl(qrCode);
      setSecret(result.secret);
      setShowSetup(true);
    }

    setLoading(false);
  }

  async function handleVerifyAndEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("code", verificationCode);

    const result = await enableTwoFactor(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess("2FA enabled successfully!");
      setTwoFactorEnabled(true);
      setShowSetup(false);
      setVerificationCode("");
      setLoading(false);

      // Refresh the page to update UI
      setTimeout(() => {
        router.refresh();
      }, 1500);
    }
  }

  async function handleDisableTwoFactor() {
    if (!confirm("Er du sikker på, at du vil deaktivere 2FA?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await disableTwoFactor();

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("2FA disabled successfully!");
      setTwoFactorEnabled(false);
    }

    setLoading(false);
    router.refresh();
  }

  if (loading && !showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-indigo-600 hover:text-indigo-500 mb-4"
          >
            ← Tilbage til Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Sikkerhedsindstillinger
          </h1>
          <p className="mt-2 text-gray-600">
            Administrer din kontos sikkerhedsfunktioner
          </p>
        </div>

        {/* 2FA Setup Modal */}
        {showSetup && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Opsæt To-Faktor Godkendelse
            </h2>

            <div className="space-y-6">
              {/* Step 1: Scan QR Code */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Trin 1: Scan QR-koden
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Brug din authenticator app (Google Authenticator, Authy,
                  Microsoft Authenticator) til at scanne denne QR-kode:
                </p>
                {qrCodeUrl && (
                  <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-64 h-64" />
                  </div>
                )}
              </div>

              {/* Step 2: Enter Code */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Trin 2: Indtast verifikationskode
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Indtast den 6-cifrede kode fra din authenticator app:
                </p>
                <form onSubmit={handleVerifyAndEnable} className="space-y-4">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    required
                  />

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-md bg-green-50 p-4">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? "Verificerer..." : "Verificer og Aktiver"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSetup(false);
                        setVerificationCode("");
                        setError("");
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                    >
                      Annuller
                    </button>
                  </div>
                </form>
              </div>

              {/* Manual Secret (fallback) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Kan ikke scanne QR-koden?
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  Indtast denne nøgle manuelt i din authenticator app:
                </p>
                <code className="block bg-white px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 font-mono break-all">
                  {secret}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Status Card */}
        {!showSetup && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              To-Faktor Godkendelse (2FA)
            </h2>

            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Status:
                  </h3>
                  <span className="ml-3">
                    {twoFactorEnabled ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Aktiveret
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Deaktiveret
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-600 max-w-2xl">
                  To-faktor godkendelse tilføjer et ekstra lag af sikkerhed til
                  din konto. Ud over dit password skal du indtaste en kode fra
                  din authenticator app når du logger ind.
                </p>
              </div>
            </div>

            {success && (
              <div className="rounded-md bg-green-50 p-4 mb-6">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              {!twoFactorEnabled ? (
                <button
                  onClick={handleEnableTwoFactor}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Opretter..." : "Aktiver 2FA"}
                </button>
              ) : (
                <button
                  onClick={handleDisableTwoFactor}
                  disabled={loading}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Deaktiverer..." : "Deaktiver 2FA"}
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Sådan fungerer det:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Download en authenticator app på din telefon</li>
                <li>Scan QR-koden for at tilføje din konto</li>
                <li>Indtast den 6-cifrede kode for at bekræfte</li>
                <li>Brug koden hver gang du logger ind fremover</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
