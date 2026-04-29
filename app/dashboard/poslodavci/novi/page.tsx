'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NoviPoslodavacPage() {
  const router = useRouter()
  const supabase = createClient()

  const [naziv, setNaziv] = useState('')
  const [email, setEmail] = useState('')
  const [kontaktLice, setKontaktLice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')

    if (!naziv.trim()) {
      setError('Unesi naziv poslodavca.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('klijenti').insert({
      naziv: naziv.trim(),
      email: email.trim() || null,
      kontakt_lice: kontaktLice.trim() || null,
      aktivan: true,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard/poslodavci')
  }

  return (
    <div style={{ padding: 30, maxWidth: 600 }}>
      <Link href="/dashboard/poslodavci">← Nazad na poslodavce</Link>

      <h1>Dodaj poslodavca</h1>

      <input
        value={naziv}
        onChange={(e) => setNaziv(e.target.value)}
        placeholder="Naziv poslodavca"
        style={inputStyle}
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={inputStyle}
      />

      <input
        value={kontaktLice}
        onChange={(e) => setKontaktLice(e.target.value)}
        placeholder="Kontakt lice"
        style={inputStyle}
      />

      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      <button onClick={save} disabled={saving} style={buttonStyle}>
        {saving ? 'Snimanje...' : 'Sačuvaj poslodavca'}
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: '1px solid #ccc',
  fontSize: 16,
  boxSizing: 'border-box' as const,
}

const buttonStyle = {
  width: '100%',
  padding: 16,
  backgroundColor: '#16a34a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontWeight: 'bold',
  fontSize: 16,
  cursor: 'pointer',
}