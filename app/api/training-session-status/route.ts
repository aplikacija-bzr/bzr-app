import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function PATCH(req: Request) {
  try {
    const {
      trainingSessionId,
      statusCode = 'IN_PROGRESS',
    } = await req.json()

    if (!trainingSessionId) {
      return NextResponse.json(
        {
          error:
            'Identifikator postupka obuke je obavezan.',
        },
        { status: 400 },
      )
    }

    const {
      data: targetStatus,
      error: statusError,
    } = await supabase
      .from('training_session_statuses')
      .select('id')
      .eq('code', statusCode)
      .single()

    if (statusError || !targetStatus) {
      return NextResponse.json(
        {
          error:
            statusError?.message ||
            `Status ${statusCode} nije pronađen.`,
        },
        { status: 500 },
      )
    }

    const {
      data: trainingSession,
      error: updateError,
    } = await supabase
      .from('training_sessions')
      .update({
        status_id: targetStatus.id,
      })
      .eq('id', trainingSessionId)
      .select('id, status_id')
      .single()

    if (updateError || !trainingSession) {
      return NextResponse.json(
        {
          error:
            updateError?.message ||
            'Status postupka obuke nije promenjen.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      trainingSession,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Nepoznata server greška.'

    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}