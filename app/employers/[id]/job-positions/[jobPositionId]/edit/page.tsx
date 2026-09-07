import Link from 'next/link'
import {
  notFound,
  redirect,
} from 'next/navigation'
import { revalidatePath } from 'next/cache'

import JobPositionHazardsSelector from '@/components/employers/JobPositionHazardsSelector'
import { addHazardActivity } from './actions'
import { createClient } from '@/lib/supabase/server'
import {
  getEmployerJobPositionByJobPositionId,
  getEmployerJobPositionHazards,
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

  /*
   * Postojeće opasnosti i štetnosti
   * ovog radnog mesta.
   */
  const existingHazards =
    await getEmployerJobPositionHazards(
      employerJobPositionId,
    )

  /*
   * Ceo aktivni šifarnik
   * opasnosti i štetnosti.
   */
  const supabase =
    await createClient()
      const {
    data: fallbackJobDescriptionData,
    error: fallbackJobDescriptionError,
  } =
    await supabase
      .from('employer_job_positions')
      .select(`
        job_description
      `)
      .eq(
        'job_position_id',
        jobPosition.job_position_id,
      )
      .neq(
        'id',
        employerJobPositionId,
      )
      .not(
        'job_description',
        'is',
        null,
      )
      .neq(
        'job_description',
        '',
      )
      .limit(1)
      .maybeSingle()

  if (fallbackJobDescriptionError) {
    throw fallbackJobDescriptionError
  }

  const effectiveJobDescription =
    jobPosition.job_description?.trim()
      ? jobPosition.job_description
      : fallbackJobDescriptionData?.job_description ?? ''

  const {
    data: hazardsData,
    error: hazardsError,
  } =
    await supabase
      .from('hazards')
      .select(`
        id,
        code,
        name,
        category,
        article_number,
        sort_order
      `)
      .eq('active', true)
      .order('sort_order', {
        ascending: true,
      })

  if (hazardsError) {
    throw hazardsError
  }

  const hazards =
    hazardsData ?? []
      const {
    data: hazardActivitiesData,
    error: hazardActivitiesError,
  } =
    await supabase
      .from('hazard_activities')
      .select(`
        id,
        hazard_id,
        activity,
        sort_order
      `)
      .eq('active', true)
      .order('sort_order', {
        ascending: true,
      })

  if (hazardActivitiesError) {
    throw hazardActivitiesError
  }

  const hazardActivities =
    hazardActivitiesData ?? []
  
 

  /*
   * Centralni šifarnik LZO i trenutno propisana
   * LZO za ovo konkretno radno mesto.
   */
  const { data: ppeGroupsData, error: ppeGroupsError } =
    await supabase
      .from('ppe_groups')
      .select(`id, code, name, sort_order`)
      .eq('active', true)
      .order('sort_order', { ascending: true })

  if (ppeGroupsError) throw ppeGroupsError

  const { data: ppeItemsData, error: ppeItemsError } =
    await supabase
      .from('ppe_items')
      .select(`id, ppe_group_id, code, name, description, sort_order`)
      .eq('active', true)
      .order('sort_order', { ascending: true })

  if (ppeItemsError) throw ppeItemsError

  const { data: existingPpeData, error: existingPpeError } =
    await supabase
      .from('employer_job_position_ppe')
      .select(`id, ppe_item_id, required`)
      .eq('employer_job_position_id', employerJobPositionId)

  if (existingPpeError) throw existingPpeError

  const ppeGroups = ppeGroupsData ?? []
  const ppeItems = ppeItemsData ?? []
  const selectedPpeItemIds = new Set(
    (existingPpeData ?? [])
      .filter((item) => item.required)
      .map((item) => item.ppe_item_id),
  )

  /*
   * LZO grupišemo prema ppe_group_id.
   * ID-jeve normalizujemo u string da poređenje
   * bude pouzdano bez obzira na tip koji vrati Supabase.
   */
  const ppeItemsByGroup = new Map<string, typeof ppeItems>()

  for (const item of ppeItems) {
    const groupId = String(item.ppe_group_id)

    const currentItems =
      ppeItemsByGroup.get(groupId) ?? []

    currentItems.push(item)
    ppeItemsByGroup.set(
      groupId,
      currentItems,
    )
  }

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

    /*
     * Sve trenutno čekirane
     * opasnosti i štetnosti.
     */
    const selectedHazardIds =
      formData
        .getAll('hazard_ids')
        .map(
          (value) =>
            String(value).trim(),
        )
        .filter(Boolean)

    const selectedPpeIds =
      formData
        .getAll('ppe_item_ids')
        .map((value) => String(value).trim())
        .filter(Boolean)

    if (
      increasedRiskValue !== 'true' &&
      increasedRiskValue !== 'false'
    ) {
      throw new Error(
        'Morate označiti da li je radno mesto sa povećanim rizikom.',
      )
    }

    /*
     * Za svaku čekiranu stavku
     * čitamo pripadajuće aktivnosti.
     */
    const {
  data: currentHazardActivities,
  error: currentHazardActivitiesError,
} =
  await supabase
    .from('hazard_activities')
    .select(`
      id,
      hazard_id,
      activity
    `)
    .eq('active', true)

if (currentHazardActivitiesError) {
  throw currentHazardActivitiesError
}
    const selectedHazardRows =
      selectedHazardIds.map(
        (hazardId) => {
          const activities =
            String(
              formData.get(
                `hazard_activities_${hazardId}`,
              ) ?? '',
            ).trim()

          if (!activities) {
            throw new Error(
              'Za svaku izabranu opasnost ili štetnost morate uneti aktivnosti pri kojima se javlja.',
            )
          }

          const selectedActivityNames =
  activities
    .replace(/\r/g, '')
    .split('\n')
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean)

const hazardActivityIds =
  (currentHazardActivities ?? [])
    .filter(
      (item) =>
        item.hazard_id === hazardId &&
        selectedActivityNames.includes(
          item.activity.trim(),
        ),
    )
    .map(
      (item) =>
        item.id,
    )

return {
  hazard_id:
    hazardId,
  activities,
  hazard_activity_ids:
    hazardActivityIds,
}
        },
      )

    const increasedRisk =
      increasedRiskValue === 'true'

    /*
     * 1. Ažuriranje osnovnih
     * podataka radnog mesta.
     */
    const {
      error: jobPositionUpdateError,
    } =
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

    if (jobPositionUpdateError) {
      throw jobPositionUpdateError
    }

    /*
     * 2. Učitavamo trenutno stanje
     * hazard veza iz baze.
     *
     * Ovo radimo ponovo u trenutku
     * čuvanja da ne zavisimo od
     * prethodno učitanog prikaza.
     */
    const {
      data: currentHazardRows,
      error: currentHazardsError,
    } =
      await supabase
        .from(
          'employer_job_position_hazards',
        )
        .select(`
          id,
          hazard_id
        `)
        .eq(
          'employer_job_position_id',
          employerJobPositionId,
        )

    if (currentHazardsError) {
      throw currentHazardsError
    }

   const hazardRowIdsToDelete =
  (currentHazardRows ?? [])
    .filter(
      (row) =>
        !selectedHazardIds.includes(
          row.hazard_id,
        ),
    )
    .map(
      (row) =>
        row.id,
    )

