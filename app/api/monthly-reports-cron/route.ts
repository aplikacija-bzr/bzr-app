import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMPLOYER_ID =
  "d955c6b4-f7eb-4cf3-ab19-25e464facde3";

const TEST_MONTH = "2026-07";

export async function GET() {
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

    return NextResponse.json({
      success: true,
      mode: "TEST",
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
      existingReport:
        existingReport || null,
      message:
        existingReport
          ? "Mesečni izveštaj je već evidentiran kao poslat. Email NIJE ponovo poslat."
          : "Mesečni izveštaj još nije evidentiran kao poslat. Email još uvek NIJE poslat.",
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