import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import InspectionPdf from "@/app/components/InspectionPdf";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 🔥 FIX: uklonjen TypeScript problem
async function pdfToBuffer(pdfElement: any) {
  const result = await pdf(pdfElement).toBuffer();

  // ako je već buffer
  if (Buffer.isBuffer(result)) {
    return result;
  }

  // ako je stream → konvertuj u buffer
  const chunks: Uint8Array[] = [];

  for await (const chunk of result as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function saveEmailLog({
  inspection_id,
  to,
  subject,
  status,
  error_message,
}: {
  inspection_id?: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  error_message?: string;
}) {
  try {
    await supabaseAdmin.from("email_logs").insert({
      inspection_id: inspection_id || null,
      email_type: "daily_inspection",
      recipient_email: to,
      subject,
      status,
      error_message: error_message || null,
    });
  } catch (error) {
    console.error("EMAIL LOG ERROR:", error);
  }
}

export async function POST(req: Request) {
  let to = "";
  let inspection_id = "";
  let subject = "BZR kontrolna lista";

  try {
    const body = await req.json();

    const {
      inspection_id: bodyInspectionId,
      to: bodyTo,
      items = [],
      companyName = "",
      employerName = "",
      advisorName = "",
      inspectionDate = "",
      photos = [],
    } = body;

    to = bodyTo;
    inspection_id = bodyInspectionId || "";

    subject = `BZR kontrolna lista${
      companyName ? ` - ${companyName}` : ""
    }`;

    if (!to) {
      return NextResponse.json(
        { error: "Nedostaje email primaoca." },
        { status: 400 }
      );
    }

    // 📄 PDF
    const pdfElement = React.createElement(InspectionPdf, {
      title: "DNEVNA BZR KONTROLNA LISTA",
      items,
      companyName,
      employerName: employerName || companyName,
      advisorName,
      inspectionDate,
      photos,
    });

    const pdfBuffer = await pdfToBuffer(pdfElement);

    // 📧 SLANJE MAILA
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: `
        <p>Poštovani,</p>
        <p>U prilogu Vam dostavljamo dnevnu BZR kontrolnu listu.</p>
        <p>Srdačan pozdrav,<br/>INPRO BZR</p>
      `,
      attachments: [
        {
          filename: "dnevna_kontrola.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await saveEmailLog({
      inspection_id,
      to,
      subject,
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      message: "Email je uspešno poslat.",
    });
  } catch (err: any) {
    console.error("EMAIL ERROR:", err);

    if (to) {
      await saveEmailLog({
        inspection_id,
        to,
        subject,
        status: "failed",
        error_message: err.message || "Greška pri slanju emaila.",
      });
    }

    return NextResponse.json(
      { error: err.message || "Greška pri slanju emaila." },
      { status: 500 }
    );
  }
}