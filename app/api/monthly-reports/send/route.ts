import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import MonthlyReport from "@/lib/pdf/MonthlyReport";

export const runtime = "nodejs";

type IncomingControl = {
  objectName?: string;
  date?: string;
  status?: string;
  adviser?: string;
  name?: string;
};

type MonthlyPdfControl = {
  name?: string;
  objectName?: string;
  date?: string;
  status?: string;
  adviser?: string;
};

export async function POST(req: Request) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Nedostaju ENV varijable" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      employerId,
      employerName,
      month,
      recipientEmail,
      controls,
      previewOnly,
    }: {
      employerId: string;
      employerName?: string;
      month: string;
      recipientEmail?: string;
      controls?: IncomingControl[];
      previewOnly?: boolean;
    } = body;

    if (!employerId || !month) {
      return NextResponse.json(
        { error: "Nedostaju podaci." },
        { status: 400 }
      );
    }

    if (!controls || controls.length === 0) {
      return NextResponse.json(
        { error: "Nema kontrola za slanje." },
        { status: 400 }
      );
    }

    const companyName = employerName || "Nepoznata firma";

    const pdfControls: MonthlyPdfControl[] = controls.map((item) => ({
      objectName: item.objectName || "-",
      date: item.date || "-",
      status: item.status || "-",
      adviser: item.adviser || "-",
    }));

    const pdfBuffer = await renderToBuffer(
      React.createElement(MonthlyReport, {
        companyName,
        month,
        controls: pdfControls,
      })
    );

    // ✅ Ako je previewOnly, samo vrati PDF browseru
    if (previewOnly) {
      return new Response(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="izvestaj-${month}.pdf"`,
        },
      });
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Nedostaje email primaoca." },
        { status: 400 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const emailResult = await resend.emails.send({
      from: "BZR <office@inpro.rs>",
      to: [recipientEmail],
      subject: `BZR izveštaj za ${month}`,
      html: `
        <div>
          <p>Poštovani,</p>
          <p>u prilogu je mesečni BZR izveštaj za <strong>${month}</strong>.</p>
          <p>Broj kontrola: <strong>${controls.length}</strong></p>
          <p>Pozdrav,<br />BZR sistem</p>
        </div>
      `,
      attachments: [
        {
          filename: `izvestaj-${month}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailResult.error) {
      return NextResponse.json(
        { error: emailResult.error.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("monthly_reports_sent")
      .insert({
        employer_id: employerId,
        month,
        recipient_email: recipientEmail,
        pdf_path: null,
        sent_by: null,
        resend_email_id: emailResult.data?.id ?? null,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email uspešno poslat.",
      companyName,
      controlsCount: controls.length,
      resendId: emailResult.data?.id ?? null,
    });
  } catch (err) {
    console.error("SERVER ERROR IN /api/monthly-reports/send:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}