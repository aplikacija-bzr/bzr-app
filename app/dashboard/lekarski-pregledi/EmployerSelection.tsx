'use client'

import { useEffect, useRef, useState } from 'react'
import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import type {
  Employee,
} from '@/lib/employees'

import type {
  Employer,
} from '@/lib/employers'

type EmployerSelectionProps = {
  employers: Employer[]
}

type ExaminationType =
  | 'PREVIOUS'
  | 'PERIODIC'
  | ''

type ResultSessionItem = {
  id: string
  referralNumber: string | null
  examinationType: 'PREVIOUS' | 'PERIODIC'
  employee: {
    firstName: string
    lastName: string
    jmbg: string | null
  }
  jobPosition: {
    name: string
  }
  existingRecord: {
    id: string
    intervalMonths: number | null
    examinationDate: string
    nextExaminationDate: string
    reportNumber: string | null
    fitnessAssessment: string | null
    measures: string | null
    status: string
  } | null
}

type ResultFormValues = {
  intervalMonths: string
  examinationDate: string
  reportNumber: string
  fitnessAssessment: string
  measures: string
}

type SavedResultState = {
  saved: boolean
  isSaving: boolean
  error: string
}

export default function EmployerSelection({
  employers,
}: EmployerSelectionProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionIdFromUrl = searchParams.get('sessionId')
    const isNewSessionRef = useRef(false)
  const [employerId, setEmployerId] =
    useState('')

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [
    selectedJobPositions,
    setSelectedJobPositions,
  ] = useState<Set<string>>(new Set())

  const [isLoading, setIsLoading] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')
    const [
  medicalExaminationSessionId,
  setMedicalExaminationSessionId,
] = useState<string | null>(null)
const [
  createdItemIds,
  setCreatedItemIds,
] = useState<string[]>([])
const [
  isRiskAssessmentSaved,
  setIsRiskAssessmentSaved,
] = useState(false)
const [
  riskAssessmentIssuer,
  setRiskAssessmentIssuer,
] = useState('DOO INPRO')
const [
  riskAssessmentYear,
  setRiskAssessmentYear,
] = useState(
  new Date().getFullYear()
)
  const [currentStep, setCurrentStep] =
  useState<2 | 3 | 4 | 5 | 6>(2)

  const [
    examinationType,
    setExaminationType,
  ] = useState<ExaminationType>('')

  const [
    resultSessionItems,
    setResultSessionItems,
  ] = useState<ResultSessionItem[]>([])

  const [
    areResultItemsLoading,
    setAreResultItemsLoading,
  ] = useState(false)

  const [
    resultItemsError,
    setResultItemsError,
  ] = useState('')

  const [
    resultForms,
    setResultForms,
  ] = useState<Record<string, ResultFormValues>>({})

  const [
    savedResultStates,
    setSavedResultStates,
  ] = useState<Record<string, SavedResultState>>({})

  const [
    isCompletingSession,
    setIsCompletingSession,
  ] = useState(false)

  const [
    isSessionCompleted,
    setIsSessionCompleted,
  ] = useState(false)

  const [
    completionError,
    setCompletionError,
  ] = useState('')
  useEffect(() => {
    

    if (!sessionIdFromUrl) {
      setMedicalExaminationSessionId(null)
      setCreatedItemIds([])
      setIsRiskAssessmentSaved(false)
      setRiskAssessmentIssuer('DOO INPRO')
      setRiskAssessmentYear(
        new Date().getFullYear()
      )
      setExaminationType('')
      setSelectedJobPositions(new Set())
      setResultSessionItems([])
      setResultForms({})
      setSavedResultStates({})
      setIsSessionCompleted(false)
      setCompletionError('')
      setResultItemsError('')
      setEmployerId('')
      setEmployees([])
      setCurrentStep(2)
      return
    }

    if (isNewSessionRef.current) {
      isNewSessionRef.current = false
      return
    }

    let isActive = true

    const sessionId =
      sessionIdFromUrl

    setMedicalExaminationSessionId(
      sessionId
    )

    async function loadSessionStatus() {
      try {
        const response = await fetch(
          `/api/medical-examination-sessions?sessionId=${encodeURIComponent(
            sessionId
          )}`
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : 'Nije moguće učitati status postupka.'
          )
        }

        if (!isActive) {
          return
        }

       const completed =
  result?.session?.statusId === 4

const loadedRiskAssessmentIssuer =
  result?.session?.riskAssessmentIssuer ?? ''

const loadedRiskAssessmentYear =
  result?.session?.riskAssessmentYear ?? null

const riskAssessmentSaved =
  Boolean(
    loadedRiskAssessmentIssuer &&
    loadedRiskAssessmentYear
  )

setIsSessionCompleted(
  completed
)

if (loadedRiskAssessmentIssuer) {
  setRiskAssessmentIssuer(
    loadedRiskAssessmentIssuer
  )
}

if (loadedRiskAssessmentYear) {
  setRiskAssessmentYear(
    Number(
      loadedRiskAssessmentYear
    )
  )
}

setIsRiskAssessmentSaved(
  riskAssessmentSaved
)

setCurrentStep(
  completed
    ? 6
    : riskAssessmentSaved
      ? 5
      : 4
)

const itemsResponse = await fetch(
  `/api/medical-examination-session-items?sessionId=${encodeURIComponent(
    sessionId
  )}`
)

const itemsResult =
  await itemsResponse.json()

if (!itemsResponse.ok) {
  throw new Error(
    typeof itemsResult.error === 'string'
      ? itemsResult.error
      : 'Nije moguće učitati stavke postupka.'
  )
}

const loadedItemIds =
  (itemsResult.items ?? [])
    .map(
      (item: { id?: string }) =>
        item.id
    )
    .filter(
      (
        itemId: string | undefined
      ): itemId is string =>
        Boolean(itemId)
    )

setCreatedItemIds(
  loadedItemIds
)
      } catch (error) {
        console.error(error)

        if (!isActive) {
          return
        }

        setIsSessionCompleted(false)
        setCurrentStep(5)
        setResultItemsError(
          error instanceof Error
            ? error.message
            : 'Nije moguće učitati status postupka.'
        )
      }
    }

    loadSessionStatus()

    return () => {
      isActive = false
    }
  }, [sessionIdFromUrl])

  useEffect(() => {
    if (
      (
        currentStep !== 5 &&
        currentStep !== 6
      ) ||
      !medicalExaminationSessionId
    ) {
      return
    }

    let isActive = true

    const sessionId =
      medicalExaminationSessionId

    async function loadResultSessionItems() {
      setAreResultItemsLoading(true)
      setResultItemsError('')

      try {
        const response = await fetch(
          `/api/medical-examination-session-items?sessionId=${encodeURIComponent(
            sessionId
          )}`
        )

        const result =
          await response.json()

        if (!response.ok) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : 'Nije moguće učitati stavke postupka.'
          )
        }

        if (isActive) {
          const loadedItems =
            (result.items ?? []) as ResultSessionItem[]

          setResultSessionItems(
            loadedItems
          )

          const nextResultForms:
            Record<string, ResultFormValues> =
              {}

          const nextSavedResultStates:
            Record<string, SavedResultState> =
              {}

          loadedItems.forEach((item) => {
            const existingRecord =
              item.existingRecord

            nextResultForms[item.id] = {
              intervalMonths:
                existingRecord
                  ?.intervalMonths != null
                  ? String(
                      existingRecord
                        .intervalMonths
                    )
                  : '12',
              examinationDate:
                existingRecord
                  ?.examinationDate ?? '',
              reportNumber:
                existingRecord
                  ?.reportNumber ?? '',
              fitnessAssessment:
                existingRecord
                  ?.fitnessAssessment ?? '',
              measures:
                existingRecord
                  ?.measures ?? '',
            }

            nextSavedResultStates[
              item.id
            ] = {
              saved:
                existingRecord !== null,
              isSaving: false,
              error: '',
            }
          })

          setResultForms(
            nextResultForms
          )

          setSavedResultStates(
            nextSavedResultStates
          )
        }
      } catch (error) {
        console.error(error)

        if (isActive) {
          setResultSessionItems([])
          setResultItemsError(
            error instanceof Error
              ? error.message
              : 'Nije moguće učitati stavke postupka.'
          )
        }
      } finally {
        if (isActive) {
          setAreResultItemsLoading(false)
        }
      }
    }

    loadResultSessionItems()

    return () => {
      isActive = false
    }
  }, [
    currentStep,
    medicalExaminationSessionId,
  ])

  async function loadEmployees(
    selectedEmployerId: string
  ) {
    if (!selectedEmployerId) {
      setEmployees([])
      setSelectedJobPositions(new Set())
      setExaminationType('')
      setCreatedItemIds([])
      setIsRiskAssessmentSaved(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSelectedJobPositions(new Set())
    setExaminationType('')
    setCreatedItemIds([])
    setIsRiskAssessmentSaved(false)

    try {
      const response = await fetch(
        `/api/employees-by-employer?employerId=${selectedEmployerId}`
      )

      if (!response.ok) {
        throw new Error(
          'Greška pri učitavanju zaposlenih.'
        )
      }

      const result =
        await response.json()

      setEmployees(
        result.employees ?? []
      )
    } catch (error) {
      console.error(error)

      setEmployees([])
      setSelectedJobPositions(new Set())
      setExaminationType('')

      setErrorMessage(
        'Nije moguće učitati zaposlene.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  function getSelectionKey(
    employeeId: string,
    jobPositionId: string
  ) {
    return `${employeeId}:${jobPositionId}`
  }

  function isJobPositionSelected(
    employeeId: string,
    jobPositionId: string
  ) {
    return selectedJobPositions.has(
      getSelectionKey(
        employeeId,
        jobPositionId
      )
    )
  }

  function isEmployeeSelected(
    employee: Employee
  ) {
    return (
      employee.job_positions.length > 0 &&
      employee.job_positions.every(
        (jobPosition) =>
          isJobPositionSelected(
            employee.id,
            jobPosition.id
          )
      )
    )
  }

  function toggleJobPosition(
    employeeId: string,
    jobPositionId: string
  ) {
    const key =
      getSelectionKey(
        employeeId,
        jobPositionId
      )

    setSelectedJobPositions(
      (current) => {
        const next =
          new Set(current)

        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }

        return next
      }
    )
  }

  function toggleEmployee(
    employee: Employee
  ) {
    const selectAll =
      !isEmployeeSelected(employee)

    setSelectedJobPositions(
      (current) => {
        const next =
          new Set(current)

        employee.job_positions.forEach(
          (jobPosition) => {
            const key =
              getSelectionKey(
                employee.id,
                jobPosition.id
              )

            if (selectAll) {
              next.add(key)
            } else {
              next.delete(key)
            }
          }
        )

        return next
      }
    )
  }
  function getSelectedSessionItems() {
  return Array.from(
    selectedJobPositions
  ).map((selectionKey) => {
    const separatorIndex =
      selectionKey.indexOf(':')

    return {
      employeeId:
        selectionKey.slice(
          0,
          separatorIndex
        ),
      employeeJobPositionId:
        selectionKey.slice(
          separatorIndex + 1
        ),
    }
  })
}
async function saveRiskAssessmentData() {
  if (!medicalExaminationSessionId) {
    setErrorMessage(
      'Nedostaje ID postupka.'
    )
    return
  }

  if (!riskAssessmentIssuer.trim()) {
    setErrorMessage(
      'Unesite ko je doneo Akt o proceni rizika.'
    )
    return
  }

  try {
    setIsLoading(true)
    setErrorMessage('')

    const response = await fetch(
      '/api/medical-examination-sessions',
      {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          sessionId:
            medicalExaminationSessionId,
          riskAssessmentIssuer:
            riskAssessmentIssuer.trim(),
          riskAssessmentYear,
        }),
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        result?.error?.message ??
          result?.error ??
          'Greška pri čuvanju podataka o Aktu.'
      )
    }

    console.log(
      'PODACI O AKTU SAČUVANI:',
      result.session
    )

    setIsRiskAssessmentSaved(true)
  } catch (error) {
    console.error(error)

    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'Nije moguće sačuvati podatke o Aktu.'
    )
  } finally {
    setIsLoading(false)
  }
}
async function saveMedicalExaminationResult(
  itemId: string
) {
  const values =
    resultForms[itemId]

  if (
    !values ||
    !values.intervalMonths ||
    !values.examinationDate ||
    !values.fitnessAssessment
  ) {
    setSavedResultStates(
      (current) => ({
        ...current,
        [itemId]: {
          saved: false,
          isSaving: false,
          error:
            'Popunite interval, datum pregleda i ocenu sposobnosti.',
        },
      })
    )

    return
  }

  try {
    setSavedResultStates(
      (current) => ({
        ...current,
        [itemId]: {
          saved: false,
          isSaving: true,
          error: '',
        },
      })
    )

    const response = await fetch(
      '/api/medical-examination-records',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          sessionItemId: itemId,
          intervalMonths:
            Number(
              values.intervalMonths
            ),
          examinationDate:
            values.examinationDate,
          reportNumber:
            values.reportNumber,
          fitnessAssessment:
            values.fitnessAssessment,
          measures:
            values.measures,
        }),
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        typeof result.error === 'string'
          ? result.error
          : result?.error?.message ??
            'Nije moguće sačuvati rezultat pregleda.'
      )
    }

    setSavedResultStates(
      (current) => ({
        ...current,
        [itemId]: {
          saved: true,
          isSaving: false,
          error: '',
        },
      })
    )
  } catch (error) {
    console.error(error)

    setSavedResultStates(
      (current) => ({
        ...current,
        [itemId]: {
          saved: false,
          isSaving: false,
          error:
            error instanceof Error
              ? error.message
              : 'Nije moguće sačuvati rezultat pregleda.',
        },
      })
    )
  }
}


