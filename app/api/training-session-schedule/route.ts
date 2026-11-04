import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RequestBody = {
  trainingSessionProgramIds: string[]
  activityType: 'TRAINING' | 'ASSESSMENT'
 scheduleType:
  | 'THEORY'
  | 'THEORY_END'
  | 'PRACTICAL'
  | 'PRACTICAL_END'
  | 'TEST'
  | 'PRACTICAL_CHECK'
  eventDate: string
  location?: string | null
  notes?: string | null
}

export async function POST(req: Request) {
  try {
    const {
      trainingSessionProgramIds,
      activityType,
      scheduleType,
      eventDate,
      location,
      notes,
    }: RequestBody = await req.json()

    if (
      !Array.isArray(trainingSessionProgramIds) ||
      trainingSessionProgramIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Nisu prosleđeni programi obuke.' },
        { status: 400 }
      )
    }

    const allowedActivityTypes = [
      'TRAINING',
      'ASSESSMENT',
    ]

    if (!allowedActivityTypes.includes(activityType)) {
      return NextResponse.json(
        { error: 'Neispravna vrsta aktivnosti.' },
        { status: 400 }
      )
    }

    const allowedScheduleTypes = [
  'THEORY',
  'THEORY_END',
  'PRACTICAL',
  'PRACTICAL_END',
  'TEST',
  'PRACTICAL_CHECK',
]

    if (!allowedScheduleTypes.includes(scheduleType)) {
      return NextResponse.json(
        { error: 'Neispravna vrsta događaja.' },
        { status: 400 }
      )
    }

    const validCombination =
  (activityType === 'TRAINING' &&
    [
      'THEORY',
      'THEORY_END',
      'PRACTICAL',
      'PRACTICAL_END',
    ].includes(scheduleType)) ||
      (activityType === 'ASSESSMENT' &&
        ['TEST', 'PRACTICAL_CHECK'].includes(scheduleType))

    if (!validCombination) {
      return NextResponse.json(
        { error: 'Neispravna kombinacija aktivnosti i događaja.' },
        { status: 400 }
      )
    }

    if (!eventDate) {
      return NextResponse.json(
        { error: 'Nije prosleđen datum događaja.' },
        { status: 400 }
      )
    }

    const uniqueTrainingSessionProgramIds = [
      ...new Set(trainingSessionProgramIds),
    ]

    const rows = uniqueTrainingSessionProgramIds.map(
      (trainingSessionProgramId) => ({
        training_session_program_id: trainingSessionProgramId,
        activity_type: activityType,
        schedule_type: scheduleType,
        event_date: eventDate,
        location: location?.trim() || null,
        notes: notes?.trim() || null,
      })
    )

    const { data, error } = await supabase
      .from('training_session_schedule')
      .upsert(rows, {
  onConflict:
    'training_session_program_id,activity_type,schedule_type',
})
      .select(`
        id,
        training_session_program_id,
        activity_type,
        schedule_type,
        event_date,
        location,
        notes
      `)

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            'Greška pri čuvanju datuma događaja.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedules: data ?? [],
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