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
    .from('klijenti')
    .select('id, naziv, aktivan, employer_id')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    return (
      <div style={{ padding: 30 }}>
        <Link href="/dashboard/poslodavci">← Nazad</Link>
        <p style={{ color: 'red' }}>Greška pri učitavanju poslodavca.</p>
      </div>
    )
  }

  const employerId = client.employer_id || ''

  const { data: inspections } = employerId
    ? await supabase
        .from('inspections')
        .select('id, inspection_date, status')
        .eq('employer_id', employerId)
        .order('inspection_date', { ascending: false })
    : { data: [] }

  return (
    <div style={{ padding: 30 }}>
      <Link href="/dashboard/poslodavci">← Nazad na poslodavce</Link>

      <div style={card}>
        <h1>{client.naziv}</h1>

        <p>
          Status:{' '}
          <b style={{ color: client.aktivan ? 'green' : 'red' }}>
            {client.aktivan ? 'Aktivan' : 'Neaktivan'}
          </b>
        </p>

        {!employerId && (
          <p style={{ color: 'red' }}>
            Nema employer_id veze za ovog poslodavca.
          </p>
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Dnevne kontrole</h2>

          <Link
            href={`/dashboard/poslodavci/${clientId}/kontrole/nova`}
            style={btn}
          >
            Nova kontrola
          </Link>
        </div>

        {!employerId ? (
          <p style={{ color: 'red' }}>Nema employer_id.</p>
        ) : inspections?.length === 0 ? (
          <p>Nema kontrola.</p>
        ) : (
          inspections?.map((i) => (
            <div key={i.id} style={row}>
              <span>
                {i.inspection_date
                  ? new Date(i.inspection_date).toLocaleDateString('sr-RS')
                  : '-'}
              </span>

              <Link href={`/dashboard/kontrole/${i.id}`}>Otvori</Link>
            </div>
          ))
        )}
      </div>

      <div style={card}>
        <h2>Mesečni izveštaj</h2>

        {employerId ? (
          <MonthlyReportButton employerId={employerId} advisorName="" />
        ) : (
          <p style={{ color: 'red' }}>
            Mesečni izveštaj nije moguć bez employer_id.
          </p>
        )}
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