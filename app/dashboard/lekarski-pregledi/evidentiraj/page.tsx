import Link from 'next/link'

import {
  createClient,
} from '@/lib/supabase/server'

import DirectMedicalExaminationForm from './DirectMedicalExaminationForm'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    recordId?: string
  }>
}

function formatDate(
  value: string | null,
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

export default async function EvidentirajPregledPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams

  const recordId =
    params.recordId ?? ''

  if (!recordId) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>
            Evidentiraj obavljen lekarski pregled
          </h1>

          <div style={errorStyle}>
            Nedostaje ID prethodnog pregleda.
          </div>

          <Link
            href="/dashboard"
            style={backLinkStyle}
          >
            ← Vrati se na Radni sto
          </Link>
        </section>
      </main>
    )
  }

  const supabase =
    await createClient()

  // -----------------------------------------
  // PRETHODNI LEKARSKI PREGLED
  // -----------------------------------------

  const {
    data: record,
    error: recordError,
  } = await supabase
    .from(
      'medical_examination_records',
    )
    .select(`
      id,
      employer_id,
      employee_id,
      employer_job_position_id,
      examination_type,
      interval_months,
      examination_date,
      next_examination_date,
      report_number,
      fitness_assessment,
      measures,
      status
    `)
    .eq(
      'id',
      recordId,
    )
    .maybeSingle()

  if (
    recordError ||
    !record
  ) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>
            Evidentiraj obavljen lekarski pregled
          </h1>

          <div style={errorStyle}>
            Prethodni lekarski pregled nije pronađen.
          </div>

          <Link
            href="/dashboard"
            style={backLinkStyle}
          >
            ← Vrati se na Radni sto
          </Link>
        </section>
      </main>
    )
  }

  // -----------------------------------------
  // POSLODAVAC
  // -----------------------------------------

  const {
    data: employer,
  } = await supabase
    .from('employers')
    .select(`
      id,
      name
    `)
    .eq(
      'id',
      record.employer_id,
    )
    .maybeSingle()

  // -----------------------------------------
  // ZAPOSLENI
  // -----------------------------------------

  const {
    data: employee,
  } = await supabase
    .from('employees')
    .select(`
      id,
      first_name,
      last_name
    `)
    .eq(
      'id',
      record.employee_id,
    )
    .maybeSingle()

  // -----------------------------------------
  // RADNO MESTO
  // -----------------------------------------

  const {
    data: employerJobPosition,
  } = await supabase
    .from(
      'employer_job_positions',
    )
    .select(`
      id,
      job_positions (
        name
      )
    `)
    .eq(
      'id',
      record.employer_job_position_id,
    )
    .maybeSingle()

  const relation =
    employerJobPosition
      ?.job_positions

  const jobPosition =
    Array.isArray(relation)
      ? relation[0]
      : relation

  const employeeName =
    [
      employee?.first_name,
      employee?.last_name,
    ]
      .filter(Boolean)
      .join(' ')

  const examinationTypeLabel =
    record.examination_type ===
    'PERIODIC'
      ? 'Periodični pregled'
      : record.examination_type ===
          'PREVIOUS'
        ? 'Prethodni pregled'
        : record.examination_type

  const intervalMonths =
    record.interval_months ?? 0

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Evidentiraj obavljen lekarski pregled
              </h1>

              <p style={subtitleStyle}>
                Evidentiranje pregleda koji je već
                obavljen bez prethodnog generisanja
                uputa kroz platformu.
              </p>
            </div>

            <Link
              href="/dashboard"
              style={backLinkStyle}
            >
              ← Vrati se na Radni sto
            </Link>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              Zaposleni i pregled
            </h2>

            <div style={gridStyle}>
              <InfoField
                label="Poslodavac"
                value={
                  employer?.name ??
                  '—'
                }
              />

              <InfoField
                label="Zaposleni"
                value={
                  employeeName ||
                  '—'
                }
              />

              <InfoField
                label="Radno mesto"
                value={
                  jobPosition?.name ??
                  '—'
                }
              />

              <InfoField
                label="Vrsta pregleda"
                value={
                  examinationTypeLabel
                }
              />

              <InfoField
                label="Interval"
                value={
                  intervalMonths
                    ? `${intervalMonths} meseci`
                    : '—'
                }
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              Prethodni pregled
            </h2>

            <div style={gridStyle}>
              <InfoField
                label="Datum pregleda"
                value={formatDate(
                  record.examination_date,
                )}
              />

              <InfoField
                label="Broj izveštaja"
                value={
                  record.report_number ??
                  '—'
                }
              />

              <InfoField
                label="Sledeći pregled"
                value={formatDate(
                  record.next_examination_date,
                )}
              />
            </div>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <InfoField
                label="Prethodna ocena sposobnosti"
                value={
                  record.fitness_assessment ??
                  '—'
                }
              />
            </div>

            {record.measures && (
              <div
                style={{
                  marginTop: 16,
                }}
              >
                <InfoField
                  label="Prethodne mere"
                  value={
                    record.measures
                  }
                />
              </div>
            )}
          </div>

          <div style={newSectionStyle}>
            <h2 style={sectionTitleStyle}>
              Novi obavljeni pregled
            </h2>

            {intervalMonths > 0 ? (
              <DirectMedicalExaminationForm
                previousRecordId={
                  record.id
                }
                intervalMonths={
                  intervalMonths
                }
                previousFitnessAssessment={
                  record.fitness_assessment
                }
              />
            ) : (
              <div style={errorStyle}>
                Za ovaj pregled nije definisan
                interval. Novi pregled nije moguće
                evidentirati dok se interval ne
                definiše.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={infoFieldStyle}>
      <div style={labelStyle}>
        {label}
      </div>

      <div style={valueStyle}>
        {value}
      </div>
    </div>
  )
}

const pageStyle:
  React.CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: 24,
}

const containerStyle:
  React.CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
}

const cardStyle:
  React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 24,
}

const headerStyle:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 24,
  flexWrap: 'wrap',
}

const titleStyle:
  React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
}

const subtitleStyle:
  React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: '#64748b',
  lineHeight: 1.5,
}

const backLinkStyle:
  React.CSSProperties = {
  display: 'inline-block',
  padding: '9px 13px',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  textDecoration: 'none',
}

const sectionStyle:
  React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  background: '#ffffff',
}

const newSectionStyle:
  React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  border: '1px solid #bfdbfe',
  borderRadius: 10,
  background: '#eff6ff',
}

const sectionTitleStyle:
  React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 18,
  fontWeight: 800,
  color: '#111827',
}

const gridStyle:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

const infoFieldStyle:
  React.CSSProperties = {
  padding: 14,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: '#f8fafc',
}

const labelStyle:
  React.CSSProperties = {
  marginBottom: 5,
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b',
}

const valueStyle:
  React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#111827',
  lineHeight: 1.4,
}

const errorStyle:
  React.CSSProperties = {
  marginTop: 16,
  marginBottom: 16,
  padding: 14,
  border: '1px solid #fecaca',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 700,
}