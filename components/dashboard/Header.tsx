import Link from 'next/link'

export default function Header() {
  return (
    <header style={header}>
      <div style={logo}>
        <Link
          href="/dashboard"
          style={{
            textDecoration: 'none',
            color: '#111827',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          INPRO BZR
        </Link>
      </div>

      <div style={searchWrapper}>
        <input
          type="text"
          placeholder="Pretraži poslodavce, zaposlene, aktivnosti..."
          style={searchInput}
        />
      </div>

      <div style={actions}>
        <button style={newButton}>
          + Novo
        </button>

        <button style={iconButton}>
          🔔
        </button>

        <button style={profileButton}>
          👤 Slobodan
        </button>
      </div>
    </header>
  )
}

const header: React.CSSProperties = {
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
}

const logo: React.CSSProperties = {
  width: 220,
}

const searchWrapper: React.CSSProperties = {
  flex: 1,
  padding: '0 24px',
}

const searchInput: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: '0 14px',
  fontSize: 15,
}

const actions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const newButton: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}

const iconButton: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
}

const profileButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
}