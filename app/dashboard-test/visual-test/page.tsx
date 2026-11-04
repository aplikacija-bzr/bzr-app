
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const TASKS = [
  'Navesti opasnosti i štetnosti koje su prisutne u prikazanoj radnoj situaciji.',
  'Navesti koje je mere bezbednosti i zdravlja na radu zaposleni primenio.',
  'Navesti koje mere bezbednosti i zdravlja na radu nisu primenjene, a trebalo ih je primeniti u prikazanoj radnoj situaciji.'
]

const MODULES = {
  RPD: {
    label: 'Nezaštićeni rotirajući i pokretni delovi',
    count: 20,
    pattern: /^RPD-V(0[1-9]|1[0-9]|20)$/
  },
  VRG: {
    label: 'Građevinski radnik – visokogradnja',
    count: 25,
    pattern: /^VGR-OP-V(0[1-9]|1[0-9]|2[0-5])$/
  }
}

type ModuleCode = keyof typeof MODULES

type PageProps = {
  searchParams: Promise<{ modul?: string }>
}

type VisualQuestion = {
  id: string
  notes: string
}

type VisualPhoto = {
  training_question_id: string
  storage_path: string
}

export default async function VisualTestPage({
  searchParams
}: PageProps) {
  const requestHeaders = await headers()
  const host = requestHeaders.get('host') || ''

  // Privremena lokalna proba.
  // Host provera nije zamena za autentifikaciju.
  if (
    host !== 'localhost:3000' &&
    host !== '127.0.0.1:3000'
  ) {
    notFound()
  }

  const params = await searchParams
  const moduleCode = (
    params.modul || 'RPD'
  ).toUpperCase()

  if (!(moduleCode in MODULES)) {
    notFound()
  }

  const code = moduleCode as ModuleCode
  const config = MODULES[code]

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return <p>Nedostaje Supabase konfiguracija.</p>
  }

  const supabase = createClient(url, key)

  const prefix =
    code === 'RPD' ? 'RPD-V%' : 'VGR-OP-V%'

  const { data: questions, error: questionsError } =
    await supabase
      .from('training_questions')
      .select('id, notes')
      .like('notes', prefix)
      .eq('active', true)
      .order('notes')

  if (questionsError) {
    return <p>Greška: {questionsError.message}</p>
  }

  const selectedQuestions = (
    (questions || []) as VisualQuestion[]
  ).filter(q => config.pattern.test(q.notes))

  if (selectedQuestions.length !== config.count) {
    return (
      <p>
        Modul {code}: očekivano {config.count} pitanja,
        pronađeno {selectedQuestions.length}.
      </p>
    )
  }

  const questionIds = selectedQuestions.map(q => q.id)

  const { data: photos, error: photosError } =
    await supabase
      .from('training_visual_photos')
      .select('training_question_id, storage_path')
      .in('training_question_id', questionIds)

  if (photosError) {
    return <p>Greška: {photosError.message}</p>
  }

  const photoMap = new Map(
    ((photos || []) as VisualPhoto[]).map(
      p => [p.training_question_id, p.storage_path]
    )
  )

  const missing = selectedQuestions.filter(
    q => !photoMap.has(q.id)
  )

  if (missing.length > 0) {
    return (
      <p>
        Nedostaju fotografije:
        {' '}{missing.map(q => q.notes).join(', ')}
      </p>
    )
  }

  return (

<main className={`visual-test ${code === 'VRG' ? 'vrg' : 'rpd'}`}>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        .visual-test {
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          letter-spacing: -0.2px;
        }

        .visual-sheet {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          padding-left: 20mm;
          padding-right: 15mm;
          box-sizing: border-box;
        }


.visual-photo {
  display: block;
  width: 77%;
  max-height: 48.3mm;
  height: auto;
  object-fit: contain;
  margin: 0 auto 5px;
}

/* Posebno podešavanje za VRG */


/* VRG – vece fotografije */

.visual-test.vrg .visual-photo {
  width: 90%;
  max-height: 55mm;
  height: auto;
  object-fit: contain;
  margin: 0 auto 5px;
}




        .visual-instruction {
          font-size: 10pt;
          font-weight: bold;
          margin: 8px 0 10px;
        }

        .visual-task {
          margin-bottom: 5px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .visual-task-title {
          font-size: 10pt;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: calc(3px + 3mm);
        }

        .answer-line {
          height: 4mm;
          border-bottom: 1px solid #888;
          margin-bottom: 1mm;
        }

        @media screen {
          .visual-sheet {
            margin-top: 20px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .visual-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding-left: 20mm !important;
            padding-right: 15mm !important;
            padding-bottom: 3mm !important;
            box-sizing: border-box !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: auto !important;
            page-break-after: auto !important;
          }


/* RPD – tri pitanja po stranici */
.visual-test.rpd .visual-sheet:nth-of-type(3n) {
  break-after: page !important;
  page-break-after: always !important;
}

/* VRG – dva pitanja po stranici */
.visual-test.vrg .visual-sheet:nth-of-type(2n) {
  break-after: page !important;
  page-break-after: always !important;
}



.visual-test.rpd .visual-sheet:nth-of-type(3n + 1) {
  padding-top: 5mm !important;
}

.visual-test.vrg .visual-sheet:nth-of-type(2n + 1) {
  padding-top: 5mm !important;
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

      {selectedQuestions.map(question => {
        const storagePath = photoMap.get(question.id)!

        const imageUrl = supabase.storage
          .from('training-question-media')
          .getPublicUrl(storagePath).data.publicUrl

        return (
          <section
            key={question.id}
            className="visual-sheet"
          >
            <img
              src={imageUrl}
              alt={`Radna situacija ${question.notes}`}
              className="visual-photo"
            />

            <div className="visual-instruction">
              Na osnovu prikazane slike odgovoriti
              na sledeća pitanja:
            </div>

            {TASKS.map((task, index) => (
              <section
                key={index}
                className="visual-task"
              >
                <div className="visual-task-title">
                  {index + 1}. {task}
                </div>

                <div className="answer-line" />
              </section>
            ))}
          </section>
        )
      })}
    </main>
  )
}
