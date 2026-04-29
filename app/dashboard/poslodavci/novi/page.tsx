'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NoviPoslodavacPage() {
  const router = useRouter()
  const supabase = createClient()

  const [naziv, setNaziv] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!naziv.trim()) {
      setMessage('❌ Unesi naziv poslodavca.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('klijenti')
      .insert({
        naziv: naziv.trim(),
        aktivan: true,
      })
      .select()

    setSaving(false)

    if (error) {
      setMessage(`❌ Greška: ${error.message}`)
      return
    }

    if (!data || data.length === 0) {
      setMessage('❌ Nije upisano u bazu.')
      return
    }

    setMessage('✅ Poslodavac je sačuvan.')

    setTimeout(() => {
      router.push('/dashboard/poslodavci')
      router.refresh()
    }, 700)
  }

  return (
    <div style={{ padding: 30, maxWidth: 600 }}>
      <Link href="/dashboard/poslodavci">← Nazad na poslodavce</Link>

      <h1>Dodaj poslodavca</h1>

      <form onSubmit={save}>
        <input
          value={naziv}
          onChange={(e) => setNaziv(e.target.value)}
          placeholder="Naziv poslodavca"
          style={inputStyle}
        />

        {message && (
          <p
            style={{
              color: message.startsWith('✅') ? 'green' : 'red',
              fontWeight: 'bold',
            }}
          >
            {message}
          </p>
        )}

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? 'Snimanje...' : 'Sačuvaj poslodavca'}
        </button>
      </form>
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