async function completeMedicalExaminationSession() {
  if (!medicalExaminationSessionId) {
    setCompletionError(
      'Nedostaje ID postupka.'
    )
    return
  }

  const totalItems =
    resultSessionItems.length

  const recordedItems =
    resultSessionItems.filter(
      (item) =>
        savedResultStates[item.id]
          ?.saved
    ).length

  if (
    totalItems === 0 ||
    recordedItems !== totalItems
  ) {
    setCompletionError(
      'Nisu evidentirani svi rezultati pregleda.'
    )
    return
  }

  try {
    setIsCompletingSession(true)
    setCompletionError('')

    const response = await fetch(
      '/api/medical-examination-sessions',
      {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          sessionId:
            medicalExaminationSessionId,
          action: 'COMPLETE',
        }),
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        typeof result.error === 'string'
          ? result.error
          : result?.error?.message ??
            'Nije moguće završiti postupak.'
      )
    }

    setIsSessionCompleted(true)
  } catch (error) {
    console.error(error)

    setCompletionError(
      error instanceof Error
        ? error.message
        : 'Nije moguće završiti postupak.'
    )
  } finally {
    setIsCompletingSession(false)
  }
}


  const returnToDashboardButton = (
    <button
      type="button"
      onClick={() => {
        router.push('/dashboard')
      }}
      style={{
        width: 'fit-content',
        minHeight: 44,
        padding: '10px 20px',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        color: '#111827',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      ← Vrati se na Radni sto
    </button>
  )

if (currentStep === 6) {
  const totalItems =
    resultSessionItems.length

  const recordedItems =
    resultSessionItems.filter(
      (item) =>
        savedResultStates[item.id]
          ?.saved
    ).length

  const allResultsRecorded =
    totalItems > 0 &&
    recordedItems === totalItems

  return (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {returnToDashboardButton}
      <div>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Završetak
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 0,
            color: '#6b7280',
          }}
        >
          Pregled završnog statusa postupka
          lekarskih pregleda.
        </p>
      </div>

      <div
        style={{
          padding: 18,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          backgroundColor: '#f8fafc',
        }}
      >
        <div>
          Ukupno stavki postupka:{' '}
          <strong>
            {totalItems}
          </strong>
        </div>

        <div
          style={{
            marginTop: 10,
          }}
        >
          Evidentirani rezultati:{' '}
          <strong>
            {recordedItems} / {totalItems}
          </strong>
        </div>

        <div
          style={{
            marginTop: 10,
            color: allResultsRecorded
              ? '#166534'
              : '#92400e',
            fontWeight: 700,
          }}
        >
          {allResultsRecorded
            ? '✓ Svi rezultati pregleda su evidentirani.'
            : 'Postupak još nije spreman za završetak.'}
        </div>

        <div
          style={{
            marginTop: 12,
            color: '#475569',
            fontSize: 14,
          }}
        >
          Session ID:{' '}
          <strong>
            {medicalExaminationSessionId ?? '—'}
          </strong>
        </div>
      </div>

      <div
        style={{
          padding: 18,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          BZR Obrazac 1
        </div>

        <div
          style={{
            color: '#64748b',
            marginBottom: 14,
          }}
        >
          Generišite kompletnu evidenciju lekarskih pregleda
          zaposlenih na radnim mestima sa povećanim rizikom
          za izabranog poslodavca.
        </div>

        <button
          type="button"
          onClick={() => {
            if (!medicalExaminationSessionId) {
              return
            }

            window.open(
              `/api/medical-examination-form1-pdf-test?sessionId=${encodeURIComponent(
                medicalExaminationSessionId
              )}`,
              '_blank',
              'noopener,noreferrer'
            )
          }}
          disabled={
            !allResultsRecorded ||
            !medicalExaminationSessionId
          }
          style={{
            minHeight: 44,
            padding: '10px 20px',
            border: 0,
            borderRadius: 8,
            backgroundColor:
              allResultsRecorded &&
              medicalExaminationSessionId
                ? '#2563eb'
                : '#cbd5e1',
            color: '#ffffff',
            fontWeight: 700,
            cursor:
              allResultsRecorded &&
              medicalExaminationSessionId
                ? 'pointer'
                : 'not-allowed',
          }}
        >
          Generiši BZR Obrazac 1
        </button>
      </div>

      {completionError && (
        <div
          style={{
            padding: 14,
            border: '1px solid #fecaca',
            borderRadius: 10,
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontWeight: 700,
          }}
        >
          {completionError}
        </div>
      )}

      {isSessionCompleted && (
        <div
          style={{
            padding: 14,
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            backgroundColor: '#f0fdf4',
            color: '#166534',
            fontWeight: 700,
          }}
        >
          ✓ Postupak je uspešno završen.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCurrentStep(5)
          }}
          style={{
            minHeight: 44,
            padding: '10px 20px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Nazad na rezultate
        </button>

        <button
          type="button"
          onClick={
            completeMedicalExaminationSession
          }
          disabled={
            !allResultsRecorded ||
            isCompletingSession ||
            isSessionCompleted
          }
          style={{
            minHeight: 44,
            padding: '10px 20px',
            border: 0,
            borderRadius: 8,
            backgroundColor:
              allResultsRecorded &&
              !isSessionCompleted
                ? '#16a34a'
                : '#cbd5e1',
            color: '#ffffff',
            fontWeight: 700,
            cursor:
              allResultsRecorded &&
              !isCompletingSession &&
              !isSessionCompleted
                ? 'pointer'
                : 'not-allowed',
          }}
        >
          {isCompletingSession
            ? 'Završavanje...'
            : isSessionCompleted
              ? 'Postupak završen'
              : 'Završi postupak'}
        </button>
      </div>
    </div>
  )
}

if (currentStep === 5) {
  return (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {returnToDashboardButton}
      <div>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Rezultati pregleda
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 0,
            color: '#6b7280',
          }}
        >
          Evidentiranje rezultata obavljenih lekarskih pregleda
          za stavke ovog postupka.
        </p>
      </div>

      <div
        style={{
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          backgroundColor: '#f8fafc',
        }}
      >
       Broj stavki postupka:{' '}
<strong>
  {resultSessionItems.length}
</strong>

        <div
          style={{
            marginTop: 12,
            color: '#475569',
            fontSize: 14,
          }}
        >
          Session ID:{' '}
          <strong>
            {medicalExaminationSessionId ?? '—'}
          </strong>
        </div>
      </div>

      {areResultItemsLoading && (
        <div
          style={{
            padding: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            backgroundColor: '#ffffff',
          }}
        >
          Učitavanje stavki postupka...
        </div>
      )}

      {resultItemsError && (
        <div
          style={{
            padding: 16,
            border: '1px solid #fecaca',
            borderRadius: 10,
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
        >
          {resultItemsError}
        </div>
      )}

      {!areResultItemsLoading &&
        !resultItemsError &&
        resultSessionItems.map(
          (item) => (
            <div
              key={item.id}
              style={{
                padding: 18,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                backgroundColor: '#ffffff',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {item.employee.firstName}{' '}
                {item.employee.lastName}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  color: '#334155',
                  marginBottom: 16,
                }}
              >
                <div>
                  Radno mesto:{' '}
                  <strong>
                    {item.jobPosition.name}
                  </strong>
                </div>

                <div>
                  Broj uputa:{' '}
                  <strong>
                    {item.referralNumber ?? '—'}
                  </strong>
                </div>

                <div>
                  Vrsta pregleda:{' '}
                  <strong>
                    {item.examinationType ===
                    'PREVIOUS'
                      ? 'Prethodni'
                      : 'Periodični'}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <label>
                  <div
                    style={{
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    Interval pregleda (meseci)
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={
                      resultForms[item.id]
                        ?.intervalMonths ?? ''
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value

                      setResultForms(
                        (current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            intervalMonths: value,
                          },
                        })
                      )
                    }}
                    disabled={
                      savedResultStates[item.id]
                        ?.saved
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div
                    style={{
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    Datum pregleda
                  </div>

                  <input
                    type="date"
                    value={
                      resultForms[item.id]
                        ?.examinationDate ?? ''
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value

                      setResultForms(
                        (current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            examinationDate: value,
                          },
                        })
                      )
                    }}
                    disabled={
                      savedResultStates[item.id]
                        ?.saved
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div
                    style={{
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    Broj izveštaja
                  </div>

                  <input
                    type="text"
                    value={
                      resultForms[item.id]
                        ?.reportNumber ?? ''
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value

                      setResultForms(
                        (current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            reportNumber: value,
                          },
                        })
                      )
                    }}
                    disabled={
                      savedResultStates[item.id]
                        ?.saved
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div
                    style={{
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    Ocena sposobnosti
                  </div>

                  <select
                    value={
                      resultForms[item.id]
                        ?.fitnessAssessment ?? ''
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value

                      setResultForms(
                        (current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            fitnessAssessment: value,
                          },
                        })
                      )
                    }}
                    disabled={
                      savedResultStates[item.id]
                        ?.saved
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Izaberite ocenu
                    </option>
                    <option value="SPOSOBAN">
                      Sposoban
                    </option>
                    <option value="SPOSOBAN_SA_OGRANICENJEM">
                      Sposoban sa ograničenjem
                    </option>
                    <option value="NIJE_SPOSOBAN">
                      Nije sposoban
                    </option>
                  </select>
                </label>
              </div>

              <label
                style={{
                  display: 'block',
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Mere
                </div>

                <textarea
                  value={
                    resultForms[item.id]
                      ?.measures ?? ''
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value

                    setResultForms(
                      (current) => ({
                        ...current,
                        [item.id]: {
                          ...current[item.id],
                          measures: value,
                        },
                      })
                    )
                  }}
                  rows={3}
                  disabled={
                    savedResultStates[item.id]
                      ?.saved
                  }
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                  }}
                />
              </label>

              {savedResultStates[item.id]
                ?.error && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    border:
                      '1px solid #fecaca',
                    borderRadius: 8,
                    backgroundColor:
                      '#fef2f2',
                    color: '#991b1b',
                  }}
                >
                  {
                    savedResultStates[
                      item.id
                    ].error
                  }
                </div>
              )}

              {savedResultStates[item.id]
                ?.saved ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    border:
                      '1px solid #bbf7d0',
                    borderRadius: 8,
                    backgroundColor:
                      '#f0fdf4',
                    color: '#166534',
                    fontWeight: 700,
                  }}
                >
                  ✓ Rezultat evidentiran
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    saveMedicalExaminationResult(
                      item.id
                    )
                  }}
                  disabled={
                    savedResultStates[item.id]
                      ?.isSaving
                  }
                  style={{
                    marginTop: 12,
                    minHeight: 44,
                    padding: '10px 20px',
                    border: 0,
                    borderRadius: 8,
                    backgroundColor:
                      '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor:
                      savedResultStates[
                        item.id
                      ]?.isSaving
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {savedResultStates[item.id]
                    ?.isSaving
                    ? 'Čuvanje...'
                    : 'Sačuvaj rezultat'}
                </button>
              )}
            </div>
          )
        )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCurrentStep(6)
          }}
          disabled={
            resultSessionItems.length === 0 ||
            !resultSessionItems.every(
              (item) =>
                savedResultStates[item.id]
                  ?.saved
            )
          }
          style={{
            width: 'fit-content',
            minHeight: 44,
            padding: '10px 20px',
            border: 0,
            borderRadius: 8,
            backgroundColor:
              resultSessionItems.length > 0 &&
              resultSessionItems.every(
                (item) =>
                  savedResultStates[item.id]
                    ?.saved
              )
                ? '#0f766e'
                : '#cbd5e1',
            color: '#ffffff',
            fontWeight: 700,
            cursor:
              resultSessionItems.length > 0 &&
              resultSessionItems.every(
                (item) =>
                  savedResultStates[item.id]
                    ?.saved
              )
                ? 'pointer'
                : 'not-allowed',
          }}
        >
          Pređi na završetak
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentStep(4)
          }}
        style={{
          width: 'fit-content',
          minHeight: 44,
          padding: '10px 20px',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          backgroundColor: '#ffffff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Nazad
      </button>
      </div>
    </div>
  )
}

