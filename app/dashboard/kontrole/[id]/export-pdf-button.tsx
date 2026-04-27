"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

type Item = {
  title: string;
  answer: string;
  comment: string;
};

type Props = {
  inspectionId: string;
  items: Item[];
  clientName?: string;
  objectName?: string;
  inspectionDate?: string;
};

const ADVISORS = [
  "Slobodan Maksimovic",
  "Milija Maric",
  "Milan Jovanovic",
  "Milena Maric",
];

function normalizeText(text: string) {
  return text
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/đ/g, "dj")
    .replace(/Č/g, "C")
    .replace(/Ć/g, "C")
    .replace(/Ž/g, "Z")
    .replace(/Š/g, "S")
    .replace(/Đ/g, "Dj");
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function normalizeAnswer(answer: string) {
  if (answer === "da") return "DA";
  if (answer === "ne") return "NE";
  if (answer === "nije_primenljivo") return "NIJE PRIMENLJIVO";
  return "-";
}

export default function ExportPdfButton({
  inspectionId,
  items,
  clientName = "",
  objectName = "",
  inspectionDate = "",
}: Props) {
  const [advisorName, setAdvisorName] = useState(ADVISORS[0]);

  const handleExport = async () => {
    try {
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      let y = 16;

      const logoDataUrl = await loadImageAsDataUrl("/Logo-transparentan.png");

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", margin, y - 2, 44, 18);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("IZVESTAJ O BZR KONTROLI", logoDataUrl ? 58 : margin, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(`Kontrola ID: ${inspectionId}`, logoDataUrl ? 58 : margin, y + 10);

      doc.text(
        `Datum kontrole: ${
          inspectionDate
            ? new Date(inspectionDate).toLocaleDateString("sr-RS")
            : "-"
        }`,
        logoDataUrl ? 58 : margin,
        y + 15
      );

      doc.text(
        `Savetnik za BZR: ${normalizeText(advisorName)}`,
        logoDataUrl ? 58 : margin,
        y + 20
      );

      doc.text(`DOO INPRO BB`, logoDataUrl ? 58 : margin, y + 25);

      doc.text(
        `Licenca: 164-02-00268/2025-01`,
        logoDataUrl ? 58 : margin,
        y + 30
      );

      if (clientName) {
        doc.text(
          `Poslodavac: ${normalizeText(clientName)}`,
          logoDataUrl ? 58 : margin,
          y + 35
        );
      }

      if (objectName) {
        doc.text(
          `Objekat: ${normalizeText(objectName)}`,
          logoDataUrl ? 58 : margin,
          y + 40
        );
      }

      y += 50;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const answeredCount = items.filter((item) => item.answer).length;
      const progress =
        items.length > 0 ? Math.round((answeredCount / items.length) * 100) : 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Pregled kontrole", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Ukupno stavki: ${items.length} | Odgovoreno: ${answeredCount} | Progres: ${progress}%`,
        margin,
        y
      );
      y += 7;

      items.forEach((item, index) => {
        const answer = normalizeAnswer(item.answer);
        const comment = item.comment?.trim() ? item.comment.trim() : "-";

        const fullText = `${index + 1}. ${normalizeText(item.title)} | ${answer} | ${normalizeText(comment)}`;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);

        const lines = doc.splitTextToSize(fullText, contentWidth);
        const rowHeight = lines.length * 4 + 2;

        if (y + rowHeight > pageHeight - 20) {
          doc.addPage();
          y = 14;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 1, contentWidth, rowHeight, "F");
        }

        doc.text(lines, margin, y + 3);
        y += rowHeight;
      });

      if (y + 28 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Zakljucak", margin, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const zakljucak = doc.splitTextToSize(
        "Na osnovu izvrsene kontrole utvrdjeno je stanje bezbednosti i zdravlja na radu. Sve nepravilnosti navedene u ovom izvestaju potrebno je otkloniti u najkracem roku.",
        contentWidth
      );
      doc.text(zakljucak, margin, y + 15);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(90);

      const napomena = doc.splitTextToSize(
        "Ovaj izvestaj je generisan u okviru interne dokumentacije DOO INPRO BB i punovazan je bez potpisa i pecata.",
        contentWidth
      );
      doc.text(napomena, margin, y + 30);

      const totalPages = doc.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Strana ${i} / ${totalPages}`, pageWidth - 28, pageHeight - 8);
      }

      doc.save(`kontrola-${inspectionId}.pdf`);
    } catch (error) {
      console.error("Greska pri exportu PDF-a:", error);
      alert("Export PDF nije uspeo.");
    }
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <select
        value={advisorName}
        onChange={(e) => setAdvisorName(e.target.value)}
        className="rounded-md border px-3 py-2"
      >
        {ADVISORS.map((advisor) => (
          <option key={advisor} value={advisor}>
            {advisor}
          </option>
        ))}
      </select>

      <button
        onClick={handleExport}
        className="rounded-md border px-4 py-2 font-medium"
        style={{
          backgroundColor: "#111827",
          color: "white",
        }}
      >
        Export PDF
      </button>
    </div>
  );
}