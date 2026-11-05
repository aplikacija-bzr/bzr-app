'use client'


import { useEffect, useState } from 'react'


type QuestionOption = {
  id: string
  option_text: string
  sort_order: number
}

type QuestionMedia = {
  id: string
  media_type: string
  storage_path: string
  alt_text: string | null
  sort_order: number
}

type TrainingQuestion = {
  id: string
  question_text: string
  sort_order: number
  options: QuestionOption[]
  media: QuestionMedia[]
}

type TrainingModule = {
  id: string
  code: string
  name: string
  sort_order: number
  question_count: number
  questions: TrainingQuestion[]
}

type Props = {
  modules: TrainingModule[]
}

type QuestionMode = 'ALL' | 'MANUAL'

export default function TestModuleSelector({
  modules,
}: Props) {
  const [selectedModules, setSelectedModules] =
    useState<string[]>([])

  const [search, setSearch] = useState('')
  const [testName, setTestName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

const [createdTestId, setCreatedTestId] = useState<string | null>(null)

const [existingTests, setExistingTests] = useState<
  { id: string; name: string; questionCount: number }[]
>([])

const [loadingTests, setLoadingTests] = useState(true)
const [testSearch, setTestSearch] = useState('')
const [testsError, setTestsError] = useState('')

async function loadExistingTests() {
  setLoadingTests(true)
  setTestsError('')

  try {
    const response = await fetch(
      '/api/training-tests',
      { cache: 'no-store' }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ?? 'Greška pri učitavanju testova.'
      )
    }

    setExistingTests(result.tests ?? [])
  } catch (error) {
    setTestsError(
      error instanceof Error
        ? error.message
        : 'Nije moguće učitati postojeće testove.'
    )
  } finally {
    setLoadingTests(false)
  }
}

useEffect(() => {
  void loadExistingTests()
}, [])

  const [moduleModes, setModuleModes] =
    useState<Record<string, QuestionMode>>({})

  const [selectedQuestions, setSelectedQuestions] =
    useState<Record<string, string[]>>({})

function toggleModule(moduleId: string) {
  const isSelected =
    selectedModules.includes(moduleId)

  if (isSelected) {
    setSelectedModules((current) =>
      current.filter((id) => id !== moduleId)
    )

    setModuleModes((current) => {
      const next = { ...current }
      delete next[moduleId]
      return next
    })

    setSelectedQuestions((current) => {
      const next = { ...current }
      delete next[moduleId]
      return next
    })

    return
  }

  setSelectedModules((current) => [
    ...current,
    moduleId,
  ])

  setModuleModes((current) => ({
    ...current,
    [moduleId]: 'ALL',
  }))

  setSelectedQuestions((current) => ({
    ...current,
    [moduleId]: [],
  }))
}

  function selectAll() {
    setSelectedModules(
      modules.map((module) => module.id)
    )

    setModuleModes((current) => {
      const next = { ...current }

      modules.forEach((module) => {
        if (!next[module.id]) {
          next[module.id] = 'ALL'
        }
      })

      return next
    })
  }

  function clearAll() {
    setSelectedModules([])
  }

  function setMode(
    moduleId: string,
    mode: QuestionMode
  ) {
    setModuleModes((current) => ({
      ...current,
      [moduleId]: mode,
    }))
  }

  function toggleQuestion(
    moduleId: string,
    questionId: string
  ) {
    setSelectedQuestions((current) => {
      const selected =
        current[moduleId] ?? []

      return {
        ...current,
        [moduleId]: selected.includes(questionId)
          ? selected.filter(
              (id) => id !== questionId
            )
          : [...selected, questionId],
      }
    })
  }

  function selectAllQuestions(
    module: TrainingModule
  ) {
    setSelectedQuestions((current) => ({
      ...current,
      [module.id]: module.questions.map(
        (question) => question.id
      ),
    }))
  }

  function clearModuleQuestions(
    moduleId: string
  ) {
    setSelectedQuestions((current) => ({
      ...current,
      [moduleId]: [],
    }))
  }

  function getMediaUrl(
    storagePath: string
  ) {
    const baseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    return `${baseUrl}/storage/v1/object/public/training-question-media/${storagePath}`
  }

  const normalizedSearch =
    search.trim().toLowerCase()

  const filteredModules = modules.filter(
    (module) =>
      module.code
        .toLowerCase()
        .includes(normalizedSearch) ||
      module.name
        .toLowerCase()
        .includes(normalizedSearch)
  )

  const totalQuestions = modules
    .filter((module) =>
      selectedModules.includes(module.id)
    )
    .reduce((total, module) => {
      const mode =
        moduleModes[module.id] ?? 'ALL'

      if (mode === 'ALL') {
        return total + module.question_count
      }

      return (
        total +
        (selectedQuestions[module.id] ?? []).length
      )
    }, 0)

  return (
    <div style={{ marginTop: 24 }}>

<section style={{
  padding: 20,
  marginBottom: 30,
  border: '1px solid #d1d5db',
  borderRadius: 12,
  backgroundColor: '#f8fafc',
}}>
  <h2>POSTOJEĆI TESTOVI</h2>

  <p>
    Pregled i ponovno štampanje ranije kreiranih testova.
  </p>

  <input
    type="text"
    value={testSearch}
    onChange={(e) => setTestSearch(e.target.value)}
    placeholder="Pretraži testove po nazivu..."
    style={{
      width: '100%',
      maxWidth: 500,
      padding: 12,
      marginBottom: 16,
      border: '1px solid #cbd5e1',
      borderRadius: 8,
    }}
  />

  <button
    type="button"
    onClick={() => void loadExistingTests()}
    disabled={loadingTests}
    style={{
      padding: '10px 16px',
      marginBottom: 16,
      cursor: 'pointer',
    }}
  >
    OSVEŽI SPISAK
  </button>

  {loadingTests && <p>Učitavanje testova...</p>}

  {testsError && (
    <p style={{ color: '#dc2626' }}>{testsError}</p>
  )}

  {!loadingTests && !testsError &&
    existingTests
      .filter((test) =>
        test.name.toLowerCase().includes(
          testSearch.toLowerCase()
        )
      )
      .map((test) => (
        <div
          key={test.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <span>
            <strong>{test.name}</strong>
            {' — '}
            {test.questionCount} pitanja
          </span>

          <a
            href={`/dashboard-test/preview/${test.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 14px',
              backgroundColor: '#047857',
              color: '#ffffff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            OTVORI / ŠTAMPAJ PDF
          </a>
        </div>
      ))}

  {!loadingTests && !testsError &&
    existingTests.length === 0 && (
      <p>Nema dostupnih aktivnih testova.</p>
    )}
</section>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          Naziv testa
        </label>

        <input
          type="text"
          value={testName}
          onChange={(event) => setTestName(event.target.value)}
          placeholder="Unesite naziv testa..."
          style={{
            width: '100%',
            maxWidth: 600,
            padding: '10px 12px',
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 6,
          }}
        />
      </div>

      <div
        style={{
          marginBottom: 16,
          maxWidth: 500,
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pretraži module po šifri ili nazivu..."
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #bbb',
            borderRadius: 6,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={selectAll}
        >
          Označi sve module
        </button>

        <button
          type="button"
          onClick={clearAll}
        >
          Poništi sve module
        </button>
      </div>

      {filteredModules.map((module) => {
        const checked =
          selectedModules.includes(module.id)

        const mode =
          moduleModes[module.id] ?? 'ALL'

        const moduleSelectedQuestions =
          selectedQuestions[module.id] ?? []

        return (
          <div
            key={module.id}
            style={{
              padding: '14px 0',
              borderBottom: '1px solid #ddd',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  toggleModule(module.id)
                }
              />

              <span>
                <strong>{module.code}</strong>
                {' — '}
                {module.name}{' '}
                <span style={{ color: '#666' }}>
                  ({module.question_count} pitanja)
                </span>
              </span>
            </label>

            {checked && (
              <div
                style={{
                  marginTop: 12,
                  marginLeft: 30,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <label>
                    <input
                      type="radio"
                      name={`mode-${module.id}`}
                      checked={mode === 'ALL'}
                      onChange={() =>
                        setMode(module.id, 'ALL')
                      }
                    />{' '}
                    Sva pitanja
                  </label>

                  <label>
                    <input
                      type="radio"
                      name={`mode-${module.id}`}
                      checked={mode === 'MANUAL'}
                      onChange={() =>
                        setMode(
                          module.id,
                          'MANUAL'
                        )
                      }
                    />{' '}
                    Izaberi pitanja ručno
                  </label>
                </div>

                {mode === 'MANUAL' && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 16,
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      background: '#fafafa',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          selectAllQuestions(module)
                        }
                      >
                        Označi sva pitanja
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          clearModuleQuestions(
                            module.id
                          )
                        }
                      >
                        Poništi sva pitanja
                      </button>
                    </div>

                    {module.questions.map(
                      (question, index) => (
                        <div
                          key={question.id}
                         style={{
  padding: '1px 0',
}}
                        >
                          <label
                            style={{
                              display: 'flex',
                              alignItems:
                                'flex-start',
                              gap: 10,
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={moduleSelectedQuestions.includes(
                                question.id
                              )}
                              onChange={() =>
                                toggleQuestion(
                                  module.id,
                                  question.id
                                )
                              }
                              style={{
                                marginTop: 3,
                              }}
                            />

                            <span style={{ lineHeight: 1.15 }}>
  <strong>{index + 1}.</strong>

{!(


[
  'OFD', 'OPD', 'RM-TIG', 'RM-MT',
  'RM-ŠR', 'VB', 'HB', 'PGV',
  'BZR-XI/G', 'MBTS-M', 'BZR-VIII', 'MP'
].includes(module.code)

 &&
  question.media.length > 0
) && (
  <> {question.question_text}</>
)}
</span>
</label>


{question.options.length > 0 &&
  question.media.length === 0 && (


  <div
    style={{
      marginLeft: 30,
      marginTop: 2,
      color: "#555",
    }}
  >
    {question.options.map((option, index) => (
      <div
        key={option.id ?? index}
        style={{
         marginBottom: 0,
lineHeight: 1.15,
        }}
      >
        {String.fromCharCode(97 + index)}) {option.option_text}
      </div>
    ))}
  </div>
)}

                          {question.media.length >
                            0 && (
                            <div
                              style={{
                                marginLeft: 30,
                                marginTop: 12,
                                display: 'flex',
                                gap: 12,
                                flexWrap: 'wrap',
                              }}
                            >
                              {question.media.map(
                                (media) => (
                                  <img
                                    key={media.id}
                                    src={getMediaUrl(
                                      media.storage_path
                                    )}
                                    alt={
                                      media.alt_text ??
                                      'Slika pitanja'
                                    }
                                    style={{
                                      maxWidth: 437,
                                      maxHeight: 343,
                                      objectFit:
                                        'contain',
                                      border:
                                        '1px solid #ccc',
                                      borderRadius: 4,
                                      background:
                                        '#fff',
                                    }}
                                  />
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    <div
                      style={{
                        marginTop: 14,
                      }}
                    >
                      Izabrano:{' '}
                      <strong>
                        {
                          moduleSelectedQuestions.length
                        }
                      </strong>{' '}
                      od{' '}
                      <strong>
                        {module.question_count}
                      </strong>{' '}
                      pitanja
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {filteredModules.length === 0 && (
        <p style={{ marginTop: 20 }}>
          Nema modula koji odgovaraju pretrazi.
        </p>
      )}

      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '2px solid #ddd',
        }}
      >
        <div>
          Izabrano modula:{' '}
          <strong>
            {selectedModules.length}
          </strong>
        </div>

        <div style={{ marginTop: 6 }}>
          Ukupno pitanja u testu:{' '}
          <strong>{totalQuestions}</strong>
        </div>

<div style={{ marginTop: 16 }}>
  <button
    type="button"
    disabled={selectedModules.length !== 1}
    onClick={() => {
      const module = modules.find(
        (item) => item.id === selectedModules[0]
      )

      if (!module) return

      const url =
        '/dashboard-test/universal-test?modul=' +
        encodeURIComponent(module.code)

      window.open(url, '_blank', 'noopener,noreferrer')
    }}
    style={{
      padding: '12px 24px',
      fontSize: 16,
      fontWeight: 700,
      border: 'none',
      borderRadius: 6,
      backgroundColor:
        selectedModules.length === 1
          ? '#047857'
          : '#d1d5db',
      color:
        selectedModules.length === 1
          ? '#ffffff'
          : '#6b7280',
      cursor:
        selectedModules.length === 1
          ? 'pointer'
          : 'not-allowed'
    }}
  >
    OTVORI VIZUELNI TEST
  </button>
</div>

                <button
          type="button"
          onClick={async () => {
            if (!testName.trim()) {
              alert('Unesite naziv testa.')
              return
            }

            setIsCreating(true)

            try {
              const response = await fetch(
                '/api/training-tests-create',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: testName.trim(),
                    moduleIds: selectedModules,
                    questionIds: modules
                      .filter((module) =>
                        selectedModules.includes(module.id)
                      )
                      .flatMap((module) => {
                        const mode =
                          moduleModes[module.id] ?? 'ALL'

                        if (mode === 'ALL') {
                          return module.questions.map(
                            (question) => question.id
                          )
                        }

                        return (
                          selectedQuestions[module.id] ?? []
                        )
                      }),
                  }),
                }
              )

              const result = await response.json()

              if (!response.ok) {
                throw new Error(
                  result.error ??
                    'Greška pri kreiranju testa.'
                )
              }



setCreatedTestId(result.test.id)
await loadExistingTests()



alert(
  `Test je uspešno kreiran.\n\n` +
  `Naziv: ${result.test.name}\n\n` +
  `Kliknite OK za otvaranje testa i štampanje.`
)

window.open(
  `/dashboard-test/preview/${createdTestId}`,
  '_blank',
  'noopener,noreferrer'
)

            } catch (error: unknown) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Nepoznata greška.'

              alert(`Greška: ${message}`)
            } finally {
              setIsCreating(false)
            }
          }}
          disabled={
            selectedModules.length === 0 ||
            totalQuestions === 0 ||
            isCreating
          }
        style={{
  marginTop: 20,
  padding: '12px 24px',
  fontSize: 16,
  fontWeight: 700,
  border: 'none',
  borderRadius: 6,
  backgroundColor:
    selectedModules.length === 0 ||
    totalQuestions === 0
      ? '#d1d5db'
      : '#2563eb',
  color:
    selectedModules.length === 0 ||
    totalQuestions === 0
      ? '#6b7280'
      : '#ffffff',
  cursor:
    selectedModules.length === 0 ||
    totalQuestions === 0
      ? 'not-allowed'
      : 'pointer',
  opacity:
    selectedModules.length === 0 ||
    totalQuestions === 0
      ? 0.65
      : 1,
}}
        >
          {isCreating
            ? 'KREIRANJE...'
            : 'KREIRAJ TEST'}
        </button>

{createdTestId && (
  <div style={{ marginTop: 16 }}>
    <a
      href={`/dashboard-test/preview/${createdTestId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        padding: '12px 20px',
        backgroundColor: '#047857',
        color: '#ffffff',
        borderRadius: 8,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      OTVORI KREIRANI TEST / PDF
    </a>
  </div>
)}

      </div>
    </div>
  )
}