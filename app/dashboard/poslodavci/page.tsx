'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Client = {
  id: string
  naziv: string | null
  aktivan: boolean | null
}

type Employer = {
  id: string
  name: string | null
  email: string | null
  contact_person: string | null
  client_id: string | null
}

export default function PoslodavciPage() {
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: clientsData, error: clientsError } = await supabase
        .from('klijenti')
        .select('id, naziv, aktivan')
        .order('naziv', { ascending: true })

      const { data: employersData, error: employersError } = await supabase
        .from('employers')
        .select('id, name, email, contact_person, client_id')

      if (!clientsError) setClients(clientsData || [])
      if (!employersError) setEmployers(employersData || [])

      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredClients = clients.filter((c) =>
    (c.naziv || '').toLowerCase().includes(search.toLowerCase())
  )

  const getEmployer = (clientId: string) => {
    return employers.find((e) => e.client_id === clientId)
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>Poslodavci</h1>
          <p style={{ margin: 0 }}>
            Izaberite poslodavca i otvorite njegovu radnu stranu.
          </p>
        </div>

        <Link
          href="/dashboard/poslodavci/novi"
          style={{
            padding: '10px 16px',
            backgroundColor: '#0f766e',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          + Novi poslodavac
        </Link>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Pretraga po nazivu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 10,
            width: 300,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />

        <button
          type="button"
          style={{
            padding: '10px 16px',
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
          }}
        >
          Pretraži
        </button>
      </div>

      {loading ? (
        <p>Učitavanje...</p>
      ) : filteredClients.length === 0 ? (
        <p>Nema pronađenih poslodavaca.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {filteredClients.map((client) => {
            const employer = getEmployer(client.id)

            return (
              <div
                key={client.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {client.naziv || 'Bez naziva'}
                </h3>

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

                {employer?.email && <p>Email: {employer.email}</p>}

                {employer?.contact_person && (
                  <p>Kontakt lice: {employer.contact_person}</p>
                )}

                <Link
                  href={`/dashboard/poslodavci/${client.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    padding: '8px 14px',
                    backgroundColor: '#000',
                    color: '#fff',
                    borderRadius: 8,
                    textDecoration: 'none',
                  }}
                >
                  Otvori
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}