import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TRAINING_PROGRAM_VERSION_ID =
  '968fdfc9-57d0-4d7f-9117-d330fa55b4b9'

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : ''

    const moduleIds =
      Array.isArray(body.moduleIds)
        ? body.moduleIds.filter(
            (id: unknown) =>
              typeof id === 'string'
          )
        : []
        const questionIds =
  Array.isArray(body.questionIds)
    ? body.questionIds.filter(
        (id: unknown) =>
          typeof id === 'string'
      )
    : []

    if (!name) {
      return NextResponse.json(
        { error: 'Nedostaje naziv testa.' },
        { status: 400 }
      )
    }

    if (moduleIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'Nije izabran nijedan modul.',
        },
        { status: 400 }
      )
    }
    if (questionIds.length === 0) {
  return NextResponse.json(
    {
      error:
        'Nije izabrano nijedno pitanje.',
    },
    { status: 400 }
  )
}

    const { data: test, error } =
      await supabase
        .from('training_tests')
        .insert({
          training_program_version_id:
            TRAINING_PROGRAM_VERSION_ID,
          name,
          test_type: 'GENERAL',
          job_risk_profile_id: null,
        })
        .select(
          'id, name, test_type, active'
        )
        .single()

    if (error) {
      throw error
    }

    const moduleRows = moduleIds.map(
      (
        moduleId: string,
        index: number
      ) => ({
        training_test_id: test.id,
        training_module_id: moduleId,
        sort_order: (index + 1) * 10,
        active: true,
      })
    )

    const { error: modulesError } =
      await supabase
        .from('training_test_modules')
        .insert(moduleRows)

    if (modulesError) {
      throw modulesError
    }
const questionRows = questionIds.map(
  (questionId: string, index: number) => ({
    training_test_id: test.id,
    training_question_id: questionId,
    sort_order: (index + 1) * 10,
    active: true,
  })
)

const { error: questionsError } =
  await supabase
    .from('training_test_questions')
    .insert(questionRows)

if (questionsError) {
  throw questionsError
}
    return NextResponse.json({
      success: true,
      test,
    })
  } catch (error: unknown) {
    console.error(
      'training-tests-create ERROR:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error
          ? String(
              (error as {
                message: unknown
              }).message
            )
          : JSON.stringify(error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}