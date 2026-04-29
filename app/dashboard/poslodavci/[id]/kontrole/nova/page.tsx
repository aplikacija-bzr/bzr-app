'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NovaKontrolaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const parts = pathname.split('/')
  const clientId = parts[3]

  const [naziv, setNaziv] = useState('')
  const [employerId, setEmployerId] = useState('')
  const [objectName, setObjectName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!clientId) {
        setError('Nedostaje ID poslodavca u URL-u.')
        return
      }

      const { data, error } = await supabase
        .from('klijenti')
        .select('naziv, employer_id')
        .eq('id', clientId)
        .single()

      if (error) {
        setError(error.message)
        return
      }

      setNaziv(data?.naziv || '')
      setEmployerId(data?.employer_id || '')
    }

    load()
  }, [clientId])

  const ensureEmployerId = async () => {
    if (employerId) return employerId

    const { data: employer, error: employerError } = await supabase
      .from('employers')
      .insert({ name: naziv || 'Poslodavac' })
      .select('id')
      .single()

    if (employerError || !employer) {
      throw new Error(employerError?.message || 'Ne mogu da napravim employer_id.')
    }

    const { error: updateError } = await supabase
      .from('klijenti')
      .update({ employer_id: employer.id })
      .eq('id', clientId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    setEmployerId(employer.id)
    return employer.id
  }

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

    try {
      const finalEmployerId = await ensureEmployerId()

      const { data, error } = await supabase
        .from('inspections')
        .insert({
          employer_id: finalEmployerId,
          client_name: naziv,
          object_name: objectName.trim(),
          advisor_name: advisorName.trim(),
          inspection_date: inspectionDate,
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }

      router.push(`/dashboard/kontrole/${data.id}`)
    } catch (err: any) {
      setError(err?.message || 'Greška pri kreiranju kontrole.')
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 30, maxWidth: 650 }}>
      <Link href={`/dashboard/poslodavci/${clientId}`}>
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

        <button onClick={createInspection} disabled={saving} style={buttonStyle}>
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