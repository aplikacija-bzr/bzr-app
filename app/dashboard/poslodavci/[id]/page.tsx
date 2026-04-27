import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import MonthlyReportButton from '@/app/components/MonthlyReportButton'

type Client = {
  id: string
  naziv: string | null
  aktivan: boolean | null
}

type Employer = {
  id: string
  name: string | null
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
    .select('id, naziv, aktivan')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/poslodavci"
          className="inline-block text-sm underline mb-4"
        >
          ← Nazad na poslodavce
        </Link>

        <p className="text-red-600 font-medium">Greška pri učitavanju klijenta.</p>
        {clientError?.message && (
          <p className="text-sm text-gray-600 mt-2">{clientError.message}</p>
        )}
      </div>
    )
  }

  let employer: Employer | null = null

  if (client.naziv) {
    const { data } = await supabase
      .from('employers')
      .select('id, name')
      .eq('name', client.naziv)
      .limit(1)
      .maybeSingle()

    employer = data
  }

  let inspections: Inspection[] = []
  let inspectionsErrorMessage = ''

  if (client.naziv) {
    const inspectionsResult = await supabase
      .from('inspections')
      .select('id, inspection_date, status, client_name, advisor_name, created_at')
      .eq('client_name', client.naziv)
      .order('inspection_date', { ascending: false })

    if (inspectionsResult.error) {
      inspectionsErrorMessage = inspectionsResult.error.message
    } else {
      inspections = inspectionsResult.data || []
    }
  }

  // savetnik iz poslednje kontrole
  const advisorName =
    inspections.find((inspection) => inspection.advisor_name && inspection.advisor_name.trim() !== '')
      ?.advisor_name || ''

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/dashboard/poslodavci"
        className="inline-block text-sm underline"
      >
        ← Nazad na poslodavce
      </Link>

      <div className="rounded-xl border p-5 bg-white">
        <h1 className="text-2xl font-bold">{client.naziv}</h1>

        <p className="mt-2 text-sm">
          Status:{' '}
          <span
            className={
              client.aktivan
                ? 'text-green-600 font-medium'
                : 'text-red-600 font-medium'
            }
          >
            {client.aktivan ? 'Aktivan' : 'Neaktivan'}
          </span>
        </p>

        {advisorName ? (
          <p className="mt-2 text-sm">
            Savetnik: <span className="font-medium">{advisorName}</span>
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

        {inspectionsErrorMessage ? (
          <p className="text-sm text-red-600">
            Greška: {inspectionsErrorMessage}
          </p>
        ) : inspections.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nema kontrola za ovog poslodavca.
          </p>
        ) : (
          <div className="space-y-2">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="flex justify-between items-center border rounded-lg p-3"
              >
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

                  {inspection.advisor_name ? (
                    <p className="text-xs text-gray-500">
                      Savetnik: {inspection.advisor_name}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/dashboard/kontrole/${inspection.id}`}
                  className="text-sm underline"
                >
                  Otvori
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-5 bg-white">
        <h2 className="text-lg font-semibold mb-3">Mesečni izveštaj</h2>

        {employer ? (
          <MonthlyReportButton
            employerId={employer.id}
            advisorName={advisorName}
          />
        ) : (
          <p className="text-sm text-red-600">
            Nije pronađen odgovarajući employer zapis.
          </p>
        )}
      </div>
    </div>
  )
}