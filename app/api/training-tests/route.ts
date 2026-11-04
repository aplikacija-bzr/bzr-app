import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: tests, error } =
      await supabase
        .from('training_tests')
        .select(`
          id,
          name,
          test_type,
          active,
          training_program_version_id,
          training_test_questions (
            training_question_id
          )
        `)
        .eq('active', true)
        .order('name', {
          ascending: true,
        })

    if (error) {
      throw error
    }

    const normalizedTests =
      (tests ?? []).map((test) => ({
        id: test.id,
        name: test.name,
        testType: test.test_type,
        trainingProgramVersionId:
          test.training_program_version_id,
        questionCount:
          test.training_test_questions?.length ??
          0,
      }))

    return NextResponse.json({
      tests: normalizedTests,
    })
  } catch (error: unknown) {
    console.error(
      'training-tests GET ERROR:',
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