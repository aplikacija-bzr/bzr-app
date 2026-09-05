import { notFound } from 'next/navigation'

import EmployeeProfile from '@/components/employee/EmployeeProfile'

import { getEmployeeById } from '@/lib/employees'
import { createClient } from '@/lib/supabase/server'

type EmployeePageProps = {
  params: Promise<{
    id: string
    employeeId: string
  }>
}

export default async function EmployeePage({
  params,
}: EmployeePageProps) {
  const { id, employeeId } = await params

  const employee = await getEmployeeById(
    employeeId,
  )

  if (
    !employee ||
    employee.employer_id !== id
  ) {
    notFound()
  }

  const supabase =
    await createClient()

  const {
    data: medicalExaminations,
    error: medicalExaminationsError,
  } =
    await supabase
      .from(
        'medical_examination_records',
      )
      .select(`
        id,
        employer_id,
        employee_id,
        employer_job_position_id,
        examination_type,
        examination_date,
        next_examination_date,
        report_number,
        status,
        employer_job_positions (
          id,
          job_positions (
            name
          )
        )
      `)
      .eq(
        'employer_id',
        id,
      )
      .eq(
        'employee_id',
        employeeId,
      )
      .order(
        'examination_date',
        {
          ascending: false,
        },
      )

  if (medicalExaminationsError) {
    throw medicalExaminationsError
  }

  const medicalExaminationsForProfile =
    (medicalExaminations ?? []).map(
      (examination) => {
        const employerJobPositionRelation =
          examination.employer_job_positions

        const employerJobPosition =
          Array.isArray(
            employerJobPositionRelation,
          )
            ? employerJobPositionRelation[0]
            : employerJobPositionRelation

        const jobPositionRelation =
          employerJobPosition?.job_positions

        const jobPosition =
          Array.isArray(
            jobPositionRelation,
          )
            ? jobPositionRelation[0]
            : jobPositionRelation

        return {
          id: examination.id,
          employer_job_position_id:
            examination.employer_job_position_id,
          job_position_name:
            jobPosition?.name ??
            'Radno mesto nije pronađeno',
          examination_type:
            examination.examination_type,
          examination_date:
            examination.examination_date,
          next_examination_date:
            examination.next_examination_date,
          report_number:
            examination.report_number,
          status:
            examination.status,
        }
      },
    )

  return (
    <EmployeeProfile
      employerId={id}
      employee={employee}
      medicalExaminations={
        medicalExaminationsForProfile
      }
    />
  )
}