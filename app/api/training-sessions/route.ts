import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const {
      employerId,
      reasonCode,
      startDate,
      practicalInstructorName,
      safetyAdvisorId,
    } = await req.json()

    if (!employerId) {
      return NextResponse.json(
        { error: 'Poslodavac je obavezan.' },
        { status: 400 }
      )
    }

    if (!reasonCode) {
      return NextResponse.json(
        { error: 'Razlog obuke je obavezan.' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Datum početka obuke je obavezan.' },
        { status: 400 }
      )
    }

    if (!practicalInstructorName || !practicalInstructorName.trim()) {
      return NextResponse.json(
        { error: 'Instruktor praktične obuke je obavezan.' },
        { status: 400 }
      )
    }

    if (!safetyAdvisorId) {
      return NextResponse.json(
        { error: 'Savetnik za BZR je obavezan.' },
        { status: 400 }
      )
    }

    const { data: draftStatus, error: statusError } = await supabase
      .from('training_session_statuses')
      .select('id')
      .eq('code', 'DRAFT')
      .single()

    if (statusError || !draftStatus) {
      return NextResponse.json(
        {
          error:
            statusError?.message ||
            'Status DRAFT nije pronađen u training_session_statuses.',
        },
        { status: 500 }
      )
    }

    const { data: trainingSession, error: trainingSessionError } =
      await supabase
        .from('training_sessions')
        .insert({
          employer_id: employerId,
          status_id: draftStatus.id,
          reason_code: reasonCode,
          start_date: startDate,
          practical_instructor_name: practicalInstructorName.trim(),
          safety_advisor_id: safetyAdvisorId,
        })
        .select('id, training_number')
        .single()

    if (trainingSessionError || !trainingSession) {
      return NextResponse.json(
        {
          error:
            trainingSessionError?.message ||
            'Greška pri kreiranju procesa obuke.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trainingSessionId: trainingSession.id,
      trainingNumber: trainingSession.training_number,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Nepoznata server greška.'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}