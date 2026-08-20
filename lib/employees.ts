import { createClient } from '@/lib/supabase/server'

export type EmployeeJobPosition = {
  id: string
  job_position_id: string
  name: string
  primary_position: boolean
}

type EmployeeJobPositionRelation = {
  id: string
  primary_position: boolean
  active: boolean
  employer_job_positions: {
    job_positions: {
      id: string
      name: string
    } | null
  } | null
}

export type Employee = {
  id: string
  employer_id: string
  first_name: string
  last_name: string
  jmbg: string | null
  employee_number: string | null
  date_of_birth: string | null
  place_of_birth: string | null
  qualification: string | null
  occupation: string | null
  employment_start: string | null
  employment_end: string | null
  email: string | null
  phone: string | null
  active: boolean
  notes: string | null
  job_positions: EmployeeJobPosition[]
}

type EmployeeDatabaseRow = Omit<
  Employee,
  'job_positions'
> & {
  employee_job_positions:
    EmployeeJobPositionRelation[]
}

const employeeSelect = `
  *,
  employee_job_positions!fk_employee_job_positions_employee (
    id,
    primary_position,
    active,
    employer_job_positions!fk_employee_job_positions_employer_job_position (
      job_positions!fk_employer_job_positions_job_position (
        id,
        name
      )
    )
  )
`

function mapEmployee(
  employee: EmployeeDatabaseRow
): Employee {
  const {
    employee_job_positions,
    ...employeeData
  } = employee

  const jobPositions =
    (employee_job_positions ?? [])
      .filter(
        (relation) =>
          relation.active
      )
      .map((relation) => {
        const jobPosition =
          relation
            .employer_job_positions
            ?.job_positions

        if (!jobPosition) {
          return null
        }

        return {
          id: relation.id,
          job_position_id:
            jobPosition.id,
          name: jobPosition.name,
          primary_position:
            relation.primary_position,
        }
      })
      .filter(
        (
          jobPosition:
            | EmployeeJobPosition
            | null
        ): jobPosition is EmployeeJobPosition =>
          jobPosition !== null
      )

  return {
    ...employeeData,
    job_positions: jobPositions,
  }
}

export async function getEmployeesByEmployerId(
  employerId: string
): Promise<Employee[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employees')
    .select(employeeSelect)
    .eq('employer_id', employerId)
    .eq('active', true)
    .order('last_name')
    .order('first_name')

  if (error) {
    throw error
  }

  return (data ?? []).map(
    (employee) =>
      mapEmployee(
        employee as EmployeeDatabaseRow
      )
  )
}

export async function getEmployeeById(
  employeeId: string
): Promise<Employee | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employees')
    .select(employeeSelect)
    .eq('id', employeeId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapEmployee(
    data as EmployeeDatabaseRow
  )
}