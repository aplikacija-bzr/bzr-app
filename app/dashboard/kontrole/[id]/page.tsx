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
  const [recipientEmail, setRecipientEmail] = useState('')

  const commentTimeouts = useRef<any>({})

  const getImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  }

  useEffect(() => {
    const load = async () => {
      const { data: inspection } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single()

      if (inspection) {
        setStatus(inspection.status)
        setClientName(inspection.client_name || '')
        setObjectName(inspection.object_name || '')
        setAdvisorName(inspection.advisor_name || '')

        const d = new Date(inspection.inspection_date || inspection.created_at)
        setInspectionDate(
          `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
        )
      }

      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')
        .order('sort_order')

      const { data: answersData } = await supabase
        .from('inspection_answers')
        .select('*')
        .eq('inspection_id', inspectionId)

      const { data: photosData } = await supabase
        .from('inspection_photos')
        .select('*')
        .eq('inspection_id', inspectionId)

      const a: any = {}
      const c: any = {}

      answersData?.forEach((row: any) => {
        if (row.answer) a[row.checklist_item_id] = row.answer
        c[row.checklist_item_id] = row.comment || ''
      })

      setItems(itemsData || [])
      setAnswers(a)
      setComments(c)
      setPhotos(photosData || [])
      setLoading(false)
    }

    load()
  }, [inspectionId])

  const pdfPhotoUrls = useMemo(
    () => photos.map((p) => getImageUrl(p.file_path)).filter(Boolean),
    [photos]
  )

  const pdfItems = useMemo(
    () =>
      items.map((item) => ({
        question: item.title,
        answer:
          answers[item.id] === 'da'
            ? 'DA'
            : answers[item.id] === 'ne'
            ? 'NE'
            : '',
        comment: comments[item.id] || '',
      })),
    [items, answers, comments]
  )

  const handleAnswer = async (id: string, value: 'da' | 'ne') => {
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
    setComments((p) => ({ ...p, [id]: value }))

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
    }, 500)
  }

  if (loading) return <div style={{ padding: 20 }}>Učitavanje...</div>

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <Link href="/dashboard/poslodavci">← Nazad</Link>

      <h1 style={{ marginTop: 10 }}>Kontrola</h1>

      <div style={{ marginBottom: 20 }}>
        <b>{clientName}</b> | {objectName} <br />
        {advisorName} | {inspectionDate}
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
              background:
                ans === 'da' ? '#e6ffe6' : ans === 'ne' ? '#ffe5e5' : '#fff',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 10 }}>
              <b>{i + 1}.</b> {item.title}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleAnswer(item.id, 'da')}
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 18,
                  borderRadius: 10,
                  background: ans === 'da' ? '#16a34a' : '#fff',
                  color: ans === 'da' ? '#fff' : '#000',
                  border: '2px solid green',
                }}
              >
                DA
              </button>

              <button
                onClick={() => handleAnswer(item.id, 'ne')}
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 18,
                  borderRadius: 10,
                  background: ans === 'ne' ? '#dc2626' : '#fff',
                  color: ans === 'ne' ? '#fff' : '#000',
                  border: '2px solid red',
                }}
              >
                NE
              </button>
            </div>

            <textarea
              placeholder="Komentar..."
              value={comments[item.id] || ''}
              onChange={(e) => handleComment(item.id, e.target.value)}
              style={{
                width: '100%',
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
              }}
            />
          </div>
        )
      })}

      {/* PDF */}
      <PDFDownloadLink
        document={
          <InspectionPdf
            items={pdfItems}
            companyName={clientName}
            employerName={clientName}
            advisorName={advisorName}
            inspectionDate={inspectionDate}
            photos={pdfPhotoUrls}
          />
        }
        fileName="kontrola.pdf"
      >
        {({ loading }) => (
          <button
            style={{
              width: '100%',
              padding: 18,
              fontSize: 18,
              marginTop: 20,
              background: '#2563eb',
              color: '#fff',
              borderRadius: 12,
              border: 'none',
            }}
          >
            {loading ? 'Generisanje...' : 'Preuzmi PDF'}
          </button>
        )}
      </PDFDownloadLink>

      {/* slike */}
      <h3 style={{ marginTop: 30 }}>Fotografije</h3>

      <PhotoUpload inspectionId={inspectionId} onUploaded={() => location.reload()} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {photos.map((p) => {
          const url = getImageUrl(p.file_path)

          return (
            <a key={p.id} href={url} target="_blank">
              <img
                src={url}
                style={{
                  width: 160,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 10,
                }}
              />
            </a>
          )
        })}
      </div>

      {/* email */}
      <div style={{ marginTop: 30 }}>
        <input
          placeholder="Email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
          }}
        />

        <button
          onClick={async () => {
            await fetch('/api/send-inspection-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inspection_id: inspectionId,
                to: recipientEmail,
                items: pdfItems,
                photos: pdfPhotoUrls,
                companyName: clientName,
                advisorName,
                inspectionDate,
              }),
            })

            alert('Poslato')
          }}
          style={{
            width: '100%',
            padding: 16,
            background: '#111827',
            color: '#fff',
            borderRadius: 10,
          }}
        >
          Pošalji PDF
        </button>
      </div>
    </div>
  )
}