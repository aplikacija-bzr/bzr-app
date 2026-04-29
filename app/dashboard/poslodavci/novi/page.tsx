'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function EmployersPage() {
  const supabase = createClient()

  const [employers, setEmployers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false })

      setEmployers(data || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <div style={{ padding: 20 }}>Učitavanje...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      
      <h1 style={{ marginBottom: 20 }}>Poslodavci</h1>

      {/* 🔥 DUGME */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/poslodavci/novi">
          <button
            style={{
              padding: '14px 20px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ➕ Dodaj poslodavca
          </button>
        </Link>
      </div>

      {employers.length === 0 ? (
        <p>Nema unetih poslodavaca.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {employers.map((emp) => (
            <Link
              key={emp.id}
              href={`/dashboard/poslodavci/${emp.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: 16,
                  border: '1px solid #ddd',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {emp.name || 'Naziv nije unet'}
                </div>

                {emp.address && (
                  <div style={{ marginTop: 6, color: '#555' }}>
                    📍 {emp.address}
                  </div>
                )}

                {emp.email && (
                  <div style={{ marginTop: 4, color: '#555' }}>
                    📧 {emp.email}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}