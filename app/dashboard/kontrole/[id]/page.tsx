'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'
import PhotoUpload from '@/app/components/inspection/PhotoUpload'

const BUCKET = 'inspection-images'
const SUPABASE_URL = 'https://awvrwilxbvibzyegwila.supabase.co'

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string
  const supabase = createClient()

  const [items, setItems] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'draft' | 'completed'>('draft')
  const [loading, setLoading] = useState(true)

  const [clientName, setClientName] = useState('')
  const [objectName, setObjectName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')

  const [photos, setPhotos] = useState<any[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailHistory, setEmailHistory] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const commentTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const getImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  }

  const loadPhotos = async () => {
    setLoadingPhotos(true)

    const { data } = await supabase
      .from('inspection_photos')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false })

    setPhotos(data || [])
    setLoadingPhotos(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('daily_email_history')

    if (saved) {
      try {
        setEmailHistory(JSON.parse(saved))
      } catch {
        setEmailHistory([])
      }
    }
  }, [])

  useEffect(() => {
    const load = async () => {
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

        const d = new Date(
          inspection.inspection_date || inspection.created_at
        )

        setInspectionDate(
          `${String(d.getDate()).padStart(2, '0')}.${String(
            d.getMonth() + 1
          ).padStart(2, '0')}.${d.getFullYear()}`
        )
      }

      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')
        .order('sort_order', { ascending: true })

      const { data: answersData } = await supabase
        .from('inspection_answers')
        .select('*')
        .eq('inspection_id', inspectionId)

      const a: Record<string, string> = {}
      const c: Record<string, string> = {}

      answersData?.forEach((row: any) => {
        if (row.answer) a[row.checklist_item_id] = row.answer
        c[row.checklist_item_id] = row.comment || ''
      })

      setItems(itemsData || [])
      setAnswers(a)
      setComments(c)

      await loadPhotos()
      setLoading(false)
    }

    if (inspectionId) load()

    return () => {
      Object.values(commentTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout)
      })
    }
  }, [inspectionId])

  const unansweredCount = items.filter(
    (item) => !answers[item.id]
  ).length

  const allAnswered =
    items.length > 0 && unansweredCount === 0

  const pdfPhotoUrls = useMemo(() => {
    return photos
      .map((p) => getImageUrl(p.file_path || p.file_url))
      .filter(Boolean)
  }, [photos])

  const pdfItems = useMemo(() => {
    return items.map((item) => ({
      question: item.title || 'Pitanje',
      answer:
        answers[item.id] === 'da'
          ? 'DA'
          : answers[item.id] === 'ne'
          ? 'NE'
          : '',
      comment: comments[item.id] || '',
    }))
  }, [items, answers, comments])

  const handleAnswer = async (
    id: string,
    value: 'da' | 'ne'
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }))

    await fetch('/api/inspection-answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspection_id: inspectionId,
        checklist_item_id: id,
        answer: value,
        comment: comments[id] || '',
      }),
    })
  }

  const handleComment = (
    id: string,
    value: string
  ) => {
    setComments((prev) => ({
      ...prev,
      [id]: value,
    }))

    clearTimeout(commentTimeouts.current[id])

    commentTimeouts.current[id] = setTimeout(async () => {
      await fetch('/api/inspection-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspection_id: inspectionId,
          checklist_item_id: id,
          answer: answers[id],
          comment: value,
        }),
      })
    }, 600)
  }
    const saveInspection = async () => {
    setSaveMessage('')
    setSaveError('')

    if (!allAnswered) {
      setSaveError(
        `Nisu sva pitanja odgovorena (${unansweredCount}).`
      )
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/inspection-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspection_id: inspectionId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(
          data?.error || 'Greška pri snimanju kontrole.'
        )
      } else {
        setSaveMessage(
          'Kontrola je uspešno sačuvana.'
        )
        setStatus('completed')
      }
    } catch (err: any) {
      setSaveError(
        err?.message || 'Greška pri snimanju kontrole.'
      )
    } finally {
      setSaving(false)
    }
  }

  const sendEmail = async () => {
    setEmailMessage('')
    setEmailError('')

    if (!recipientEmail) {
      setEmailError(
        'Email nije poslat: unesi email primaoca.'
      )
      return
    }

    setSendingEmail(true)

    try {
      const res = await fetch(
        '/api/send-inspection-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setEmailError(
          `Email nije poslat: ${
            data?.error || 'nepoznata greška.'
          }`
        )
        return
      }

      const newHistory = [
        recipientEmail,
        ...emailHistory.filter(
          (e) => e !== recipientEmail
        ),
      ].slice(0, 80)

      setEmailHistory(newHistory)

      localStorage.setItem(
        'daily_email_history',
        JSON.stringify(newHistory)
      )

      setEmailMessage('Email je uspešno poslat.')
    } catch (err: any) {
      setEmailError(
        `Email nije poslat: ${
          err?.message || 'greška.'
        }`
      )
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          fontSize: 22,
        }}
      >
        Učitavanje...
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        paddingBottom: 170,
        maxWidth: 950,
        margin: 'auto',
        backgroundColor: '#f8fafc',
        color: '#111827',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/dashboard/poslodavci"
          style={{
            display: 'inline-block',
            padding: '10px 14px',
            border: '2px solid #111827',
            borderRadius: 10,
            color: '#111827',
            textDecoration: 'none',
            fontWeight: 'bold',
            backgroundColor: '#ffffff',
          }}
        >
          ← Nazad na poslodavce
        </Link>
      </div>

      <h1
        style={{
          marginBottom: 16,
          fontSize: 30,
          color: '#111827',
        }}
      >
        Kontrolna lista
      </h1>

      {items.map((item, i) => {
        const ans = answers[item.id]

        return (
          <div
            key={item.id}
            style={{
              marginBottom: 22,
              padding: 20,
              borderRadius: 16,
              backgroundColor:
                ans === 'da'
                  ? '#ffffff'
                  : ans === 'ne'
                  ? '#fff7f7'
                  : '#ffffff',
              boxShadow:
                '0 4px 12px rgba(0,0,0,0.12)',
              border:
                ans === 'da'
                  ? '3px solid #16a34a'
                  : ans === 'ne'
                  ? '3px solid #dc2626'
                  : '3px solid #94a3b8',
            }}
          >
            <div
              style={{
                fontSize: 23,
                marginBottom: 16,
                color: '#111827',
                fontWeight: 800,
                lineHeight: 1.35,
              }}
            >
              <b>{i + 1}.</b> {item.title}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <button
                onClick={() =>
                  handleAnswer(item.id, 'da')
                }
                style={{
                  flex: 1,
                  padding: 20,
                  fontSize: 22,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  border: '3px solid #15803d',
                  backgroundColor:
                    ans === 'da'
                      ? '#16a34a'
                      : '#ffffff',
                  color:
                    ans === 'da'
                      ? '#ffffff'
                      : '#111827',
                }}
              >
                DA
              </button>

              <button
                onClick={() =>
                  handleAnswer(item.id, 'ne')
                }
                style={{
                  flex: 1,
                  padding: 20,
                  fontSize: 22,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  border: '3px solid #b91c1c',
                  backgroundColor:
                    ans === 'ne'
                      ? '#dc2626'
                      : '#ffffff',
                  color:
                    ans === 'ne'
                      ? '#ffffff'
                      : '#111827',
                }}
              >
                NE
              </button>
            </div>

            <textarea
              value={comments[item.id] || ''}
              onChange={(e) =>
                handleComment(item.id, e.target.value)
              }
              placeholder="Komentar..."
              rows={4}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 12,
                border: '3px solid #64748b',
                fontSize: 20,
                color: '#111827',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )
      })}

      <PhotoUpload
        inspectionId={inspectionId}
        onUploaded={loadPhotos}
      />

      <div
        style={{
          marginTop: 24,
          padding: 18,
          border: '2px solid #cbd5e1',
          borderRadius: 14,
          backgroundColor: '#ffffff',
        }}
      >
        <h3
          style={{
            fontSize: 24,
            color: '#111827',
          }}
        >
          Fotografije
        </h3>

        {loadingPhotos ? (
          <p>Učitavanje fotografija...</p>
        ) : photos.length === 0 ? (
          <p>Nema dodatih fotografija.</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {photos.map((photo) => {
              const url = getImageUrl(
                photo.file_path || photo.file_url
              )

              return (
                <div
                  key={photo.id}
                  style={{ width: 210 }}
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={url}
                      alt="Fotografija"
                      style={{
                        width: 210,
                        height: 155,
                        objectFit: 'cover',
                        borderRadius: 12,
                        border:
                          '2px solid #64748b',
                      }}
                    />
                  </a>

                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      marginTop: 8,
                      padding: '10px 12px',
                      backgroundColor:
                        '#2563eb',
                      color: 'white',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 'bold',
                      textAlign: 'center',
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
            <div
        style={{
          marginTop: 24,
          padding: 18,
          border: '2px solid #cbd5e1',
          borderRadius: 14,
          backgroundColor: '#ffffff',
        }}
      >
        <h3
          style={{
            fontSize: 24,
            color: '#111827',
          }}
        >
          Pošalji PDF mailom
        </h3>

        <select
          value={recipientEmail}
          onChange={(e) =>
            setRecipientEmail(e.target.value)
          }
          style={{
            width: '100%',
            padding: 14,
            marginBottom: 12,
            borderRadius: 12,
            border: '2px solid #64748b',
            fontSize: 18,
          }}
        >
          <option value="">
            Izaberi ranije korišćen email...
          </option>

          {emailHistory.map((email) => (
            <option
              key={email}
              value={email}
            >
              {email}
            </option>
          ))}
        </select>

        <input
          type="email"
          value={recipientEmail}
          onChange={(e) =>
            setRecipientEmail(e.target.value)
          }
          placeholder="Ili unesi novi email"
          style={{
            width: '100%',
            padding: 14,
            marginBottom: 12,
            borderRadius: 12,
            border: '2px solid #64748b',
            fontSize: 18,
          }}
        />

        <button
          onClick={sendEmail}
          disabled={sendingEmail}
          style={{
            width: '100%',
            padding: 18,
            backgroundColor:
              sendingEmail
                ? '#6b7280'
                : '#111827',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          {sendingEmail
            ? 'Slanje...'
            : 'Pošalji PDF mailom'}
        </button>

        {emailMessage && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: 12,
              fontWeight: 'bold',
              fontSize: 18,
            }}
          >
            ✅ {emailMessage}
          </div>
        )}

        {emailError && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: 12,
              fontWeight: 'bold',
              fontSize: 18,
            }}
          >
            ❌ {emailError}
          </div>
        )}
      </div>
    </div>
  )
}