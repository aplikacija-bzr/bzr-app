import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import type { CSSProperties } from 'react'
import ResendEmailButton from '@/app/components/ResendEmailButton'

type EmailLog = {
  id: string
  inspection_id: string | null
  email_type: string | null
  recipient_email: string | null
  subject: string | null
  status: string | null
  error_message: string | null
  sent_at: string | null
}

type PageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}


function formatDate(value: string | null) {
  if (!value) return ''

  const date = new Date(value)

  return `${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1
  ).padStart(2, '0')}.${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default async function EmailLogoviPage({ searchParams }: PageProps) {
    const supabase = await createClient()
  const params = searchParams ? await searchParams : {}
  const search = (params.q || '').trim()
    

  let query = supabase
    .from('email_logs')
    .select(
      'id, inspection_id, email_type, recipient_email, subject, status, error_message, sent_at'
    )
    .order('sent_at', { ascending: false })

  if (search) {
    query = query.or(
      `recipient_email.ilike.%${search}%,subject.ilike.%${search}%,email_type.ilike.%${search}%,status.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  const logs = (data || []) as EmailLog[]

  return (
    <div style={{ padding: 20, maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/poslodavci" style={backButtonStyle}>
          ← Nazad na poslodavce
        </Link>
      </div>

      <h1>Pregled poslatih emailova</h1>

      <p style={{ color: '#555' }}>
        Ovde se vidi kome je poslat dnevni BZR izveštaj, kada je poslat i da li
        je slanje bilo uspešno.
      </p>

      {/* PRETRAGA */}
      <form method="GET" action="/dashboard/email-logovi" style={searchWrapper}>
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Pretraži po emailu, firmi, naslovu ili statusu..."
          style={searchInput}
        />

        <button type="submit" style={searchButton}>
          Pretraži
        </button>

        {search && (
          <Link href="/dashboard/email-logovi" style={resetButton}>
            Poništi
          </Link>
        )}
      </form>

      {error && (
        <div style={errorStyle}>
          Greška pri učitavanju: {error.message}
        </div>
      )}

      {logs.length === 0 ? (
        <div style={emptyStyle}>
          {search ? 'Nema rezultata.' : 'Još nema emailova.'}
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={thStyle}>Datum</th>
                <th style={thStyle}>Primalac</th>
                <th style={thStyle}>Naslov</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Akcija</th>
                <th style={thStyle}>Kontrola</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={tdStyle}>{formatDate(log.sent_at)}</td>
                  <td style={tdStyle}>{log.recipient_email}</td>
                  <td style={tdStyle}>{log.subject}</td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '5px 10px',
                        borderRadius: 999,
                        fontWeight: 'bold',
                        color: log.status === 'sent' ? '#065f46' : '#991b1b',
                        backgroundColor:
                          log.status === 'sent' ? '#d1fae5' : '#fee2e2',
                      }}
                    >
                      {log.status === 'sent' ? 'POSLATO' : 'GREŠKA'}
                    </span>
                  </td>

                  {/* 🔥 NOVO DUGME */}
                  <td style={tdStyle}>
                    <ResendEmailButton logId={log.id} />
                  </td>

                  <td style={tdStyle}>
                    {log.inspection_id ? (
                      <Link href={`/dashboard/kontrole/${log.inspection_id}`}>
                        Otvori
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* STILOVI */

const backButtonStyle: CSSProperties = {
  padding: '10px 14px',
  border: '1px solid #ccc',
  borderRadius: 8,
  textDecoration: 'none',
}

const searchWrapper: CSSProperties = {
  marginTop: 20,
  marginBottom: 20,
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const searchInput: CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #ccc',
  minWidth: 250,
}

const searchButton: CSSProperties = {
  padding: '12px 18px',
  backgroundColor: '#111827',
  color: 'white',
  borderRadius: 10,
  border: 'none',
}

const resetButton: CSSProperties = {
  padding: '12px 18px',
  backgroundColor: '#e5e7eb',
  borderRadius: 10,
  textDecoration: 'none',
}

const errorStyle: CSSProperties = {
  padding: 12,
  backgroundColor: '#ffe5e5',
  borderRadius: 10,
}

const emptyStyle: CSSProperties = {
  padding: 12,
  border: '1px solid #ddd',
  borderRadius: 10,
}

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: CSSProperties = {
  padding: 10,
  borderBottom: '1px solid #ddd',
}

const tdStyle: CSSProperties = {
  padding: 10,
  borderBottom: '1px solid #eee',
}