'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'

type ChecklistItem = {
  id: string
  title: string
}

type InspectionStatus = 'draft' | 'completed'

type AnswerRow = {
  checklist_item_id: string
  answer: 'da' | 'ne' | null
  comment: string | null
}

type InspectionRow = {
  status: InspectionStatus
  created_at?: string | null
}

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string
  const supabase = createClient()

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<InspectionStatus>('draft')
  const [loading, setLoading] = useState(true)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')

  const commentTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('id, title')
        .order('sort_order', { ascending: true })

      const { data: answersData, error: answersError } = await supabase
        .from('inspection_answers')
        .select('checklist_item_id, answer, comment')
        .eq('inspection_id', inspectionId)

      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .select('status, created_at')
        .eq('id', inspectionId)
        .single()

      if (itemsError || answersError || inspectionError) {
        setErrorMessage(
          itemsError?.message ||
            answersError?.message ||
            inspectionError?.message ||
            'Greška pri učitavanju podataka.'
        )
        setLoading(false)
        return
      }

      const answersMap: Record<string, string> = {}
      const commentsMap: Record<string, string> = {}

      ;(answersData as AnswerRow[] | null)?.forEach((row) => {
        if (row.answer) answersMap[row.checklist_item_id] = row.answer
        commentsMap[row.checklist_item_id] = row.comment || ''
      })

      const inspection = inspectionData as InspectionRow | null

      setItems(itemsData || [])
      setAnswers(answersMap)
      setComments(commentsMap)
      setStatus((inspection?.status as InspectionStatus) || 'draft')

      if (inspection?.created_at) {
        const date = new Date(inspection.created_at)
        setInspectionDate(
          `${String(date.getDate()).padStart(2, '0')}.${String(
            date.getMonth() + 1
          ).padStart(2, '0')}.${date.getFullYear()}`
        )
      } else {
        setInspectionDate('')
      }

      setLoading(false)
    }

    fetchData()

    return () => {
      Object.values(commentTimeouts.current).forEach(clearTimeout)
    }
  }, [inspectionId, supabase])

  const unansweredCount = useMemo(() => {
    return items.filter((item) => !answers[item.id]).length
  }, [items, answers])

  const allAnswered = items.length > 0 && unansweredCount === 0

  const pdfItems = useMemo(() => {
    return items.map((item) => ({
      question: item.title,
      answer:
        answers[item.id] === 'da'
          ? 'DA'
          : answers[item.id] === 'ne'
            ? 'NE'
            : '',
      comment: comments[item.id] || '',
    }))
  }, [items, answers, comments])

  const handleAnswer = async (itemId: string, value: 'da' | 'ne') => {
    if (status === 'completed') return

    setErrorMessage('')
    setSuccessMessage('')
    setSavingItemId(itemId)

    const previousValue = answers[itemId]
    const currentComment = comments[itemId] || ''

    setAnswers((prev) => ({
      ...prev,
      [itemId]: value,
    }))

    try {
      const res = await fetch('/api/inspection-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_id: inspectionId,
          checklist_item_id: itemId,
          answer: value,
          comment: currentComment,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAnswers((prev) => {
          const next = { ...prev }
          if (previousValue) next[itemId] = previousValue
          else delete next[itemId]
          return next
        })

        setErrorMessage(data?.error || 'Greška pri snimanju odgovora.')
      }
    } catch {
      setAnswers((prev) => {
        const next = { ...prev }
        if (previousValue) next[itemId] = previousValue
        else delete next[itemId]
        return next
      })

      setErrorMessage('Greška pri snimanju odgovora.')
    } finally {
      setSavingItemId(null)
    }
  }

  const saveComment = async (itemId: string, commentValue: string) => {
    if (status === 'completed') return

    setSavingCommentId(itemId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/inspection-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_id: inspectionId,
          checklist_item_id: itemId,
          answer: answers[itemId] || undefined,
          comment: commentValue,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data?.error || 'Greška pri snimanju komentara.')
      }
    } catch {
      setErrorMessage('Greška pri snimanju komentara.')
    } finally {
      setSavingCommentId((current) => (current === itemId ? null : current))
    }
  }

  const handleCommentChange = (itemId: string, value: string) => {
    if (status === 'completed') return

    setComments((prev) => ({
      ...prev,
      [itemId]: value,
    }))

    if (commentTimeouts.current[itemId]) {
      clearTimeout(commentTimeouts.current[itemId])
    }

    commentTimeouts.current[itemId] = setTimeout(() => {
      saveComment(itemId, value)
    }, 700)
  }

  const completeInspection = async () => {
    if (status === 'completed') return

    if (!allAnswered) {
      setErrorMessage(
        `Nije moguće završiti kontrolu. Neodgovorena pitanja: ${unansweredCount}.`
      )
      return
    }

    setFinishing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/inspection-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspection_id: inspectionId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data?.error || 'Greška pri završavanju kontrole.')
        return
      }

      setStatus('completed')
      setSuccessMessage('Kontrola je uspešno završena.')
    } catch {
      setErrorMessage('Greška pri završavanju kontrole.')
    } finally {
      setFinishing(false)
    }
  }

  const sendInspectionEmail = async () => {
    if (!recipientEmail) {
      setErrorMessage('Unesi email primaoca.')
      return
    }

    setSendingEmail(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/send-inspection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: 'BZR kontrolna lista',
          items: pdfItems,
          inspectionTitle: 'BZR kontrolna lista',
          inspectionDate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data?.error || 'Greška pri slanju emaila.')
        return
      }

      setSuccessMessage('PDF kontrolne liste je uspešno poslat mailom.')
    } catch {
      setErrorMessage('Greška pri slanju emaila.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Učitavanje...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h1>Kontrolna lista</h1>

      {inspectionDate && (
        <p>
          Datum: <b>{inspectionDate}</b>
        </p>
      )}

      <p>
        Status: <b>{status === 'completed' ? 'ZAVRŠENA' : 'U TOKU'}</b>
      </p>

      {status === 'draft' && (
        <p>
          Neodgovorena pitanja: <b>{unansweredCount}</b>
        </p>
      )}

      {errorMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#ffe5e5',
            color: '#900',
            border: '1px solid #f1b5b5',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#eaf7ea',
            color: '#155724',
            border: '1px solid #b7dfb7',
          }}
        >
          {successMessage}
        </div>
      )}

      {items.map((item, index) => {
        const currentAnswer = answers[item.id]
        const currentComment = comments[item.id] || ''

        return (
          <div
            key={item.id}
            style={{
              marginBottom: 15,
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 8,
              background:
                currentAnswer === 'ne'
                  ? '#ffe5e5'
                  : currentAnswer === 'da'
                    ? '#e6ffe6'
                    : '#fff',
            }}
          >
            <p style={{ marginTop: 0, marginBottom: 10 }}>
              <b>{index + 1}.</b> {item.title}
            </p>

            <div style={{ marginBottom: 10 }}>
              <label style={{ marginRight: 16 }}>
                <input
                  type="radio"
                  name={item.id}
                  disabled={status === 'completed' || savingItemId === item.id}
                  checked={currentAnswer === 'da'}
                  onChange={() => handleAnswer(item.id, 'da')}
                />{' '}
                DA
              </label>

              <label>
                <input
                  type="radio"
                  name={item.id}
                  disabled={status === 'completed' || savingItemId === item.id}
                  checked={currentAnswer === 'ne'}
                  onChange={() => handleAnswer(item.id, 'ne')}
                />{' '}
                NE
              </label>

              {savingItemId === item.id && (
                <span style={{ marginLeft: 12, fontSize: 14 }}>
                  Snimanje odgovora...
                </span>
              )}
            </div>

            <textarea
              placeholder="Komentar / napomena..."
              value={currentComment}
              disabled={status === 'completed'}
              onChange={(e) => handleCommentChange(item.id, e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #ccc',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            {savingCommentId === item.id && (
              <div style={{ marginTop: 6, fontSize: 14 }}>
                Snimanje komentara...
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <PDFDownloadLink
          document={
            <InspectionPdf
              title="DNEVNA BZR KONTROLNA LISTA"
              items={pdfItems}
              companyName=""
              employerName=""
              advisorName=""
              inspectionDate={inspectionDate}
              photos={[]}
            />
          }
          fileName="kontrolna_lista.pdf"
        >
          {({ loading: pdfLoading }) => (
            <span
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: 8,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              {pdfLoading ? 'Priprema PDF...' : 'Preuzmi PDF'}
            </span>
          )}
        </PDFDownloadLink>

        {status === 'draft' && (
          <button
            onClick={completeInspection}
            disabled={!allAnswered || finishing}
            style={{
              padding: '10px 20px',
              backgroundColor: !allAnswered || finishing ? '#999' : 'green',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: !allAnswered || finishing ? 'not-allowed' : 'pointer',
            }}
          >
            {finishing ? 'Završavanje...' : 'Završi kontrolu'}
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 8,
          backgroundColor: '#fafafa',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Pošalji PDF mailom</h3>

        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Email primaoca"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ccc',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />

        <div>
          <button
            onClick={sendInspectionEmail}
            disabled={sendingEmail}
            style={{
              padding: '10px 20px',
              backgroundColor: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: sendingEmail ? 'not-allowed' : 'pointer',
            }}
          >
            {sendingEmail ? 'Slanje...' : 'Pošalji PDF mailom'}
          </button>
        </div>
      </div>

      {status === 'completed' && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#eaf7ea',
            border: '1px solid #b7dfb7',
          }}
        >
          Kontrola je završena i izmene su zaključane.
        </div>
      )}
    </div>
  )
}