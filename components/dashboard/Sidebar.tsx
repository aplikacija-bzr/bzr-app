import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside style={sidebar}>
      <nav style={nav}>
        <Link href="/dashboard" style={item}>
          🏠 Komandni centar
        </Link>

        <Link href="/dashboard/poslodavci" style={item}>
          🏢 Poslodavci
        </Link>

        <Link href="/dashboard/postupci" style={item}>
          📋 Postupci
        </Link>

        <Link href="/dashboard/aktivnosti" style={item}>
          ✅ Aktivnosti
        </Link>

        <Link href="/dashboard/zaposleni" style={item}>
          👷 Zaposleni
        </Link>

        <Link href="/dashboard/dokumentacija" style={item}>
          📄 Dokumentacija
        </Link>

        <Link href="/dashboard/izvestaji" style={item}>
          📊 Izveštaji
        </Link>

        <Link href="/dashboard/podesavanja" style={item}>
          ⚙ Podešavanja
        </Link>
      </nav>

      <div style={footer}>
        INPRO BZR
        <br />
        v1.0.0
      </div>
    </aside>
  )
}

const sidebar: React.CSSProperties = {
  width: 260,
  height: '100%',
  background: '#f8fafc',
  borderRight: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}

const nav: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: 20,
  gap: 8,
}

const item: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 500,
}

const footer: React.CSSProperties = {
  padding: 20,
  borderTop: '1px solid #e5e7eb',
  fontSize: 12,
  color: '#6b7280',
}