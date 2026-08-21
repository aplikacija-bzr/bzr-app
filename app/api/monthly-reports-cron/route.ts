import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMPLOYER_ID =
  "d955c6b4-f7eb-4cf3-ab19-25e464facde3";

const TEST_MONTH = "2026-07";

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Nedostaju Supabase environment variables.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    const shouldSend =
      request.nextUrl.searchParams.get(
        "send"
      ) === "1";

    const {
      data: employer,
      error: employerError,
    } =
      await supabase
        .from("employers")
        .select(`
          id,
          name,
          monthly_report_email
        `)
        .eq(
          "id",
          TEST_EMPLOYER_ID
        )
        .maybeSingle();

    if (employerError) {
      return NextResponse.json(
        {
          error:
            employerError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!employer) {
      return NextResponse.json(
        {
          error:
            "Test poslodavac TIM nije pronađen.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: existingReport,
      error: existingReportError,
    } =
      await supabase
        .from("monthly_reports_sent")
        .select(`
          id,
          employer_id,
          month,
          recipient_email,
          status,
          sent_at
        `)
        .eq(
          "employer_id",
          TEST_EMPLOYER_ID
        )
        .eq(
          "month",
          TEST_MONTH
        )
        .eq(
          "status",
          "sent"
        )
        .order(
          "sent_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (existingReportError) {
      return NextResponse.json(
        {
          error:
            existingReportError.message,
        },
        {
          status: 500,
        }
      );
    }

    const [year, monthNumber] =
      TEST_MONTH.split("-");

    const startDate =
      `${year}-${monthNumber}-01`;

    const endDate =
      new Date(
        Number(year),
        Number(monthNumber),
        1
      )
        .toISOString()
        .slice(0, 10);

    const {
      data: inspections,
      error: inspectionsError,
    } =
      await supabase
        .from("inspections")
        .select(`
          id,
          inspection_date,
          object_name,
          status,
          advisor_name
        `)
        .eq(
          "employer_id",
          TEST_EMPLOYER_ID
        )
        .eq(
          "status",
          "completed"
        )
        .gte(
          "inspection_date",
          startDate
        )
        .lt(
          "inspection_date",
          endDate
        )
        .order(
          "inspection_date",
          {
            ascending: true,
          }
        );

    if (inspectionsError) {
      return NextResponse.json(
        {
          error:
            inspectionsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const completedControls =
      inspections ?? [];

    const advisorNames =
      Array.from(
        new Set(
          completedControls
            .map(
              (inspection) =>
                inspection.advisor_name?.trim()
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      );

    const advisorName =
      advisorNames.join(", ");

    const canSend =
      !existingReport &&
      completedControls.length > 0 &&
      Boolean(
        employer.monthly_report_email
      );

    if (!canSend) {
      return NextResponse.json({
        success: true,
        mode: "TEST",
        sent: false,
        employer: {
          id:
            employer.id,
          name:
            employer.name,
          monthlyReportEmail:
            employer.monthly_report_email,
        },
        month:
          TEST_MONTH,
        alreadySent:
          Boolean(existingReport),
        completedControlsCount:
          completedControls.length,
        canSend,
        message:
          existingReport
            ? "Izveštaj je već poslat. Novi email NIJE poslat."
            : completedControls.length === 0
            ? "Nema završenih kontrola za ovaj mesec. Email NIJE poslat."
            : "Poslodavac nema email za mesečni izveštaj. Email NIJE poslat.",
      });
    }

    if (!shouldSend) {
      return NextResponse.json({
        success: true,
        mode: "TEST",
        sent: false,
        employer: {
          id:
            employer.id,
          name:
            employer.name,
          monthlyReportEmail:
            employer.monthly_report_email,
        },
        month:
          TEST_MONTH,
        alreadySent: false,
        completedControlsCount:
          completedControls.length,
        canSend: true,
        advisorName:
          advisorName || null,
        message:
          "Izveštaj je spreman za slanje. Za stvarni TEST dodaj ?send=1. Email još NIJE poslat.",
      });
    }

    const origin =
      request.nextUrl.origin;

    const sendResponse =
      await fetch(
        `${origin}/api/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            to:
              employer.monthly_report_email,

            employerId:
              employer.id,

            month:
              TEST_MONTH,

            advisorName,
          }),
          cache: "no-store",
        }
      );

    const sendResult =
      await sendResponse.json();

    if (!sendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          error:
            sendResult?.error ||
            "Greška pri slanju mesečnog izveštaja.",
        },
        {
          status:
            sendResponse.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "TEST-SEND",
      sent: true,
      employer: {
        id:
          employer.id,
        name:
          employer.name,
        monthlyReportEmail:
          employer.monthly_report_email,
      },
      month:
        TEST_MONTH,
      completedControlsCount:
        completedControls.length,
      advisorName:
        advisorName || null,
      message:
        "TEST mesečni izveštaj je uspešno poslat. Sledeći poziv mora biti blokiran evidencijom monthly_reports_sent.",
    });
  } catch (error) {
    console.error(
      "MONTHLY REPORT CRON ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nepoznata greška.",
      },
      {
        status: 500,
      }
    );
  }
}