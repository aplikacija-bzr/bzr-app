import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type NewEmployerJobPositionPageProps = {
  params: Promise<{
    id: string
  }>
}

type JobPosition = {
  id: string
  code: string
  name: string
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

const selectStyle = {
  ...inputStyle,
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '150px',
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

function createJobPositionCode(
  name: string,
) {
  const normalized =
    name
      .trim()
      .toUpperCase()
      .replace(/Đ/g, 'DJ')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[^A-Z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      )

  return `RM-${normalized}`
}

export default async function NewEmployerJobPositionPage({
  params,
}: NewEmployerJobPositionPageProps) {
  const { id } = await params

  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('job_positions')
      .select(`
        id,
        code,
        name
      `)
      .eq('active', true)
      .order('sort_order', {
        ascending: true,
      })
      .order('name', {
        ascending: true,
      })

  if (error) {
    throw error
  }

  const jobPositions =
    (data ?? []) as JobPosition[]

  async function createEmployerJobPosition(
    formData: FormData,
  ) {
    'use server'

    const supabase =
      await createClient()

    const selectedJobPositionId =
      String(
        formData.get(
          'job_position_id',
        ) ?? '',
      ).trim()

    const newJobPositionName =
      String(
        formData.get(
          'new_job_position_name',
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
      !selectedJobPositionId &&
      !newJobPositionName
    ) {
      throw new Error(
        'Izaberite postojeće radno mesto ili unesite naziv novog radnog mesta.',
      )
    }

    if (
      selectedJobPositionId &&
      newJobPositionName
    ) {
      throw new Error(
        'Izaberite samo jedan način: postojeće radno mesto ili unos novog radnog mesta.',
      )
    }

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

    let jobPositionId =
      selectedJobPositionId

    /*
     * Ako je uneto NOVO radno mesto,
     * prvo ga dodajemo u centralni
     * šifarnik job_positions.
     */
    if (newJobPositionName) {
      const {
        data: existingByName,
        error: existingByNameError,
      } =
        await supabase
          .from('job_positions')
          .select(`
            id,
            name
          `)
          .ilike(
            'name',
            newJobPositionName,
          )
          .maybeSingle()

      if (existingByNameError) {
        throw existingByNameError
      }

      /*
       * Ako naziv već postoji u šifarniku,
       * koristimo postojeći zapis umesto
       * pravljenja duplikata.
       */
      if (existingByName) {
        jobPositionId =
          existingByName.id
      } else {
        const {
          data: lastPosition,
          error: lastPositionError,
        } =
          await supabase
            .from('job_positions')
            .select('sort_order')
            .order('sort_order', {
              ascending: false,
            })
            .limit(1)
            .maybeSingle()

        if (lastPositionError) {
          throw lastPositionError
        }

        const nextSortOrder =
          (lastPosition
            ?.sort_order ?? 0) + 1

        const baseCode =
          createJobPositionCode(
            newJobPositionName,
          )

        const {
          data: existingCodes,
          error: existingCodesError,
        } =
          await supabase
            .from('job_positions')
            .select('code')
            .like(
              'code',
              `${baseCode}%`,
            )

        if (existingCodesError) {
          throw existingCodesError
        }

        const usedCodes =
          new Set(
            (existingCodes ?? []).map(
              (item) => item.code,
            ),
          )

        let generatedCode =
          baseCode

        let suffix = 2

        while (
          usedCodes.has(
            generatedCode,
          )
        ) {
          generatedCode =
            `${baseCode}-${suffix}`

          suffix += 1
        }

        const {
          data: newJobPosition,
          error:
            newJobPositionError,
        } =
          await supabase
            .from('job_positions')
            .insert({
              code:
                generatedCode,
              name:
                newJobPositionName,
              description:
                null,
              active:
                true,
              sort_order:
                nextSortOrder,
            })
            .select('id')
            .single()

        if (newJobPositionError) {
          throw newJobPositionError
        }

        jobPositionId =
          newJobPosition.id
      }
    }

    if (!jobPositionId) {
      throw new Error(
        'Radno mesto nije određeno.',
      )
    }

    /*
     * Provera da li poslodavac već ima
     * ovo radno mesto.
     */
    const {
      data: existingEmployerPosition,
      error:
        existingEmployerPositionError,
    } =
      await supabase
        .from(
          'employer_job_positions',
        )
        .select(`
          id,
          active
        `)
        .eq(
          'employer_id',
          id,
        )
        .eq(
          'job_position_id',
          jobPositionId,
        )
        .maybeSingle()

    if (
      existingEmployerPositionError
    ) {
      throw existingEmployerPositionError
    }

    if (
      existingEmployerPosition?.active
    ) {
      throw new Error(
        'Ovo radno mesto je već dodato poslodavcu.',
      )
    }

    /*
     * Ako je radno mesto ranije postojalo
     * kod poslodavca ali je bilo deaktivirano,
     * ponovo ga aktiviramo.
     */
    if (
      existingEmployerPosition &&
      !existingEmployerPosition.active
    ) {
      const {
        error: reactivateError,
      } =
        await supabase
          .from(
            'employer_job_positions',
          )
          .update({
            active: true,
            increased_risk:
              increasedRisk,
            job_description:
              jobDescription || null,
            valid_until:
              null,
          })
          .eq(
            'id',
            existingEmployerPosition.id,
          )

      if (reactivateError) {
        throw reactivateError
      }
    } else {
      /*
       * Novo povezivanje radnog mesta
       * sa konkretnim poslodavcem.
       */
      const {
        error: insertError,
      } =
        await supabase
          .from(
            'employer_job_positions',
          )
          .insert({
            employer_id:
              id,
            job_position_id:
              jobPositionId,
            increased_risk:
              increasedRisk,
            job_description:
              jobDescription || null,
            active:
              true,
          })

      if (insertError) {
        throw insertError
      }
    }

    revalidatePath(
      `/employers/${id}`,
    )

    redirect(
      `/employers/${id}`,
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

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Novo radno mesto
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Izaberite postojeće radno mesto
          ili unesite potpuno novo radno mesto.
        </p>
      </div>

      <form
        action={
          createEmployerJobPosition
        }
        style={{
          background: '#ffffff',
          border:
            '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div>
          <label
            htmlFor="job_position_id"
            style={labelStyle}
          >
            Postojeće radno mesto
          </label>

          <select
            id="job_position_id"
            name="job_position_id"
            defaultValue=""
            style={selectStyle}
          >
            <option value="">
              — Ne biram postojeće —
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

        <div
          style={{
            margin:
              '22px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              height: 1,
              flex: 1,
              background:
                '#e5e7eb',
            }}
          />

          <span
            style={{
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ILI
          </span>

          <div
            style={{
              height: 1,
              flex: 1,
              background:
                '#e5e7eb',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="new_job_position_name"
            style={labelStyle}
          >
            Naziv novog radnog mesta
          </label>

          <input
            id="new_job_position_name"
            name="new_job_position_name"
            placeholder="npr. monter vrata i prozora"
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
            Popunjava se samo ako radno
            mesto ne postoji u gornjem
            šifarniku.
          </p>
        </div>

        <div
          style={{
            marginTop: 22,
          }}
        >
          <label
            htmlFor="job_description"
            style={labelStyle}
          >
            Opis poslova
          </label>

          <textarea
            id="job_description"
            name="job_description"
            placeholder="Unesite opis poslova koje zaposleni obavlja na ovom radnom mestu..."
            style={textareaStyle}
          />

          <p
            style={{
              marginTop: 7,
              marginBottom: 0,
              color: '#64748b',
              fontSize: 13,
            }}
          >
            Ovaj opis se čuva za konkretnog
            poslodavca i kasnije ćemo ga
            koristiti u BZR dokumentaciji.
          </p>
        </div>

        <div
          style={{
            marginTop: 22,
          }}
        >
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
            defaultValue=""
            style={selectStyle}
          >
            <option
              value=""
              disabled
            >
              Izaberi
            </option>

            <option value="true">
              Da
            </option>

            <option value="false">
              Ne
            </option>
          </select>
        </div>

        <div
          style={{
            marginTop: '18px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Broj postojećih radnih mesta
          u šifarniku:{' '}
          <strong>
            {jobPositions.length}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            gap: '12px',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop:
              '1px solid #e5e7eb',
          }}
        >
          <Link
            href={`/employers/${id}`}
            style={{
              padding:
                '11px 18px',
              border:
                '1px solid #d1d5db',
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
              padding:
                '11px 20px',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Dodaj radno mesto
          </button>
        </div>
      </form>
    </main>
  )
}