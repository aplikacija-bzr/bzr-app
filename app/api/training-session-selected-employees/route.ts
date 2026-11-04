import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const trainingSessionId = body.trainingSessionId as string | undefined
    const employeeIds = body.employeeIds as string[] | undefined

    if (!trainingSessionId) {
      return NextResponse.json(
        { error: 'Nedostaje trainingSessionId.' },
        { status: 400 }
      )
    }

    if (!employeeIds || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'Izaberite najmanje jednog zaposlenog.' },
        { status: 400 }
      )
    }

    // 1. Radna mesta izabrana za konkretnu obuku
    const { data: sessionJobPositions, error: sessionJobPositionsError } =
      await supabase
        .from('training_session_job_positions')
        .select('id, job_position_id')
        .eq('training_session_id', trainingSessionId)

    if (sessionJobPositionsError) {
      throw sessionJobPositionsError
    }

    if (!sessionJobPositions || sessionJobPositions.length === 0) {
      return NextResponse.json(
        { error: 'Obuka nema izabrana radna mesta.' },
        { status: 400 }
      )
    }

    // 2. Poslodavac konkretne obuke
    const { data: trainingSession, error: trainingSessionError } =
      await supabase
        .from('training_sessions')
        .select('employer_id')
        .eq('id', trainingSessionId)
        .single()

    if (trainingSessionError || !trainingSession) {
      return NextResponse.json(
        { error: 'Proces obuke nije pronađen.' },
        { status: 404 }
      )
    }

    const jobPositionIds = sessionJobPositions.map(
      (row) => row.job_position_id
    )

    // 3. Employer job positions za tog poslodavca i ta radna mesta
    const { data: employerJobPositions, error: employerJobPositionsError } =
      await supabase
        .from('employer_job_positions')
        .select('id, job_position_id')
        .eq('employer_id', trainingSession.employer_id)
        .in('job_position_id', jobPositionIds)
        .eq('active', true)

    if (employerJobPositionsError) {
      throw employerJobPositionsError
    }

    const employerJobPositionIds = (employerJobPositions ?? []).map(
      (row) => row.id
    )

    if (employerJobPositionIds.length === 0) {
      return NextResponse.json(
        { error: 'Nisu pronađena radna mesta poslodavca.' },
        { status: 400 }
      )
    }

    // 4. Veze izabranih zaposlenih sa tim radnim mestima
    const { data: employeeJobPositions, error: employeeJobPositionsError } =
      await supabase
        .from('employee_job_positions')
        .select('id, employee_id, employer_job_position_id')
        .in('employee_id', employeeIds)
        .in('employer_job_position_id', employerJobPositionIds)
        .eq('active', true)

    if (employeeJobPositionsError) {
      throw employeeJobPositionsError
    }

    const rowsToInsert: {
      training_session_job_position_id: string
      employee_job_position_id: string
      sort_order: number
    }[] = []

    let sortOrder = 1

    for (const employeeJobPosition of employeeJobPositions ?? []) {
      const employerJobPosition = (employerJobPositions ?? []).find(
        (row) => row.id === employeeJobPosition.employer_job_position_id
      )

      if (!employerJobPosition) continue

      const sessionJobPosition = sessionJobPositions.find(
        (row) => row.job_position_id === employerJobPosition.job_position_id
      )

      if (!sessionJobPosition) continue

      rowsToInsert.push({
        training_session_job_position_id: sessionJobPosition.id,
        employee_job_position_id: employeeJobPosition.id,
        sort_order: sortOrder,
      })

      sortOrder += 1
    }

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Nisu pronađene odgovarajuće veze zaposlenih i radnih mesta.' },
        { status: 400 }
      )
    }

    // 5. Brišemo eventualni prethodni izbor za ovu obuku
    const sessionJobPositionIds = sessionJobPositions.map((row) => row.id)

    const { error: deleteError } = await supabase
      .from('training_session_employees')
      .delete()
      .in('training_session_job_position_id', sessionJobPositionIds)

    if (deleteError) {
      throw deleteError
    }

    // 6. Upisujemo novi izbor zaposlenih
    const { data: insertedRows, error: insertError } = await supabase
      .from('training_session_employees')
      .insert(rowsToInsert)
      .select()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      count: insertedRows?.length ?? 0,
    })
  } catch (error) {
    console.error('training-session-selected-employees POST error:', error)

    return NextResponse.json(
      { error: 'Greška pri čuvanju zaposlenih.' },
      { status: 500 }
    )
  }
}