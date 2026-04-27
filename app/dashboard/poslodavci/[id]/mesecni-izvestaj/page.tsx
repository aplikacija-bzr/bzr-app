"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function MesecniIzvestajPage() {
  const params = useParams();
  const employerId = params.id as string;

  const month = new Date().toISOString().slice(0, 7); // npr 2026-04

  useEffect(() => {
    const url = `/api/mesecni-izvestaj?employer_id=${employerId}&month=${month}`;
    window.open(url, "_blank");
  }, [employerId, month]);

  return <div>Generisanje mesečnog izveštaja...</div>;
}