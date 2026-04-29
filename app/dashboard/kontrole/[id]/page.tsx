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

  const commentTimeouts = useRef<any>({})

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

        const d = new Date(inspection.inspection_date || inspection.created_at)
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
    clearTimeout(timeout as ReturnType<typeof setTimeout>)
  })
}
  }, [inspectionId])

  const pdfPhotoUrls = useMemo(() => {
    return photos.map((p) => getImageUrl(p.file_path || p.file_url)).filter(Boolean)
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

  const handleAnswer = async (id: string, value: 'da' | 'ne') => {
    if (status === 'completed') return

    setAnswers((prev) => ({ ...prev, [id]: value }))

    await fetch('/api/inspection-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspection_id: inspectionId,
        checklist_item_id: id,
        answer: value,
        comment: comments[id] || '',
      }),
    })
  }

  const handleComment = (id: string, value: string) => {
    if (status === 'completed') return

    setComments((prev) => ({ ...prev, [id]: value }))

    clearTimeout(commentTimeouts.current[id])

    commentTimeouts.current[id] = setTimeout(async () => {
      await fetch('/api/inspection-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_id: inspectionId,
          checklist_item_id: id,
          answer: answers[id],
          comment: value,
        }),
      })
    }, 600)
  }

  const sendEmail = async () => {
    setEmailMessage('')
    setEmailError('')

    if (!recipientEmail) {
      const msg = '❌ Email nije poslat: unesi email primaoca.'
      setEmailError(msg)
      alert(msg)
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
        const msg = `❌ Email nije poslat: ${data?.error || 'nepoznata greška.'}`
        setEmailError(msg)
        alert(msg)
        return
      }

      const newHistory = [
        recipientEmail,
        ...emailHistory.filter((e) => e !== recipientEmail),
      ].slice(0, 10)

      setEmailHistory(newHistory)
      localStorage.setItem('daily_email_history', JSON.stringify(newHistory))

      const msg = data?.message || '✅ Email je uspešno poslat.'
      setEmailMessage(`✅ ${msg.replace('✅', '').trim()}`)
      alert('✅ Email je uspešno poslat.')
    } catch (err: any) {
      const msg = `❌ Email nije poslat: ${err?.message || 'greška.'}`
      setEmailError(msg)
      alert(msg)
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Učitavanje...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 950, margin: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard/poslodavci">← Nazad na poslodavce</Link>
      </div>

      <h1>Kontrolna lista</h1>
      <div style={{ padding: 12, backgroundColor: 'yellow', marginBottom: 20 }}>
  TEST NOVI KOD 29.04.
</div>

      <div
        style={{
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 12,
          backgroundColor: '#fafafa',
          marginBottom: 20,
        }}
      >
        <p>
          Poslodavac: <b>{clientName || '-'}</b>
        </p>
        <p>
          Objekat: <b>{objectName || '-'}</b>
        </p>
        <p>
          Savetnik: <b>{advisorName || '-'}</b>
        </p>
        <p>
          Datum: <b>{inspectionDate || '-'}</b>
        </p>
        <p>
          Status: <b>{status === 'completed' ? 'SAČUVANA' : 'U TOKU'}</b>
        </p>
      </div>

      {items.map((item, i) => {
        const ans = answers[item.id]

        return (
          <div
            key={item.id}
            style={{
              marginBottom: 20,
              padding: 18,
              borderRadius: 14,
              backgroundColor:
                ans === 'da' ? '#e6ffe6' : ans === 'ne' ? '#ffe5e5' : '#fff',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              border: '1px solid #ddd',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 12 }}>
              <b>{i + 1}.</b> {item.title}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button
                onClick={() => handleAnswer(item.id, 'da')}
                disabled={status === 'completed'}
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 18,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  border: '2px solid #16a34a',
                  backgroundColor: ans === 'da' ? '#16a34a' : '#fff',
                  color: ans === 'da' ? '#fff' : '#111',
                }}
              >
                DA
              </button>

              <button
                onClick={() => handleAnswer(item.id, 'ne')}
                disabled={status === 'completed'}
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 18,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  border: '2px solid #dc2626',
                  backgroundColor: ans === 'ne' ? '#dc2626' : '#fff',
                  color: ans === 'ne' ? '#fff' : '#111',
                }}
              >
                NE
              </button>
            </div>

            <textarea
              value={comments[item.id] || ''}
              onChange={(e) => handleComment(item.id, e.target.value)}
              disabled={status === 'completed'}
              placeholder="Komentar..."
              rows={4}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )
      })}

      <div style={{ marginTop: 24 }}>
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
          fileName="dnevna_kontrola.pdf"
        >
          {({ loading }) => (
            <button
              style={{
                width: '100%',
                padding: 16,
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 17,
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Priprema PDF...' : 'Preuzmi PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <PhotoUpload inspectionId={inspectionId} onUploaded={loadPhotos} />

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 12,
        }}
      >
        <h3>Fotografije</h3>

        <button
          onClick={loadPhotos}
          type="button"
          style={{
            padding: '10px 14px',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: 8,
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {photos.map((photo) => {
              const url = getImageUrl(photo.file_path || photo.file_url)

              return (
                <div key={photo.id}>
                  <a href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt="Fotografija kontrole"
                      style={{
                        width: 190,
                        height: 140,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid #ccc',
                        display: 'block',
                      }}
                    />
                  </a>

                  <a
                    href={url}
                    download
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '8px 12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: 14,
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
          marginTop: 30,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 12,
          backgroundColor: '#fafafa',
        }}
      >
        <h3>Pošalji PDF mailom</h3>

        <select
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
            border: '1px solid #ccc',
            fontSize: 16,
          }}
        >
          <option value="">Izaberi ranije korišćen email...</option>
          {emailHistory.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>

        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Ili unesi novi email"
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
            border: '1px solid #ccc',
            fontSize: 16,
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={sendEmail}
          disabled={sendingEmail}
          style={{
            width: '100%',
            padding: 16,
            backgroundColor: sendingEmail ? '#6b7280' : '#111827',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 17,
            fontWeight: 'bold',
          }}
        >
          {sendingEmail ? 'Slanje...' : 'Pošalji PDF mailom'}
        </button>

        {emailMessage ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: 10,
              fontWeight: 'bold',
            }}
          >
            {emailMessage}
          </div>
        ) : null}

        {emailError ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: 10,
              fontWeight: 'bold',
            }}
          >
            {emailError}
          </div>
        ) : null}
      </div>
    </div>
  )
}