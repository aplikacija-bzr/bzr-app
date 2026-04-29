'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string
  const supabase = createClient()

  const [items, setItems] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'draft' | 'completed'>('draft')
  const [loading, setLoading] = useState(true)

  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailHistory, setEmailHistory] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const commentTimeouts = useRef<any>({})

  useEffect(() => {
    const saved = localStorage.getItem('daily_email_history')
    if (saved) setEmailHistory(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')

      const { data: answersData } = await supabase
        .from('inspection_answers')
        .select('*')
        .eq('inspection_id', inspectionId)

      const a: any = {}
      answersData?.forEach((row: any) => {
        a[row.checklist_item_id] = row.answer
      })

      setItems(itemsData || [])
      setAnswers(a)
      setLoading(false)
    }

    load()

    return () => {
      Object.values(commentTimeouts.current).forEach((t) =>
        clearTimeout(t as any)
      )
    }
  }, [inspectionId])

  const unansweredCount = items.filter((i) => !answers[i.id]).length
  const allAnswered = items.length > 0 && unansweredCount === 0

  const handleAnswer = async (id: string, value: 'da' | 'ne') => {
    setAnswers((p) => ({ ...p, [id]: value }))

    await fetch('/api/inspection-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspection_id: inspectionId,
        checklist_item_id: id,
        answer: value,
      }),
    })
  }

  const sendEmail = async () => {
    setEmailMessage('')
    setEmailError('')

    if (!recipientEmail) {
      setEmailError('❌ Unesi email')
      return
    }

    setSendingEmail(true)

    try {
      const res = await fetch('/api/send-inspection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_id: inspectionId,
          to: recipientEmail,
          items: [],
          photos: [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setEmailError(`❌ ${data.error}`)
      } else {
        setEmailMessage('✅ Email je uspešno poslat.')

        const newHistory = [
          recipientEmail,
          ...emailHistory.filter((e) => e !== recipientEmail),
        ].slice(0, 10)

        setEmailHistory(newHistory)
        localStorage.setItem(
          'daily_email_history',
          JSON.stringify(newHistory)
        )
      }
    } catch (err: any) {
      setEmailError(`❌ ${err.message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  const saveInspection = async () => {
    if (!allAnswered) {
      setSaveError(`❌ Nisu sva pitanja odgovorena (${unansweredCount})`)
      return
    }

    setSaving(true)

    await fetch('/api/inspection-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection_id: inspectionId }),
    })

    setStatus('completed')
    setSaving(false)
  }

  if (loading) return <div>Učitavanje...</div>

  return (
    <div style={{ padding: 20, paddingBottom: 120 }}>
      <h1>Kontrola</h1>

      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: 10 }}>
          <p>{item.title}</p>

          <button onClick={() => handleAnswer(item.id, 'da')}>DA</button>
          <button onClick={() => handleAnswer(item.id, 'ne')}>NE</button>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <select
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
        >
          <option value="">Izaberi email</option>
          {emailHistory.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>

        <input
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
        />

        <button onClick={sendEmail}>
          {sendingEmail ? 'Slanje...' : 'Pošalji email'}
        </button>

        {emailMessage && <p>{emailMessage}</p>}
        {emailError && <p>{emailError}</p>}
      </div>

      {/* 🔥 OVO JE KLJUČNO DUGME */}
      {status === 'draft' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            padding: 15,
            borderTop: '1px solid #ddd',
          }}
        >
          <button
            onClick={saveInspection}
            disabled={!allAnswered || saving}
            style={{
              width: '100%',
              padding: 18,
              fontSize: 20,
              background: !allAnswered ? '#999' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 10,
            }}
          >
            {saving ? 'Snimanje...' : 'Snimi kontrolu'}
          </button>

          {!allAnswered && (
            <p style={{ color: 'red' }}>
              Nisu sva pitanja odgovorena ({unansweredCount})
            </p>
          )}
        </div>
      )}
    </div>
  )
}