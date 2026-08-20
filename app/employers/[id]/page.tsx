import EmployerWorkspace from '@/components/employer/EmployerWorkspace'

import {
  getEmployerById,
} from '@/lib/employers'

import {
  getEmployeesByEmployerId,
} from '@/lib/employees'

import {
  getEmployerJobPositionsByEmployerId,
} from '@/lib/employer-job-positions'

type EmployerPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EmployerPage({
  params,
}: EmployerPageProps) {
  const { id } = await params

  const employer =
    await getEmployerById(id)

  const employees =
    await getEmployeesByEmployerId(id)

  const jobPositions =
    await getEmployerJobPositionsByEmployerId(id)

  console.log(employer)
  console.log('Employer ID:', id)
  console.log('Employees:', employees)
  console.log(
    'Employer job positions:',
    jobPositions,
  )

  return (
    <EmployerWorkspace
      employer={employer}
      employees={employees}
      jobPositions={jobPositions}
    />
  )
}