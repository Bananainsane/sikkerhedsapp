"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface FileUploadFormProps {
  users: User[];
  adminEmail: string;
}

export default function FileUploadForm({ users, adminEmail }: FileUploadFormProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !file) {
      setMessage({ type: "error", text: "Vælg en bruger og en fil" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetUser", selectedUser);
      formData.append("adminEmail", adminEmail);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Fil uploadet: ${file.name}` });
        setFile(null);
        setSelectedUser("");
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Refresh page to show new file
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error || "Upload fejlede" });
      }
    } catch {
      setMessage({ type: "error", text: "Netværksfejl" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Selection */}
      <div>
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
          Vælg bruger
        </label>
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="">-- Vælg en bruger --</option>
          {users.map((user) => (
            <option key={user.id} value={user.name || user.email}>
              {user.name || user.email}
            </option>
          ))}
        </select>
      </div>

      {/* File Input */}
      <div>
        <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
          Vælg fil
        </label>
        <input
          id="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-500">
            Valgt: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !selectedUser || !file}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Uploader..." : "Upload Fil"}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
