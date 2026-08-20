import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createMedicalExaminationSession,
  type MedicalExaminationType,
} from '@/lib/medical-examination-session'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CreateSessionRequest = {
  employerId?: string
  examinationType?: MedicalExaminationType
}

type UpdateSessionRequest = {
  sessionId?: string

  action?:
    | 'WAITING_RESULTS'
    | 'COMPLETE'

  riskAssessmentIssuer?: string
  riskAssessmentYear?: number
}

// -----------------------------------------
// UČITAVANJE POSTOJEĆE SESIJE
// -----------------------------------------

export async function GET(
  request: NextRequest
) {
  try {
    const sessionId =
      request.nextUrl.searchParams.get(
        'sessionId'
      )

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaje sessionId.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase =
      await createClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'medical_examination_sessions'
        )
        .select(`
          id,
          session_number,
          employer_id,
          examination_type,
          status_id,
          risk_assessment_issuer,
          risk_assessment_year,
          created_at,
          updated_at
        `)
        .eq(
          'id',
          sessionId
        )
        .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Postupak lekarskih pregleda nije pronađen.',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id:
          data.id,

        sessionNumber:
          data.session_number,

        employerId:
          data.employer_id,

        examinationType:
          data.examination_type,

        statusId:
          data.status_id,

        riskAssessmentIssuer:
          data.risk_assessment_issuer,

        riskAssessmentYear:
          data.risk_assessment_year,

        createdAt:
          data.created_at,

        updatedAt:
          data.updated_at,
      },
    })
  } catch (error) {
    console.error(
      'GET MEDICAL EXAMINATION SESSION:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nepoznata greška.',
      },
      {
        status: 500,
      }
    )
  }
}

// -----------------------------------------
// KREIRANJE SESIJE
// -----------------------------------------

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
      CreateSessionRequest

    const {
      employerId,
      examinationType,
    } = body

    if (!employerId) {
      return NextResponse.json(
        {
          error:
            'Nedostaje employerId.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      examinationType !== 'PREVIOUS' &&
      examinationType !== 'PERIODIC'
    ) {
      return NextResponse.json(
        {
          error:
            'Neispravna vrsta pregleda.',
        },
        {
          status: 400,
        }
      )
    }

    const session =
      await createMedicalExaminationSession({
        employerId,
        examinationType,
      })

    return NextResponse.json(
      {
        success: true,
        session,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'CREATE MEDICAL EXAMINATION SESSION:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nepoznata greška.',
      },
      {
        status: 500,
      }
    )
  }
}

// -----------------------------------------
// IZMENA STATUSA / PODATAKA SESIJE
// -----------------------------------------

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
      UpdateSessionRequest

    const {
      sessionId,
      action,
      riskAssessmentIssuer,
      riskAssessmentYear,
    } = body

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            'Nedostaje sessionId.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase =
      await createClient()

    // -----------------------------------------
    // ČEKAJU SE REZULTATI PREGLEDA
    // status_id = 3 = IN_PROGRESS
    // -----------------------------------------

    if (action === 'WAITING_RESULTS') {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'medical_examination_sessions'
          )
          .update({
            status_id: 3,
          })
          .eq(
            'id',
            sessionId
          )
          .select(`
            id,
            session_number,
            status_id,
            updated_at
          `)
          .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        session: data,
      })
    }

    // -----------------------------------------
    // ZAVRŠETAK POSTUPKA
    // status_id = 4 = COMPLETED
    // -----------------------------------------

    if (action === 'COMPLETE') {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'medical_examination_sessions'
          )
          .update({
            status_id: 4,
          })
          .eq(
            'id',
            sessionId
          )
          .select(`
            id,
            session_number,
            status_id,
            updated_at
          `)
          .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        session: data,
      })
    }

    // -----------------------------------------
    // ČUVANJE PODATAKA O AKTU
    // -----------------------------------------

    if (
      !riskAssessmentIssuer ||
      !riskAssessmentIssuer.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Nedostaje podatak ko je doneo Akt o proceni rizika.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Number.isInteger(
        riskAssessmentYear
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Neispravna godina Akta o proceni rizika.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'medical_examination_sessions'
        )
        .update({
          risk_assessment_issuer:
            riskAssessmentIssuer.trim(),

          risk_assessment_year:
            riskAssessmentYear,
        })
        .eq(
          'id',
          sessionId
        )
        .select(`
          id,
          risk_assessment_issuer,
          risk_assessment_year
        `)
        .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      session: data,
    })
  } catch (error) {
    console.error(
      'UPDATE MEDICAL EXAMINATION SESSION:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nepoznata greška.',
      },
      {
        status: 500,
      }
    )
  }
}