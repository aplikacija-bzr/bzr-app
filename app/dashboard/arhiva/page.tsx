'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { pdf } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'

type Inspection = {
  id: string
  client_name: string | null
  object_name: string | null
  advisor_name: string | null
  inspection_date: string | null
  status: string | null
}

export default function ArhivaPage() {
  const supabase = createClient()

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadArchive = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const start = `${month}-01`
    const d = new Date(start)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const end = nextMonth.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('inspections')
      .select(
        'id, client_name, object_name, advisor_name, inspection_date, status'
      )
      .gte('inspection_date', start)
      .lt('inspection_date', end)
      .order('inspection_date', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setInspections(data || [])
    setLoading(false)
  }

  const lockMonth = async () => {
    setError('')
    setMessage('')

    const start = `${month}-01`
    const d = new Date(start)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const end = nextMonth.toISOString().slice(0, 10)

    const { error } = await supabase
      .from('inspections')
      .update({ locked: true })
      .gte('inspection_date', start)
      .lt('inspection_date', end)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Mesec je uspešno zaključan.')
    }
  }

  const downloadZip = async () => {
    setError('')
    setMessage('Priprema ZIP fajla...')

    const start = `${month}-01`
    const d = new Date(start)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const end = nextMonth.toISOString().slice(0, 10)

    const { data: inspectionsData, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*')
      .gte('inspection_date', start)
      .lt('inspection_date', end)
      .order('inspection_date', { ascending: true })

    if (inspectionsError) {
      setError(inspectionsError.message)
      setMessage('')
      return
    }

    if (!inspectionsData || inspectionsData.length === 0) {
      setError('Nema podataka za ZIP.')
      setMessage('')
      return
    }

    const zip = new JSZip()

    for (const ins of inspectionsData) {
      const safeClient = cleanFileName(ins.client_name || 'poslodavac')
      const safeDate = ins.inspection_date || 'bez-datuma'
      const folderName = `${safeClient}-${safeDate}`
      const folder = zip.folder(folderName)

      const { data: answers } = await supabase
        .from('inspection_answers')
        .select('answer, comment, checklist_items(title)')
        .eq('inspection_id', ins.id)

      const pdfItems =
        answers?.map((row: any) => ({
          question: row.checklist_items?.title || 'Pitanje',
          answer:
            row.answer === 'da'
              ? 'DA'
              : row.answer === 'ne'
                ? 'NE'
                : '',
          comment: row.comment || '',
        })) || []

      const inspectionDate = ins.inspection_date
        ? formatDate(ins.inspection_date)
        : ''

      const pdfBlob = await pdf(
        <InspectionPdf
          title="DNEVNA BZR KONTROLNA LISTA"
          items={pdfItems}
          companyName={ins.client_name || ''}
          employerName={ins.client_name || ''}
          advisorName={ins.advisor_name || ''}
          inspectionDate={inspectionDate}
          photos={[]}
        />
      ).toBlob()

      folder?.file('dnevna_kontrola.pdf', pdfBlob)

      const { data: photos } = await supabase
        .from('inspection_photos')
        .select('*')
        .eq('inspection_id', ins.id)

      if (photos) {
        for (const photo of photos) {
          const url =
            photo.file_url ||
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-images/${photo.file_path}`

          try {
            const res = await fetch(url)
            const blob = await res.blob()
            const name = photo.file_path?.split('/').pop() || 'slika.jpg'
            folder?.file(name, blob)
          } catch (err) {
            console.log('Greška slika:', err)
          }
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `arhiva-${month}.zip`)

    setMessage('ZIP je spreman.')
  }

  return (
    <div style={{ padding: 30, maxWidth: 1000, margin: 'auto' }}>
      <h1>Arhiva kontrola</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            marginRight: 10,
          }}
        />

        <button
          onClick={loadArchive}
          disabled={loading}
          style={{
            padding: '12px 18px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            marginRight: 10,
          }}
        >
          {loading ? 'Učitavanje...' : 'Učitaj arhivu'}
        </button>

        <button
          onClick={lockMonth}
          style={{
            padding: '12px 18px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            marginRight: 10,
          }}
        >
          Zaključi mesec
        </button>

        <button
          onClick={downloadZip}
          style={{
            padding: '12px 18px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
          }}
        >
          Preuzmi ZIP
        </button>
      </div>

      {message && (
        <p style={{ color: 'green', fontWeight: 'bold' }}>✅ {message}</p>
      )}

      {error && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>❌ {error}</p>
      )}

      {!loading && inspections.length === 0 && (
        <p>Izaberi mesec i klikni „Učitaj arhivu”.</p>
      )}

      {inspections.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={thStyle}>Datum</th>
                <th style={thStyle}>Poslodavac</th>
                <th style={thStyle}>Objekat</th>
                <th style={thStyle}>Savetnik</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Akcija</th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={tdStyle}>
                    {inspection.inspection_date
                      ? formatDate(inspection.inspection_date)
                      : '-'}
                  </td>

                  <td style={tdStyle}>{inspection.client_name || '-'}</td>
                  <td style={tdStyle}>{inspection.object_name || '-'}</td>
                  <td style={tdStyle}>{inspection.advisor_name || '-'}</td>

                  <td style={tdStyle}>
                    {inspection.status === 'completed'
                      ? 'Sačuvana'
                      : 'U toku'}
                  </td>

                  <td style={tdStyle}>
                    <Link href={`/dashboard/kontrole/${inspection.id}`}>
                      Otvori
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}.`
}

function cleanFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .trim()
}

const thStyle = {
  padding: 12,
  border: '1px solid #ddd',
  textAlign: 'left' as const,
}

const tdStyle = {
  padding: 12,
  border: '1px solid #ddd',
}