import { createClient } from '@/lib/supabase/server'

export type EmployerJobPosition = {
  id: string
  employer_id: string
  job_position_id: string
  name: string
  internal_name: string | null
  organizational_unit: string | null
  job_description: string | null
  increased_risk: boolean
  active: boolean
}

type JobPositionRelation = {
  id: string
  name: string
}

type EmployerJobPositionDatabaseRow = {
  id: string
  employer_id: string
  job_position_id: string
  internal_name: string | null
  organizational_unit: string | null
  job_description: string | null
  increased_risk: boolean
  active: boolean
  job_positions:
    | JobPositionRelation
    | JobPositionRelation[]
    | null
}

function mapEmployerJobPosition(
  row: EmployerJobPositionDatabaseRow
): EmployerJobPosition | null {
  const jobPosition =
    Array.isArray(
      row.job_positions
    )
      ? row.job_positions[0]
      : row.job_positions

  if (!jobPosition) {
    return null
  }

  return {
    id: row.id,
    employer_id:
      row.employer_id,
    job_position_id:
      row.job_position_id,
    name:
      jobPosition.name,
    internal_name:
      row.internal_name,
    organizational_unit:
      row.organizational_unit,
    job_description:
      row.job_description,
    increased_risk:
      row.increased_risk,
    active:
      row.active,
  }
}

const employerJobPositionSelect = `
  id,
  employer_id,
  job_position_id,
  internal_name,
  organizational_unit,
  job_description,
  increased_risk,
  active,
  job_positions!fk_employer_job_positions_job_position (
    id,
    name
  )
`

export async function getEmployerJobPositionsByEmployerId(
  employerId: string
): Promise<EmployerJobPosition[]> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'employer_job_positions'
      )
      .select(
        employerJobPositionSelect
      )
      .eq(
        'employer_id',
        employerId
      )
      .eq(
        'active',
        true
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) =>
      mapEmployerJobPosition(
        row as unknown as EmployerJobPositionDatabaseRow
      )
    )
    .filter(
      (
        item
      ): item is EmployerJobPosition =>
        item !== null
    )
}

export async function getEmployerJobPositionByJobPositionId(
  employerId: string,
  jobPositionId: string
): Promise<EmployerJobPosition | null> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'employer_job_positions'
      )
      .select(
        employerJobPositionSelect
      )
      .eq(
        'employer_id',
        employerId
      )
      .eq(
        'job_position_id',
        jobPositionId
      )
      .eq(
        'active',
        true
      )
      .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapEmployerJobPosition(
    data as unknown as EmployerJobPositionDatabaseRow
  )
}