'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'

type ChecklistItem = {
  id: string
  title: string
}

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string

  const supabase = createClient()

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')
        .order('sort_order')

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

      setItems(itemsData || [])
      setAnswers(a)
      setComments(c)
      setLoading(false)
    }

    fetchData()
  }, [inspectionId])

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

  if (loading) return <div style={{ padding: 20 }}>Učitavanje...</div>

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <Link href="/dashboard/poslodavci">← Nazad</Link>

      <h1 style={{ marginTop: 10 }}>Kontrolna lista</h1>

      {items.map((item, index) => {
        const currentAnswer = answers[item.id]
        const currentComment = comments[item.id] || ''

        return (
          <div
            key={item.id}
            style={{
              marginBottom: 20,
              padding: 15,
              border: '1px solid #ddd',
              borderRadius: 10,
              backgroundColor:
                currentAnswer === 'ne'
                  ? '#ffe5e5'
                  : currentAnswer === 'da'
                  ? '#e6ffe6'
                  : '#fff',
            }}
          >
            <p style={{ marginBottom: 10, fontSize: 16 }}>
              <b>{index + 1}.</b> {item.title}
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button
                onClick={() =>
                  setAnswers((p) => ({ ...p, [item.id]: 'da' }))
                }
                style={{
                  padding: '12px 24px',
                  backgroundColor:
                    currentAnswer === 'da' ? 'green' : '#eee',
                  color: currentAnswer === 'da' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                DA
              </button>

              <button
                onClick={() =>
                  setAnswers((p) => ({ ...p, [item.id]: 'ne' }))
                }
                style={{
                  padding: '12px 24px',
                  backgroundColor:
                    currentAnswer === 'ne' ? 'red' : '#eee',
                  color: currentAnswer === 'ne' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                NE
              </button>
            </div>

            <textarea
              placeholder="Komentar..."
              value={currentComment}
              onChange={(e) =>
                setComments((p) => ({
                  ...p,
                  [item.id]: e.target.value,
                }))
              }
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #ccc',
              }}
            />
          </div>
        )
      })}

      <div style={{ marginTop: 20 }}>
        <PDFDownloadLink
          document={
            <InspectionPdf
              title="DNEVNA BZR KONTROLNA LISTA"
              items={pdfItems}
              companyName=""
              employerName=""
              advisorName=""
              inspectionDate=""
              photos={[]}
            />
          }
          fileName="kontrola.pdf"
        >
          {({ loading }) => (
            <button
              style={{
                padding: '12px 20px',
                backgroundColor: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              {loading ? 'PDF...' : 'Preuzmi PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  )
}