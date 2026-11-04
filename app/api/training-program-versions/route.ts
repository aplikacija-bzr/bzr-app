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
    const programCode = searchParams.get('programCode')

    if (!programCode) {
      return NextResponse.json(
        { error: 'Nedostaje programCode.' },
        { status: 400 }
      )
    }

    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id, code, name')
      .eq('code', programCode)
      .eq('active', true)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Program obuke nije pronađen.' },
        { status: 404 }
      )
    }
    const { data: version, error: versionError } = await supabase
  .from('training_program_versions')
  .select(`
    id,
    version_number,
    version_label,
    valid_from,
    valid_until,
    theory_duration_minutes,
    practical_duration_minutes,
    content_summary,
    learning_outcomes,
    passing_score_percent
  `)
  .eq('training_program_id', program.id)
  .eq('active', true)
  .order('version_number', { ascending: false })
  .limit(1)
  .maybeSingle()

if (versionError) {
  throw versionError
}

if (!version) {
  return NextResponse.json(
    { error: 'Aktivna verzija programa obuke nije pronađena.' },
    { status: 404 }
  )
}
return NextResponse.json({
  program,
  version,
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