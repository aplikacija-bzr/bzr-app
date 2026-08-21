import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPORTS_PER_RUN = 20;

function getPreviousMonth() {
  const now = new Date();

  const previousMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - 1,
      1
    )
  );

  const year =
    previousMonth.getUTCFullYear();

  const month =
    String(
      previousMonth.getUTCMonth() + 1
    ).padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthRange(month: string) {
  const [year, monthNumber] =
    month.split("-");

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

  return {
    startDate,
    endDate,
  };
}

export async function GET(
  request: NextRequest
) {
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

    const shouldSend =
      request.nextUrl.searchParams.get(
        "send"
      ) === "1";

    const month =
      getPreviousMonth();

    const {
      startDate,
      endDate,
    } =
      getMonthRange(month);

    /*
     * 1. Poslodavci koji imaju
     * definisan email za mesečni izveštaj.
     */
    const {
      data: employersData,
      error: employersError,
    } =
      await supabase
        .from("employers")
        .select(`
          id,
          name,
          monthly_report_email
        `)
        .not(
          "monthly_report_email",
          "is",
          null
        )
        .neq(
          "monthly_report_email",
          ""
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (employersError) {
      return NextResponse.json(
        {
          error:
            employersError.message,
        },
        {
          status: 500,
        }
      );
    }

    const employers =
      employersData ?? [];

    const employerIds =
      employers.map(
        (employer) =>
          employer.id
      );

    /*
     * 2. Završene kontrole
     * za prethodni mesec.
     */
    let inspections: any[] = [];

    if (
      employerIds.length > 0
    ) {
      const {
        data: inspectionsData,
        error: inspectionsError,
      } =
        await supabase
          .from("inspections")
          .select(`
            id,
            employer_id,
            inspection_date,
            object_name,
            advisor_name,
            status
          `)
          .in(
            "employer_id",
            employerIds
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

      inspections =
        inspectionsData ?? [];
    }

    /*
     * 3. Već poslati mesečni
     * izveštaji za isti mesec.
     */
    let sentReports: any[] = [];

    if (
      employerIds.length > 0
    ) {
      const {
        data: sentData,
        error: sentError,
      } =
        await supabase
          .from(
            "monthly_reports_sent"
          )
          .select(`
            id,
            employer_id,
            month,
            recipient_email,
            status,
            sent_at
          `)
          .in(
            "employer_id",
            employerIds
          )
          .eq(
            "month",
            month
          )
          .eq(
            "status",
            "sent"
          );

      if (sentError) {
        return NextResponse.json(
          {
            error:
              sentError.message,
          },
          {
            status: 500,
          }
        );
      }

      sentReports =
        sentData ?? [];
    }

    /*
     * 4. Formiranje pregleda.
     */
    const results =
      employers.map(
        (employer) => {
          const employerInspections =
            inspections.filter(
              (inspection) =>
                inspection.employer_id ===
                employer.id
            );

          const existingReport =
            sentReports.find(
              (report) =>
                report.employer_id ===
                employer.id
            );

          const advisorNames =
            Array.from(
              new Set(
                employerInspections
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

          const alreadySent =
            Boolean(
              existingReport
            );

          const completedControlsCount =
            employerInspections.length;

          const canSend =
            !alreadySent &&
            completedControlsCount > 0 &&
            Boolean(
              employer.monthly_report_email
            );

          let reason = "";

          if (alreadySent) {
            reason =
              "Već poslato";
          } else if (
            completedControlsCount === 0
          ) {
            reason =
              "Nema završenih kontrola";
          } else {
            reason =
              "Spremno za slanje";
          }

          return {
            employerId:
              employer.id,

            employerName:
              employer.name,

            recipientEmail:
              employer.monthly_report_email,

            month,

            completedControlsCount,

            advisorNames,

            alreadySent,

            canSend,

            reason,

            existingReport:
              existingReport || null,
          };
        }
      );

    const readyToSend =
      results.filter(
        (item) =>
          item.canSend
      );

    const alreadySent =
      results.filter(
        (item) =>
          item.alreadySent
      );

    const withoutControls =
      results.filter(
        (item) =>
          !item.alreadySent &&
          item.completedControlsCount === 0
      );

    /*
     * 5. DRY-RUN.
     * Bez ?send=1 nema slanja.
     */
    if (!shouldSend) {
      return NextResponse.json({
        success: true,
        mode: "DRY-RUN",
        sent: false,
        month,

        summary: {
          employersWithEmail:
            employers.length,

          readyToSend:
            readyToSend.length,

          alreadySent:
            alreadySent.length,

          withoutControls:
            withoutControls.length,

          maxReportsPerRun:
            MAX_REPORTS_PER_RUN,

          wouldSendNow:
            Math.min(
              readyToSend.length,
              MAX_REPORTS_PER_RUN
            ),
        },

        results,

        message:
          "DRY-RUN završen. Nijedan email NIJE poslat.",
      });
    }

    /*
     * 6. Slanje najviše 20 kandidata
     * u jednom pokretanju.
     */
    const candidates =
      readyToSend.slice(
        0,
        MAX_REPORTS_PER_RUN
      );

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        mode: "BATCH-SEND",
        sent: false,
        month,
        attempted: 0,
        sentCount: 0,
        failedCount: 0,
        message:
          "Nema kandidata za slanje. Nijedan email NIJE poslat.",
      });
    }

    const origin =
      request.nextUrl.origin;

    const sendResults: any[] = [];

    /*
     * Šaljemo redom, ne paralelno,
     * da ne opterećujemo mail server.
     */
    for (const candidate of candidates) {
      try {
        const advisorName =
          candidate.advisorNames.join(
            ", "
          );

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
                  candidate.recipientEmail,

                employerId:
                  candidate.employerId,

                month,

                advisorName,
              }),
              cache: "no-store",
            }
          );

        const sendResult =
          await sendResponse.json();

        if (!sendResponse.ok) {
          sendResults.push({
            employerId:
              candidate.employerId,

            employerName:
              candidate.employerName,

            recipientEmail:
              candidate.recipientEmail,

            success: false,

            error:
              sendResult?.error ||
              "Greška pri slanju mesečnog izveštaja.",
          });

          continue;
        }

        sendResults.push({
          employerId:
            candidate.employerId,

          employerName:
            candidate.employerName,

          recipientEmail:
            candidate.recipientEmail,

          success: true,
        });
      } catch (sendError) {
        sendResults.push({
          employerId:
            candidate.employerId,

          employerName:
            candidate.employerName,

          recipientEmail:
            candidate.recipientEmail,

          success: false,

          error:
            sendError instanceof Error
              ? sendError.message
              : "Nepoznata greška pri slanju.",
        });
      }
    }

    const successful =
      sendResults.filter(
        (item) =>
          item.success
      );

    const failed =
      sendResults.filter(
        (item) =>
          !item.success
      );

    return NextResponse.json({
      success:
        failed.length === 0,

      mode: "BATCH-SEND",

      sent:
        successful.length > 0,

      month,

      maxReportsPerRun:
        MAX_REPORTS_PER_RUN,

      attempted:
        candidates.length,

      sentCount:
        successful.length,

      failedCount:
        failed.length,

      results:
        sendResults,

      message:
        `Obrada završena. Poslato: ${successful.length}. Neuspešno: ${failed.length}.`,
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