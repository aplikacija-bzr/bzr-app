import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Nedostaje sessionId.' },
        { status: 400 }
      )
    }

    // 1. Uzimamo poslodavca iz procesa obuke
    const { data: trainingSession, error: trainingSessionError } =
      await supabase
        .from('training_sessions')
        .select('employer_id')
        .eq('id', sessionId)
        .single()

    if (trainingSessionError || !trainingSession) {
      return NextResponse.json(
        { error: 'Proces obuke nije pronađen.' },
        { status: 404 }
      )
    }

    // 2. Uzimamo radna mesta izabrana u Fazi 2
    const { data: sessionJobPositions, error: sessionJobPositionsError } =
      await supabase
        .from('training_session_job_positions')
        .select('job_position_id')
        .eq('training_session_id', sessionId)

    if (sessionJobPositionsError) {
      throw sessionJobPositionsError
    }

    const jobPositionIds = [
      ...new Set(
        (sessionJobPositions ?? [])
          .map((row) => row.job_position_id)
          .filter(Boolean)
      ),
    ]

    if (jobPositionIds.length === 0) {
      return NextResponse.json({
        employees: [],
      })
    }

    // 3. Nalazimo employer_job_positions za konkretnog poslodavca
    const { data: employerJobPositions, error: employerJobPositionsError } =
      await supabase
        .from('employer_job_positions')
        .select('id')
        .eq('employer_id', trainingSession.employer_id)
        .in('job_position_id', jobPositionIds)
        .eq('active', true)

    if (employerJobPositionsError) {
      throw employerJobPositionsError
    }

    const employerJobPositionIds = [
      ...new Set(
        (employerJobPositions ?? [])
          .map((row) => row.id)
          .filter(Boolean)
      ),
    ]

    if (employerJobPositionIds.length === 0) {
      return NextResponse.json({
        employees: [],
      })
    }

    // 4. Nalazimo zaposlene vezane za ta radna mesta
    const { data: employeePositions, error: employeePositionsError } =
      await supabase
        .from('employee_job_positions')
        .select('employee_id')
        .in('employer_job_position_id', employerJobPositionIds)
        .eq('active', true)

    if (employeePositionsError) {
      throw employeePositionsError
    }

    const employeeIds = [
      ...new Set(
        (employeePositions ?? [])
          .map((row) => row.employee_id)
          .filter(Boolean)
      ),
    ]

    if (employeeIds.length === 0) {
      return NextResponse.json({
        employees: [],
      })
    }

    // 5. Učitavamo podatke aktivnih zaposlenih
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        jmbg,
        qualification,
        active
      `)
      .in('id', employeeIds)
      .eq('active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (employeesError) {
      throw employeesError
    }

    return NextResponse.json({
      employees: employees ?? [],
    })
  } catch (error) {
    console.error('training-session-employees GET error:', error)

    return NextResponse.json(
      { error: 'Greška pri učitavanju zaposlenih.' },
      { status: 500 }
    )
  }
}