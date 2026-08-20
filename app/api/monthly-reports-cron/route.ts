import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMPLOYER_ID =
  "d955c6b4-f7eb-4cf3-ab19-25e464facde3";

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
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

    /*
     * TEST FAZA:
     * Za sada proveravamo samo TIM.
     * Još NE šaljemo email.
     */

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

    return NextResponse.json({
      success: true,
      mode: "TEST",
      message:
        "Cron ruta radi. Email još nije poslat.",
      employer: {
        id:
          employer.id,

        name:
          employer.name,

        monthlyReportEmail:
          employer.monthly_report_email,
      },
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