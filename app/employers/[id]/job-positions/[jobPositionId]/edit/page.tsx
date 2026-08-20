import Link from 'next/link'
import {
  notFound,
  redirect,
} from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  getEmployerJobPositionByJobPositionId,
} from '@/lib/employer-job-positions'

type EditEmployerJobPositionPageProps = {
  params: Promise<{
    id: string
    jobPositionId: string
  }>
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
  background: '#ffffff',
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '170px',
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

export default async function EditEmployerJobPositionPage({
  params,
}: EditEmployerJobPositionPageProps) {
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
  const employerJobPositionId =
  jobPosition.id

  async function updateEmployerJobPosition(
    formData: FormData,
  ) {
    'use server'

    const supabase =
      await createClient()

    const internalName =
      String(
        formData.get(
          'internal_name',
        ) ?? '',
      ).trim()

    const organizationalUnit =
      String(
        formData.get(
          'organizational_unit',
        ) ?? '',
      ).trim()

    const jobDescription =
      String(
        formData.get(
          'job_description',
        ) ?? '',
      ).trim()

    const increasedRiskValue =
      String(
        formData.get(
          'increased_risk',
        ) ?? '',
      ).trim()

    if (
      increasedRiskValue !== 'true' &&
      increasedRiskValue !== 'false'
    ) {
      throw new Error(
        'Morate označiti da li je radno mesto sa povećanim rizikom.',
      )
    }

    const increasedRisk =
      increasedRiskValue === 'true'

    const { error } =
      await supabase
        .from(
          'employer_job_positions',
        )
        .update({
          internal_name:
            internalName || null,
          organizational_unit:
            organizationalUnit || null,
          job_description:
            jobDescription || null,
          increased_risk:
            increasedRisk,
        })
        .eq(
  'id',
  employerJobPositionId,
)
        .eq(
          'employer_id',
          id,
        )

    if (error) {
      throw error
    }

    revalidatePath(
      `/employers/${id}`,
    )

    revalidatePath(
      `/employers/${id}/job-positions/${jobPositionId}`,
    )

    redirect(
      `/employers/${id}/job-positions/${jobPositionId}`,
    )
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
          href={`/employers/${id}/job-positions/${jobPositionId}`}
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na radno mesto
        </Link>

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Izmeni radno mesto
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          {jobPosition.name}
        </p>
      </div>

      <form
        action={
          updateEmployerJobPosition
        }
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          <div>
            <label
              htmlFor="internal_name"
              style={labelStyle}
            >
              Naziv radnog mesta kod poslodavca
            </label>

            <input
              id="internal_name"
              name="internal_name"
              defaultValue={
                jobPosition.internal_name ??
                ''
              }
              placeholder={jobPosition.name}
              style={inputStyle}
            />

            <p
              style={{
                marginTop: 7,
                marginBottom: 0,
                color: '#64748b',
                fontSize: 13,
              }}
            >
              Ako ostane prazno, koristiće se naziv iz šifarnika:
              {' '}
              <strong>
                {jobPosition.name}
              </strong>
            </p>
          </div>

          <div>
            <label
              htmlFor="organizational_unit"
              style={labelStyle}
            >
              Organizaciona jedinica
            </label>

            <input
              id="organizational_unit"
              name="organizational_unit"
              defaultValue={
                jobPosition.organizational_unit ??
                ''
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="job_description"
              style={labelStyle}
            >
              Opis poslova
            </label>

            <textarea
              id="job_description"
              name="job_description"
              defaultValue={
                jobPosition.job_description ??
                ''
              }
              style={textareaStyle}
            />
          </div>

          <div>
            <label
              htmlFor="increased_risk"
              style={labelStyle}
            >
              Radno mesto sa povećanim rizikom *
            </label>

            <select
              id="increased_risk"
              name="increased_risk"
              required
              defaultValue={
                jobPosition.increased_risk
                  ? 'true'
                  : 'false'
              }
              style={inputStyle}
            >
              <option value="true">
                Da
              </option>

              <option value="false">
                Ne
              </option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Link
            href={`/employers/${id}/job-positions/${jobPositionId}`}
            style={{
              padding: '11px 18px',
              border: '1px solid #d1d5db',
              borderRadius: '7px',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 700,
            }}
          >
            Otkaži
          </Link>

          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: '7px',
              padding: '11px 20px',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Sačuvaj izmene
          </button>
        </div>
      </form>
    </main>
  )
}