if (currentStep === 4) {
  return (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {returnToDashboardButton}
      <div>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Generisanje uputa
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 0,
            color: '#6b7280',
          }}
        >
          Postupak je kreiran i izabrani zaposleni
          i radna mesta su sačuvani.
        </p>
      </div>

      <div
        style={{
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          backgroundColor: '#f8fafc',
        }}
      >
        Broj stavki za generisanje uputa:{' '}
        <strong>
          {selectedJobPositions.size}
        </strong>

        <div
          style={{
            marginTop: 12,
            color: '#475569',
            fontSize: 14,
          }}
        >
          Session ID:{' '}
          <strong>
            {medicalExaminationSessionId ?? '—'}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            fontWeight: 700,
          }}
        >
          Akt o proceni rizika doneo
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name="risk-assessment-issuer"
            value="DOO INPRO"
            checked={
              riskAssessmentIssuer ===
              'DOO INPRO'
            }
            onChange={() => {
              setRiskAssessmentIssuer(
                'DOO INPRO'
              )
              setIsRiskAssessmentSaved(false)
            }}
          />

          <span>
            DOO INPRO
          </span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name="risk-assessment-issuer"
            value="OTHER"
            checked={
              riskAssessmentIssuer !==
              'DOO INPRO'
            }
            onChange={() => {
              setRiskAssessmentIssuer('')
              setIsRiskAssessmentSaved(false)
            }}
          />

          <span>
            Drugi poslodavac
          </span>
        </label>

        {riskAssessmentIssuer !==
          'DOO INPRO' && (
          <input
            type="text"
            value={riskAssessmentIssuer}
            onChange={(event) => {
              setRiskAssessmentIssuer(
                event.target.value
              )
              setIsRiskAssessmentSaved(false)
            }}
            placeholder="Unesite naziv poslodavca"
            style={inputStyle}
          />
        )}

        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label
            htmlFor="risk-assessment-year"
            style={{
              fontWeight: 700,
            }}
          >
            Godina donošenja Akta
          </label>

          <select
            id="risk-assessment-year"
            value={riskAssessmentYear}
            onChange={(event) => {
              setRiskAssessmentYear(
                Number(event.target.value)
              )
              setIsRiskAssessmentSaved(false)
            }}
            style={inputStyle}
          >
            {Array.from(
              { length: 20 },
              (_, index) =>
                new Date().getFullYear() -
                index
            ).map((year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isRiskAssessmentSaved && (
        <div
          style={{
            padding: 14,
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            backgroundColor: '#f0fdf4',
            color: '#166534',
            fontWeight: 700,
          }}
        >
          ✓ Podaci o Aktu su sačuvani.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={saveRiskAssessmentData}
          disabled={isLoading}
          style={{
            width: 'fit-content',
            minHeight: 44,
            padding: '10px 20px',
            border: 0,
            borderRadius: 8,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            cursor:
              isLoading
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          Sačuvaj podatke o Aktu
        </button>

        {isRiskAssessmentSaved && (
          <button
            type="button"
            onClick={() => {
              const itemIdsParam =
                createdItemIds
                  .map((itemId) =>
                    encodeURIComponent(itemId)
                  )
                  .join(',')

              window.open(
                `/api/medical-referral-pdf-batch?itemIds=${itemIdsParam}`,
                '_blank',
                'noopener,noreferrer'
              )
            }}
            disabled={
              createdItemIds.length === 0 ||
              isLoading
            }
            style={{
              width: 'fit-content',
              minHeight: 44,
              padding: '10px 20px',
              border: 0,
              borderRadius: 8,
              backgroundColor:
                createdItemIds.length > 0
                  ? '#16a34a'
                  : '#cbd5e1',
              color: '#ffffff',
              fontWeight: 700,
              cursor:
                createdItemIds.length > 0 &&
                !isLoading
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            Generiši upute ({createdItemIds.length})
          </button>
        )}

        {isRiskAssessmentSaved && (
          <>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(5)
              }}
              style={{
                width: 'fit-content',
                minHeight: 44,
                padding: '10px 20px',
                border: 0,
                borderRadius: 8,
                backgroundColor: '#0f766e',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Unesi rezultate pregleda
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!medicalExaminationSessionId) {
                  setErrorMessage(
                    'Nedostaje ID postupka.'
                  )
                  return
                }

                try {
                  setIsLoading(true)
                  setErrorMessage('')

                  const response = await fetch(
                    '/api/medical-examination-sessions',
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type':
                          'application/json',
                      },
                      body: JSON.stringify({
                        sessionId:
                          medicalExaminationSessionId,
                        action:
                          'WAITING_RESULTS',
                      }),
                    }
                  )

                  const result =
                    await response.json()

                  if (!response.ok) {
                    throw new Error(
                      typeof result.error === 'string'
                        ? result.error
                        : result?.error?.message ??
                          'Nije moguće označiti da se čekaju rezultati.'
                    )
                  }

                  router.push('/dashboard')
                  router.refresh()
                } catch (error) {
                  console.error(error)

                  setErrorMessage(
                    error instanceof Error
                      ? error.message
                      : 'Nije moguće označiti da se čekaju rezultati.'
                  )
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              style={{
                width: 'fit-content',
                minHeight: 44,
                padding: '10px 20px',
                border: '1px solid #0f766e',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                color: '#0f766e',
                fontWeight: 700,
                cursor:
                  isLoading
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  isLoading
                    ? 0.7
                    : 1,
              }}
            >
              {isLoading
                ? 'Čuvanje...'
                : 'Vrati se na Radni sto — čekaju se rezultati'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setCurrentStep(3)
          }}
          style={{
            width: 'fit-content',
            minHeight: 44,
            padding: '10px 20px',
            border:
              '1px solid #cbd5e1',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Nazad
        </button>
      </div>
    </div>
  )
}

  if (currentStep === 3) {
    return (
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
      {returnToDashboardButton}
        <div>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Vrsta pregleda
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: '#6b7280',
            }}
          >
            Odredite vrstu lekarskog
            pregleda za izabrane zaposlene
            i radna mesta.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="examination-type"
              value="PREVIOUS"
              checked={
                examinationType ===
                'PREVIOUS'
              }
              onChange={() => {
                setExaminationType(
                  'PREVIOUS'
                )
              }}
            />

            <span>
              Prethodni pregled
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="examination-type"
              value="PERIODIC"
              checked={
                examinationType ===
                'PERIODIC'
              }
              onChange={() => {
                setExaminationType(
                  'PERIODIC'
                )
              }}
            />

            <span>
              Periodični pregled
            </span>
          </label>
        </div>

        <div
          style={{
            padding: 16,
            border:
              '1px solid #e5e7eb',
            borderRadius: 10,
            backgroundColor: '#f8fafc',
          }}
        >
          Izabrano veza zaposleni–radno
          mesto:{' '}
          <strong>
            {selectedJobPositions.size}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentStep(2)
            }}
            style={{
              minHeight: 44,
              padding: '10px 20px',
              border:
                '1px solid #cbd5e1',
              borderRadius: 8,
              backgroundColor: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Nazad
          </button>

          <button
            type="button"
            disabled={!examinationType}
            onClick={async () => {
  if (!employerId || !examinationType) {
    return
  }

  try {
    setIsLoading(true)
    setErrorMessage('')

    const response = await fetch(
      '/api/medical-examination-sessions',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          employerId,
          examinationType,
        }),
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        result?.error?.message ??
          result?.error ??
          'Greška pri kreiranju postupka.'
      )
    }
setMedicalExaminationSessionId(
  result.session.id
)
isNewSessionRef.current = true
router.replace(
  `/dashboard/lekarski-pregledi?sessionId=${encodeURIComponent(
    result.session.id
  )}`
)
setIsRiskAssessmentSaved(false)

   const selectedItems =
  getSelectedSessionItems()

const newItemIds: string[] = []

for (const selectedItem of selectedItems) {
  const itemResponse = await fetch(
    '/api/medical-examination-session-items',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        sessionId:
          result.session.id,
        employeeId:
          selectedItem.employeeId,
        employeeJobPositionId:
          selectedItem.employeeJobPositionId,
      }),
    }
  )

  const itemResult =
    await itemResponse.json()

  if (!itemResponse.ok) {
    throw new Error(
      itemResult?.error?.message ??
        itemResult?.error ??
        'Greška pri kreiranju stavke postupka.'
    )
  }

  if (itemResult?.item?.id) {
    newItemIds.push(itemResult.item.id)
  }
}

setCreatedItemIds(newItemIds)

console.log(
  'KREIRAN SESSION:',
  result.session
)

console.log(
  'KREIRANE STAVKE:',
  selectedItems.length
)
setCurrentStep(4)
  } catch (error) {
    console.error(error)

    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'Nije moguće kreirati postupak.'
    )
  } finally {
    setIsLoading(false)
  }
}}
            style={{
              minHeight: 44,
              padding: '10px 20px',
              border: 0,
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor:
                examinationType
                  ? 'pointer'
                  : 'not-allowed',
              backgroundColor:
                examinationType
                  ? '#2563eb'
                  : '#cbd5e1',
              color: '#ffffff',
            }}
          >
            Nastavi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {returnToDashboardButton}
      <div>
        <label
          htmlFor="medical-employer"
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Poslodavac
        </label>

        <select
          id="medical-employer"
          style={inputStyle}
          value={employerId}
          onChange={(event) => {
            const selectedEmployerId =
              event.target.value

            setEmployerId(
              selectedEmployerId
            )

            loadEmployees(
              selectedEmployerId
            )
          }}
        >
          <option value="">
            Izaberite poslodavca
          </option>

          {employers.map(
            (employer) => (
              <option
                key={employer.id}
                value={employer.id}
              >
                {employer.name}
              </option>
            )
          )}
        </select>
      </div>

      {isLoading && (
        <div
          style={{
            color: '#6b7280',
          }}
        >
          Učitavanje zaposlenih...
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            color: '#b91c1c',
          }}
        >
          {errorMessage}
        </div>
      )}

      {!isLoading &&
        employerId &&
        !errorMessage && (
          <div>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Zaposleni i radna mesta
            </h3>

            {employees.length === 0 ? (
              <div
                style={{
                  color: '#6b7280',
                }}
              >
                Nema zaposlenih za
                izabranog poslodavca.
              </div>
            ) : (
              <>
                <div
                  style={{
                    overflowX: 'auto',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: 10,
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse:
                        'collapse',
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            ...tableHeaderStyle,
                            width: 52,
                          }}
                        >
                          Izbor
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Zaposleni
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Radna mesta
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.map(
                        (employee) => (
                          <tr
                            key={
                              employee.id
                            }
                          >
                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              <input
                                type="checkbox"
                                checked={
                                  isEmployeeSelected(
                                    employee
                                  )
                                }
                                disabled={
                                  employee
                                    .job_positions
                                    .length === 0
                                }
                                onChange={() =>
                                  toggleEmployee(
                                    employee
                                  )
                                }
                                aria-label={`Izaberi ${employee.first_name} ${employee.last_name}`}
                              />
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                employee.last_name
                              }{' '}
                              {
                                employee.first_name
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {employee
                                .job_positions
                                .length ===
                              0 ? (
                                '—'
                              ) : (
                                <div
                                  style={{
                                    display:
                                      'flex',
                                    flexDirection:
                                      'column',
                                    gap: 8,
                                  }}
                                >
                                  {employee.job_positions.map(
                                    (
                                      jobPosition
                                    ) => (
                                      <label
                                        key={
                                          jobPosition.id
                                        }
                                        style={{
                                          display:
                                            'flex',
                                          alignItems:
                                            'center',
                                          gap: 8,
                                          cursor:
                                            'pointer',
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isJobPositionSelected(
                                            employee.id,
                                            jobPosition.id
                                          )}
                                          onChange={() =>
                                            toggleJobPosition(
                                              employee.id,
                                              jobPosition.id
                                            )
                                          }
                                        />

                                        <span>
                                          {
                                            jobPosition.name
                                          }
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    color: '#475569',
                    fontSize: 14,
                  }}
                >
                  Izabrano veza
                  zaposleni–radno mesto:{' '}
                  <strong>
                    {
                      selectedJobPositions.size
                    }
                  </strong>
                </div>

                <button
                  type="button"
                  disabled={
                    selectedJobPositions.size ===
                    0
                  }
                  onClick={() => {
                    setCurrentStep(3)
                  }}
                  style={{
                    marginTop: 16,
                    minHeight: 44,
                    padding:
                      '10px 20px',
                    border: 0,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor:
                      selectedJobPositions.size ===
                      0
                        ? 'not-allowed'
                        : 'pointer',
                    backgroundColor:
                      selectedJobPositions.size ===
                      0
                        ? '#cbd5e1'
                        : '#2563eb',
                    color: '#ffffff',
                  }}
                >
                  Nastavi
                </button>
              </>
            )}
          </div>
        )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  backgroundColor: '#ffffff',
}

const tableHeaderStyle: React.CSSProperties =
  {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom:
      '1px solid #e5e7eb',
    backgroundColor: '#f8fafc',
    fontSize: 14,
  }

const tableCellStyle: React.CSSProperties =
  {
    padding: '10px 12px',
    borderBottom:
      '1px solid #e5e7eb',
    verticalAlign: 'top',
  }