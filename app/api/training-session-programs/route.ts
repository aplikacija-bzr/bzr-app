import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
type RequestBody = {
  trainingSessionJobPositionIds: string[]
  trainingProgramVersionId: string
}
export async function POST(req: Request) {
  try {
    const {
      trainingSessionJobPositionIds,
      trainingProgramVersionId,
    }: RequestBody = await req.json()

    if (
      !Array.isArray(trainingSessionJobPositionIds) ||
      trainingSessionJobPositionIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Nisu prosleđena radna mesta iz procesa obuke.' },
        { status: 400 }
      )
    }

    if (!trainingProgramVersionId) {
      return NextResponse.json(
        { error: 'Nije prosleđena verzija programa obuke.' },
        { status: 400 }
      )
    }
    const uniqueJobPositionIds = [
  ...new Set(trainingSessionJobPositionIds),
]

const rows = uniqueJobPositionIds.map(
  (trainingSessionJobPositionId, index) => ({
    training_session_job_position_id:
      trainingSessionJobPositionId,
    training_program_version_id:
      trainingProgramVersionId,
    sort_order: index + 1,
  })
)
const { data, error } = await supabase
  .from('training_session_programs')
  .upsert(
    rows,
    {
      onConflict:
        'training_session_job_position_id,training_program_version_id',
    }
  )
  .select(
    'id, training_session_job_position_id, training_program_version_id, sort_order'
  )

if (error) {
  return NextResponse.json(
    {
      error:
        error.message ||
        'Greška pri povezivanju programa sa radnim mestima.',
    },
    { status: 500 }
  )
}

return NextResponse.json({
  success: true,
  programs: data ?? [],
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