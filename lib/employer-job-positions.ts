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

export type EmployerJobPositionHazard = {
  id: string
  employer_job_position_id: string
  hazard_id: string
  activities: string
  code: string
  name: string
  category: string
  article_number: number
  sort_order: number
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

type HazardRelation = {
  id: string
  code: string
  name: string
  category: string
  article_number: number
  sort_order: number
}

type EmployerJobPositionHazardDatabaseRow = {
  id: string
  employer_job_position_id: string
  hazard_id: string
  activities: string
  hazards:
    | HazardRelation
    | HazardRelation[]
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

function mapEmployerJobPositionHazard(
  row: EmployerJobPositionHazardDatabaseRow
): EmployerJobPositionHazard | null {
  const hazard =
    Array.isArray(
      row.hazards
    )
      ? row.hazards[0]
      : row.hazards

  if (!hazard) {
    return null
  }

  return {
    id: row.id,
    employer_job_position_id:
      row.employer_job_position_id,
    hazard_id:
      row.hazard_id,
    activities:
      row.activities,
    code:
      hazard.code,
    name:
      hazard.name,
    category:
      hazard.category,
    article_number:
      hazard.article_number,
    sort_order:
      hazard.sort_order,
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

export async function getEmployerJobPositionHazards(
  employerJobPositionId: string
): Promise<EmployerJobPositionHazard[]> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'employer_job_position_hazards'
      )
      .select(`
        id,
        employer_job_position_id,
        hazard_id,
        activities,
        hazards (
          id,
          code,
          name,
          category,
          article_number,
          sort_order
        )
      `)
      .eq(
        'employer_job_position_id',
        employerJobPositionId
      )

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) =>
      mapEmployerJobPositionHazard(
        row as unknown as EmployerJobPositionHazardDatabaseRow
      )
    )
    .filter(
      (
        item
      ): item is EmployerJobPositionHazard =>
        item !== null
    )
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order
    )
}