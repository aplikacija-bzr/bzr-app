"use client";

import { useState } from "react";

type SendMonthlyReportButtonProps = {
  inspectionId: string;
  companyName: string;
  advisorName: string;
};

export default function SendMonthlyReportButton({
  inspectionId,
  companyName,
  advisorName,
}: SendMonthlyReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleOpenPdf = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/mesecni-izvestaj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionId,
          companyName,
          advisorName,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Greška API:", errorText);
        throw new Error("Greška pri generisanju PDF-a");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (error) {
      console.error("Greška pri otvaranju PDF-a:", error);
      alert("Greška pri otvaranju PDF-a.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenPdf}
      disabled={loading}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Generišem PDF..." : "Otvori mesečni izveštaj"}
    </button>
  );
}