"use client";

import { useState } from "react";

type ResendReportButtonProps = {
  employerId: string;
  advisorId: string | null;
  month: string;
  employerName: string;
  advisorName: string;
  inspectionsCount: number;
  email: string;
};

export default function ResendReportButton({
  employerId,
  advisorId,
  month,
  employerName,
  advisorName,
  inspectionsCount,
  email,
}: ResendReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const isDisabled = !employerId || !month || !email || loading;

  const handleResend = async () => {
    if (isDisabled) return;

    try {
      setLoading(true);

      const response = await fetch("/api/mesecni-izvestaj/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employerId,
          advisorId,
          month,
          employerName,
          advisorName,
          inspectionsCount,
          recipientEmail: email,
          forceResend: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Greška pri ponovnom slanju.");
      }

      alert("Izveštaj je uspešno ponovo poslat.");
    } catch (error: any) {
      alert(error?.message || "Greška pri ponovnom slanju.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isDisabled}
      className="rounded bg-black px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {loading ? "Šaljem..." : "Ponovo pošalji"}
    </button>
  );
}