'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Inspection = {
  id: string
  client_name: string | null
  object_name: string | null
  advisor_name: string | null
  inspection_date: string | null
  status: string | null
}

export default function KontrolePage() {
  const supabase = createClient()

  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const startDate = firstDay.toISOString().slice(0, 10)
      const endDate = nextMonth.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('inspections')
        .eq('locked', false)
        .select(
          'id, client_name, object_name, advisor_name, inspection_date, status'
        )
        .gte('inspection_date', startDate)
        .lt('inspection_date', endDate)
        .order('inspection_date', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setInspections(data || [])
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div style={{ padding: 30, maxWidth: 1000, margin: 'auto' }}>
      <h1>Dnevne BZR kontrole</h1>

      <p style={{ color: '#555' }}>
        Prikazuju se samo kontrole iz tekućeg meseca.
      </p>

      {loading && <p>Učitavanje...</p>}

      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      {!loading && inspections.length === 0 && (
        <p>Nema kontrola za tekući mesec.</p>
      )}

      {inspections.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={thStyle}>Datum</th>
                <th style={thStyle}>Poslodavac</th>
                <th style={thStyle}>Objekat</th>
                <th style={thStyle}>Savetnik</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Akcija</th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={tdStyle}>
                    {inspection.inspection_date
                      ? formatDate(inspection.inspection_date)
                      : '-'}
                  </td>

                  <td style={tdStyle}>{inspection.client_name || '-'}</td>
                  <td style={tdStyle}>{inspection.object_name || '-'}</td>
                  <td style={tdStyle}>{inspection.advisor_name || '-'}</td>

                  <td style={tdStyle}>
                    {inspection.status === 'completed'
                      ? 'Sačuvana'
                      : 'U toku'}
                  </td>

                  <td style={tdStyle}>
                    <Link
                      href={`/dashboard/kontrole/${inspection.id}`}
                      style={{
                        color: '#2563eb',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                      }}
                    >
                      Otvori
                    </Link>
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

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}.`
}

const thStyle = {
  padding: 12,
  border: '1px solid #ddd',
  textAlign: 'left' as const,
}

const tdStyle = {
  padding: 12,
  border: '1px solid #ddd',
}