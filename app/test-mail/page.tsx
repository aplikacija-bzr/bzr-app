"use client";

import { useState } from "react";

export default function TestMailPage() {
  const [email, setEmail] = useState("slobodan.maksimovic@inpro.rs");
  const [employerId, setEmployerId] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [month, setMonth] = useState("2026-04");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setMessage("");

    if (!email.trim()) {
      setMessage("❌ Unesi email.");
      return;
    }

    if (!employerId.trim()) {
      setMessage("❌ Unesi pravi employer_id iz baze.");
      return;
    }

    if (!month.trim()) {
      setMessage("❌ Unesi mesec, npr. 2026-04.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/mesecni-izvestaj/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          employer_id: employerId,
          employer_name: employerName,
          advisor_name: advisorName,
          month,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Greška pri slanju.");
      }

      setMessage("✅ Email uspešno poslat!");
    } catch (err: any) {
      setMessage("❌ Greška: " + (err.message || "Nepoznata greška"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Test slanja mesečnog izveštaja</h2>

      <div style={{ marginTop: 12 }}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Employer ID</label>
        <input
          type="text"
          value={employerId}
          onChange={(e) => setEmployerId(e.target.value)}
          placeholder="unesi pravi employer_id iz Supabase"
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Naziv firme</label>
        <input
          type="text"
          value={employerName}
          onChange={(e) => setEmployerName(e.target.value)}
          placeholder="npr. DOO INPRO"
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Savetnik</label>
        <input
          type="text"
          value={advisorName}
          onChange={(e) => setAdvisorName(e.target.value)}
          placeholder="npr. Slobodan Maksimović"
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Mesec</label>
        <input
          type="text"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="2026-04"
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          backgroundColor: loading ? "#ccc" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Slanje..." : "Pošalji mail"}
      </button>

      {message && (
        <p style={{ marginTop: 15, fontWeight: "bold" }}>{message}</p>
      )}
    </div>
  );
}