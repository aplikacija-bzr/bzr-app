import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  getEmployerJobPositionByJobPositionId,
} from '@/lib/employer-job-positions'

type EmployerJobPositionPageProps = {
  params: Promise<{
    id: string
    jobPositionId: string
  }>
}

export default async function EmployerJobPositionPage({
  params,
}: EmployerJobPositionPageProps) {
  const {
    id,
    jobPositionId,
  } = await params

  const jobPosition =
    await getEmployerJobPositionByJobPositionId(
      id,
      jobPositionId,
    )

  if (!jobPosition) {
    notFound()
  }

  return (
    <main
      style={{
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          marginBottom: '28px',
        }}
      >
        <Link
          href={`/employers/${id}`}
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na poslodavca
        </Link>

        <div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  }}
>
  <h1
    style={{
      margin: 0,
      fontSize: '30px',
      fontWeight: 800,
      color: '#111827',
    }}
  >
    {jobPosition.internal_name ||
      jobPosition.name}
  </h1>

  <Link
    href={`/employers/${id}/job-positions/${jobPositionId}/edit`}
    style={{
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
    }}
  >
    Izmeni radno mesto
  </Link>
</div>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Detalji radnog mesta kod
          poslodavca.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '20px',
        }}
      >
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '22px',
              color: '#111827',
            }}
          >
            Osnovni podaci
          </h2>

          <div
            style={{
              display: 'grid',
              gap: '14px',
            }}
          >
            <div>
              <strong>
                Naziv radnog mesta:
              </strong>{' '}
              {jobPosition.internal_name ||
                jobPosition.name}
            </div>

            {jobPosition.internal_name && (
              <div>
                <strong>
                  Naziv u šifarniku:
                </strong>{' '}
                {jobPosition.name}
              </div>
            )}

            <div>
              <strong>
                Organizaciona jedinica:
              </strong>{' '}
              {jobPosition.organizational_unit ||
                '—'}
            </div>
          </div>
        </section>

        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '22px',
              color: '#111827',
            }}
          >
            Opis poslova
          </h2>

          {jobPosition.job_description ? (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                color: '#374151',
                fontSize: '15px',
              }}
            >
              {jobPosition.job_description}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                color: '#64748b',
              }}
            >
              Opis poslova nije unet.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}