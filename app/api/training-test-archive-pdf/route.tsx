
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'

import ArchiveTestDocument from './ArchiveTestDocument'


export const dynamic = 'force-dynamic'

async function loadArchiveTest(
  admin: ReturnType<typeof createAdminClient>,
  testId: string
) {
  const { data: test, error: testError } =
    await admin
      .from('training_tests')
      .select('id, name')
      .eq('id', testId)
      .single()

  if (testError) throw testError

  const { data: moduleRows, error: moduleError } =
    await admin
      .from('training_test_modules')
      .select(`
        sort_order,
        training_modules (
          id,
          code,
          name
        )
      `)
      .eq('training_test_id', testId)
      .eq('active', true)
      .order('sort_order')

  if (moduleError) throw moduleError

  const { data: questionRows, error: questionError } =
    await admin
      .from('training_test_questions')
      .select(`
        sort_order,
        training_question_id,
        training_questions (
          id,
          question_text,
          training_question_options (
            id,
            option_text,
            sort_order,
            active
          ),
          training_question_media (
            id,
            storage_path,
            sort_order,
            active
          )
        )
      `)
      .eq('training_test_id', testId)
      .eq('active', true)
      .order('sort_order')

  if (questionError) throw questionError

  if (!questionRows?.length) {
    throw new Error('Test nema povezanih pitanja.')
  }

  const questionIds = questionRows.map(
    (row) => row.training_question_id
  )


const { data: moduleQuestionRows, error: linkError } =
  await admin
    .from('training_module_questions')
    .select(`
      training_module_id,
      training_question_id
    `)
    .in('training_question_id', questionIds)


  if (linkError) throw linkError

  const questions = questionRows.map((row: any) => {
    const q = Array.isArray(row.training_questions)
      ? row.training_questions[0]
      : row.training_questions

    if (!q) {
      throw new Error('Pitanje nije pronađeno.')
    }

    return {
      id: q.id,
      question_text: q.question_text,
      options: (q.training_question_options ?? [])
        .filter((o: any) => o.active)
        .sort((a: any, b: any) =>
          a.sort_order - b.sort_order
        )
        .map((o: any) => ({
          id: o.id,
          option_text: o.option_text,
          sort_order: o.sort_order,
        })),
      media: (q.training_question_media ?? [])
        .filter((m: any) => m.active)
        .sort((a: any, b: any) =>
          a.sort_order - b.sort_order
        ),
    }
  })

  const modules = (moduleRows ?? []).map((row: any) => {
    const module = Array.isArray(row.training_modules)
      ? row.training_modules[0]
      : row.training_modules

    if (!module) {
      throw new Error('Modul nije pronađen.')
    }

    const moduleQuestionIds = new Set(
      (moduleQuestionRows ?? [])
        .filter(
          (link) => link.training_module_id === module.id
        )
        .map((link) => link.training_question_id)
    )

    return {
      id: module.id,
      code: module.code,
      name: module.name,
      questions: questions.filter((q) =>
        moduleQuestionIds.has(q.id)
      ),
    }
  })

  return {
    testName: test.name,
    modules,
    questionCount: questions.length,
  }
}

