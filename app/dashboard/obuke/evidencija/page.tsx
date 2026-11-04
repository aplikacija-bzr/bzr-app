import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type PageProps = {
  searchParams?: Promise<{
    employerId?: string
    recordId?: string
  }>
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${day}.${month}.${year}.`
}

async function updateTrainingRecord(formData: FormData) {
  'use server'

  const recordId = String(formData.get('recordId') ?? '')
  const trainingDate = String(formData.get('trainingDate') ?? '')
  const assessmentDate = String(formData.get('assessmentDate') ?? '')

  if (!recordId) throw new Error('Nedostaje ID evidencije obuke.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('training_records')
    .update({
      training_date: trainingDate || null,
      assessment_date: assessmentDate || null,
    })
    .eq('id', recordId)

  if (error) {
    throw new Error(error.message || 'Greška pri čuvanju datuma obuke.')
  }

  revalidatePath('/dashboard/obuke/evidencija')
}

export default async function TrainingRecordsPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedEmployerId = params.employerId ?? ''
  const selectedRecordId = params.recordId ?? ''

  const supabase = await createClient()

  const {
    data: employers,
    error: employersError,
  } = await supabase
    .from('employers')
    .select('id, name')
    .eq('active', true)
    .order('name', {
      ascending: true,
    })

  if (employersError) {
    throw new Error(
      employersError.message ||
        'Greška pri učitavanju poslodavaca.'
    )
  }

  let records: any[] = []

  if (selectedEmployerId) {
    const {
      data,
      error,
    } = await supabase
      .from('training_records')
      .select(`
        id,
        employer_id,
        employee_id,
        employer_job_position_id,
        training_date,
        assessment_date,
        interval_months,
        next_training_date,
        reminder_date,
        status,
        employees (
          first_name,
          last_name
        ),
        employer_job_positions (
          internal_name,
          job_positions (
            name
          )
        )
      `)
      .eq('employer_id', selectedEmployerId)

    if (error) {
      throw new Error(
        error.message ||
          'Greška pri učitavanju evidencije obuka.'
      )
    }

    records = data ?? []
  }

  const selectedEmployer =
    employers?.find(
      (employer) => employer.id === selectedEmployerId
    ) ?? null

  const sortedRecords = [...records].sort((a, b) => {
    const aEmployee = Array.isArray(a.employees)
      ? a.employees[0]
      : a.employees

    const bEmployee = Array.isArray(b.employees)
      ? b.employees[0]
      : b.employees

    const aName =
      `${aEmployee?.last_name ?? ''} ${
        aEmployee?.first_name ?? ''
      }`.trim()

    const bName =
      `${bEmployee?.last_name ?? ''} ${
        bEmployee?.first_name ?? ''
      }`.trim()

    return aName.localeCompare(bName, 'sr')
  })

  return (
    <div
      style={{
        maxWidth: 1500,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1,
            color: '#6b7280',
          }}
        >
          OBUKE ZA BEZBEDAN I ZDRAV RAD
        </div>

        <h1
          style={{
            marginTop: 6,
            marginBottom: 8,
            fontSize: 30,
          }}
        >
          Evidencija obučenosti zaposlenih
        </h1>

        <div
          style={{
            color: '#4b5563',
          }}
        >
          Pregled rokova obuke i provere obučenosti po
          poslodavcu.
        </div>
      </div>

      <div
        style={{
          padding: 20,
          border: '1px solid #d1d5db',
          borderRadius: 14,
          backgroundColor: '#ffffff',
          marginBottom: 24,
        }}
      >
        <form
          method="GET"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: '1 1 400px',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Poslodavac
            </label>

            <select
              name="employerId"
              defaultValue={selectedEmployerId}
              style={{
                width: '100%',
                minHeight: 44,
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">
                Izaberite poslodavca
              </option>

              {(employers ?? []).map((employer) => (
                <option
                  key={employer.id}
                  value={employer.id}
                >
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              minHeight: 44,
              minWidth: 130,
              padding: '10px 20px',
              border: 0,
              borderRadius: 8,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Prikaži
          </button>
        </form>
      </div>

      {!selectedEmployerId ? (
        <div
          style={{
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 14,
            backgroundColor: '#ffffff',
            color: '#4b5563',
          }}
        >
          Izaberite poslodavca da biste otvorili
          evidenciju obuka.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <strong>
                {selectedEmployer?.name ??
                  'Izabrani poslodavac'}
              </strong>
            </div>

            <div
              style={{
                fontWeight: 700,
                color: '#4b5563',
              }}
            >
              Broj zapisa: {sortedRecords.length}
            </div>
          </div>

          <div
            style={{
              overflowX: 'auto',
              border: '1px solid #d1d5db',
              borderRadius: 14,
              backgroundColor: '#ffffff',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: 1200,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <th style={headerCell}>R.br.</th>

                  <th style={headerCell}>
                    Ime i prezime zaposlenog
                  </th>

                  <th style={headerCell}>
                    Radno mesto
                  </th>

                  <th style={headerCell}>
                    Datum obuke
                  </th>

                  <th style={headerCell}>
                    Datum provere obučenosti
                  </th>

                  <th style={headerCell}>
                    Period provere
                  </th>

                  <th style={headerCell}>
                    Datum sledeće obuke
                  </th>

                  <th style={headerCell}>
                    Podsetnik
                  </th>
                  <th style={headerCell}>
                    Akcija
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        color: '#6b7280',
                      }}
                    >
                      Za ovog poslodavca nema zapisa u
                      evidenciji obuka.
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record, index) => {
                    const employee = Array.isArray(
                      record.employees
                    )
                      ? record.employees[0]
                      : record.employees

                    const employerJobPosition =
                      Array.isArray(
                        record.employer_job_positions
                      )
                        ? record
                            .employer_job_positions[0]
                        : record.employer_job_positions

                    const jobPosition = Array.isArray(
                      employerJobPosition?.job_positions
                    )
                      ? employerJobPosition
                          .job_positions[0]
                      : employerJobPosition?.job_positions

                    const jobPositionName =
                      employerJobPosition?.internal_name ||
                      jobPosition?.name ||
                      '—'

                    return (
                      <tr
                        key={record.id}
                        style={
                          selectedRecordId === record.id
                            ? {
                                backgroundColor: '#fff7ed',
                                outline: '2px solid #fb923c',
                                outlineOffset: '-2px',
                              }
                            : undefined
                        }
                      >
                        <td style={bodyCell}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...bodyCell,
                            fontWeight: 700,
                          }}
                        >
                          {employee?.last_name ?? ''}{' '}
                          {employee?.first_name ?? ''}
                        </td>

                        <td style={bodyCell}>
                          {jobPositionName}
                        </td>

                        <td style={bodyCell}>
                          {formatDate(
                            record.training_date
                          )}
                        </td>

                        <td style={bodyCell}>
                          {formatDate(
                            record.assessment_date
                          )}
                        </td>

                        <td style={bodyCell}>
                          {record.interval_months
                            ? `${record.interval_months} meseci`
                            : '12 meseci'}
                        </td>

                        <td style={bodyCell}>
                          {formatDate(
                            record.next_training_date
                          )}
                        </td>

                        <td style={bodyCell}>
                          {formatDate(
                            record.reminder_date
                          )}
                        </td>
                        <td style={bodyCell}>
                          <details
                            open={selectedRecordId === record.id}
                          >
                            <summary
                              style={{
                                cursor: 'pointer',
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Izmeni
                            </summary>

                            <form
                              action={updateTrainingRecord}
                              style={{
                                marginTop: 12,
                                minWidth: 240,
                                padding: 12,
                                border: '1px solid #d1d5db',
                                borderRadius: 10,
                                backgroundColor: '#f8fafc',
                              }}
                            >
                              <input
                                type="hidden"
                                name="recordId"
                                value={record.id}
                              />

                              <label style={editLabel}>Datum obuke</label>
                              <input
                                type="date"
                                name="trainingDate"
                                defaultValue={record.training_date ?? ''}
                                style={dateInput}
                              />

                              <label style={{ ...editLabel, marginTop: 10 }}>
                                Datum provere obučenosti
                              </label>
                              <input
                                type="date"
                                name="assessmentDate"
                                defaultValue={record.assessment_date ?? ''}
                                style={dateInput}
                              />

                              <button type="submit" style={saveButton}>
                                Sačuvaj
                              </button>
                            </form>
                          </details>

                          {record.training_date &&
                            record.assessment_date && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: '6px 8px',
                                  border: '1px solid #22c55e',
                                  borderRadius: 7,
                                  backgroundColor: '#f0fdf4',
                                  color: '#166534',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  textAlign: 'center',
                                }}
                              >
                                SAČUVANO
                              </div>
                            )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const headerCell: React.CSSProperties = {
  padding: '12px 10px',
  borderBottom: '1px solid #d1d5db',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const bodyCell: React.CSSProperties = {
  padding: '11px 10px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: 14,
  verticalAlign: 'top',
}
const editLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
}

const dateInput: React.CSSProperties = {
  width: '100%',
  minHeight: 38,
  padding: '7px 9px',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
}

const saveButton: React.CSSProperties = {
  width: '100%',
  minHeight: 38,
  marginTop: 12,
  padding: '8px 12px',
  border: 0,
  borderRadius: 7,
  fontWeight: 800,
  cursor: 'pointer',
}