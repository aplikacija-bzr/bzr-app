"use client";

import { useState } from "react";

type Control = {
  objectName: string;
  date: string;
  status: string;
  adviser: string;
};

type MonthlyPdfButtonProps = {
  employerId?: string | number;
  employerName?: string;
  month?: string;
  controls?: Control[];
};

export default function MonthlyPdfButton({
  employerId,
  employerName,
  month,
  controls = [],
}: MonthlyPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const isDisabled = !employerId || !month || controls.length === 0;

  const handleClick = async () => {
    if (isDisabled) return;

    try {
      setLoading(true);

      const res = await fetch("/api/monthly-reports/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employerId,
          employerName,
          month,
          controls,
          previewOnly: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("PDF preview error:", text);
        alert("Greška pri generisanju PDF-a.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("PDF error:", err);
      alert("Greška pri generisanju PDF-a.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || loading}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: isDisabled || loading ? "#9ca3af" : "#111111",
        color: "#ffffff",
        fontSize: "14px",
        cursor: isDisabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Generišem..." : "PDF izveštaj"}
    </button>
  );
}