import type { CSSProperties } from 'react'

type InboxPriority = 'critical' | 'high'

type InboxStatus =
  | 'new'
  | 'not_started'
  | 'in_progress'
  | 'waiting'

type WorkInboxItem = {
  id: string
  employerName: string
  category: string
  title: string
  subjectLabel?: string
  deadlineLabel: string
  reasonLabel: string
  priority: InboxPriority
  status: InboxStatus
}

const inboxItems: WorkInboxItem[] = [
  {
    id: 'training-inkom',
    employerName: 'INKOM DOO',
    category: 'OBUKA ZA BZR',
    title: 'Izvršiti periodičnu obuku zaposlenih',
    subjectLabel: '5 zaposlenih',
    deadlineLabel: 'Rok istekao pre 3 dana',
    reasonLabel: 'Periodična obuka zaposlenih je istekla.',
    priority: 'critical',
    status: 'not_started',
  },
  {
    id: 'equipment-rmf',
    employerName: 'RMF',
    category: 'OPREMA ZA RAD',
    title: 'Izvršiti periodično ispitivanje opreme za rad',
    subjectLabel: 'Autodizalica',
    deadlineLabel: 'Rok ističe za 12 dana',
    reasonLabel:
      'Rok za periodično ispitivanje opreme približava se isteku.',
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: 'medical-gorstak',
    employerName: 'GORŠTAK',
    category: 'LEKARSKI PREGLEDI',
    title: 'Organizovati lekarske preglede zaposlenih',
    subjectLabel: 'Radno mesto: vozač traktora',
    deadlineLabel: 'Rok istekao juče',
    reasonLabel:
      'Periodični lekarski pregled nije realizovan u predviđenom roku.',
    priority: 'critical',
    status: 'waiting',
  },
]

function getStatusLabel(status: InboxStatus): string {
  switch (status) {
    case 'new':
      return 'Novo'
    case 'not_started':
      return 'Nije pokrenuto'
    case 'in_progress':
      return 'U toku'
    case 'waiting':
      return 'Čeka poslodavca'
  }
}

function getActionLabel(status: InboxStatus): string {
  switch (status) {
    case 'new':
      return 'Obradi zahtev'
    case 'not_started':
      return 'Pokreni postupak'
    case 'in_progress':
      return 'Nastavi postupak'
    case 'waiting':
      return 'Pregledaj'
  }
}

export default function WorkInbox() {
  return (
    <section style={panel}>
      <div style={panelHeader}>
        <div>
          <h2 style={panelTitle}>Radni Inbox</h2>

          <p style={panelSubtitle}>
            Moji otvoreni zadaci
          </p>
        </div>

        <button
          type="button"
          style={showAllButton}
        >
          Prikaži sve ({inboxItems.length})
        </button>
      </div>

      <div style={list}>
        {inboxItems.map((item) => {
          const isCritical =
            item.priority === 'critical'

          return (
            <article
              key={item.id}
              style={{
                ...row,
                borderLeftColor: isCritical
                  ? '#dc2626'
                  : '#f97316',
              }}
            >
              <div style={topRow}>
                <div>
                  <div style={employerName}>
                    {item.employerName}
                  </div>

                  <div style={category}>
                    {item.category}
                  </div>
                </div>

                <div style={badges}>
                  <span
                    style={{
                      ...priorityBadge,
                      backgroundColor: isCritical
                        ? '#fee2e2'
                        : '#ffedd5',
                      color: isCritical
                        ? '#991b1b'
                        : '#9a3412',
                    }}
                  >
                    {isCritical
                      ? '🔴 Kritičan'
                      : '🟠 Visok'}
                  </span>

                  <span style={statusBadge}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              <div style={taskTitle}>
                {item.title}
              </div>

              {item.subjectLabel && (
                <div style={subjectLabel}>
                  {item.subjectLabel}
                </div>
              )}

              <div
                style={{
                  ...deadline,
                  color: isCritical
                    ? '#b91c1c'
                    : '#c2410c',
                }}
              >
                {item.deadlineLabel}
              </div>

              <div
                style={{
                  ...reasonBox,
                  backgroundColor: isCritical
                    ? '#fef2f2'
                    : '#fff7ed',
                  color: isCritical
                    ? '#991b1b'
                    : '#9a3412',
                }}
              >
                <span style={reasonTitle}>
                  Razlog:
                </span>{' '}
                {item.reasonLabel}
              </div>

              <div style={actions}>
                <button
                  type="button"
                  style={primaryButton}
                >
                  {getActionLabel(item.status)}
                </button>

                <button
                  type="button"
                  style={moreButton}
                  aria-label={`Dodatne akcije za zadatak ${item.title}`}
                >
                  ⋮
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const panel: CSSProperties = {
  padding: 20,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
}

const panelHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
  marginBottom: 16,
}

const panelTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#111827',
}

const panelSubtitle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 14,
  color: '#6b7280',
}

const showAllButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  marginTop: 2,
}

const list: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const row: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderLeftWidth: 5,
  borderRadius: 8,
  padding: 16,
  background: '#ffffff',
}

const topRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
}

const employerName: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
}

const category: CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  color: '#6b7280',
}

const badges: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 6,
}

const priorityBadge: CSSProperties = {
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const statusBadge: CSSProperties = {
  padding: '4px 8px',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const taskTitle: CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  fontWeight: 700,
  color: '#111827',
}

const subjectLabel: CSSProperties = {
  marginTop: 7,
  fontSize: 13,
  color: '#6b7280',
}

const deadline: CSSProperties = {
  marginTop: 7,
  fontSize: 13,
  fontWeight: 700,
}

const reasonBox: CSSProperties = {
  marginTop: 12,
  padding: '9px 11px',
  borderRadius: 7,
  fontSize: 13,
  lineHeight: 1.45,
}

const reasonTitle: CSSProperties = {
  fontWeight: 700,
}

const actions: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 14,
}

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 7,
  background: '#2563eb',
  color: '#ffffff',
  padding: '8px 14px',
  fontWeight: 600,
  cursor: 'pointer',
}

const moreButton: CSSProperties = {
  width: 36,
  height: 34,
  border: '1px solid #d1d5db',
  borderRadius: 7,
  background: '#ffffff',
  cursor: 'pointer',
  fontSize: 18,
}