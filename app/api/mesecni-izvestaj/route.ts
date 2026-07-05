import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { pdf } from "@react-pdf/renderer";
import MonthlyInspectionPdf from "@/app/components/MonthlyInspectionPdf";

export const runtime = "nodejs";

type InspectionRow = {
  id: string;
  created_at: string | null;
  inspection_date: string | null;
  object_name: string | null;
  client_name: string | null;
};

type AnswerRow = {
  id: string;
  inspection_id: string;
  answer: string | null;
  comment: string | null;
  checklist_items?: {
    title: string | null;
  } | null;
};

type PhotoRow = {
  id: string;
  inspection_id: string;
  file_path: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

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

function calculateGrade(noPercent: number) {
  if (noPercent <= 1) return "MERE ZA BZR ODLIČNE";
  if (noPercent <= 5) return "MERE ZA BZR ZADOVOLJAVAJUĆE";
  if (noPercent <= 8) return "MERE ZA BZR PRIHVATLJIVE";
  if (noPercent <= 10) return "MERE ZA BZR NEZADOVOLJAVAJUĆE";
  return "MERE ZA BZR NEPRIHVATLJIVE";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const employerId = searchParams.get("employer_id") || "";
    const month = searchParams.get("month") || "";
    const advisorName = searchParams.get("advisor_name") || "";

    if (!employerId || !month) {
      return NextResponse.json(
        { error: "Nedostaje employer_id ili month." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const [year, m] = month.split("-");
    const startDate = `${year}-${m}-01`;
    const endDate = new Date(Number(year), Number(m), 1)
      .toISOString()
      .slice(0, 10);

    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("id, name, email, contact_person")
      .eq("id", employerId)
      .maybeSingle();

    if (employerError) {
      return NextResponse.json({ error: employerError.message }, { status: 500 });
    }

    const employerName = employer?.name || "Poslodavac";

    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from("inspections")
      .select("id, created_at, inspection_date, object_name, client_name")
      .eq("employer_id", employerId)
      .gte("inspection_date", startDate)
      .lt("inspection_date", endDate)
      .order("inspection_date", { ascending: true });

    if (inspectionsError) {
      return NextResponse.json(
        { error: inspectionsError.message },
        { status: 500 }
      );
    }

    const inspections = (inspectionsData ?? []) as InspectionRow[];
    const inspectionIds = inspections.map((i) => i.id);

    let answers: AnswerRow[] = [];
    let photos: PhotoRow[] = [];

    if (inspectionIds.length > 0) {
      const { data: answersData, error: answersError } = await supabase
        .from("inspection_answers")
        .select("id, inspection_id, answer, comment, checklist_items(title)")
        .in("inspection_id", inspectionIds);

      if (answersError) {
        return NextResponse.json(
          { error: answersError.message },
          { status: 500 }
        );
      }

      answers = (answersData ?? []) as unknown as AnswerRow[];

      const { data: photosData, error: photosError } = await supabase
        .from("inspection_photos")
        .select("id, inspection_id, file_path")
        .in("inspection_id", inspectionIds);

      if (photosError) {
        return NextResponse.json(
          { error: photosError.message },
          { status: 500 }
        );
      }

      photos = (photosData ?? []) as PhotoRow[];
    }

    const answersMap = new Map<string, AnswerRow[]>();
    answers.forEach((a) => {
      if (!answersMap.has(a.inspection_id)) {
        answersMap.set(a.inspection_id, []);
      }
      answersMap.get(a.inspection_id)!.push(a);
    });

    const photosMap = new Map<string, string[]>();
    photos.forEach((p) => {
      if (!photosMap.has(p.inspection_id)) {
        photosMap.set(p.inspection_id, []);
      }
      photosMap.get(p.inspection_id)!.push(buildPublicUrl(p.file_path));
    });

    const controls = inspections.map((inspection) => {
      const inspectionAnswers = answersMap.get(inspection.id) || [];

      const yesCount = inspectionAnswers.filter(
        (a) => a.answer?.toLowerCase() === "da"
      ).length;

      const noAnswers = inspectionAnswers.filter(
        (a) => a.answer?.toLowerCase() === "ne"
      );

      const totalQuestions = inspectionAnswers.length;
      const noCount = noAnswers.length;
      const noPercent =
        totalQuestions > 0 ? (noCount / totalQuestions) * 100 : 0;

      return {
        id: inspection.id,
        date: formatDateSr(getInspectionDate(inspection)),
        objectName: inspection.object_name || inspection.client_name || "-",
        totalQuestions,
        yesCount,
        noCount,
        noPercent,
        grade: calculateGrade(noPercent),
        defects: noAnswers.map((a) => ({
          text: a.checklist_items?.title || "Pitanje",
          comment: a.comment || "",
        })),
        photos: photosMap.get(inspection.id) || [],
      };
    });

    const totalControls = controls.length;
    const totalQuestions = controls.reduce((sum, c) => sum + c.totalQuestions, 0);
    const totalYes = controls.reduce((sum, c) => sum + c.yesCount, 0);
    const totalNo = controls.reduce((sum, c) => sum + c.noCount, 0);
    const noPercent = totalQuestions > 0 ? (totalNo / totalQuestions) * 100 : 0;
    const monthNumber = month.split("-")[1] || "00";

const now = new Date();

// Datum koji će se prikazivati u PDF-u
const issueDate = now.toLocaleDateString("sr-RS");

// Datum koji ulazi u broj izveštaja
const reportDateForNumber = now
  .toISOString()
  .slice(0, 10)
  .replaceAll("-", "");

const reportNumber = `M-${monthNumber}-${reportDateForNumber}-001`;
    console.log("=== NOVI MONTHLY PDF ===");
    const pdfElement = React.createElement(MonthlyInspectionPdf, {
      companyName: "INPRO BZR",
      employerName,
      advisorName: advisorName || "-",
      monthLabel: formatMonthLabel(month),
      reportNumber,
      issueDate,
      controls,
      summary: {
        totalControls,
        totalQuestions,
        totalYes,
        totalNo,
        noPercent,
        grade: calculateGrade(noPercent),
      },
    });

    const buffer = await pdf(pdfElement as any).toBuffer();

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="mesecni-izvestaj-${month}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Greška kod mesečnog izveštaja:", error);

    return NextResponse.json(
      { error: "Greška prilikom izrade mesečnog izveštaja." },
      { status: 500 }
    );
  }
}