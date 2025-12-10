"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FileInfo {
  id: string;
  filename: string;
  filetype: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedFor: string;
}

export default function FileList() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files/list?admin=true");
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

  const handleDelete = async (fileId: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne fil?")) return;

    try {
      const response = await fetch(`/api/files/delete?id=${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
        router.refresh();
      }
    } catch (error) {
      console.error("Fejl ved sletning:", error);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Indlæser...</p>;
  }

  if (files.length === 0) {
    return <p className="text-gray-500">Ingen filer uploadet endnu.</p>;
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900">{file.filename}</p>
            <p className="text-sm text-gray-500">
              Til: {file.uploadedFor} | {new Date(file.uploadedAt).toLocaleDateString("da-DK")}
            </p>
          </div>
          <button
            onClick={() => handleDelete(file.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Slet
          </button>
        </div>
      ))}
    </div>
  );
}
