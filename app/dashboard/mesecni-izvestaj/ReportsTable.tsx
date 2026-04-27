type Report = {
  id: string;
  month: string;
  recipient_email: string;
  sent_at: string;
  inspections_count: number;
  employers: { name: string } | null;
  advisors: { full_name: string } | null;
};

export default function ReportsTable({ reports }: { reports: Report[] }) {
  if (!reports || reports.length === 0) {
    return (
      <p className="text-gray-500">
        Nema poslatih izveštaja.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Firma</th>
            <th className="p-3">Mesec</th>
            <th className="p-3">Email</th>
            <th className="p-3">Kontrole</th>
            <th className="p-3">Datum slanja</th>
            <th className="p-3">Savetnik</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">
                {r.employers?.name ?? "-"}
              </td>

              <td className="p-3">
                {formatMonth(r.month)}
              </td>

              <td className="p-3">
                {r.recipient_email}
              </td>

              <td className="p-3">
                {r.inspections_count}
              </td>

              <td className="p-3">
                {formatDate(r.sent_at)}
              </td>

              <td className="p-3">
                {r.advisors?.full_name ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("sr-RS");
}

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  return `${m}.${year}`;
}