import './print.css'
import PdfPreview from './PdfPreview';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = {
  params: Promise<{
    testId: string
  }>
}

type QuestionOption = {
  id: string
  option_text: string
  sort_order: number
}

type QuestionMedia = {
  id: string
  storage_path: string
  alt_text: string | null
  sort_order: number
}

type TestQuestion = {
  id: string
  question_text: string
  sort_order: number
  options: QuestionOption[]
  media: QuestionMedia[]
}

export default async function TestPreviewPage({
  params,
}: Props) {
  const { testId } = await params

  const { data: test, error: testError } =
    await supabase
      .from('training_tests')
      .select('id, name')
      .eq('id', testId)
      .single()

  if (testError || !test) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Pregled testa</h1>
        <p>Test nije pronađen.</p>
      </div>
    )
  }

  const {
    data: testModules,
    error: modulesError,
  } = await supabase
    .from('training_test_modules')
    .select(`
      sort_order,
      training_modules (
        id,
        code,
        name
      )
    `)
    .eq('training_test_id', testId)
    .eq('active', true)
    .order('sort_order', {
      ascending: true,
    })

  if (modulesError) {
    return (
      <div style={{ padding: 24 }}>
        <h2>{test.name}</h2>
        <p>Greška pri učitavanju modula.</p>
      </div>
    )
  }

  const {
    data: testQuestionRows,
    error: questionsError,
  } = await supabase
    .from('training_test_questions')
    .select(`
      sort_order,
      training_question_id,
      training_questions (
        id,
        question_text,
        training_question_options (
          id,
          option_text,
          sort_order,
          active
        ),
        training_question_media (
          id,
          storage_path,
          alt_text,
          sort_order,
          active
        )
      )
    `)
    .eq('training_test_id', testId)
    .eq('active', true)
    .order('sort_order', {
      ascending: true,
    })

  if (questionsError) {
    return (
      <div style={{ padding: 24 }}>
        <h2>{test.name}</h2>
        <p>Greška pri učitavanju pitanja.</p>
      </div>
    )
  }

  const testQuestions: TestQuestion[] =
    (testQuestionRows ?? [])
      .map((item) => {
        const question = Array.isArray(
          item.training_questions
        )
          ? item.training_questions[0]
          : item.training_questions

        if (!question) {
          return null
        }

        const options =
          (
            question.training_question_options ??
            []
          )
            .filter(
              (option) =>
                option.active === true
            )
            .sort(
              (a, b) =>
                a.sort_order -
                b.sort_order
            )
            .map((option) => ({
              id: option.id,
              option_text:
                option.option_text,
              sort_order:
                option.sort_order,
            }))

        const media =
          (
            question.training_question_media ??
            []
          )
            .filter(
              (item) =>
                item.active === true
            )
            .sort(
              (a, b) =>
                a.sort_order -
                b.sort_order
            )
            .map((item) => ({
              id: item.id,
              storage_path:
                item.storage_path,
              alt_text:
                item.alt_text,
              sort_order:
                item.sort_order,
            }))

        return {
          id: question.id,
          question_text:
            question.question_text,
          sort_order:
            item.sort_order,
          options,
          media,
        }
      })
      .filter(
        (
          question
        ): question is TestQuestion =>
          question !== null
      )

  const testQuestionIds = new Set(
    testQuestions.map(
      (question) => question.id
    )
  )

  const { data: moduleQuestionRows } =
    await supabase
      .from('training_module_questions')
      .select(`
        training_module_id,
        training_question_id,
        sort_order
      `)
      .eq('active', true)
      .in(
        'training_question_id',
        Array.from(testQuestionIds)
      )
  const pdfModules =
    (testModules ?? [])
      .map((item) => {
        const module = Array.isArray(
          item.training_modules
        )
          ? item.training_modules[0]
          : item.training_modules

        if (!module) {
          return null
        }

        const moduleQuestionIds =
          new Set(
            (moduleQuestionRows ?? [])
              .filter(
                (row) =>
                  row.training_module_id ===
                  module.id
              )
              .sort(
                (a, b) =>
                  a.sort_order -
                  b.sort_order
              )
              .map(
                (row) =>
                  row.training_question_id
              )
          )

        const questions =
          testQuestions
            .filter((question) =>
              moduleQuestionIds.has(
                question.id
              )
            )
 .map((question) => ({
  id: question.id,
  question_text:
    question.question_text,

  options: question.options.map(
    (option) => ({
      id: option.id,
      option_text:
        option.option_text,
      sort_order:
        option.sort_order,
    })
  ),

  media: question.media.map(
    (item) => ({
      id: item.id,
      storage_path:
        item.storage_path,
      alt_text:
        item.alt_text,
      sort_order:
        item.sort_order,
    })
  ),
}))

        return {
          id: module.id,
          code: module.code,
          name: module.name,
          questions,
        }
      })
      .filter(
        (
          module
        ): module is NonNullable<
          typeof module
        > => module !== null
      )

