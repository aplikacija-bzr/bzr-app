import type { CSSProperties } from 'react'
import Link from 'next/link'

import type { Employee } from '@/lib/employees'

import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import InfoRow from '@/components/ui/InfoRow'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'

type MedicalExamination = {
  id: string
  employer_job_position_id: string
  job_position_name: string
  examination_type: string
  examination_date: string | null
  next_examination_date: string | null
  report_number: string | null
  status: string
}

type EmployeeProfileProps = {
  employerId: string
  employee: Employee
  medicalExaminations?: MedicalExamination[]
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return '—'
  }

  const [year, month, day] =
    value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}.`
}

function getExaminationTypeLabel(
  value: string,
) {
  if (value === 'PERIODIC') {
    return 'Periodični pregled'
  }

  if (value === 'PREVIOUS') {
    return 'Prethodni pregled'
  }

  return value
}

export default function EmployeeProfile({
  employerId,
  employee,
  medicalExaminations = [],
}: EmployeeProfileProps) {
  return (
    <PageContainer>
      <PageHeader
        backHref={`/employers/${employerId}`}
        backLabel="Nazad na poslodavca"
        title={`${employee.first_name} ${employee.last_name}`}
        status={
          <Badge
            variant={
              employee.active
                ? 'success'
                : 'danger'
            }
          >
            {employee.active
              ? 'Aktivan'
              : 'Neaktivan'}
          </Badge>
        }
        actions={
          <Link
            href={`/employers/${employerId}/employees/${employee.id}/edit`}
            style={editEmployeeLink}
          >
            Izmeni zaposlenog
          </Link>
        }
      />

      <div style={cards}>
        <Card title="Osnovni podaci">
          <InfoRow
            label="JMBG"
            value={employee.jmbg ?? '—'}
          />

          <InfoRow
            label="Datum rođenja"
            value={employee.date_of_birth ?? '—'}
          />

          <InfoRow
            label="Mesto rođenja"
            value={employee.place_of_birth ?? '—'}
          />
        </Card>

        <Card title="Radna mesta">
          <div style={jobHeader}>
            <div>
              Broj radnih mesta:{' '}
              <strong>
                {employee.job_positions.length}
              </strong>
            </div>

            <Link
              href={`/employers/${employerId}/employees/${employee.id}/job-positions/new`}
              style={addJobLink}
            >
              + Dodaj radno mesto
            </Link>
          </div>

          {employee.job_positions.length > 0 ? (
            <div style={jobList}>
              {employee.job_positions.map(
                (jobPosition) => (
                  <div
                    key={jobPosition.id}
                    style={jobListItem}
                  >
                    <div style={jobName}>
                      {jobPosition.name}
                    </div>

                    <Link
                      href={`/employers/${employerId}/job-positions/${jobPosition.job_position_id}`}
                      style={openJobLink}
                    >
                      Otvori radno mesto
                    </Link>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p style={emptyText}>—</p>
          )}
        </Card>

        <Card title="Lekarski pregledi">
          {medicalExaminations.length > 0 ? (
            <div style={medicalList}>
              {medicalExaminations.map(
                (examination) => (
                  <div
                    key={examination.id}
                    style={medicalItem}
                  >
                    <div style={medicalContent}>
                      <div style={medicalJobName}>
                        {examination.job_position_name}
                      </div>

                      <div style={medicalDetails}>
                        <span>
                          {getExaminationTypeLabel(
                            examination.examination_type,
                          )}
                        </span>

                        <span>
                          Poslednji pregled:{' '}
                          <strong>
                            {formatDate(
                              examination.examination_date,
                            )}
                          </strong>
                        </span>

                        <span>
                          Sledeći pregled:{' '}
                          <strong>
                            {formatDate(
                              examination.next_examination_date,
                            )}
                          </strong>
                        </span>

                        <span>
                          Broj izveštaja:{' '}
                          <strong>
                            {examination.report_number ??
                              '—'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/lekarski-pregledi/evidentiraj?recordId=${encodeURIComponent(
                        examination.id,
                      )}`}
                      style={recordMedicalLink}
                    >
                      Evidentiraj obavljeni pregled
                    </Link>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p style={emptyText}>
              Nema učitanih lekarskih pregleda.
            </p>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}

const cards: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 20,
  alignItems: 'start',
}

const jobHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 16,
}

const addJobLink: CSSProperties = {
  display: 'inline-block',
  padding: '10px 16px',
  borderRadius: '7px',
  background: '#16a34a',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const jobList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const jobListItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
}

const jobName: CSSProperties = {
  fontWeight: 700,
  color: '#111827',
}

const openJobLink: CSSProperties = {
  display: 'inline-block',
  padding: '9px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  background: '#ffffff',
  color: '#0f172a',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const medicalList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const medicalItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#ffffff',
  flexWrap: 'wrap',
}

const medicalContent: CSSProperties = {
  flex: 1,
  minWidth: 260,
}

const medicalJobName: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#111827',
}

const medicalDetails: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 16px',
  marginTop: 8,
  color: '#64748b',
  fontSize: 12,
}

const recordMedicalLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 13px',
  border: '1px solid #16a34a',
  borderRadius: 7,
  background: '#ffffff',
  color: '#15803d',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const editEmployeeLink: CSSProperties = {
  display: 'inline-block',
  padding: '10px 16px',
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  background: '#ffffff',
  color: '#0f172a',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const emptyText: CSSProperties = {
  margin: 0,
  color: '#64748b',
}