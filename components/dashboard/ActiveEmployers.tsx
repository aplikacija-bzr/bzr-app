import type { CSSProperties } from 'react'

type ActiveEmployer = {
  id: string
  employerName: string
  currentWork: string
  lastActivity: string
}

const activeEmployers: ActiveEmployer[] = [
  {
    id: 'inkom',
    employerName: 'INKOM DOO',
    currentWork: '📚 Obuka zaposlenih',
    lastActivity: 'Danas u 10:42',
  },
  {
    id: 'rmf',
    employerName: 'RMF',
    currentWork: '🩺 Lekarski pregledi',
    lastActivity: 'Danas u 09:15',
  },
  {
    id: 'np-tara',
    employerName: 'NACIONALNI PARK TARA',
    currentWork: '⚡ Električne instalacije',
    lastActivity: 'Juče u 15:30',
  },
]

export default function ActiveEmployers() {
  return (
    <section style={panel}>
      <div style={panelHeader}>
        <div>
          <h2 style={panelTitle}>Poslodavci kojima se danas bavim</h2>
          <p style={panelSubtitle}>Aktivne radne sesije</p>
        </div>

        <button type="button" style={showAllButton}>
          Prikaži sve ({activeEmployers.length})
        </button>
      </div>

      <div style={list}>
        {activeEmployers.map((employer) => (
          <article key={employer.id} style={row}>
            <div>
              <div style={employerName}>
                🏢 {employer.employerName}
              </div>

              <div style={currentWork}>
                {employer.currentWork}
              </div>

              <div style={lastActivity}>
                Poslednja aktivnost: {employer.lastActivity}
              </div>
            </div>

            <button type="button" style={primaryButton}>
              Nastavi
            </button>
          </article>
        ))}
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
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
}

const panelTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
}

const panelSubtitle: CSSProperties = {
  margin: '6px 0 0',
  color: '#6b7280',
  fontSize: 14,
}

const showAllButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  cursor: 'pointer',
  fontWeight: 600,
}

const list: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const row: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
}

const employerName: CSSProperties = {
  fontWeight: 700,
  color: '#111827',
}

const currentWork: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: '#374151',
}

const lastActivity: CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: '#6b7280',
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