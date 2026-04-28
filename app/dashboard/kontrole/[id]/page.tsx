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

type InspectionRow = {
  id: string
  status: InspectionStatus
  checklist_id?: string | null
  client_name?: string | null
  object_name?: string | null
  inspection_date?: string | null
  advisor_name?: string | null
  created_at?: string | null
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
  const rawId = params?.id
  const inspectionId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

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

  const commentTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!inspectionId) return

      const { data: inspection } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single()

      if (!inspection) return

      setStatus(inspection.status)
      setClientName(inspection.client_name || '')
      setObjectName(inspection.object_name || '')
      setAdvisorName(inspection.advisor_name || '')

      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')
        .order('sort_order')

      setItems(itemsData || [])

      const { data: answersData } = await supabase
        .from('inspection_answers')
        .select('*')
        .eq('inspection_id', inspectionId)

      const a: any = {}
      const c: any = {}

      answersData?.forEach((row: any) => {
        a[row.checklist_item_id] = row.answer
        c[row.checklist_item_id] = row.comment || ''
      })

      setAnswers(a)
      setComments(c)
      setLoading(false)
    }

    fetchData()
  }, [inspectionId])

  const pdfItems = useMemo(() => {
    return items.map((item) => ({
      question: item.title,
      answer: answers[item.id] === 'da' ? 'DA' : answers[item.id] === 'ne' ? 'NE' : '',
      comment: comments[item.id] || '',
    }))
  }, [items, answers, comments])

  if (loading) return <div>Učitavanje...</div>

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <Link href="/dashboard/poslodavci">← Nazad</Link>

      <h1>Kontrolna lista</h1>

      {items.map((item, index) => {
        const currentAnswer = answers[item.id]
        const currentComment = comments[item.id] || ''

        return (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <p>
              <b>{index + 1}.</b> {item.title}
            </p>

            <button onClick={() => setAnswers((p) => ({ ...p, [item.id]: 'da' }))}>
              DA
            </button>

            <button onClick={() => setAnswers((p) => ({ ...p, [item.id]: 'ne' }))}>
              NE
            </button>

            <textarea
              value={currentComment}
              onChange={(e) =>
                setComments((p) => ({ ...p, [item.id]: e.target.value }))
              }
            />
          </div>
        )
      })}

      <PDFDownloadLink
        document={
          <InspectionPdf
            title="DNEVNA BZR KONTROLNA LISTA"
            items={pdfItems}
            companyName={clientName}
            employerName={clientName}
            advisorName={advisorName}
            inspectionDate={inspectionDate}
            photos={[]}
          />
        }
        fileName="kontrola.pdf"
      >
        {({ loading }) => (loading ? 'PDF...' : 'Preuzmi PDF')}
      </PDFDownloadLink>
    </div>
  )
}