return (
  <div
    className="test-print-page"
    style={{
      padding: 24,
      maxWidth: 900,
      margin: '0 auto',
    }}
  >

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          <h1
            style={{
              marginBottom: 6,
              fontSize: 24,
            }}
          >
            TEST
          </h1>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            OBUKA ZA BEZBEDAN I ZDRAV RAD
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 16,
            }}
          >
            {test.name}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 18,
            fontSize: 16,
          }}
        >
          <div>
            <strong>Poslodavac:</strong>{' '}
            ________________________________________________
          </div>

          <div>
            <strong>
              Ime i prezime zaposlenog:
            </strong>{' '}
            __________________________________
          </div>

          <div>
            <strong>Datum:</strong>{' '}
            ____________________
          </div>
        </div>
      </div>

      <div>
        {testModules?.map((item) => {
          const module = Array.isArray(
            item.training_modules
          )
            ? item.training_modules[0]
            : item.training_modules

          if (!module) {
            return null
          }

          const moduleQuestionIds =
            new Set(
              (moduleQuestionRows ?? [])
                .filter(
                  (row) =>
                    row.training_module_id ===
                    module.id
                )
                .sort(
                  (a, b) =>
                    a.sort_order -
                    b.sort_order
                )
                .map(
                  (row) =>
                    row.training_question_id
                )
            )

          const questions =
            testQuestions.filter(
              (question) =>
                moduleQuestionIds.has(
                  question.id
                )
            )

         return  (
            <section
              key={module.id}
              style={{
                marginTop: 30,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom:
                    '2px solid #333',
                }}
              >
                {module.code}
                {' — '}
                {module.name}
              </h2>


{questions.map(
  (question, index) => (
    <div
      key={question.id}
      className={
        question.media.length > 0
          ? 'print-visual-question'
          : 'print-text-question'
      }
      style={{
        marginBottom: 22,
        lineHeight: 1.5,
      }}
    >

                    <div>
                      <strong>
                        {index + 1}.
                      </strong>{' '}
                      {
                        question.question_text
                      }
                    </div>

                    {question.media.length >
                      0 && (

<div
  className="print-poster-container"
  style={{

                          marginTop: 12,
                          marginLeft: 24,
                          display: 'flex',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        {question.media.map(
                          (media) => (
                            <img
                              key={
                                media.id
                              }
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/training-question-media/${media.storage_path}`}
                              alt={
                                media.alt_text ??
                                'Slika uz pitanje'
                              }

style={{
  width: '100%',
  maxWidth: 800,
  height: 'auto',
  objectFit: 'contain',
  border: '1px solid #ccc',
}}

                            />
                          )
                        )}
                      </div>
                    )}

                    {question.options.length >
                      0 && (
                      <div
                        style={{
                          marginTop: 8,
                          marginLeft: 24,
                          display: 'flex',
                          gap: 28,
                          flexWrap: 'wrap',
                        }}
                      >
                        {question.options.map(
                          (option) => (
                            <div
                              key={
                                option.id
                              }
                            >
                             {' '}
{question.media.length === 0
  ? option.option_text
  : String.fromCharCode(
      97 + question.options.indexOf(option)
    ) + ')'}

                            </div>
                          )
                        )}
                      </div>
                    )}

                    {question.options.length ===
                      0 && (
                      <div
                        style={{
                          marginTop: 12,
                          marginLeft: 24,
                          borderBottom:
                            '1px solid #999',
                          height: 24,
                        }}
                      />
                    )}
                  </div>
                )
              )}
            </section>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: '1px solid #999',
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 60,
        }}
      >
        <div style={{ flex: 1 }}>
          <div>
            Potpis zaposlenog:
          </div>

          <div
            style={{
              marginTop: 28,
            }}
          >
            ______________________________
          </div>
        </div>

        <div
          style={{
            flex: 1,
            textAlign: 'right',
          }}
        >
          <div>
            Potpis savetnika za bezbednost
            i zdravlje na radu:
          </div>

          <div
            style={{
              marginTop: 28,
            }}
          >
            ______________________________
          </div>
        </div>
      </div>
       <div style={{ marginTop: 40 }}>
        <PdfPreview
  testName={test.name}
  modules={pdfModules}
/>
      </div>

    </div>
  )
}