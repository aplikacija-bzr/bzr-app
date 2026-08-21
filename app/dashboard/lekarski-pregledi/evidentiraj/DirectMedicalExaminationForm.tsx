'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

type DirectMedicalExaminationFormProps = {
  previousRecordId: string
  intervalMonths: number
  previousFitnessAssessment?: string | null
}

function addMonths(
  dateValue: string,
  months: number,
) {
  if (!dateValue) {
    return ''
  }

  const [
    year,
    month,
    day,
  ] = dateValue
    .split('-')
    .map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return ''
  }

  const sourceDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  const targetDate =
    new Date(
      Date.UTC(
        year,
        month - 1 + months,
        1,
      ),
    )

  const lastDayOfTargetMonth =
    new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate()

  targetDate.setUTCDate(
    Math.min(
      sourceDate.getUTCDate(),
      lastDayOfTargetMonth,
    ),
  )

  return targetDate
    .toISOString()
    .slice(0, 10)
}

function formatDateSr(
  value: string,
) {
  if (!value) {
    return '—'
  }

  const [
    year,
    month,
    day,
  ] = value.split('-')

  return `${day}.${month}.${year}.`
}

function getErrorMessage(
  value: unknown,
) {
  if (
    typeof value === 'string'
  ) {
    return value
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    if (
      'message' in value &&
      value.message
    ) {
      return String(
        value.message,
      )
    }

    return JSON.stringify(
      value,
    )
  }

  return (
    'Došlo je do greške pri evidentiranju pregleda.'
  )
}

