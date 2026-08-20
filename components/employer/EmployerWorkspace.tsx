import type { CSSProperties } from 'react'
import Link from 'next/link'

import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import InfoRow from '@/components/ui/InfoRow'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'

import EmployeesList from '@/components/employer/EmployeesList'

import type { Employer } from '@/lib/employers'
import type { Employee } from '@/lib/employees'
import type {
  EmployerJobPosition,
} from '@/lib/employer-job-positions'

type EmployerWorkspaceProps = {
  employer: Employer
  employees: Employee[]
  jobPositions: EmployerJobPosition[]
}

export default function EmployerWorkspace({
  employer,
  employees,
  jobPositions,
}: EmployerWorkspaceProps) {
  return (
    <PageContainer>
      <PageHeader
        title={employer.name}
        subtitle={
          employer.code
            ? `Šifra: ${employer.code}`
            : undefined
        }
        backHref="/employers"
        backLabel="Nazad na poslodavce"
      />

      <div style={layout}>
        <Card
          title="Osnovni podaci"
          subtitle="Poslodavac"
        >
          <div>
            <InfoRow
              label="Naziv"
              value={employer.name}
              labelWidth={130}
            />

            <InfoRow
              label="PIB"
              value={employer.pib}
              labelWidth={130}
            />

            <InfoRow
              label="Matični broj"
              value={employer.registration_number}
              labelWidth={130}
            />

            <InfoRow
              label="Šifra delatnosti"
              value={employer.activity_code}
              labelWidth={130}
            />

            <InfoRow
              label="Šifra"
              value={employer.code}
              labelWidth={130}
            />

            <InfoRow
              label="Adresa"
              value={employer.address}
              labelWidth={130}
            />

            <InfoRow
              label="Mesto"
              value={employer.city}
              labelWidth={130}
            />

            <InfoRow
              label="Kontakt osoba"
              value={employer.contact_person}
              labelWidth={130}
            />

            <InfoRow
              label="Telefon"
              value={employer.contact_phone}
              labelWidth={130}
            />

            <InfoRow
              label="Kontakt e-mail"
              value={employer.contact_email}
              labelWidth={130}
            />

            <InfoRow
              label="Opšti e-mail"
              value={employer.email}
              labelWidth={130}
            />

            <p>
              <strong>Status:</strong>{' '}
              <Badge
                variant={
                  employer.active
                    ? 'success'
                    : 'danger'
                }
              >
                {employer.active
                  ? 'Aktivan'
                  : 'Neaktivan'}
              </Badge>
            </p>
          </div>
        </Card>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <Card
            title="Zaposleni"
            subtitle="Pregled zaposlenih"
          >
            <EmployeesList
              employerId={employer.id}
              employees={employees}
            />
          </Card>

          <Card
            title="Radna mesta"
            subtitle="Radna mesta kod poslodavca"
          >
            <div>
              <div style={jobPositionsHeader}>
                <p
                  style={{
                    margin: 0,
                    color: '#475569',
                    fontSize: 14,
                  }}
                >
                  Broj radnih mesta:{' '}
                  <strong>
                    {jobPositions.length}
                  </strong>
                </p>

                <Link
                  href={`/employers/${employer.id}/job-positions/new`}
                  style={newJobPositionLink}
                >
                  + Novo radno mesto
                </Link>
              </div>

              {jobPositions.length === 0 ? (
                <div style={emptyState}>
                  Poslodavac nema uneta radna mesta.
                </div>
              ) : (
                <div style={jobPositionsList}>
                  {jobPositions.map(
                    (jobPosition) => (
                      <div
                        key={jobPosition.id}
                        style={jobPositionRow}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#111827',
                            }}
                          >
                            {jobPosition.internal_name ||
                              jobPosition.name}
                          </div>

                          {jobPosition.internal_name && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 13,
                                color: '#64748b',
                              }}
                            >
                              Šifarnik:{' '}
                              {jobPosition.name}
                            </div>
                          )}
                        </div>

                        
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

const layout: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '320px minmax(0, 1fr)',
  gap: 20,
}

const jobPositionsHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 18,
}

const newJobPositionLink: CSSProperties = {
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

const emptyState: CSSProperties = {
  padding: '16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#f8fafc',
  color: '#64748b',
  fontSize: '14px',
}

const jobPositionsList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const jobPositionRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
}