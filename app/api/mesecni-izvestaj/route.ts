import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { pdf } from "@react-pdf/renderer";
import InspectionPdf from "../../components/InspectionPdf";

type InspectionRow = {
  id: string;
  created_at: string | null;
  inspection_date?: string | null;
  object_name?: string | null;
  client_name?: string | null;
};

type AnswerRow = {
  id: string;
  inspection_id: string;
  checklist_item_id?: string | null;
  answer: string;
  comment: string | null;
};

type PhotoRow = {
  id: string;
  inspection_id: string;
  file_path: string;
};

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${m}.${year}`;
}

function formatDateSr(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("sr-RS");
}

function isInMonth(dateValue: string | null | undefined, month: string) {
  if (!dateValue) return false;

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}` === month;
}

function getInspectionDate(row: InspectionRow) {
  return row.inspection_date || row.created_at || null;
}

async function buildMonthlyPdf({
  employerId,
  month,
  advisorName,
}: {
  employerId: string;
  month: string;
  advisorName?: string;
}) {
  const supabase = await createClient();

  // 🔥 OVDE JE KLJUČNA IZMENA
  const { data: employerRows } = await supabase
    .from("employers")
    .select("id, name, email, contact_person")
    .eq("id", employerId)
    .limit(1);

  const employer = employerRows?.[0];

  const employerName = employer?.name || "Firma";
  const employerEmail = employer?.email || "";
  const contactPerson = employer?.contact_person || "";

  const { data: inspectionsData } = await supabase
    .from("inspections")
    .select("id, created_at, inspection_date, object_name, client_name")
    .eq("employer_id", employerId)
    .order("created_at", { ascending: true });

  const allInspections = (inspectionsData ?? []) as InspectionRow[];

  const inspections = allInspections.filter((row) =>
    isInMonth(getInspectionDate(row), month)
  );

  const inspectionIds = inspections.map((i) => i.id);

  const { data: photosData } = await supabase
    .from("inspection_photos")
    .select("id, inspection_id, file_path")
    .in("inspection_id", inspectionIds);

  const photos = (photosData ?? []) as PhotoRow[];

  const photosMap = new Map<string, string[]>();

  photos.forEach((p) => {
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-images/${p.file_path}`;

    if (!photosMap.has(p.inspection_id)) {
      photosMap.set(p.inspection_id, []);
    }

    photosMap.get(p.inspection_id)!.push(publicUrl);
  });

  const { data: answersData } = await supabase
    .from("inspection_answers")
    .select("id, inspection_id, answer, comment")
    .in("inspection_id", inspectionIds)
    .eq("answer", "ne");

  const answers = (answersData ?? []) as AnswerRow[];

  const items =
    answers.length > 0
      ? answers.map((a, index) => {
          const inspection = inspections.find((i) => i.id === a.inspection_id);
          const inspectionPhotos = photosMap.get(a.inspection_id) || [];

          return {
            question: `${index + 1}. ${
              inspection?.object_name || inspection?.client_name || "-"
            } | ${formatDateSr(getInspectionDate(inspection!))}`,
            answer: "NE",
            comment: a.comment || "",
            photos: inspectionPhotos,
          };
        })
      : [
          {
            question:
              "U izabranom periodu nema odgovora NE u dnevnim kontrolama.",
            answer: "",
            comment: "",
            photos: [],
          },
        ];

  const pdfElement = React.createElement(InspectionPdf, {
    title: "MESEČNI IZVEŠTAJ",
    companyName: employerName,
    employerName,
    employerEmail,     // 🔥 DODATO
    contactPerson,     // 🔥 DODATO
    advisorName: advisorName || "-",
    inspectionDate: `Mesec: ${formatMonthLabel(month)}`,
    items,
  });

  const buffer = await pdf(pdfElement).toBuffer();

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mesecni-${month}.pdf"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const employerId = searchParams.get("employer_id") || "";
  const month = searchParams.get("month") || "";
  const advisorName = searchParams.get("advisor_name") || "";

  return buildMonthlyPdf({
    employerId,
    month,
    advisorName,
  });
}