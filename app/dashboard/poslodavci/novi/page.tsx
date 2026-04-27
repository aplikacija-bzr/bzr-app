'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NoviPoslodavacPage() {
  const supabase = createClient()
  const router = useRouter()

  const [naziv, setNaziv] = useState('')
  const [email, setEmail] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!naziv.trim()) {
      alert('Unesite naziv poslodavca')
      return
    }

    setLoading(true)

    try {
      const { data: existingClient } = await supabase
        .from('klijenti')
        .select('id')
        .ilike('naziv', naziv.trim())
        .maybeSingle()

      if (existingClient) {
        alert('Poslodavac sa ovim nazivom već postoji.')
        setLoading(false)
        return
      }

      const { data: clientData, error: clientError } = await supabase
        .from('klijenti')
        .insert([
          {
            naziv: naziv.trim(),
            aktivan: true,
          },
        ])
        .select()
        .single()

      if (clientError) throw clientError

      const { error: employerError } = await supabase
        .from('employers')
        .insert([
          {
            name: naziv.trim(),
            email: email.trim() || null,
            contact_person: contactPerson.trim() || null,
            client_id: clientData.id,
          },
        ])

      if (employerError) throw employerError

      alert('Poslodavac uspešno dodat')
      router.push('/dashboard/poslodavci')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Greška prilikom unosa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>Novi poslodavac</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Naziv poslodavca</label>
          <input
            type="text"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
              marginTop: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
              marginTop: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Kontakt lice</label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
              marginTop: 6,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0f766e',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Snimam...' : 'Sačuvaj'}
        </button>
      </form>
    </div>
  )
}