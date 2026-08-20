import { NextRequest, NextResponse } from 'next/server'

import { getEmployeesByEmployerId } from '@/lib/employees'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const employerId =
      searchParams.get('employerId')

    if (!employerId) {
      return NextResponse.json(
        {
          error: 'Nedostaje employerId.',
        },
        {
          status: 400,
        }
      )
    }

    const employees =
      await getEmployeesByEmployerId(
        employerId
      )

    const totalJobPositions =
      employees.reduce(
        (sum, employee) =>
          sum +
          employee.job_positions.length,
        0
      )

    const employeesWithoutJobPositions =
      employees.filter(
        (employee) =>
          employee.job_positions.length === 0
      ).length

    return NextResponse.json({
      summary: {
        employeesCount:
          employees.length,

        totalJobPositions,

        employeesWithoutJobPositions,
      },

      employees,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Greška pri učitavanju zaposlenih.',
      },
      {
        status: 500,
      }
    )
  }
}