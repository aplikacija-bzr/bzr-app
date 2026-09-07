'use client'

import {
  useState,
} from 'react'

type JobPosition = {
  id: string
  name: string
}

type Props = {
  employerId: string
  employeeId: string
  jobPositions: JobPosition[]
}

export default function InitialMedicalExaminationForm({
  employerId,
  employeeId,
  jobPositions,
}: Props) {
  const [
    employerJobPositionId,
    setEmployerJobPositionId,
  ] = useState(
    jobPositions.length === 1
      ? jobPositions[0].id
      : '',
  )

  const [
    examinationType,
    setExaminationType,
  ] = useState('PERIODIC')

  const [
    intervalMonths,
    setIntervalMonths,
  ] = useState('12')

  const [
    examinationDate,
    setExaminationDate,
  ] = useState('')

  const [
    reportNumber,
    setReportNumber,
  ] = useState('')

  const [
    fitnessAssessment,
    setFitnessAssessment,
  ] = useState('')

  const [
    measures,
    setMeasures,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    success,
    setSuccess,
  ] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !employerJobPositionId ||
      !examinationDate ||
      !intervalMonths
    ) {
      setError(
        'Popunite radno mesto, datum pregleda i interval.',
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response =
        await fetch(
          '/api/medical-examination-records/initial',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              employerId,
              employeeId,
              employerJobPositionId,
              examinationType,
              intervalMonths:
                Number(intervalMonths),
              examinationDate,
              reportNumber,
              fitnessAssessment,
              measures,
            }),
          },
        )

      const result =
        await response.json()

      if (!response.ok) {
        const message =
          typeof result?.error ===
          'string'
            ? result.error
            : result?.error?.message

        throw new Error(
          message ||
            'Pregled nije sačuvan.',
        )
      }

      setSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Došlo je do greške prilikom čuvanja pregleda.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={successStyle}>
        <strong>
          Lekarski pregled je uspešno
          evidentiran.
        </strong>

        <button
          type="button"
          style={reloadButtonStyle}
          onClick={() => {
            window.location.reload()
          }}
        >
          Prikaži evidentirani pregled
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={formStyle}
    >
      <div style={fieldStyle}>
        <label style={labelStyle}>
          Radno mesto *
        </label>

        <select
          value={
            employerJobPositionId
          }
          onChange={(event) =>
            setEmployerJobPositionId(
              event.target.value,
            )
          }
          style={inputStyle}
          required
        >
          <option value="">
            Izaberite radno mesto
          </option>

          {jobPositions.map(
            (jobPosition) => (
              <option
                key={jobPosition.id}
                value={jobPosition.id}
              >
                {jobPosition.name}
              </option>
            ),
          )}
        </select>
      </div>

      <div style={twoColumnsStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Vrsta pregleda *
          </label>

          <select
            value={examinationType}
            onChange={(event) =>
              setExaminationType(
                event.target.value,
              )
            }
            style={inputStyle}
          >
            <option value="PREVIOUS">
              Prethodni pregled
            </option>

            <option value="PERIODIC">
              Periodični pregled
            </option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Interval (meseci) *
          </label>

          <input
            type="number"
            min="1"
            value={intervalMonths}
            onChange={(event) =>
              setIntervalMonths(
                event.target.value,
              )
            }
            style={inputStyle}
            required
          />
        </div>
      </div>

      <div style={twoColumnsStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Datum pregleda *
          </label>

          <input
            type="date"
            value={examinationDate}
            onChange={(event) =>
              setExaminationDate(
                event.target.value,
              )
            }
            style={inputStyle}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Broj izveštaja
          </label>

          <input
            type="text"
            value={reportNumber}
            onChange={(event) =>
              setReportNumber(
                event.target.value,
              )
            }
            style={inputStyle}
          />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>
          Ocena zdravstvene
          sposobnosti
        </label>

        <textarea
          value={fitnessAssessment}
          onChange={(event) =>
            setFitnessAssessment(
              event.target.value,
            )
          }
          style={textareaStyle}
          rows={3}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>
          Mere
        </label>

        <textarea
          value={measures}
          onChange={(event) =>
            setMeasures(
              event.target.value,
            )
          }
          style={textareaStyle}
          rows={3}
        />
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          ...submitButtonStyle,
          opacity:
            saving ? 0.6 : 1,
        }}
      >
        {saving
          ? 'Čuvanje...'
          : 'Sačuvaj postojeći pregled'}
      </button>
    </form>
  )
}

const formStyle:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginTop: 16,
  padding: 16,
  border: '1px solid #bbf7d0',
  borderRadius: 8,
  background: '#f0fdf4',
}

const twoColumnsStyle:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

const fieldStyle:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const labelStyle:
  React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
}

const inputStyle:
  React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontSize: 14,
}

const textareaStyle:
  React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit',
}

const submitButtonStyle:
  React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 16px',
  border: 0,
  borderRadius: 7,
  background: '#16a34a',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const errorStyle:
  React.CSSProperties = {
  padding: 12,
  border: '1px solid #fecaca',
  borderRadius: 7,
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 700,
}

const successStyle:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  marginTop: 16,
  padding: 14,
  border: '1px solid #bbf7d0',
  borderRadius: 8,
  background: '#f0fdf4',
  color: '#166534',
}

const reloadButtonStyle:
  React.CSSProperties = {
  padding: '9px 13px',
  border: '1px solid #16a34a',
  borderRadius: 7,
  background: '#ffffff',
  color: '#15803d',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}