import Link from 'next/link'
import {
  notFound,
  redirect,
} from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getEmployeeById } from '@/lib/employees'
import {
  getEmployerJobPositionsByEmployerId,
} from '@/lib/employer-job-positions'

type NewEmployeeJobPositionPageProps = {
  params: Promise<{
    id: string
    employeeId: string
  }>
}

const selectStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
  background: '#ffffff',
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

export default async function NewEmployeeJobPositionPage({
  params,
}: NewEmployeeJobPositionPageProps) {
  const {
    id,
    employeeId,
  } = await params

  const employee =
    await getEmployeeById(employeeId)

  if (
    !employee ||
    employee.employer_id !== id
  ) {
    notFound()
  }

  const jobPositions =
    await getEmployerJobPositionsByEmployerId(
      id,
    )

  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('employee_job_positions')
      .select(`
        employer_job_position_id
      `)
      .eq('employee_id', employeeId)
      .eq('active', true)

  if (error) {
    throw error
  }

  const assignedJobPositionIds =
    new Set(
      (data ?? []).map(
        (item) =>
          item.employer_job_position_id,
      ),
    )

  const availableJobPositions =
    jobPositions.filter(
      (jobPosition) =>
        !assignedJobPositionIds.has(
          jobPosition.id,
        ),
    )

  async function createEmployeeJobPosition(
    formData: FormData,
  ) {
    'use server'

    const supabase =
      await createClient()

    const employerJobPositionId =
      String(
        formData.get(
          'employer_job_position_id',
        ) ?? '',
      ).trim()

    const startDate =
      String(
        formData.get(
          'start_date',
        ) ?? '',
      ).trim()

    if (!employerJobPositionId) {
      throw new Error(
        'Radno mesto je obavezno.',
      )
    }

    if (!startDate) {
      throw new Error(
        'Datum početka rada na radnom mestu je obavezan.',
      )
    }

    /*
     * Provera da izabrano radno mesto
     * zaista pripada ovom poslodavcu.
     */
    const {
      data: employerJobPosition,
      error:
        employerJobPositionError,
    } =
      await supabase
        .from(
          'employer_job_positions',
        )
        .select('id')
        .eq(
          'id',
          employerJobPositionId,
        )
        .eq('employer_id', id)
        .eq('active', true)
        .maybeSingle()

    if (employerJobPositionError) {
      throw employerJobPositionError
    }

    if (!employerJobPosition) {
      throw new Error(
        'Izabrano radno mesto ne pripada ovom poslodavcu.',
      )
    }

    /*
     * Provera da zaposleni već nema
     * aktivnu vezu sa ovim radnim mestom.
     */
    const {
      data: existingRelation,
      error: existingRelationError,
    } =
      await supabase
        .from(
          'employee_job_positions',
        )
        .select('id')
        .eq(
          'employee_id',
          employeeId,
        )
        .eq(
          'employer_job_position_id',
          employerJobPositionId,
        )
        .eq('active', true)
        .maybeSingle()

    if (existingRelationError) {
      throw existingRelationError
    }

    if (existingRelation) {
      throw new Error(
        'Zaposleni je već raspoređen na ovo radno mesto.',
      )
    }

    /*
     * Proveravamo da li zaposleni
     * već ima neko aktivno radno mesto.
     * Ako nema, prvo radno mesto postaje primarno.
     */
    const {
      count,
      error: countError,
    } =
      await supabase
        .from(
          'employee_job_positions',
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq(
          'employee_id',
          employeeId,
        )
        .eq('active', true)

    if (countError) {
      throw countError
    }

    const isPrimary =
      (count ?? 0) === 0

    const { error: insertError } =
      await supabase
        .from(
          'employee_job_positions',
        )
        .insert({
          employee_id:
            employeeId,
          employer_job_position_id:
            employerJobPositionId,
          start_date:
            startDate,
          primary_position:
            isPrimary,
          active: true,
        })

    if (insertError) {
      throw insertError
    }

    revalidatePath(
      `/employers/${id}`,
    )

    revalidatePath(
      `/employers/${id}/employees/${employeeId}`,
    )

    redirect(
      `/employers/${id}/employees/${employeeId}`,
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
          href={`/employers/${id}/employees/${employeeId}`}
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na zaposlenog
        </Link>

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Dodaj radno mesto
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Zaposleni:{' '}
          <strong>
            {employee.first_name}{' '}
            {employee.last_name}
          </strong>
        </p>
      </div>

      <form
        action={
          createEmployeeJobPosition
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
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '20px',
          }}
        >
          <div
            style={{
              gridColumn: '1 / -1',
            }}
          >
            <label
              htmlFor="employer_job_position_id"
              style={labelStyle}
            >
              Radno mesto *
            </label>

            <select
              id="employer_job_position_id"
              name="employer_job_position_id"
              required
              defaultValue=""
              style={selectStyle}
            >
              <option
                value=""
                disabled
              >
                Izaberi radno mesto
              </option>

              {availableJobPositions.map(
                (jobPosition) => (
                  <option
                    key={jobPosition.id}
                    value={jobPosition.id}
                  >
                    {jobPosition.internal_name ||
                      jobPosition.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="start_date"
              style={labelStyle}
            >
              Datum početka rada na radnom mestu *
            </label>

            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '18px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Broj dostupnih radnih mesta:{' '}
          <strong>
            {availableJobPositions.length}
          </strong>
        </div>

        {availableJobPositions.length === 0 && (
          <div
            style={{
              marginTop: '18px',
              padding: '14px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Nema dostupnih radnih mesta za
            povezivanje sa ovim zaposlenim.
          </div>
        )}

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
            href={`/employers/${id}/employees/${employeeId}`}
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
            disabled={
              availableJobPositions.length === 0
            }
            style={{
              border: 0,
              borderRadius: '7px',
              padding: '11px 20px',
              background:
                availableJobPositions.length === 0
                  ? '#9ca3af'
                  : '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              cursor:
                availableJobPositions.length === 0
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            Sačuvaj radno mesto
          </button>
        </div>
      </form>
    </main>
  )
}