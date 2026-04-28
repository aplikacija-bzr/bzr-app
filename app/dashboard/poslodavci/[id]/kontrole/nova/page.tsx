'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NewInspectionPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()

  const clientId = params.id as string

  const [client, setClient] = useState<any>(null)
  const [checklist, setChecklist] = useState<any>(null)

  const [objectName, setObjectName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: clientData } = await supabase
        .from('klijenti')
        .select('id, naziv, employer_id')
        .eq('id', clientId)
        .single()

      const { data: checklistData } = await supabase
        .from('checklists')
        .select('*')
        .limit(1)
        .single()

      setClient(clientData)
      setChecklist(checklistData)
      setLoading(false)
    }

    load()
  }, [clientId])

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!client?.employer_id) {
      alert('Nema employer_id')
      return
    }

    if (!checklist?.id) {
      alert('Nema checklist')
      return
    }

    setSaving(true)

    const res = await fetch('/api/create-inspection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employer_id: client.employer_id,
        client_name: client.naziv,
        checklist_id: checklist.id,
        object_name: objectName,
        advisor_name: advisorName,
        inspection_date: inspectionDate,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Greška')
      setSaving(false)
      return
    }

    router.push(`/dashboard/kontrole/${data.id}`)
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Učitavanje...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h1>Nova kontrola</h1>

      <p>
        Poslodavac: <b>{client?.naziv}</b>
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Objekat</label>
          <input
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            style={{ width: '100%', padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Savetnik</label>
          <input
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
            style={{ width: '100%', padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Datum</label>
          <input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            style={{ width: '100%', padding: 10 }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: 14,
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Kreiranje...' : 'Kreiraj kontrolu'}
        </button>
      </form>
    </div>
  )
}