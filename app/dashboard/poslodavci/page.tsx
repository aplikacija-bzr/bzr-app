import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { CSSProperties } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function PoslodavciPage() {
  const { data: clients } = await supabase
    .from('klijenti')
    .select('*')
    .order('naziv', { ascending: true })

  return (
    <div style={{ padding: 30 }}>
      {/* 🔙 POVRATAK */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-block',
          marginBottom: 16,
          padding: '10px 14px',
          backgroundColor: '#111827',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        ← Nazad na INPRO-BZR
      </Link>

      <h1>Poslodavci</h1>

      <p style={{ marginBottom: 20 }}>
        Izaberite poslodavca i otvorite njegovu radnu stranu.
      </p>

      {/* 🔍 PRETRAGA (ostaje kako je bila) */}
      <form
        method="GET"
        style={{ marginBottom: 20, display: 'flex', gap: 10 }}
      >
        <input
          type="text"
          name="search"
          placeholder="Pretraga po nazivu..."
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ccc',
            width: 260,
          }}
        />

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontWeight: 'bold',
          }}
        >
          Pretraži
        </button>
      </form>

      {/* 📋 LISTA */}
      <div style={gridStyle}>
        {clients?.map((client) => (
          <div key={client.id} style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>{client.naziv}</h3>

            <p>
              Status:{' '}
              <span
                style={{
                  color: client.aktivan ? 'green' : 'red',
                  fontWeight: 'bold',
                }}
              >
                {client.aktivan ? 'Aktivan' : 'Neaktivan'}
              </span>
            </p>

            {client.email && <p>Email: {client.email}</p>}
            {client.kontakt_lice && (
              <p>Kontakt lice: {client.kontakt_lice}</p>
            )}

            <Link
              href={`/dashboard/poslodavci/${client.id}`}
              style={openButton}
            >
              Otvori
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
}

const cardStyle: CSSProperties = {
  padding: 16,
  border: '1px solid #ddd',
  borderRadius: 12,
  backgroundColor: '#fff',
}

const openButton: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '8px 14px',
  backgroundColor: '#000',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 'bold',
}