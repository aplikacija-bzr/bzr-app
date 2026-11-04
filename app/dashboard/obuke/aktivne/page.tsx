import Link from 'next/link'
import type { CSSProperties } from 'react'

import { createClient } from '@/lib/supabase/server'

type ActiveTrainingRow = {
  id: string
  training_number: string
  employer_id: string
  status_id: number
  reason_code: string | null
  start_date: string
  employers:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
  training_session_statuses:
    | {
        code: string
        name: string
      }
    | {
        code: string
        name: string
      }[]
    | null
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}.`
}

function getReasonLabel(reasonCode: string | null) {
  switch (reasonCode) {
    case '01':
      return 'Zasnivanje radnog odnosa ili drugo radno angažovanje'
    case '02':
      return 'Premeštaj na druge poslove'
    case '03':
      return 'Nova tehnologija, sredstva za rad ili promena opreme'
    case '04':
      return 'Promena radnog procesa'
    case '05':
      return 'Rad na dva ili više radnih mesta'
    case '06':
      return 'Zaposleni drugog poslodavca'
    case '07':
      return 'Dodatna obuka zbog zahteva radnog procesa'
    case '08':
      return 'Dodatna obuka nakon teške, smrtne ili kolektivne povrede'
    case '09':
      return 'Periodična obuka zaposlenih'
    case '10':
      return 'Obuka neposrednih rukovodilaca'
    default:
      return reasonCode
        ? `Razlog ${reasonCode}`
        : 'Nije evidentirano'
  }
}

export default async function ActiveTrainingsPage() {
  const supabase = await createClient()

  const {
    data,
    error,
  } = await supabase
    .from('training_sessions')
    .select(`
      id,
      training_number,
      employer_id,
      status_id,
      reason_code,
      start_date,
      employers (
        name
      ),
      training_session_statuses (
        code,
        name
      )
    `)
    .in(
      'status_id',
      [1, 2, 3]
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    )

  if (error) {
    throw new Error(
      error.message ||
        'Greška pri učitavanju aktivnih obuka.'
    )
  }

  const trainings =
    (data ?? []) as ActiveTrainingRow[]

  return (
    <main style={pageStyle}>
      <Link
        href="/dashboard/obuke"
        style={backButton}
      >
        ← Nazad na Obuke
      </Link>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>
          MODUL OBUKE
        </p>

        <h1 style={titleStyle}>
          Aktivne obuke
        </h1>

        <p style={descriptionStyle}>
          Pregled postupaka obuke koji su u pripremi,
          zakazani ili trenutno u toku.
        </p>
      </header>

      {trainings.length === 0 ? (
        <div style={emptyState}>
          <div style={emptyTitle}>
            Nema aktivnih obuka
          </div>

          <div style={emptyText}>
            Trenutno nema postupaka obuke sa statusom
            U pripremi, Zakazano ili U toku.
          </div>
        </div>
      ) : (
        <div style={listStyle}>
          {trainings.map((training) => {
            const employer =
              Array.isArray(
                training.employers
              )
                ? training.employers[0]
                : training.employers

            const status =
              Array.isArray(
                training.training_session_statuses
              )
                ? training
                    .training_session_statuses[0]
                : training
                    .training_session_statuses

            return (
              <article
                key={training.id}
                style={cardStyle}
              >
                <div style={cardTopRow}>
                  <div>
                    <div style={trainingNumberStyle}>
                      {training.training_number}
                    </div>

                    <div style={employerStyle}>
                      {employer?.name ??
                        'Nepoznat poslodavac'}
                    </div>
                  </div>

                  <div
                    style={{
                      ...statusBadge,
                      ...(status?.code ===
                      'IN_PROGRESS'
                        ? statusInProgress
                        : statusDraft),
                    }}
                  >
                    {status?.name ??
                      status?.code ??
                      'Aktivno'}
                  </div>
                </div>

                <div style={detailsGrid}>
                  <div>
                    <div style={detailLabel}>
                      Razlog obuke
                    </div>

                    <div style={detailValue}>
                      {getReasonLabel(
                        training.reason_code
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={detailLabel}>
                      Datum početka
                    </div>

                    <div style={detailValue}>
                      {formatDate(
                        training.start_date
                      )}
                    </div>
                  </div>
                </div>

                <div style={actionsStyle}>
                  <Link
                    href={`/dashboard/obuke/nova?sessionId=${encodeURIComponent(
                      training.id
                    )}`}
                    style={primaryButton}
                  >
                    Nastavi postupak
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: 30,
}

const backButton: CSSProperties = {
  display: 'inline-block',
  marginBottom: 26,
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 700,
}

const headerStyle: CSSProperties = {
  marginBottom: 28,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: '#7c3aed',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.2,
}

const titleStyle: CSSProperties = {
  marginTop: 8,
  marginBottom: 10,
  fontSize: 32,
  color: '#111827',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  color: '#4b5563',
  fontSize: 16,
  lineHeight: 1.6,
}

const emptyState: CSSProperties = {
  padding: 28,
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  backgroundColor: '#f8fafc',
}

const emptyTitle: CSSProperties = {
  marginBottom: 6,
  fontSize: 18,
  fontWeight: 800,
  color: '#111827',
}

const emptyText: CSSProperties = {
  color: '#64748b',
  lineHeight: 1.5,
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const cardStyle: CSSProperties = {
  padding: 20,
  border: '1px solid #ddd6fe',
  borderRadius: 14,
  backgroundColor: '#ffffff',
}

const cardTopRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
}

const trainingNumberStyle: CSSProperties = {
  marginBottom: 4,
  color: '#7c3aed',
  fontSize: 14,
  fontWeight: 800,
}

const employerStyle: CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  color: '#111827',
}

const statusBadge: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
}

const statusDraft: CSSProperties = {
  backgroundColor: '#ede9fe',
  color: '#6d28d9',
}

const statusInProgress: CSSProperties = {
  backgroundColor: '#dcfce7',
  color: '#166534',
}

const detailsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 18,
  marginTop: 20,
}

const detailLabel: CSSProperties = {
  marginBottom: 5,
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
}

const detailValue: CSSProperties = {
  color: '#111827',
  fontSize: 14,
  fontWeight: 600,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 20,
}

const primaryButton: CSSProperties = {
  display: 'inline-block',
  padding: '9px 14px',
  borderRadius: 8,
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 800,
}