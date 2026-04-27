"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  employerId: string;
  advisorId: string | null;
  month: string;
  employerName: string;
  advisorName: string;
  inspectionsCount: number;
  defaultEmail?: string;
};

export default function SendMonthlyReportButton({
  employerId,
  advisorId,
  month,
  employerName,
  advisorName,
  inspectionsCount,
  defaultEmail = "",
}: Props) {
  const router = useRouter();

  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail(defaultEmail || "");
  }, [defaultEmail, employerId]);

  async function handleClick() {
    try {
      setMessage("");

      if (!email.trim()) {
        setMessage("❌ Unesi email klijenta.");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/mesecni-izvestaj/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          employer_id: employerId,
          advisor_id: advisorId,
          employer_name: employerName,
          advisor_name: advisorName,
          month,
          inspections_count: inspectionsCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Greška pri slanju.");
      }

      setMessage("✅ Email uspešno poslat i evidentiran.");

      setTimeout(() => {
        router.refresh();
      }, 700);
    } catch (err: any) {
      setMessage("❌ Greška: " + (err.message || "Nepoznata greška"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
        marginTop: "12px",
        flexWrap: "wrap",
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Unesi email klijenta"
        style={{
          width: 260,
          padding: "10px 12px",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          cursor: loading ? "not-allowed" : "pointer",
          display: "inline-block",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Slanje..." : "Pošalji klijentu na mail"}
      </button>

      {message ? <div style={{ width: "100%" }}>{message}</div> : null}
    </div>
  );
}