async function loadArchiveImages(
  admin: ReturnType<typeof createAdminClient>,
  modules: Awaited<ReturnType<typeof loadArchiveTest>>['modules']
) {
  const result = []

  for (const module of modules) {
    const questions = []

    for (const question of module.questions) {
      const mediaWithImages = []

      for (const media of question.media) {
        if (!media.storage_path) {
          throw new Error(
            `Nedostaje putanja fotografije za pitanje ${question.id}.`
          )
        }

        const { data, error } = await admin.storage
          .from('training-question-media')
          .download(media.storage_path)

        if (error || !data) {
          throw new Error(
            `Fotografija nije pronađena: ${media.storage_path}`
          )
        }

        const mimeType = data.type

        if (
          mimeType !== 'image/png' &&
          mimeType !== 'image/jpeg'
        ) {
          throw new Error(
            `Nepodržan format fotografije: ${media.storage_path}`
          )
        }

        const bytes = Buffer.from(
          await data.arrayBuffer()
        )

        if (bytes.length === 0) {
          throw new Error(
            `Fotografija je prazna: ${media.storage_path}`
          )
        }

        const imageData =
          `data:${mimeType};base64,${bytes.toString('base64')}`

        mediaWithImages.push({
          id: media.id,
          image_data: imageData,
          sort_order: media.sort_order,
        })
      }

      questions.push({
        ...question,
        media: mediaWithImages,
      })
    }

    result.push({
      ...module,
      questions,
    })
  }

  return result
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
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

    const recordId =
      request.nextUrl.searchParams.get('recordId')

    if (!recordId || !UUID_PATTERN.test(recordId)) {
      return NextResponse.json(
        { error: 'Neispravan ID arhivskog zapisa.' },
        { status: 400 }
      )
    }

    const { data: record, error: recordError } =
      await admin
        .from('training_session_generated_tests')
        .select(`
          id,
          training_session_id,
          job_position_id,
          training_test_id,
          test_name,
          pdf_storage_path
        `)
        .eq('id', recordId)
        .maybeSingle()

    if (recordError) throw recordError

    if (!record) {
      return NextResponse.json(
        { error: 'Arhivski zapis nije pronađen.' },
        { status: 404 }
      )
    }

    // Ako PDF vec postoji, vrati arhivirani dokument.
    // Ne generisi novi PDF.

    if (record.pdf_storage_path) {
      const { data: savedPdf, error: downloadError } =
        await admin.storage
          .from('training-test-archive')
          .download(record.pdf_storage_path)

      if (downloadError || !savedPdf) {
        return NextResponse.json(
          {
            error:
              'Arhivirani PDF nije dostupan u Storage-u.',
          },
          { status: 404 }
        )
      }

      const pdfBytes = await savedPdf.arrayBuffer()

      return new NextResponse(
        new Uint8Array(pdfBytes),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition':
              'inline; filename="arhivirani-test.pdf"',
            'Cache-Control': 'no-store',
          },
        }
      )
    }



    // Privremena provera ucitavanja testa
    const testData = await loadArchiveTest(
      admin,
      record.training_test_id
    )

    const assignedQuestionIds = new Set(
      testData.modules.flatMap((module) =>
        module.questions.map((question) => question.id)
      )
    )

    if (
      assignedQuestionIds.size !== testData.questionCount
    ) {
      return NextResponse.json(
        {
          error:
            'Nisu sva pitanja rasporedjena u module.',
          totalQuestions: testData.questionCount,
          assignedQuestions: assignedQuestionIds.size,
        },
        { status: 422 }
      )
    }


    // Probno generisanje PDF-a bez arhiviranja


    // Ucitavanje fotografija za PDF
    const modules = await loadArchiveImages(
      admin,
      testData.modules
    )


    const buffer = await renderToBuffer(
      createElement(ArchiveTestDocument, {
        testName: testData.testName,
        modules,
      }) as any
    )



    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            'inline; filename="probni-test.pdf"',
          'Cache-Control': 'no-store',
        },
      }
    )



  } catch (error) {
    console.error('training-test-archive-pdf GET:', error)

    return NextResponse.json(
      { error: 'Greška pri proveri arhive PDF-a.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user }, error: authError } =
      await auth.auth.getUser()

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
        .select('role, active')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) throw profileError

    if (
      !profile?.active ||
      !['ADMIN', 'OPERATER'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'Pristup nije dozvoljen.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    const recordId = body?.recordId

    if (
      typeof recordId !== 'string' ||
      !UUID_PATTERN.test(recordId)
    ) {
      return NextResponse.json(
        { error: 'Neispravan ID zapisa.' },
        { status: 400 }
      )
    }

    const { data: record, error: recordError } =
      await admin
        .from('training_session_generated_tests')
        .select('*')
        .eq('id', recordId)
        .maybeSingle()

    if (recordError) throw recordError

    if (!record) {
      return NextResponse.json(
        { error: 'Zapis nije pronađen.' },
        { status: 404 }
      )
    }

    if (record.pdf_storage_path) {
      return NextResponse.json({
        success: true,
        archived: true,
        alreadyArchived: true,
        recordId,
      })
    }

    const testData = await loadArchiveTest(
      admin,
      record.training_test_id
    )

    const assigned = testData.modules.flatMap(
      module => module.questions.map(q => q.id)
    )

    if (
      new Set(assigned).size !== testData.questionCount ||
      assigned.length !== testData.questionCount
    ) {
      return NextResponse.json(
        { error: 'Raspored pitanja nije ispravan.' },
        { status: 422 }
      )
    }




    // Ucitavanje svih fotografija pre arhiviranja
    const modules = await loadArchiveImages(
      admin,
      testData.modules
    )


    const buffer = await renderToBuffer(
      createElement(ArchiveTestDocument, {
        testName: testData.testName,
        modules,
      }) as any
    )

    const bytes = new Uint8Array(buffer)

    if (
      bytes.length < 100 ||
      String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-'
    ) {
      throw new Error('Generisani dokument nije ispravan PDF.')
    }

    const storagePath =
      `${record.training_session_id}/${record.id}.pdf`

    const bucket = admin.storage.from(
      'training-test-archive'
    )

    const { error: uploadError } = await bucket.upload(
      storagePath,
      bytes,
      {
        contentType: 'application/pdf',
        upsert: false,
      }
    )

    if (uploadError) {
      throw uploadError
    }

    const { data: updated, error: updateError } =
      await admin
        .from('training_session_generated_tests')
        .update({
          pdf_storage_path: storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id)
        .is('pdf_storage_path', null)
        .select('id')
        .maybeSingle()

    if (updateError || !updated) {
      // Ne brisemo fajl automatski:
      // drugi zahtev je mozda upravo upisao putanju.
      throw new Error(
        'PDF je postavljen, ali upis arhive nije potvrđen. Potrebna je provera.'
      )
    }

    return NextResponse.json({
      success: true,
      archived: true,
      alreadyArchived: false,
      recordId: record.id,
      storagePath,
    })
  } catch (error) {
    console.error(
      'training-test-archive-pdf POST:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Greška pri arhiviranju PDF-a.',
      },
      { status: 500 }
    )
  }
}
