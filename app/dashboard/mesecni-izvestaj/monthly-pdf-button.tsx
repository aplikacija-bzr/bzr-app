"use client";

import { useState } from "react";

type MonthlyPdfButtonProps = {
  employerId?: string | number;
  month?: string;
};

export default function MonthlyPdfButton({
  employerId,
  month,
}: MonthlyPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const isDisabled = !employerId || !month || loading;

  const handleClick = async () => {
    if (isDisabled) return;

    try {
      setLoading(true);

      const res = await fetch("/api/mesecni-izvestaj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employerId: String(employerId),
          month: String(month),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Greška API:", errorText);
        throw new Error("Greška pri generisanju mesečnog PDF-a.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Greška pri otvaranju mesečnog PDF-a:", error);
      alert("Greška pri otvaranju mesečnog PDF-a.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="rounded bg-black px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {loading ? "Generišem..." : "Generiši PDF"}
    </button>
  );
}