'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NovaKontrolaPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const poslodavacId = params.id as string

  const [naziv, setNaziv] = useState('')
  const [objectName, setObjectName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('klijenti')
        .select('naziv')
        .eq('id', poslodavacId)
        .single()

      setNaziv(data?.naziv || '')
    }

    load()
  }, [poslodavacId])

  const createInspection = async () => {
    setError('')

    if (!objectName.trim()) {
      setError('Unesi objekat.')
      return
    }

    if (!advisorName.trim()) {
      setError('Unesi savetnika.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        client_name: naziv,
        object_name: objectName.trim(),
        advisor_name: advisorName.trim(),
        inspection_date: inspectionDate,
        status: 'draft',
      })
      .select('id')
      .single()

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push(`/dashboard/kontrole/${data.id}`)
  }

  return (
    <div style={{ padding: 30, maxWidth: 650 }}>
      <Link href={`/dashboard/poslodavci/${poslodavacId}`}>
        ← Nazad na poslodavca
      </Link>

      <h1>Nova kontrola</h1>

      <div style={cardStyle}>
        <p>
          Poslodavac: <b>{naziv || '-'}</b>
        </p>

        <h3>BZR Kontrolna lista</h3>

        <label style={labelStyle}>Objekat</label>
        <input
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          placeholder="Unesi objekat"
          style={inputStyle}
        />

        <label style={labelStyle}>Savetnik</label>
        <input
          value={advisorName}
          onChange={(e) => setAdvisorName(e.target.value)}
          placeholder="Unesi ime savetnika"
          style={inputStyle}
        />

        <label style={labelStyle}>Datum</label>
        <input
          type="date"
          value={inspectionDate}
          onChange={(e) => setInspectionDate(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: 'red' }}>❌ {error}</p>}

        <button
          onClick={createInspection}
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? 'Kreiranje...' : 'Kreiraj kontrolu'}
        </button>
      </div>
    </div>
  )
}

const cardStyle = {
  marginTop: 20,
  padding: 20,
  border: '1px solid #ddd',
  borderRadius: 12,
  backgroundColor: '#fafafa',
}

const labelStyle = {
  display: 'block',
  marginTop: 16,
  marginBottom: 6,
  fontWeight: 'bold' as const,
}

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: '1px solid #ccc',
  fontSize: 16,
  boxSizing: 'border-box' as const,
}

const buttonStyle = {
  marginTop: 22,
  padding: '16px 22px',
  backgroundColor: '#16a34a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 'bold' as const,
  cursor: 'pointer',
}