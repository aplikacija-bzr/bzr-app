import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RequestBody = {
  trainingSessionId?: string
  jobPositionIds?: string[]
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const trainingSessionId =
      searchParams.get('sessionId')?.trim() ?? ''

    if (!trainingSessionId) {
      return NextResponse.json(
        { error: 'Proces obuke nije prosleđen.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('training_session_job_positions')
      .select(`
        id,
        training_session_id,
        job_position_id,
        sort_order
      `)
      .eq('training_session_id', trainingSessionId)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            'Greška pri učitavanju radnih mesta obuke.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      jobPositions: data ?? [],
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

export async function POST(req: Request) {
  try {
    const {
      trainingSessionId,
      jobPositionIds,
    }: RequestBody = await req.json()

    if (!trainingSessionId) {
      return NextResponse.json(
        { error: 'Proces obuke nije prosleđen.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(jobPositionIds) || jobPositionIds.length === 0) {
      return NextResponse.json(
        { error: 'Izaberite najmanje jedno radno mesto.' },
        { status: 400 }
      )
    }

    const uniqueJobPositionIds = [...new Set(jobPositionIds)]

    const rows = uniqueJobPositionIds.map((jobPositionId, index) => ({
      training_session_id: trainingSessionId,
      job_position_id: jobPositionId,
      sort_order: index + 1,
    }))

    const { data, error } = await supabase
      .from('training_session_job_positions')
      .insert(rows)
      .select('id, training_session_id, job_position_id, sort_order')

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            'Greška pri upisu radnih mesta u proces obuke.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobPositions: data ?? [],
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