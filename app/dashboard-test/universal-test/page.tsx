
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

export const dynamic = 'force-dynamic'

const TASKS = [
  'Navesti opasnosti i štetnosti koje su prisutne u prikazanoj radnoj situaciji.',
  'Navesti koje je mere bezbednosti i zdravlja na radu zaposleni primenio.',
  'Navesti koje mere bezbednosti i zdravlja na radu nisu primenjene, a trebalo ih je primeniti u prikazanoj radnoj situaciji.'
]

type PrintConfig = {
  perPage: number
  photoHeight: string
  photoWidth: string
}

const PRINT_CONFIG: Record<string, PrintConfig> = {
  'BZR-RPD': {
    perPage: 3,
    photoHeight: '48.3mm',
    photoWidth: '77%'
  },
  'VGR-OP': {
    perPage: 2,
    photoHeight: '55mm',
    photoWidth: '90%'
  }
}

const DEFAULT_PRINT: PrintConfig = {
  perPage: 2,
  photoHeight: '55mm',
  photoWidth: '90%'
}

type PageProps = {
  searchParams: Promise<{ modul?: string }>
}

type Question = {
  id: string
  notes: string | null
  sort_order: number
}

type Photo = {
  training_question_id: string
  storage_path: string
}

type ModuleQuestionRow = {
  sort_order: number
  training_question: {
    id: string
    notes: string | null
    active: boolean
  } | null
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }

  return result
}

export default async function UniversalTestPage({
  searchParams
}: PageProps) {
  const requestHeaders = await headers()
  const host = requestHeaders.get('host') || ''

  // Samo kontrolisana lokalna razvojna proba.
  // Host nije bezbednosna autentifikacija.
  if (
    host !== 'localhost:3000' &&
    host !== '127.0.0.1:3000'
  ) {
    notFound()
  }

  const params = await searchParams
  const moduleCode = params.modul || 'BZR-RPD'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return <p>Nedostaje Supabase konfiguracija.</p>
  }

  const supabase = createClient(url, key)

  const { data: moduleData, error: moduleError } =
    await supabase
      .from('training_modules')
      .select('id, code, name')
      .eq('code', moduleCode)
      .eq('active', true)
      .maybeSingle()

  if (moduleError || !moduleData) {
    notFound()
  }

  const { data: moduleQuestions, error: questionsError } =
    await supabase
      .from('training_module_questions')
      .select(`
        sort_order,
        training_question:training_questions (
          id,
          notes,
          active
        )
      `)
      .eq('training_module_id', moduleData.id)
      .eq('active', true)
      .order('sort_order')

  if (questionsError) {
    return <p>Greška: {questionsError.message}</p>
  }

  const questions: Question[] = (
    (moduleQuestions || []) as unknown as ModuleQuestionRow[]
  )
    .filter(item =>
      item.training_question?.id &&
      item.training_question.active
    )
    .map(item => ({
      id: item.training_question!.id,
      notes: item.training_question!.notes,
      sort_order: item.sort_order
    }))

  if (questions.length === 0) {
    return <p>Modul nema aktivnih pitanja.</p>
  }

  const questionIds = questions.map(q => q.id)

  const { data: photos, error: photosError } =
    await supabase
      .from('training_visual_photos')
      .select('training_question_id, storage_path')
      .in('training_question_id', questionIds)

  if (photosError) {
    return <p>Greška: {photosError.message}</p>
  }

  const photoMap = new Map(
    ((photos || []) as Photo[]).map(
      p => [p.training_question_id, p.storage_path]
    )
  )

  const visualQuestions = questions.filter(
    q => photoMap.has(q.id)
  )

  if (visualQuestions.length === 0) {
    return (
      <p>
        Modul {moduleData.code} još nema pripremljene
        fotografije za univerzalni test.
      </p>
    )
  }

  const config =
    PRINT_CONFIG[moduleData.code] || DEFAULT_PRINT

  const isRPD = moduleData.code === 'BZR-RPD'
  const isVRG = moduleData.code === 'VGR-OP'

  const moduleClass = isRPD
    ? 'rpd'
    : isVRG
      ? 'vrg'
      : 'other'

  const pages = chunk(
    visualQuestions,
    config.perPage
  )

  const cssVariables = {
    '--photo-height': config.photoHeight,
    '--photo-width': config.photoWidth
  } as CSSProperties

  return (
    <main
      className={`universal-test ${moduleClass}`}
      style={cssVariables}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        .universal-test {
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          letter-spacing: -0.2px;
        }

        .print-page {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          padding-left: 20mm;
          padding-right: 15mm;
          box-sizing: border-box;
        }

        .visual-question {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .visual-photo {
          display: block;
          width: var(--photo-width);
          max-height: var(--photo-height);
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

        /* RPD - odobreni kompaktni raspored */
        .universal-test.rpd .visual-instruction {
          margin: 4px 0 5px;
        }

        .universal-test.rpd .visual-task {
          margin-bottom: 3px;
        }

        .universal-test.rpd .visual-task-title {
          margin-bottom: calc(3px + 3mm);
        }

        @media screen {
          .print-page {
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

          .print-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding-left: 20mm !important;
            padding-right: 15mm !important;
            padding-top: 5mm !important;
            padding-bottom: 0 !important;
            box-sizing: border-box !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .print-page:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }

          .visual-question {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .visual-task {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* RPD: manje vertikalnih razmaka */
          .universal-test.rpd .visual-instruction {
            margin: 3px 0 4px !important;
          }

          .universal-test.rpd .visual-task {
            margin-bottom: 2px !important;
          }

          .universal-test.rpd .visual-task-title {
            margin-bottom: calc(3px + 2mm) !important;
          }

          .universal-test.rpd .visual-photo {
            max-height: 48.3mm !important;
            width: 77% !important;
            margin-bottom: 3px !important;
          }

          /* VRG: zadrzava odobrene dimenzije */
          .universal-test.vrg .visual-photo {
            max-height: 55mm !important;
            width: 90% !important;
          }

          .answer-line {
            border-bottom: 1px solid #777 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {pages.map((pageQuestions, pageIndex) => (
        <section
          key={pageIndex}
          className="print-page"
        >
          {pageQuestions.map(question => {
            const path = photoMap.get(question.id)!

            const imageUrl = supabase.storage
              .from('training-question-media')
              .getPublicUrl(path).data.publicUrl

            return (
              <section
                key={question.id}
                className="visual-question"
              >
                <img
                  src={imageUrl}
                  alt={question.notes || 'Radna situacija'}
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
        </section>
      ))}
    </main>
  )
}