export default function DirectMedicalExaminationForm({
  previousRecordId,
  intervalMonths,
  previousFitnessAssessment,
}: DirectMedicalExaminationFormProps) {
  const router =
    useRouter()

  const [
    examinationDate,
    setExaminationDate,
  ] =
    useState('')

  const [
    reportNumber,
    setReportNumber,
  ] =
    useState('')

  const [
    fitnessAssessment,
    setFitnessAssessment,
  ] =
    useState(
      previousFitnessAssessment ??
      '',
    )

  const [
    measures,
    setMeasures,
  ] =
    useState('')

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  const [
    savedNextExaminationDate,
    setSavedNextExaminationDate,
  ] =
    useState('')

  const nextExaminationDate =
    useMemo(
      () =>
        addMonths(
          examinationDate,
          intervalMonths,
        ),
      [
        examinationDate,
        intervalMonths,
      ],
    )

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!examinationDate) {
      setErrorMessage(
        'Unesite datum pregleda.',
      )
      return
    }

    if (
      !reportNumber.trim()
    ) {
      setErrorMessage(
        'Unesite broj izveštaja.',
      )
      return
    }

    if (
      !fitnessAssessment.trim()
    ) {
      setErrorMessage(
        'Unesite ocenu sposobnosti.',
      )
      return
    }

    try {
      setIsSaving(true)

      const response =
        await fetch(
          '/api/medical-examination-records/direct',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                previousRecordId,
                examinationDate,
                reportNumber:
                  reportNumber.trim(),
                fitnessAssessment:
                  fitnessAssessment.trim(),
                measures:
                  measures.trim(),
              }),
          },
        )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result.error,
          ),
        )
      }

      const savedDate =
        result.record
          ?.next_examination_date ??
        nextExaminationDate

      setSavedNextExaminationDate(
        savedDate,
      )

      if (result.existing) {
        setSuccessMessage(
          'Ovaj pregled je već evidentiran.',
        )
      } else {
        setSuccessMessage(
          'Lekarski pregled je uspešno evidentiran.',
        )
      }
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Došlo je do greške pri evidentiranju pregleda.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleBackToDashboard() {
    router.push(
      '/dashboard',
    )

    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={formStyle}
    >
      <div style={formGrid}>
        <div>
          <label
            htmlFor="examinationDate"
            style={labelStyle}
          >
            Datum pregleda *
          </label>

          <input
            id="examinationDate"
            type="date"
            value={
              examinationDate
            }
            onChange={(
              event,
            ) =>
              setExaminationDate(
                event.target.value,
              )
            }
            style={inputStyle}
            disabled={
              isSaving ||
              Boolean(
                successMessage,
              )
            }
            required
          />
        </div>

        <div>
          <label
            htmlFor="reportNumber"
            style={labelStyle}
          >
            Broj izveštaja *
          </label>

          <input
            id="reportNumber"
            type="text"
            value={
              reportNumber
            }
            onChange={(
              event,
            ) =>
              setReportNumber(
                event.target.value,
              )
            }
            placeholder="npr. 4542"
            style={inputStyle}
            disabled={
              isSaving ||
              Boolean(
                successMessage,
              )
            }
            required
          />
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Interval
          </label>

          <div
            style={
              readonlyFieldStyle
            }
          >
            {intervalMonths}{' '}
            meseci
          </div>
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Sledeći pregled
          </label>

          <div
            style={
              readonlyFieldStyle
            }
          >
            {formatDateSr(
              nextExaminationDate,
            )}
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="fitnessAssessment"
          style={labelStyle}
        >
          Ocena sposobnosti *
        </label>

        <textarea
          id="fitnessAssessment"
          value={
            fitnessAssessment
          }
          onChange={(
            event,
          ) =>
            setFitnessAssessment(
              event.target.value,
            )
          }
          rows={3}
          placeholder="npr. sposoban za rad na visini"
          style={
            textareaStyle
          }
          disabled={
            isSaving ||
            Boolean(
              successMessage,
            )
          }
          required
        />
      </div>

      <div>
        <label
          htmlFor="measures"
          style={labelStyle}
        >
          Mere
        </label>

        <textarea
          id="measures"
          value={measures}
          onChange={(
            event,
          ) =>
            setMeasures(
              event.target.value,
            )
          }
          rows={3}
          placeholder="Unesite eventualne mere ili ostavite prazno."
          style={
            textareaStyle
          }
          disabled={
            isSaving ||
            Boolean(
              successMessage,
            )
          }
        />
      </div>

      {errorMessage && (
        <div
          style={errorStyle}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={successStyle}
        >
          <div
            style={{
              fontWeight: 800,
            }}
          >
            ✓ {successMessage}
          </div>

          {savedNextExaminationDate && (
            <div
              style={{
                marginTop: 6,
              }}
            >
              Sledeći pregled:{' '}
              <strong>
                {formatDateSr(
                  savedNextExaminationDate,
                )}
              </strong>
            </div>
          )}
        </div>
      )}

      <div
        style={
          actionsStyle
        }
      >
        {!successMessage && (
          <button
            type="submit"
            style={
              saveButtonStyle
            }
            disabled={
              isSaving
            }
          >
            {isSaving
              ? 'Čuvanje...'
              : 'Sačuvaj pregled'}
          </button>
        )}

        <button
          type="button"
          style={
            backButtonStyle
          }
          onClick={
            handleBackToDashboard
          }
          disabled={
            isSaving
          }
        >
          ← Vrati se na Radni sto
        </button>
      </div>
    </form>
  )
}

const formStyle:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const formGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
}

const labelStyle:
  React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 800,
  color: '#374151',
}

const inputStyle:
  React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  boxSizing: 'border-box',
  padding: '9px 11px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontSize: 14,
}

const textareaStyle:
  React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 11px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontSize: 14,
  lineHeight: 1.5,
  resize: 'vertical',
}

const readonlyFieldStyle:
  React.CSSProperties = {
  minHeight: 42,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  padding: '9px 11px',
  border:
    '1px solid #e2e8f0',
  borderRadius: 7,
  background: '#f8fafc',
  color: '#111827',
  fontSize: 14,
  fontWeight: 700,
}

const actionsStyle:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 4,
}

const saveButtonStyle:
  React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 7,
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  cursor: 'pointer',
}

const backButtonStyle:
  React.CSSProperties = {
  padding: '10px 16px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  cursor: 'pointer',
}

const errorStyle:
  React.CSSProperties = {
  padding: 13,
  border:
    '1px solid #fecaca',
  borderRadius: 7,
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 700,
}

const successStyle:
  React.CSSProperties = {
  padding: 14,
  border:
    '1px solid #86efac',
  borderRadius: 7,
  background: '#f0fdf4',
  color: '#166534',
}