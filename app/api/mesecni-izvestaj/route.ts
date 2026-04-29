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
  answer: string;
  comment: string | null;
};

type PhotoRow = {
  id: string;
  inspection_id: string;
  file_path: string;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://YOUR_PROJECT.supabase.co"; // fallback OBAVEZNO zameni ako treba

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${m}.${year}`;
}

function formatDateSr(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("sr-RS");
}

function getInspectionDate(row: InspectionRow) {
  return row.inspection_date || row.created_at || null;
}

function buildPublicUrl(path: string) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return `${SUPABASE_URL}/storage/v1/object/public/inspection-images/${path}`;
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

  const [year, m] = month.split("-");
  const startDate = `${year}-${m}-01`;

  const endDate = new Date(Number(year), Number(m), 1)
    .toISOString()
    .slice(0, 10);

  const { data: employer } = await supabase
    .from("employers")
    .select("id, name, email, contact_person")
    .eq("id", employerId)
    .maybeSingle();

  const employerName = employer?.name || "Firma";
  const employerEmail = employer?.email || "";
  const contactPerson = employer?.contact_person || "";

  const { data: inspectionsData } = await supabase
    .from("inspections")
    .select("id, created_at, inspection_date, object_name, client_name")
    .eq("employer_id", employerId)
    .gte("inspection_date", startDate)
    .lt("inspection_date", endDate)
    .order("inspection_date", { ascending: true });

  const inspections = (inspectionsData ?? []) as InspectionRow[];
  const inspectionIds = inspections.map((i) => i.id);

  let photos: PhotoRow[] = [];
  let answers: AnswerRow[] = [];

  if (inspectionIds.length > 0) {
    const { data: photosData } = await supabase
      .from("inspection_photos")
      .select("id, inspection_id, file_path")
      .in("inspection_id", inspectionIds);

    photos = (photosData ?? []) as PhotoRow[];

    const { data: answersData } = await supabase
      .from("inspection_answers")
      .select("id, inspection_id, answer, comment")
      .in("inspection_id", inspectionIds);

    answers = (answersData ?? []) as AnswerRow[];
  }

  const photosMap = new Map<string, string[]>();

  photos.forEach((p) => {
    const publicUrl = buildPublicUrl(p.file_path);

    if (!photosMap.has(p.inspection_id)) {
      photosMap.set(p.inspection_id, []);
    }

    photosMap.get(p.inspection_id)!.push(publicUrl);
  });

  const answersMap = new Map<string, AnswerRow[]>();

  answers.forEach((a) => {
    if (!answersMap.has(a.inspection_id)) {
      answersMap.set(a.inspection_id, []);
    }

    answersMap.get(a.inspection_id)!.push(a);
  });

  const items =
    inspections.length > 0
      ? inspections.map((inspection, index) => {
          const inspectionAnswers = answersMap.get(inspection.id) || [];

          const negativeAnswers = inspectionAnswers.filter(
            (a) => a.answer?.toLowerCase() === "ne"
          );

          return {
            question: `${index + 1}. ${
              inspection.object_name || inspection.client_name || "-"
            } | ${formatDateSr(getInspectionDate(inspection))}`,

            answer: negativeAnswers.length > 0 ? "NE" : "DA",

            comment:
              negativeAnswers.length > 0
                ? negativeAnswers
                    .map((a) => a.comment)
                    .filter(Boolean)
                    .join("; ")
                : "Kontrola izvršena. Nema evidentiranih nepravilnosti.",

            photos: photosMap.get(inspection.id) || [],
          };
        })
      : [
          {
            question: "U izabranom mesecu nema evidentiranih dnevnih kontrola.",
            answer: "",
            comment: "",
            photos: [],
          },
        ];

  const pdfElement = React.createElement(InspectionPdf, {
    title: "MESEČNI IZVEŠTAJ",
    companyName: employerName,
    employerName,
    employerEmail,
    contactPerson,
    advisorName: advisorName || "-",
    inspectionDate: `Mesec: ${formatMonthLabel(month)}`,
    items,
  });

  const buffer = await pdf(pdfElement).toBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
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