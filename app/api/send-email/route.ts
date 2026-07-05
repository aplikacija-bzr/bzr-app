import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import MonthlyInspectionPdf from "@/app/components/MonthlyInspectionPdf";

export const runtime = "nodejs";

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
type ChecklistItemRow = {
  id: string;
  title: string | null;
};

type PhotoRow = {
  id: string;
  inspection_id: string;
  file_path: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${m}.${year}`;
}

function formatDateSr(value: string | null | undefined) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}.`;
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

function getDailyGrade(noCount: number) {
  if (noCount === 0) return "MERE ZA BZR PRIMENJENE";
  if (noCount === 1) return "MERE ZA BZR PRIMENJENE ZADOVOLJAVAJUĆE";
  return "MERE ZA BZR NEZADOVOLJAVAJUĆE";
}

function getMonthlyGrade(noPercent: number) {
  if (noPercent <= 1) return "MERE ZA BZR ODLIČNE";
  if (noPercent <= 5) return "MERE ZA BZR ZADOVOLJAVAJUĆE";
  if (noPercent <= 8) return "MERE ZA BZR PRIHVATLJIVE";
  if (noPercent <= 10) return "MERE ZA BZR NEZADOVOLJAVAJUĆE";
  return "MERE ZA BZR NEPRIHVATLJIVE";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = body.to || "";
    const employerId = body.employerId || body.employer_id || "";
    const month = body.month || "";
    const advisorName = body.advisorName || body.advisor_name || "";

    if (!to) {
      return NextResponse.json(
        { error: "Nedostaje email primaoca." },
        { status: 400 }
      );
    }

    if (!employerId || !month) {
      return NextResponse.json(
        { error: "Nedostaju employerId ili month." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: employerRows, error: employerError } = await supabase
      .from("employers")
      .select("id, name")
      .eq("id", employerId)
      .limit(1);

    if (employerError) {
      throw new Error(`Greška employers: ${employerError.message}`);
    }

    const employerName = employerRows?.[0]?.name || "Firma";

    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from("inspections")
      .select("id, created_at, inspection_date, object_name, client_name")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: true });

    if (inspectionsError) {
      throw new Error(`Greška inspections: ${inspectionsError.message}`);
    }

    const allInspections = (inspectionsData ?? []) as InspectionRow[];

    const inspections = allInspections.filter((row) =>
      isInMonth(getInspectionDate(row), month)
    );

    const inspectionIds = inspections.map((i) => i.id);

    let controls: any[] = [];

    if (inspectionIds.length > 0) {
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

      const { data: answersData, error: answersError } = await supabase
        .from("inspection_answers")
        .select("id, inspection_id, checklist_item_id, answer, comment")
        .in("inspection_id", inspectionIds);

      if (answersError) {
        throw new Error(`Greška inspection_answers: ${answersError.message}`);
      }

      const answers = (answersData ?? []) as AnswerRow[];

      const { data: checklistItemsData, error: checklistItemsError } = await supabase
  .from("checklist_items")
  .select("id, title");

if (checklistItemsError) {
  throw new Error(`Greška checklist_items: ${checklistItemsError.message}`);
}

const checklistItems = (checklistItemsData ?? []) as ChecklistItemRow[];

const checklistMap = new Map<string, string>();

checklistItems.forEach((item) => {
  checklistMap.set(item.id, item.title || "Pitanje");
});
    

      controls = inspections.map((inspection) => {
        const inspectionAnswers = answers.filter(
          (a) => a.inspection_id === inspection.id
        );

        const yesCount = inspectionAnswers.filter(
          (a) => a.answer === "da"
        ).length;

        const noAnswers = inspectionAnswers.filter((a) => a.answer === "ne");

        const noCount = noAnswers.length;
        const totalQuestions = yesCount + noCount;

        const noPercent =
          totalQuestions > 0 ? (noCount / totalQuestions) * 100 : 0;

        return {
          id: inspection.id,
          date: formatDateSr(getInspectionDate(inspection)),
          objectName:
            inspection.object_name || inspection.client_name || employerName,
          totalQuestions,
          yesCount,
          noCount,
          noPercent,
          grade: getDailyGrade(noCount),
          defects: noAnswers.map((a) => ({
  text:
    checklistMap.get(a.checklist_item_id || "") ||
    "Pitanje sa odgovorom NE",
  comment: a.comment || "",
})),
          photos: photosMap.get(inspection.id) || [],
        };
      });
    }

    const totalControls = controls.length;

    const totalQuestions = controls.reduce(
      (sum, c) => sum + c.totalQuestions,
      0
    );

    const totalYes = controls.reduce((sum, c) => sum + c.yesCount, 0);
    const totalNo = controls.reduce((sum, c) => sum + c.noCount, 0);

    const monthlyNoPercent =
      totalQuestions > 0 ? (totalNo / totalQuestions) * 100 : 0;

    const summary = {
      totalControls,
      totalQuestions,
      totalYes,
      totalNo,
      noPercent: monthlyNoPercent,
      grade: getMonthlyGrade(monthlyNoPercent),
    };

    const pdfElement = React.createElement(MonthlyInspectionPdf, {
      companyName: employerName,
      employerName,
      advisorName: advisorName || "-",
      monthLabel: formatMonthLabel(month),
      controls,
      summary,
    });

    const pdfStream = await pdf(pdfElement as any).toBuffer();
const chunks: Uint8Array[] = [];

for await (const chunk of pdfStream as any) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

const pdfBuffer = Buffer.concat(chunks);
    

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `Mesečni BZR izveštaj - ${employerName} - ${formatMonthLabel(
        month
      )}`,
      html: `
        <p>Poštovani,</p>
        <p>U prilogu Vam dostavljamo mesečni BZR izveštaj za firmu <b>${employerName}</b>.</p>
        <p>Period: <b>${formatMonthLabel(month)}</b></p>
        <p>Srdačan pozdrav,<br/>INPRO BZR</p>
      `,
      attachments: [
        {
          filename: `mesecni_izvestaj_${month}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SEND MONTHLY EMAIL ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Greška pri slanju emaila." },
      { status: 500 }
    );
  }
}