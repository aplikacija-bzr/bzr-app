import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

type Client = {
  id: string
  naziv: string | null
  employer_id: string | null
}

type Checklist = {
  id: string
  name?: string | null
  naziv?: string | null
  title?: string | null
}

export default async function NewInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: clientId } = await params

  const { data: client, error: clientError } = await supabase
    .from('klijenti')
    .select('id, naziv, employer_id')
    .eq('id', clientId)
    .single()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .select('id, name')
    .limit(1)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)

  const checklistLabel =
    (checklist as Checklist | null)?.name ||
    (checklist as Checklist | null)?.naziv ||
    (checklist as Checklist | null)?.title ||
    'Kontrolna lista'

  if (clientError || !client) {
    return (
      <div style={{ padding: 20 }}>
        <Link href="/dashboard/poslodavci">← Nazad</Link>
        <p style={{ color: 'red' }}>Greška pri učitavanju poslodavca.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <Link href={`/dashboard/poslodavci/${clientId}`}>
        ← Nazad na poslodavca
      </Link>

      <h1>Nova kontrola</h1>

      <p>
        Poslodavac: <b>{client.naziv}</b>
      </p>

      {!client.employer_id ? (
        <p style={{ color: 'red' }}>
          Nema employer_id za ovog poslodavca.
        </p>
      ) : checklistError ? (
        <p style={{ color: 'red' }}>
          Greška kontrolne liste: {checklistError.message}
        </p>
      ) : !checklist?.id ? (
        <p style={{ color: 'red' }}>Nema kontrolne liste.</p>
      ) : (
        <form action="/api/create-inspection" method="POST">
          <input type="hidden" name="employer_id" value={client.employer_id} />
          <input type="hidden" name="client_name" value={client.naziv || ''} />
          <input type="hidden" name="checklist_id" value={checklist.id} />

          <div style={{ marginBottom: 12 }}>
            <label>Kontrolna lista</label>
            <input
              value={checklistLabel}
              disabled
              style={{ width: '100%', padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Objekat</label>
            <input
              name="object_name"
              style={{ width: '100%', padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Savetnik</label>
            <input
              name="advisor_name"
              style={{ width: '100%', padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Datum</label>
            <input
              type="date"
              name="inspection_date"
              defaultValue={today}
              required
              style={{ width: '100%', padding: 10 }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: 14,
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            Kreiraj kontrolu
          </button>
        </form>
      )}
    </div>
  )
}