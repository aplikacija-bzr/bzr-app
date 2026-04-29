import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { CSSProperties } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export default async function DashboardPage() {
  const { start, end } = getTodayRange()

  const { count: todayEmails } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', start)
    .lte('sent_at', end)

  const { count: totalEmails } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')

  const { count: failedEmails } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  const { count: todayInspections } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lte('created_at', end)

  return (
    <div style={{ padding: 30, maxWidth: 1000 }}>
      <h1>INPRO-BZR</h1>

      <div style={cardsWrapper}>
        <div style={cardStyle}>
          <div style={cardNumber}>{todayEmails || 0}</div>
          <div style={cardLabel}>Danas poslatih emailova</div>
        </div>

        <div style={cardStyle}>
          <div style={cardNumber}>{totalEmails || 0}</div>
          <div style={cardLabel}>Ukupno poslatih emailova</div>
        </div>

        <div style={cardStyle}>
          <div style={cardNumber}>{failedEmails || 0}</div>
          <div style={cardLabel}>Grešaka pri slanju</div>
        </div>

        <div style={cardStyle}>
          <div style={cardNumber}>{todayInspections || 0}</div>
          <div style={cardLabel}>Dnevnih kontrola danas</div>
        </div>
      </div>

      <p style={{ marginTop: 26, marginBottom: 14 }}>Izaberi opciju:</p>

      <div style={buttonsWrapper}>
        <Link href="/dashboard/poslodavci" style={buttonStyle}>
          🔍 Pretraga poslodavaca
        </Link>

        {/* 🔥 NOVO DUGME */}
        <Link href="/dashboard/poslodavci/novi" style={greenButton}>
          ➕ Dodaj poslodavca
        </Link>

        <Link href="/dashboard/email-logovi" style={buttonStyle}>
          📧 Pregled poslatih emailova
        </Link>
      </div>
    </div>
  )
}

const cardsWrapper: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 14,
  marginTop: 20,
}

const cardStyle: CSSProperties = {
  padding: 18,
  border: '1px solid #ddd',
  borderRadius: 12,
  backgroundColor: '#fafafa',
}

const cardNumber: CSSProperties = {
  fontSize: 32,
  fontWeight: 'bold',
  marginBottom: 6,
}

const cardLabel: CSSProperties = {
  fontSize: 15,
  color: '#555',
}

const buttonsWrapper: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: 320,
}

const buttonStyle: CSSProperties = {
  display: 'block',
  padding: '14px 18px',
  borderRadius: 10,
  backgroundColor: '#111827',
  color: 'white',
  textDecoration: 'none',
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'center',
}

const greenButton: CSSProperties = {
  display: 'block',
  padding: '14px 18px',
  borderRadius: 10,
  backgroundColor: '#16a34a',
  color: 'white',
  textDecoration: 'none',
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'center',
}