import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import MonthlyReportButton from '@/app/components/MonthlyReportButton'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: clientId } = await params

  const { data: client, error } = await supabase
    .from('employers')
    .select('id, name, active, monthly_report_email')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    return (
      <div style={{ padding: 30 }}>
        <Link href="/dashboard/poslodavci">← Nazad</Link>

        <p style={{ color: 'red' }}>
          Greška pri učitavanju poslodavca.
        </p>
      </div>
    )
  }

  const employerId = client.id

  const { data: inspections } = await supabase
    .from('inspections')
    .select('id, inspection_date, status')
    .eq('employer_id', employerId)
    .order('inspection_date', { ascending: false })

  return (
    <div style={{ padding: 30 }}>
      <Link href="/dashboard/poslodavci">
        ← Nazad na poslodavce
      </Link>

      <div style={card}>
        <h1>{client.name}</h1>

        <p>
          Status:{' '}
          <b
            style={{
              color: client.active ? 'green' : 'red',
            }}
          >
            {client.active ? 'Aktivan' : 'Neaktivan'}
          </b>
        </p>

        <p>
          Email za mesečni izveštaj:{' '}
          <b>
            {client.monthly_report_email || 'Nije unet'}
          </b>
        </p>
      </div>

      <div style={card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <h2>Dnevne kontrole</h2>

          <Link
            href={`/dashboard/poslodavci/${clientId}/kontrole/nova`}
            style={btn}
          >
            Nova kontrola
          </Link>
        </div>

        {inspections?.length === 0 ? (
          <p>Nema kontrola.</p>
        ) : (
          inspections?.map((i) => (
            <div key={i.id} style={row}>
              <span>
                {i.inspection_date
                  ? new Date(
                      i.inspection_date
                    ).toLocaleDateString('sr-RS')
                  : '-'}
              </span>

              <Link href={`/dashboard/kontrole/${i.id}`}>
                Otvori
              </Link>
            </div>
          ))
        )}
      </div>

      <div style={card}>
        <h2>Mesečni izveštaj</h2>

        <MonthlyReportButton
          employerId={employerId}
          advisorName=""
        />
      </div>
    </div>
  )
}

const card = {
  border: '1px solid #ddd',
  borderRadius: 12,
  padding: 20,
  marginTop: 20,
  background: '#fafafa',
}

const btn = {
  padding: '10px 16px',
  background: 'black',
  color: 'white',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 'bold',
}

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: 10,
  borderBottom: '1px solid #eee',
}