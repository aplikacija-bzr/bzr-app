import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createMedicalExaminationSessionItem,
  getMedicalReferralData,
} from '@/lib/medical-examination-session'

import {
  createClient,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CreateSessionItemRequest = {
  sessionId?: string
  employeeId?: string
  employeeJobPositionId?: string
}

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
    } = await supabase
      .from(
        'medical_examination_session_items'
      )
      .select('id')
      .eq(
        'session_id',
        sessionId
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

    if (error) {
      throw error
    }

    const itemIds =
      (data ?? []).map(
        (row) => row.id
      )

    const items =
      await Promise.all(
        itemIds.map(
          async (itemId) => {
            const referralData =
              await getMedicalReferralData(
                itemId
              )

            if (!referralData) {
              return null
            }

            const {
              data: existingRecord,
              error: existingRecordError,
            } = await supabase
              .from(
                'medical_examination_records'
              )
              .select(`
                id,
                interval_months,
                examination_date,
                next_examination_date,
                report_number,
                fitness_assessment,
                measures,
                status
              `)
              .eq(
                'source_record_id',
                itemId
              )
              .maybeSingle()

            if (existingRecordError) {
              throw existingRecordError
            }

            return {
              id:
                referralData.itemId,
              referralNumber:
                referralData.referralNumber,
              examinationType:
                referralData.examinationType,
              employee: {
                firstName:
                  referralData.employee
                    .firstName,
                lastName:
                  referralData.employee
                    .lastName,
                jmbg:
                  referralData.employee
                    .jmbg,
              },
              jobPosition: {
                name:
                  referralData.jobPosition
                    .name,
              },
              existingRecord:
                existingRecord
                  ? {
                      id:
                        existingRecord.id,
                      intervalMonths:
                        existingRecord
                          .interval_months,
                      examinationDate:
                        existingRecord
                          .examination_date,
                      nextExaminationDate:
                        existingRecord
                          .next_examination_date,
                      reportNumber:
                        existingRecord
                          .report_number,
                      fitnessAssessment:
                        existingRecord
                          .fitness_assessment,
                      measures:
                        existingRecord
                          .measures,
                      status:
                        existingRecord
                          .status,
                    }
                  : null,
            }
          }
        )
      )

    return NextResponse.json(
      {
        success: true,
        items:
          items.filter(Boolean),
      },
      {
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error(
      'GET MEDICAL EXAMINATION SESSION ITEMS:',
      error
    )

    const errorDetails =
      error &&
      typeof error === 'object'
        ? {
            message:
              'message' in error
                ? String(error.message)
                : null,
            code:
              'code' in error
                ? String(error.code)
                : null,
            details:
              'details' in error
                ? String(error.details)
                : null,
            hint:
              'hint' in error
                ? String(error.hint)
                : null,
          }
        : {
            message:
              String(error),
            code: null,
            details: null,
            hint: null,
          }

    return NextResponse.json(
      {
        success: false,
        error: errorDetails,
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
      CreateSessionItemRequest

    const {
      sessionId,
      employeeId,
      employeeJobPositionId,
    } = body

    if (
      !sessionId ||
      !employeeId ||
      !employeeJobPositionId
    ) {
      return NextResponse.json(
        {
          error:
            'Nedostaju podaci za stavku postupka.',
        },
        {
          status: 400,
        }
      )
    }

    const item =
      await createMedicalExaminationSessionItem({
        sessionId,
        employeeId,
        employeeJobPositionId,
      })

    return NextResponse.json(
      {
        success: true,
        item,
      },
      {
        status: 201,
      }
    )
  } catch (error: unknown) {
    console.error(
      'CREATE MEDICAL EXAMINATION SESSION ITEM:',
      error
    )

    const errorDetails =
      error &&
      typeof error === 'object'
        ? {
            message:
              'message' in error
                ? String(error.message)
                : null,
            code:
              'code' in error
                ? String(error.code)
                : null,
            details:
              'details' in error
                ? String(error.details)
                : null,
            hint:
              'hint' in error
                ? String(error.hint)
                : null,
          }
        : {
            message:
              String(error),
            code: null,
            details: null,
            hint: null,
          }

    return NextResponse.json(
      {
        success: false,
        error: errorDetails,
      },
      {
        status: 500,
      }
    )
  }
}