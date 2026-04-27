import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import InspectionPdf from "@/app/components/InspectionPdf";

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
  answer: string;
  comment: string | null;
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

    let items: any[] = [];

    if (inspectionIds.length > 0) {
      const { data: photosData, error: photosError } = await supabase
        .from("inspection_photos")
        .select("id, inspection_id, file_path")
        .in("inspection_id", inspectionIds);

      if (photosError) {
        throw new Error(`Greška inspection_photos: ${photosError.message}`);
      }

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
        .select("id, inspection_id, answer, comment")
        .in("inspection_id", inspectionIds)
        .eq("answer", "ne");

      if (answersError) {
        throw new Error(`Greška inspection_answers: ${answersError.message}`);
      }

      const answers = (answersData ?? []) as AnswerRow[];

      items =
        answers.length > 0
          ? answers.map((a, index) => {
              const inspection = inspections.find(
                (i) => i.id === a.inspection_id
              );

              return {
                question: `${index + 1}. ${
                  inspection?.object_name || inspection?.client_name || "-"
                } | ${formatDateSr(getInspectionDate(inspection!))}`,
                answer: "NE",
                comment: a.comment || "",
                photos: photosMap.get(a.inspection_id) || [],
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
    } else {
      items = [
        {
          question: "Za izabrani period nema dnevnih kontrola.",
          answer: "",
          comment: "",
          photos: [],
        },
      ];
    }

    const pdfElement = React.createElement(InspectionPdf, {
      title: "MESEČNI IZVEŠTAJ",
      items,
      companyName: employerName,
      employerName,
      advisorName: advisorName || "-",
      inspectionDate: `Mesec: ${formatMonthLabel(month)}`,
      photos: [],
    });

    const pdfBuffer = await pdf(pdfElement).toBuffer();

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