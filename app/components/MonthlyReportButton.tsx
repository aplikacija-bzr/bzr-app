"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  employerId: string;
  advisorName: string;
};

export default function MonthlyReportButton({
  employerId,
  advisorName,
}: Props) {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [month, setMonth] = useState(defaultMonth);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  useEffect(() => {
    const loadEmailSuggestions = async () => {
      try {
        const res = await fetch("/api/email-suggestions");
        const data = await res.json();

        if (res.ok && Array.isArray(data?.emails)) {
          setEmailSuggestions(data.emails);
        }
      } catch {
        // nije kritično
      }
    };

    loadEmailSuggestions();
  }, []);

  const filteredEmails = useMemo(() => {
    const value = email.toLowerCase().trim();

    return emailSuggestions
      .filter((suggestion) => {
        const cleanEmail = suggestion.toLowerCase();

        if (!value) return true;

        return cleanEmail.includes(value) && cleanEmail !== value;
      })
      .slice(0, 8);
  }, [emailSuggestions, email]);

  const handleOpen = () => {
    const url = `/api/mesecni-izvestaj?employer_id=${employerId}&month=${month}&advisor_name=${advisorName}`;
    window.open(url, "_blank");
  };

  const handleSend = async () => {
    try {
      setMessage("");

      if (!email.trim()) {
        setMessage("Unesi email primaoca.");
        return;
      }

      setSending(true);

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          employerId,
          month,
          advisorName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Greška pri slanju emaila.");
      }

      setMessage("Email je poslat.");

      const suggestionsRes = await fetch("/api/email-suggestions");
      const suggestionsData = await suggestionsRes.json();

      if (suggestionsRes.ok && Array.isArray(suggestionsData?.emails)) {
        setEmailSuggestions(suggestionsData.emails);
      }
    } catch (err: any) {
      setMessage(err.message || "Greška pri slanju.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />

        <button
          onClick={handleOpen}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
        >
          Otvori mesečni izveštaj
        </button>
      </div>

      <div className="flex gap-3 items-start flex-wrap">
        <div className="relative">
          <input
            type="text"
            value={email}
            onFocus={() => setShowEmailSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowEmailSuggestions(false), 150);
            }}
            onChange={(e) => {
              setEmail(e.target.value);
              setShowEmailSuggestions(true);
            }}
            placeholder="Email primaoca"
            className="border px-3 py-2 rounded-lg w-[280px]"
          />

          {showEmailSuggestions && filteredEmails.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
              {filteredEmails.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={() => {
                    setEmail(suggestion);
                    setShowEmailSuggestions(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm border-b hover:bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
        >
          {sending ? "Slanje..." : "Pošalji mesečni izveštaj"}
        </button>
      </div>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}