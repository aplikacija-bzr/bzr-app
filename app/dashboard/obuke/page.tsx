import Link from 'next/link'
import type { CSSProperties } from 'react'

export default function ObukePage() {
  return (
    <main style={pageStyle}>
      <Link
        href="/dashboard"
        style={backButton}
      >
        ← Nazad na INPRO-BZR
      </Link>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>
          OBUKE ZA BEZBEDAN I ZDRAV RAD
        </p>

        <h1 style={titleStyle}>
          Obuke za bezbedan i zdrav rad
        </h1>

        <p style={descriptionStyle}>
          Modul za upravljanje obukama zaposlenih,
          evidencijom obučenosti i rokovima za
          periodične provere.
        </p>
      </header>

      <div style={gridStyle}>
        <Link
          href="/dashboard/obuke/nova"
          style={cardStyle}
        >
          <div style={iconStyle}>＋</div>

          <div>
            <div style={cardTitle}>
              Nova obuka
            </div>

            <div style={cardDescription}>
              Pokreni novi postupak obuke
              zaposlenih.
            </div>
          </div>
        </Link>

        <Link
  href="/dashboard/obuke/aktivne"
  style={cardStyle}
>
  <div style={iconStyle}>▶</div>

  <div>
    <div style={cardTitle}>
      Aktivne obuke
    </div>

    <div style={cardDescription}>
      Pregled obuka koje su trenutno
      u toku.
    </div>
  </div>
</Link>

        <div style={cardStyle}>
          <div style={iconStyle}>✓</div>

          <div>
            <div style={cardTitle}>
              Arhiva obuka
            </div>

            <div style={cardDescription}>
              Pregled završenih postupaka
              obuke.
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/obuke/evidencija"
          style={cardStyle}
        >
          <div style={iconStyle}>☷</div>

          <div>
            <div style={cardTitle}>
              Evidencija obučenosti zaposlenih
            </div>

            <div style={cardDescription}>
              Pregled datuma obuke, provere
              obučenosti i narednih rokova.
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/baza-znanja"
          style={cardStyle}
        >
          <div style={iconStyle}>▤</div>

          <div>
            <div style={cardTitle}>
              Baze znanja
            </div>

            <div style={cardDescription}>
              Programi, pitanja i sadržaji
              potrebni za sprovođenje obuke.
            </div>
          </div>
        </Link>
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '30px',
}

const backButton: CSSProperties = {
  display: 'inline-block',
  marginBottom: 26,
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 700,
}

const headerStyle: CSSProperties = {
  marginBottom: 30,
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

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 18,
}

const cardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  minHeight: 105,
  padding: '20px 22px',
  border: '1px solid #ddd6fe',
  borderRadius: 14,
  backgroundColor: '#faf5ff',
  color: '#111827',
  textDecoration: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
}

const iconStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 46,
  height: 46,
  flexShrink: 0,
  borderRadius: 12,
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontSize: 24,
  fontWeight: 800,
}

const cardTitle: CSSProperties = {
  marginBottom: 6,
  color: '#111827',
  fontSize: 17,
  fontWeight: 800,
}

const cardDescription: CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
  lineHeight: 1.45,
}