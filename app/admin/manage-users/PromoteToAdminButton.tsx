"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromoteToAdminButtonProps {
  userId: string;
  userEmail: string;
}

export default function PromoteToAdminButton({
  userId,
  userEmail,
}: PromoteToAdminButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const promoteToAdmin = async () => {
    if (
      !confirm(
        `Er du sikker på, at du vil forfremme ${userEmail} til administrator?`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert(`${userEmail} er nu forfremmet til administrator`);
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Fejl: ${data.error}`);
      }
    } catch (error) {
      alert("Der opstod en fejl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={promoteToAdmin}
      disabled={loading}
      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? "Forfremer..." : "Forfrem til Admin"}
    </button>
  );
}
