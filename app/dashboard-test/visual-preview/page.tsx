
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const TASKS = [
  'Navesti opasnosti i štetnosti koje su prisutne u prikazanoj radnoj situaciji.',
  'Navesti koje je mere bezbednosti i zdravlja na radu zaposleni primenio.',
  'Navesti koje mere bezbednosti i zdravlja na radu nisu primenjene, a trebalo ih je primeniti u prikazanoj radnoj situaciji.'
]

type PageProps = {
  searchParams: Promise<{ poster?: string }>
}

export default async function VisualPreviewPage({
  searchParams
}: PageProps) {
  // Probna stranica je dostupna samo lokalno.
  // Za produkciju je potrebna prava provera korisnicke sesije.
  const requestHeaders = await headers()
  const host = requestHeaders.get('host') || ''

  if (
    host !== 'localhost:3000' &&
    host !== '127.0.0.1:3000'
  ) {
    notFound()
  }

  const params = await searchParams
  const poster = params.poster || 'RPD-V01'

  if (!/^RPD-V(0[1-9]|1[0-9]|20)$/.test(poster)) {
    notFound()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return <p>Nedostaje Supabase konfiguracija.</p>
  }

  const supabase = createClient(url, key)

  const { data: question, error: questionError } =
    await supabase
      .from('training_questions')
      .select('id, notes')
      .eq('notes', poster)
      .eq('active', true)
      .maybeSingle()

  if (questionError || !question) {
    notFound()
  }

  const { data: photo, error: photoError } =
    await supabase
      .from('training_visual_photos')
      .select('storage_path')
      .eq('training_question_id', question.id)
      .maybeSingle()

  if (photoError || !photo) {
    return <p>Fotografija nije pronađena.</p>
  }

  const imageUrl = supabase.storage
    .from('training-question-media')
    .getPublicUrl(photo.storage_path).data.publicUrl

  return (
    <main className="visual-preview">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        .visual-preview {
          width: 100%;
          max-width: 190mm;
          margin: 20px auto;
          padding-left: 20mm;
          padding-right: 15mm;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          letter-spacing: -0.2px;
        }

        .visual-preview h1 {
          display: block;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          margin: 0 0 8px 0;
          padding-top: 15mm;
          padding-bottom: 2mm;
          line-height: 1.3;
          letter-spacing: 0;
          color: #000;
        }

        .visual-photo {
          display: block;
          width: 67%;
          max-height: 57mm;
          height: auto;
          object-fit: contain;
          margin: 0 auto 8px;
        }

        .visual-instruction {
          font-size: 10pt;
          font-weight: bold;
          margin: 8px 0 10px;
        }

        .visual-task {
          margin-bottom: 11px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .visual-task-title {
          font-size: 10pt;
          font-weight: 600;
          line-height: 1.25;
          margin-bottom: 3px;
        }

        .answer-line {
          height: 5mm;
          border-bottom: 1px solid #888;
          margin-bottom: 1mm;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          .visual-preview {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding-left: 20mm !important;
            padding-right: 15mm !important;
            box-sizing: border-box !important;
          }

          .visual-task {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .answer-line {
            border-bottom: 1px solid #777 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <h1>INPRO BZR MASTER – {question.notes}</h1>

      <img
        src={imageUrl}
        alt={`Radna situacija ${question.notes}`}
        className="visual-photo"
      />

      <div className="visual-instruction">
        Na osnovu prikazane slike odgovoriti na sledeća pitanja:
      </div>

      {TASKS.map((task, index) => (
        <section key={index} className="visual-task">
          <div className="visual-task-title">
            {index + 1}. {task}
          </div>

          {[1, 2, 3].map((line) => (
            <div key={line} className="answer-line" />
          ))}
        </section>
      ))}
    </main>
  )
}
