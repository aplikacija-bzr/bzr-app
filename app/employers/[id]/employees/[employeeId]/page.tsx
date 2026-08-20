import { notFound } from 'next/navigation'
import EmployeeProfile from '@/components/employee/EmployeeProfile'
import { getEmployeeById } from '@/lib/employees'

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

  const employee = await getEmployeeById(employeeId)

  if (!employee || employee.employer_id !== id) {
    notFound()
  }

  return (
    <EmployeeProfile
      employerId={id}
      employee={employee}
    />
  )
}