if (
  hazardRowIdsToDelete.length > 0
) {
  const {
    error: deleteHazardsError,
  } =
    await supabase
      .from(
        'employer_job_position_hazards',
      )
      .delete()
      .in(
        'id',
        hazardRowIdsToDelete,
      )

  if (deleteHazardsError) {
    throw deleteHazardsError
  }
}

    /*
     * 5. Sve trenutno čekirane stavke
     * upisujemo preko UPSERT-a.
     *
     * Ako zapis već postoji:
     * ažurira se activities.
     *
     * Ako ne postoji:
     * pravi se novi zapis.
     *
     * UNIQUE zaštita:
     * employer_job_position_id + hazard_id
     */
    if (
      selectedHazardRows.length > 0
    ) {
      const rowsToUpsert =
        selectedHazardRows.map(
          (hazard) => ({
            employer_job_position_id:
              employerJobPositionId,
            hazard_id:
              hazard.hazard_id,
            activities:
              hazard.activities,
            updated_at:
              new Date().toISOString(),
          }),
        )

     const {
  data: savedHazardRows,
  error: upsertHazardsError,
} =
  await supabase
    .from(
      'employer_job_position_hazards',
    )
    .upsert(
      rowsToUpsert,
      {
        onConflict:
          'employer_job_position_id,hazard_id',
      },
    )
    .select(`
      id,
      hazard_id
    `)

if (upsertHazardsError) {
  throw upsertHazardsError
}

for (const savedHazard of
  savedHazardRows ?? []) {
  const selectedHazard =
    selectedHazardRows.find(
      (item) =>
        item.hazard_id ===
        savedHazard.hazard_id,
    )

  if (!selectedHazard) {
    continue
  }

  const {
    error:
      deleteHazardActivitiesError,
  } =
    await supabase
      .from(
        'employer_job_position_hazard_activities',
      )
      .delete()
      .eq(
        'employer_job_position_hazard_id',
        savedHazard.id,
      )

  if (deleteHazardActivitiesError) {
    throw deleteHazardActivitiesError
  }

  if (
    selectedHazard
      .hazard_activity_ids.length > 0
  ) {
    const activityRows =
      selectedHazard
        .hazard_activity_ids
        .map(
          (hazardActivityId) => ({
            employer_job_position_hazard_id:
              savedHazard.id,
            hazard_activity_id:
              hazardActivityId,
          }),
        )

    const {
      error:
        insertHazardActivitiesError,
    } =
      await supabase
        .from(
          'employer_job_position_hazard_activities',
        )
        .insert(activityRows)

    if (insertHazardActivitiesError) {
      throw insertHazardActivitiesError
    }
  }
}
    }

    /*
     * LZO za konkretno radno mesto.
     * Postojeće redove zadržavamo da ne izgubimo
     * klasu, specifikaciju ili napomene. Menjamo
     * samo required, a nove izbore dodajemo.
     */
    const { data: currentPpeRows, error: currentPpeRowsError } =
      await supabase
        .from('employer_job_position_ppe')
        .select(`id, ppe_item_id, required`)
        .eq('employer_job_position_id', employerJobPositionId)

    if (currentPpeRowsError) throw currentPpeRowsError

    for (const currentPpe of currentPpeRows ?? []) {
      const shouldBeRequired = selectedPpeIds.includes(
        currentPpe.ppe_item_id,
      )

      if (currentPpe.required !== shouldBeRequired) {
        const { error: updatePpeError } =
          await supabase
            .from('employer_job_position_ppe')
            .update({
              required: shouldBeRequired,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentPpe.id)

        if (updatePpeError) throw updatePpeError
      }
    }

    const currentPpeItemIds = new Set(
      (currentPpeRows ?? []).map((item) => item.ppe_item_id),
    )

    const newRequiredPpeRows = selectedPpeIds
      .filter((ppeItemId) => !currentPpeItemIds.has(ppeItemId))
      .map((ppeItemId) => ({
        employer_job_position_id: employerJobPositionId,
        ppe_item_id: ppeItemId,
        required: true,
      }))

    if (newRequiredPpeRows.length > 0) {
      const { error: insertPpeError } =
        await supabase
          .from('employer_job_position_ppe')
          .insert(newRequiredPpeRows)

      if (insertPpeError) throw insertPpeError
    }

    revalidatePath(
      `/employers/${id}`,
    )

    revalidatePath(
      `/employers/${id}/job-positions/${jobPositionId}`,
    )

    revalidatePath(
      `/employers/${id}/job-positions/${jobPositionId}/edit`,
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
          border:
            '1px solid #e5e7eb',
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
              placeholder={
                jobPosition.name
              }
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
              Ako ostane prazno, koristiće se naziv iz šifarnika:{' '}
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
    effectiveJobDescription
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

          <JobPositionHazardsSelector
  hazards={hazards}
  hazardActivities={
    hazardActivities
  }
  initialHazards={
    existingHazards
  }
  addHazardActivity={
    addHazardActivity
  }
/>

          <section
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              Lična zaštitna oprema propisana za radno mesto
            </h2>
            <p style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>
              Označite svu LZO koja je propisana za ovo radno mesto.
            </p>

            <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
              {ppeGroups.map((group) => {
                const groupItems =
                  ppeItemsByGroup.get(
                    String(group.id),
                  ) ?? []

                if (groupItems.length === 0) return null

                return (
                  <div
                    key={group.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '11px 14px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 800,
                      }}
                    >
                      {group.code} {group.name}
                    </div>

                    {groupItems.map((item) => (
                      <label
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          name="ppe_item_ids"
                          value={item.id}
                          defaultChecked={selectedPpeItemIds.has(item.id)}
                          style={{ marginTop: 3 }}
                        />
                        <span>
                          <strong>{item.code}</strong> {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
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
            href={`/employers/${id}/job-positions/${jobPositionId}`}
            style={{
              padding:
                '11px 18px',
              border:
                '1px solid #d1d5db',
              borderRadius:
                '7px',
              textDecoration:
                'none',
              color:
                '#374151',
              fontWeight:
                700,
            }}
          >
            Otkaži
          </Link>

          <button
            type="submit"
            style={{
              border: 0,
              borderRadius:
                '7px',
              padding:
                '11px 20px',
              background:
                '#16a34a',
              color:
                '#ffffff',
              fontWeight:
                800,
              cursor:
                'pointer',
            }}
          >
            Sačuvaj izmene
          </button>
        </div>
      </form>
    </main>
  )
}