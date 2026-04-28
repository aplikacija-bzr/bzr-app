import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import MonthlyReportButton from '@/app/components/MonthlyReportButton'

type Client = {
  id: string
  naziv: string | null
  aktivan: boolean | null
  employer_id: string | null
}

type Inspection = {
  id: string
  inspection_date: string | null
  status: string | null
  client_name: string | null
  advisor_name?: string | null
  created_at?: string | null
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: clientId } = await params

  const { data: client, error: clientError } = await supabase
    .from('klijenti')
    .select('id, naziv, aktivan, employer_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return (
      <div className="p-6">
        <Link href="/dashboard/poslodavci" className="underline">
          ← Nazad na poslodavce
        </Link>
        <p className="text-red-600 mt-4">Greška pri učitavanju poslodavca.</p>
      </div>
    )
  }

  const employerId = client.employer_id || ''

  let inspections: Inspection[] = []
  let inspectionsErrorMessage = ''

  if (employerId) {
    const result = await supabase
      .from('inspections')
      .select('id, inspection_date, status, client_name, advisor_name, created_at')
      .eq('employer_id', employerId)
      .order('inspection_date', { ascending: false })

    if (result.error) {
      inspectionsErrorMessage = result.error.message
    } else {
      inspections = result.data || []
    }
  }

  const advisorName =
    inspections.find((i) => i.advisor_name && i.advisor_name.trim() !== '')
      ?.advisor_name || ''

  return (
    <div className="p-6 space-y-6">
      <Link href="/dashboard/poslodavci" className="underline">
        ← Nazad na poslodavce
      </Link>

      <div className="rounded-xl border p-5 bg-white">
        <h1 className="text-2xl font-bold">{client.naziv}</h1>

        <p className="mt-2 text-sm">
          Status:{' '}
          <span className={client.aktivan ? 'text-green-600' : 'text-red-600'}>
            {client.aktivan ? 'Aktivan' : 'Neaktivan'}
          </span>
        </p>

        {!employerId ? (
          <p className="mt-3 text-sm text-red-600">
            Nema employer_id veze za ovog poslodavca.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border p-5 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Dnevne kontrole</h2>

          <Link
            href={`/dashboard/poslodavci/${clientId}/kontrole/nova`}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm"
          >
            Nova kontrola
          </Link>
        </div>

        {!employerId ? (
          <p className="text-sm text-red-600">Nema employer_id.</p>
        ) : inspectionsErrorMessage ? (
          <p className="text-sm text-red-600">Greška: {inspectionsErrorMessage}</p>
        ) : inspections.length === 0 ? (
          <p className="text-sm text-gray-600">Nema kontrola za ovog poslodavca.</p>
        ) : (
          <div className="space-y-2">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="border rounded-lg p-3 flex justify-between">
                <div>
                  <p className="text-sm">
                    Datum:{' '}
                    {inspection.inspection_date
                      ? new Date(inspection.inspection_date).toLocaleDateString('sr-RS')
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {inspection.status || 'u toku'}
                  </p>
                </div>

                <Link href={`/dashboard/kontrole/${inspection.id}`} className="underline text-sm">
                  Otvori
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-5 bg-white">
        <h2 className="text-lg font-semibold mb-3">Mesečni izveštaj</h2>

        {employerId ? (
          <MonthlyReportButton employerId={employerId} advisorName={advisorName} />
        ) : (
          <p className="text-sm text-red-600">Mesečni izveštaj nije moguć bez employer_id.</p>
        )}
      </div>
    </div>
  )
}