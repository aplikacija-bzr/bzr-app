import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const to =
      body.to ||
      body.recipientEmail ||
      body.recipient_email ||
      body.email ||
      "";

    const employerId =
      body.employer_id ||
      body.employerId ||
      "";

    const advisorId =
      body.advisor_id ??
      body.advisorId ??
      null;

    const advisorName =
      body.advisor_name ||
      body.advisorName ||
      null;

    const employerName =
      body.employer_name ||
      body.employerName ||
      null;

    const month = body.month || "";

    const inspectionsCountFromBody =
      body.inspections_count ??
      body.inspectionsCount ??
      null;

    const forceResend =
      body.force_resend === true || body.forceResend === true;

    if (!to || !employerId || !month) {
      return NextResponse.json(
        { error: "Nedostaju obavezni podaci." },
        { status: 400 }
      );
    }

    if (!forceResend) {
      const { data: existingReport, error: existingError } = await supabase
        .from("monthly_reports_sent")
        .select("sent_at")
        .eq("employer_id", employerId)
        .eq("month", month)
        .eq("recipient_email", to)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          {
            error: "Greška pri proveri duplikata.",
            details: existingError.message,
          },
          { status: 500 }
        );
      }

      if (existingReport) {
        return NextResponse.json(
          {
            error:
              "Ovaj mesečni izveštaj je već poslat na ovu email adresu. Koristi 'Ponovo pošalji' iz liste poslatih izveštaja.",
          },
          { status: 409 }
        );
      }
    }

    let inspectionsCount = 0;

    if (typeof inspectionsCountFromBody === "number") {
      inspectionsCount = inspectionsCountFromBody;
    } else {
      const [year, monthNum] = month.split("-").map(Number);

      if (!year || !monthNum) {
        return NextResponse.json(
          { error: "Neispravan format meseca. Očekuje se YYYY-MM." },
          { status: 400 }
        );
      }

      const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

      const { count, error: inspectionsError } = await supabase
        .from("inspections")
        .select("*", { count: "exact", head: true })
        .eq("employer_id", employerId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (inspectionsError) {
        return NextResponse.json(
          {
            error: "Greška pri proveri kontrola.",
            details: inspectionsError.message,
          },
          { status: 500 }
        );
      }

      inspectionsCount = count ?? 0;
    }

    if (inspectionsCount <= 0 && !forceResend) {
      return NextResponse.json(
        { error: "Nema kontrola za izabrani period." },
        { status: 400 }
      );
    }

    const pdfUrl = `/api/mesecni-izvestaj?employer_id=${encodeURIComponent(
      employerId
    )}&month=${encodeURIComponent(month)}${
      employerName
        ? `&employer_name=${encodeURIComponent(employerName)}`
        : ""
    }`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const fullPdfUrl = `${appUrl}${pdfUrl}`;

    const mailResponse = await fetch(`${appUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject: `Mesečni izveštaj - ${employerName || "Firma"} - ${month}`,
        text: `U prilogu / na linku se nalazi mesečni izveštaj za ${employerName || "firmu"} za period ${month}.`,
        pdfUrl: fullPdfUrl,
        employerName: employerName || "",
        month,
      }),
    });

    const mailResult = await mailResponse.json().catch(() => null);

    if (!mailResponse.ok) {
      return NextResponse.json(
        {
          error: mailResult?.error || "Greška pri slanju emaila.",
        },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("monthly_reports_sent")
      .insert({
        employer_id: employerId,
        advisor_id: advisorId || null,
        advisor_name: advisorName || null,
        month,
        recipient_email: to,
        inspections_count: inspectionsCount,
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        {
          error: "Email je poslat, ali evidencija nije upisana u bazu.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email uspešno poslat i evidentiran.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Neočekivana greška.",
      },
      { status: 500 }
    );
  }
}