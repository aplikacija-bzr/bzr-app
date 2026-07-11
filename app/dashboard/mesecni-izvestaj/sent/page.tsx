import { createClient } from "@/utils/supabase/server";
import ResendReportButton from "./ResendReportButton";
import MonthlyPdfButton from "../monthly-pdf-button";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    employer_id?: string;
    month?: string;
  }>;
};

type ReportRow = {
  employer_id: string;
  advisor_id: string | null;
  advisor_name?: string | null;
  month: string;
  recipient_email: string;
  sent_at: string;
  inspections_count: number | null;
  employers:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export default async function SentMesecniIzvestajiPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const employerId = params.employer_id;
  const month = params.month;

  const { data: employers } = await supabase
    .from("employers")
    .select("id, name")
    .order("name");

  async function fetchReportsWithAdvisorName() {
    let query = supabase
      .from("monthly_reports_sent")
      .select(`
        employer_id,
        advisor_id,
        advisor_name,
        month,
        recipient_email,
        sent_at,
        inspections_count,
        employers (
          id,
          name
        )
      `)
      .order("sent_at", { ascending: false });

    if (employerId) query = query.eq("employer_id", employerId);
    if (month) query = query.eq("month", month);

    return await query;
  }

  async function fetchReportsWithoutAdvisorName() {
    let query = supabase
      .from("monthly_reports_sent")
      .select(`
        employer_id,
        advisor_id,
        month,
        recipient_email,
        sent_at,
        inspections_count,
        employers (
          id,
          name
        )
      `)
      .order("sent_at", { ascending: false });

    if (employerId) query = query.eq("employer_id", employerId);
    if (month) query = query.eq("month", month);

    return await query;
  }

  const firstAttempt = await fetchReportsWithAdvisorName();

  let reports: ReportRow[] = [];
  let errorMessage = "";

  if (firstAttempt.error) {
    const fallbackAttempt = await fetchReportsWithoutAdvisorName();

    if (fallbackAttempt.error) {
      errorMessage = fallbackAttempt.error.message;
    } else {
      reports = ((fallbackAttempt.data ?? []) as ReportRow[]).map((row) => ({
        ...row,
        advisor_name: null,
      }));
    }
  } else {
    reports = (firstAttempt.data ?? []) as ReportRow[];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Poslati mesečni izveštaji
        </h1>

        <div className="flex gap-2">
          <Link href="/" className="bg-black text-white px-4 py-2 rounded text-sm">
            Početna
          </Link>

          <Link
            href="/dashboard/poslodavci"
            className="bg-gray-200 px-4 py-2 rounded text-sm"
          >
            Nazad
          </Link>
        </div>
      </div>

      <form method="GET" className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-sm block mb-1">Firma</label>
          <select
            name="employer_id"
            defaultValue={employerId || ""}
            className="border rounded px-3 py-2"
          >
            <option value="">Sve firme</option>
            {employers?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">Mesec</label>
          <input
            type="month"
            name="month"
            defaultValue={month || ""}
            className="border rounded px-3 py-2"
          />
        </div>

        <button className="bg-black text-white px-4 py-2 rounded">
          Filtriraj
        </button>

        <Link
          href="/dashboard/mesecni-izvestaj/sent"
          className="px-4 py-2 border rounded text-sm"
        >
          Reset
        </Link>
      </form>

      {!errorMessage && reports.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Firma</th>
              <th className="p-2 border">Mesec</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Kontrole</th>
              <th className="p-2 border">Datum</th>
              <th className="p-2 border">Savetnik</th>
              <th className="p-2 border">Akcija</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((r, i) => {
              const employer = Array.isArray(r.employers)
  ? r.employers[0]
  : r.employers; 

              return (
                <tr key={`${r.employer_id}-${r.sent_at}-${i}`}>
                  <td className="p-2 border">{employer?.name ?? "-"}</td>
                  <td className="p-2 border">{formatMonth(r.month)}</td>
                  <td className="p-2 border">{r.recipient_email}</td>
                  <td className="p-2 border">{r.inspections_count ?? 0}</td>
                  <td className="p-2 border">{formatDate(r.sent_at)}</td>
                  <td className="p-2 border">{r.advisor_name ?? "-"}</td>

                  <td className="p-2 border">
                    <div className="flex flex-wrap gap-2">
                      <MonthlyPdfButton
                        employerId={r.employer_id}
                        month={r.month}
                      />

                      <ResendReportButton
                        employerId={r.employer_id}
                        advisorId={r.advisor_id}
                        month={r.month}
                        employerName={employer?.name ?? ""}
                        advisorName={r.advisor_name ?? ""}
                        inspectionsCount={r.inspections_count ?? 0}
                        email={r.recipient_email}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("sr-RS");
}

function formatMonth(value: string) {
  const [year, m] = value.split("-");
  return `${m}.${year}`;
}