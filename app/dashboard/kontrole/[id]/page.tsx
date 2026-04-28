'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'
import PhotoUpload from '@/app/components/inspection/PhotoUpload'

type ChecklistItem = {
  id: string
  title: string
  description?: string | null
}

type InspectionStatus = 'draft' | 'completed'

type AnswerRow = {
  checklist_item_id: string
  answer: 'da' | 'ne' | null
  comment: string | null
}

type PhotoRow = {
  id: string
  file_path?: string | null
  file_url?: string | null
  created_at?: string | null
}

const BUCKET = 'inspection-images'
const SUPABASE_URL = 'https://awvrwilxbvibzyegwila.supabase.co'

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
  const [clientName, setClientName] = useState('')
  const [clientPageId, setClientPageId] = useState('')
  const [objectName, setObjectName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  const commentTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const loadPhotos = async () => {
    if (!inspectionId) return

    setLoadingPhotos(true)

    const { data, error } = await supabase
      .from('inspection_photos')
      .select('id, file_path, file_url, created_at')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false })

    if (!error) {
      setPhotos((data || []) as PhotoRow[])
    }

    setLoadingPhotos(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!inspectionId) return

      setLoading(true)

      const { data: inspection } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single()

      if (inspection) {
        setStatus(inspection.status || 'draft')
        setClientName(inspection.client_name || '')
        setObjectName(inspection.object_name || '')
        setAdvisorName(inspection.advisor_name || '')

        if (inspection.client_name) {
          const { data: clientRow } = await supabase
            .from('klijenti')
            .select('id')
            .eq('naziv', inspection.client_name)
            .limit(1)
            .maybeSingle()

          setClientPageId(clientRow?.id || '')
        }

        const rawDate = inspection.inspection_date || inspection.created_at

        if (rawDate) {
          const date = new Date(rawDate)
          setInspectionDate(
            `${String(date.getDate()).padStart(2, '0')}.${String(
              date.getMonth() + 1
            ).padStart(2, '0')}.${date.getFullYear()}`
          )
        }
      }

      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('id, title, description')
        .order('sort_order', { ascending: true })

      const { data: answersData } = await supabase
        .from('inspection_answers')
        .select('checklist_item_id, answer, comment')
        .eq('inspection_id', inspectionId)

      const answersMap: Record<string, string> = {}
      const commentsMap: Record<string, string> = {}

      ;(answersData as AnswerRow[] | null)?.forEach((row) => {
        if (row.answer) {
          answersMap[row.checklist_item_id] = row.answer
        }

        commentsMap[row.checklist_item_id] = row.comment || ''
      })

      setItems((itemsData || []) as ChecklistItem[])
      setAnswers(answersMap)
      setComments(commentsMap)

      await loadPhotos()
      setLoading(false)
    }

    fetchData()

    return () => {
      Object.values(commentTimeouts.current).forEach(clearTimeout)
    }
  }, [inspectionId])

  const unansweredCount = useMemo(() => {
    return items.filter((item) => !answers[item.id]).length
  }, [items, answers])

  const allAnswered = items.length > 0 && unansweredCount === 0

  const pdfPhotoUrls = useMemo(() => {
    return photos
      .map((photo) =>
        photo.file_path
          ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${photo.file_path}`
          : ''
      )
      .filter(Boolean)
  }, [photos])

  const pdfItems = useMemo(() => {
    return items.map((item) => ({
      question: item.title || 'Pitanje',
      answer: answers[item.id] === 'da' ? 'DA' : answers[item.id] === 'ne' ? 'NE' : '',
      comment: comments[item.id] || '',
    }))
  }, [items, answers, comments])

  const handleAnswer = async (itemId: string, value: 'da' | 'ne') => {
    if (status === 'completed') return

    setSavingItemId(itemId)
    setErrorMessage('')
    setSuccessMessage('')

    const currentComment = comments[itemId] || ''
    setAnswers((prev) => ({ ...prev, [itemId]: value }))

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
      setErrorMessage(data?.error || 'Greška pri snimanju odgovora.')
    }

    setSavingItemId(null)
  }

  const saveComment = async (itemId: string, value: string) => {
    if (status === 'completed') return

    setSavingCommentId(itemId)

    await fetch('/api/inspection-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspection_id: inspectionId,
        checklist_item_id: itemId,
        answer: answers[itemId] || undefined,
        comment: value,
      }),
    })

    setSavingCommentId(null)
  }

  const handleCommentChange = (itemId: string, value: string) => {
    if (status === 'completed') return

    setComments((prev) => ({ ...prev, [itemId]: value }))

    if (commentTimeouts.current[itemId]) {
      clearTimeout(commentTimeouts.current[itemId])
    }

    commentTimeouts.current[itemId] = setTimeout(() => {
      saveComment(itemId, value)
    }, 700)
  }

  const saveInspection = async () => {
    if (!allAnswered) {
      setErrorMessage(`Nije moguće snimiti kontrolu. Neodgovorena pitanja: ${unansweredCount}.`)
      return
    }

    setFinishing(true)

    const res = await fetch('/api/inspection-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection_id: inspectionId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMessage(data?.error || 'Greška pri snimanju kontrole.')
    } else {
      setStatus('completed')
      setSuccessMessage('Kontrola je uspešno sačuvana.')
    }

    setFinishing(false)
  }

  const sendInspectionEmail = async () => {
    if (!recipientEmail) {
      setErrorMessage('Unesi email primaoca.')
      return
    }

    setSendingEmail(true)
    setErrorMessage('')
    setSuccessMessage('')

    const res = await fetch('/api/send-inspection-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspection_id: inspectionId,
        to: recipientEmail,
        items: pdfItems,
        photos: pdfPhotoUrls,
        companyName: clientName,
        employerName: clientName,
        advisorName,
        inspectionDate,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMessage(data?.error || 'Greška pri slanju emaila.')
    } else {
      setSuccessMessage(data?.message || 'Email je uspešno poslat.')
    }

    setSendingEmail(false)
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Učitavanje...</div>
  }

  return (
    <>
      <div style={{ padding: 20, paddingBottom: status === 'draft' ? 120 : 20, maxWidth: 1000 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/poslodavci">← Nazad na poslodavce</Link>

          {clientPageId ? (
            <Link href={`/dashboard/poslodavci/${clientPageId}`}>
              ← Nazad na kontrole
            </Link>
          ) : null}
        </div>

        <h1>Kontrolna lista</h1>

        {clientName ? <p>Poslodavac: <b>{clientName}</b></p> : null}
        {objectName ? <p>Objekat: <b>{objectName}</b></p> : null}
        {advisorName ? <p>Savetnik: <b>{advisorName}</b></p> : null}
        {inspectionDate ? <p>Datum: <b>{inspectionDate}</b></p> : null}

        <p>Status: <b>{status === 'completed' ? 'SAČUVANA' : 'U TOKU'}</b></p>

        {errorMessage ? (
          <div style={{ marginBottom: 16, padding: 14, backgroundColor: '#ffe5e5', color: '#900', borderRadius: 10 }}>
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div style={{ marginBottom: 16, padding: 14, backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 10 }}>
            ✅ {successMessage}
          </div>
        ) : null}

        {items.map((item, index) => {
          const currentAnswer = answers[item.id]
          const currentComment = comments[item.id] || ''

          return (
            <div
              key={item.id}
              style={{
                marginBottom: 20,
                padding: 20,
                border: '1px solid #ddd',
                borderRadius: 12,
                backgroundColor:
                  currentAnswer === 'ne'
                    ? '#ffe5e5'
                    : currentAnswer === 'da'
                      ? '#e6ffe6'
                      : '#fff',
              }}
            >
              <p style={{ fontSize: 20, marginBottom: 12 }}>
                <b>{index + 1}.</b> {item.title}
              </p>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <button
                  onClick={() => handleAnswer(item.id, 'da')}
                  disabled={status === 'completed' || savingItemId === item.id}
                  style={{
                    flex: 1,
                    padding: 18,
                    fontSize: 20,
                    fontWeight: 'bold',
                    borderRadius: 12,
                    backgroundColor: currentAnswer === 'da' ? '#16a34a' : '#fff',
                    color: currentAnswer === 'da' ? '#fff' : '#111',
                    border: '2px solid #16a34a',
                  }}
                >
                  DA
                </button>

                <button
                  onClick={() => handleAnswer(item.id, 'ne')}
                  disabled={status === 'completed' || savingItemId === item.id}
                  style={{
                    flex: 1,
                    padding: 18,
                    fontSize: 20,
                    fontWeight: 'bold',
                    borderRadius: 12,
                    backgroundColor: currentAnswer === 'ne' ? '#dc2626' : '#fff',
                    color: currentAnswer === 'ne' ? '#fff' : '#111',
                    border: '2px solid #dc2626',
                  }}
                >
                  NE
                </button>
              </div>

              <textarea
                value={currentComment}
                disabled={status === 'completed'}
                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                placeholder="Komentar..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 16,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  boxSizing: 'border-box',
                }}
              />

              {savingCommentId === item.id ? (
                <div style={{ marginTop: 6, fontSize: 14 }}>Snimanje komentara...</div>
              ) : null}
            </div>
          )
        })}

        <div style={{ marginTop: 20 }}>
          <PDFDownloadLink
            document={
              <InspectionPdf
                title="DNEVNA BZR KONTROLNA LISTA"
                items={pdfItems}
                companyName={clientName}
                employerName={clientName}
                advisorName={advisorName}
                inspectionDate={inspectionDate}
                photos={pdfPhotoUrls}
              />
            }
            fileName="kontrolna_lista.pdf"
          >
            {({ loading }) => (
              <button
                style={{
                  padding: '14px 22px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'Priprema PDF...' : 'Preuzmi PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>

        <PhotoUpload inspectionId={inspectionId} onUploaded={loadPhotos} />

        <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h3>Fotografije</h3>

          <button
            onClick={loadPhotos}
            type="button"
            style={{
              padding: '12px 16px',
              backgroundColor: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            Osveži fotografije
          </button>

          {loadingPhotos ? (
            <p>Učitavanje fotografija...</p>
          ) : photos.length === 0 ? (
            <p>Nema dodatih fotografija.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {photos.map((photo) => {
                const imageUrl = photo.file_path
                  ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${photo.file_path}`
                  : ''

                return (
                  <div key={photo.id}>
                    <a href={imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={imageUrl}
                        alt="Fotografija kontrole"
                        style={{
                          width: 220,
                          height: 160,
                          objectFit: 'cover',
                          borderRadius: 10,
                          border: '1px solid #ccc',
                          display: 'block',
                        }}
                      />
                    </a>

                    <a
                      href={imageUrl}
                      download
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '8px 12px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 'bold',
                        textDecoration: 'none',
                      }}
                    >
                      Preuzmi fotografiju
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h3>Pošalji PDF mailom</h3>

          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Email primaoca"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ccc',
              marginBottom: 12,
              fontSize: 16,
            }}
          />

          <button
            onClick={sendInspectionEmail}
            disabled={sendingEmail}
            style={{
              padding: '14px 22px',
              backgroundColor: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {sendingEmail ? 'Slanje...' : 'Pošalji PDF mailom'}
          </button>
        </div>
      </div>

      {status === 'draft' ? (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #ddd',
            padding: 14,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <button
            onClick={saveInspection}
            disabled={!allAnswered || finishing}
            style={{
              width: '100%',
              padding: 18,
              fontSize: 20,
              fontWeight: 'bold',
              backgroundColor: !allAnswered || finishing ? '#999' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 14,
            }}
          >
            {finishing ? 'Snimanje...' : 'Snimi kontrolu'}
          </button>
        </div>
      ) : null}
    </>
  )
}