
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Provera postojece korisnicke sesije
    const auth = await createClient()

    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Korisnik nije prijavljen.' },
        { status: 401 }
      )
    }

    // Provera aktivnog profila
    const admin = createAdminClient()

    const { data: profile, error: profileError } =
      await admin
        .from('user_profiles')
        .select('role, active')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) throw profileError

    if (!profile?.active) {
      return NextResponse.json(
        { error: 'Pristup nije dozvoljen.' },
        { status: 403 }
      )
    }

    const sessionId =
      request.nextUrl.searchParams.get('sessionId')

    if (
      !sessionId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
    ) {
      return NextResponse.json(
        { error: 'Neispravan ID obuke.' },
        { status: 400 }
      )
    }

    // Provera postojanja obuke
    const { data: session, error: sessionError } =
      await admin
        .from('training_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle()

    if (sessionError) throw sessionError

    if (!session) {
      return NextResponse.json(
        { error: 'Obuka nije pronadjena.' },
        { status: 404 }
      )
    }

    // Ucitavanje arhiviranih testova
    const { data, error } = await admin
      .from('training_session_generated_tests')
      .select(`
        id,
        training_session_id,
        job_position_id,
        training_test_id,
        test_name,
        pdf_storage_path,
        created_at
      `)
      .eq('training_session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      tests: data ?? [],
    })
  } catch (error) {
    console.error(
      'training-session-generated-tests GET:',
      error
    )

    return NextResponse.json(
      { error: 'Greska pri ucitavanju arhive testova.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await createClient()

    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Korisnik nije prijavljen.' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()

    const { data: profile, error: profileError } =
      await admin
        .from('user_profiles')
        .select('active, role')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) throw profileError

    if (!profile?.active) {
      return NextResponse.json(
        { error: 'Pristup nije dozvoljen.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      trainingSessionId,
      sessionJobPositionId,
      testIds,
    } = body

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (
      typeof trainingSessionId !== 'string' ||
      !uuidPattern.test(trainingSessionId) ||
      typeof sessionJobPositionId !== 'string' ||
      !uuidPattern.test(sessionJobPositionId) ||
      !Array.isArray(testIds) ||
      testIds.length === 0 ||
      testIds.some(
        (id: unknown) =>
          typeof id !== 'string' ||
          !uuidPattern.test(id)
      )
    ) {
      return NextResponse.json(
        { error: 'Neispravni podaci za čuvanje.' },
        { status: 400 }
      )
    }

    const uniqueTestIds = [
      ...new Set<string>(testIds),
    ]

    // Provera radnog mesta u konkretnoj obuci
    const { data: sessionJob, error: jobError } =
      await admin
        .from('training_session_job_positions')
        .select('id, training_session_id')
        .eq('id', sessionJobPositionId)
        .eq('training_session_id', trainingSessionId)
        .maybeSingle()

    if (jobError) throw jobError

    if (!sessionJob) {
      return NextResponse.json(
        {
          error:
            'Radno mesto ne pripada izabranoj obuci.',
        },
        { status: 400 }
      )
    }

    // Provera izabranih testova
    const { data: tests, error: testsError } =
      await admin
        .from('training_tests')
        .select(`
          id,
          name,
          active,
          training_test_questions (
            training_question_id
          )
        `)
        .in('id', uniqueTestIds)

    if (testsError) throw testsError

    if (
      !tests ||
      tests.length !== uniqueTestIds.length
    ) {
      return NextResponse.json(
        { error: 'Neki izabrani testovi ne postoje.' },
        { status: 400 }
      )
    }

    const invalidTest = tests.find(
      (test) =>
        !test.active ||
        (test.training_test_questions?.length ?? 0) === 0
    )

    if (invalidTest) {
      return NextResponse.json(
        {
          error:
            'Izabrani test nije aktivan ili nema pitanja.',
        },
        { status: 400 }
      )
    }

    // Provera već sačuvanih veza
    const { data: existing, error: existingError } =
      await admin
        .from('training_session_generated_tests')
        .select('training_test_id')
        .eq('training_session_id', trainingSessionId)
        .eq('job_position_id', sessionJobPositionId)
        .in('training_test_id', uniqueTestIds)

    if (existingError) throw existingError

    const existingIds = new Set(
      (existing ?? []).map(
        (item) => item.training_test_id
      )
    )

    const newRows = tests
      .filter((test) => !existingIds.has(test.id))
      .map((test) => ({
        training_session_id: trainingSessionId,
        job_position_id: sessionJobPositionId,
        training_test_id: test.id,
        test_name: test.name,
        pdf_storage_path: null,
      }))

    if (newRows.length > 0) {
      const { error: insertError } =
        await admin
          .from('training_session_generated_tests')
          .insert(newRows)

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      addedCount: newRows.length,
      existingCount: existingIds.size,
      message:
        'Testovi su povezani sa obukom. PDF arhiviranje još nije izvršeno.',
    })
  } catch (error) {
    console.error(
      'training-session-generated-tests POST:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Greška pri povezivanju testova sa obukom.',
      },
      { status: 500 }
    )
  }
}
