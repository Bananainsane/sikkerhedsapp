"use client";

import { useState, useEffect } from "react";

interface FileInfo {
  id: string;
  filename: string;
  filetype: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ValidationResult {
  fileId: string;
  valid: boolean;
  message: string;
}

interface UserFileListProps {
  username: string;
}

export default function UserFileList({ username }: UserFileListProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files/list");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Fejl ved hentning af filer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAndDownload = async (fileId: string, filename: string) => {
    setDownloadingId(fileId);

    try {
      // First verify integrity
      const verifyResponse = await fetch(`/api/files/download?id=${fileId}&verify=true`);
      const verifyData = await verifyResponse.json();

      // Store validation result
      setValidationResults((prev) => ({
        ...prev,
        [fileId]: {
          fileId,
          valid: verifyData.valid,
          message: verifyData.message,
        },
      }));

      // Then download the file
      const downloadResponse = await fetch(`/api/files/download?id=${fileId}`);

      if (downloadResponse.ok) {
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download fejl:", error);
      setValidationResults((prev) => ({
        ...prev,
        [fileId]: {
          fileId,
          valid: false,
          message: "Download fejlede",
        },
      }));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Indlæser...</p>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-gray-500">No files available to download</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const validation = validationResults[file.id];

        return (
          <div
            key={file.id}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{file.filename}</p>
                <p className="text-sm text-gray-500">
                  Uploadet af: {file.uploadedBy} |{" "}
                  {new Date(file.uploadedAt).toLocaleDateString("da-DK")}
                </p>
              </div>
              <button
                onClick={() => handleValidateAndDownload(file.id, file.filename)}
                disabled={downloadingId === file.id}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingId === file.id ? "Downloader..." : "Validate & Download"}
              </button>
            </div>

            {/* Validation Result */}
            {validation && (
              <div
                className={`mt-4 p-3 rounded-md flex items-center ${
                  validation.valid
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {validation.valid ? (
                  <>
                    <svg
                      className="h-5 w-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium text-green-600">
                      No contamination detected
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5 mr-2 text-red-500"
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
                    <span className="font-medium text-red-600">Contaminated</span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
