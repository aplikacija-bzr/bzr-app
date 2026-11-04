import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  renderToBuffer,
} from '@react-pdf/renderer'

import {
  createClient,
} from '@supabase/supabase-js'

import TrainingPracticalAssessmentDocument, {
  type TrainingPracticalAssessmentData,
} from '@/components/trainings/TrainingPracticalAssessmentDocument'
import { createElement } from 'react'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest
) {
  try {
    const trainingSessionId =
      request.nextUrl.searchParams.get(
        'trainingSessionId'
      )

    if (!trainingSessionId) {
      return NextResponse.json(
        {
          error:
            'Nedostaje trainingSessionId.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase = createClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .SUPABASE_SERVICE_ROLE_KEY!
    )

    // =====================================================
    // 1. OSNOVNI PODACI O OBUCI
    // =====================================================

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('training_sessions')
      .select(`
        id,
        training_number,
        employer_id,
        practical_instructor_name,
        safety_advisor_id,
        employers!fk_training_sessions_employer (
          name
        )
      `)
      .eq(
        'id',
        trainingSessionId
      )
      .single()

    if (
      sessionError ||
      !session
    ) {
      console.error(
        'GREŠKA OBUKA:',
        sessionError
      )

      return NextResponse.json(
        {
          error:
            'Obuka nije pronađena.',
        },
        {
          status: 404,
        }
      )
    }

    // =====================================================
    // 2. RADNA MESTA SESIJE
    // =====================================================

    const {
      data: sessionJobPositions,
      error:
        sessionJobPositionsError,
    } = await supabase
      .from(
        'training_session_job_positions'
      )
      .select('id')
      .eq(
        'training_session_id',
        trainingSessionId
      )

    if (
      sessionJobPositionsError
    ) {
      console.error(
        'GREŠKA RADNA MESTA:',
        sessionJobPositionsError
      )

      return NextResponse.json(
        {
          error:
            'Greška pri učitavanju radnih mesta obuke.',
        },
        {
          status: 500,
        }
      )
    }

    const sessionJobPositionIds =
      (
        sessionJobPositions ?? []
      ).map(
        (row) => row.id
      )

    if (
      sessionJobPositionIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Obuka nema sačuvana radna mesta.',
        },
        {
          status: 400,
        }
      )
    }

    // =====================================================
    // 3. ZAPOSLENI I ZBIRNI REZULTATI PRAKTIČNE PROVERE
    // =====================================================

    const {
      data: sessionEmployees,
      error: employeesError,
    } = await supabase
      .from(
        'training_session_employees'
      )
      .select(`
        id,
        employee_job_position_id,
        sort_order,
        practical_passed,
        practical_assessment_date,

        employee_job_positions (
          employees (
            id,
            first_name,
            last_name
          ),
          employer_job_positions (
            id,
            job_positions (
              id,
              name
            )
          )
        )
      `)
      .in(
        'training_session_job_position_id',
        sessionJobPositionIds
      )
      .order(
        'sort_order',
        {
          ascending: true,
        }
      )

    if (employeesError) {
      console.error(
        'GREŠKA ZAPOSLENI:',
        employeesError
      )

      return NextResponse.json(
        {
          error:
            'Greška pri učitavanju zaposlenih za praktičnu proveru.',
        },
        {
          status: 500,
        }
      )
    }

    if (
      !sessionEmployees ||
      sessionEmployees.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Nema zaposlenih u ovoj obuci.',
        },
        {
          status: 400,
        }
      )
    }

    const trainingSessionEmployeeIds =
      sessionEmployees.map(
        (row) => row.id
      )

    // =====================================================
    // 4. POJEDINAČNE STAVKE PRAKTIČNE PROVERE
    // =====================================================

    const {
      data: practicalItems,
      error: practicalItemsError,
    } = await supabase
      .from(
        'training_practical_assessment_items'
      )
      .select(`
        id,
        training_session_employee_id,
        assessment_type,
        hazard_id,
        ppe_item_id,
        description,
        passed,
        notes,
        sort_order,

        hazards (
          id,
          code,
          name
        ),

        ppe_items (
          id,
          code,
          name
        )
      `)
      .in(
        'training_session_employee_id',
        trainingSessionEmployeeIds
      )
      .order(
        'sort_order',
        {
          ascending: true,
        }
      )

    if (
      practicalItemsError
    ) {
      console.error(
        'GREŠKA STAVKE PRAKTIČNE PROVERE:',
        practicalItemsError
      )

      return NextResponse.json(
        {
          error:
            'Greška pri učitavanju stavki praktične provere.',
        },
        {
          status: 500,
        }
      )
    }

    // =====================================================
    // 5. POSLODAVAC
    // =====================================================

    const employer =
      Array.isArray(
        session.employers
      )
        ? session.employers[0]
        : session.employers

    // =====================================================
    // 6. SAVETNIK ZA BZR
    // =====================================================

    let safetyAdvisorName = ''

    if (
      session.safety_advisor_id
    ) {
      const {
        data: safetyAdvisor,
        error:
          safetyAdvisorError,
      } = await supabase
        .from(
          'training_instructors'
        )
        .select(`
          first_name,
          last_name
        `)
        .eq(
          'id',
          session.safety_advisor_id
        )
        .maybeSingle()

      if (
        safetyAdvisorError
      ) {
        console.error(
          'GREŠKA SAVETNIK:',
          safetyAdvisorError
        )
      }

      if (safetyAdvisor) {
        safetyAdvisorName =
          `${
            safetyAdvisor.first_name ??
            ''
          } ${
            safetyAdvisor.last_name ??
            ''
          }`.trim()
      }
    }

    // =====================================================
    // 7. MAPIRANJE ZAPOSLENIH I PRAKTIČNIH STAVKI
    // =====================================================

    const employees =
      sessionEmployees.map(
        (row: any) => {
          const employeeJobPosition =
            Array.isArray(
              row.employee_job_positions
            )
              ? row
                  .employee_job_positions[0]
              : row
                  .employee_job_positions

          const employee =
            Array.isArray(
              employeeJobPosition
                ?.employees
            )
              ? employeeJobPosition
                  .employees[0]
              : employeeJobPosition
                  ?.employees

          const employerJobPosition =
            Array.isArray(
              employeeJobPosition
                ?.employer_job_positions
            )
              ? employeeJobPosition
                  .employer_job_positions[0]
              : employeeJobPosition
                  ?.employer_job_positions

          const jobPosition =
            Array.isArray(
              employerJobPosition
                ?.job_positions
            )
              ? employerJobPosition
                  .job_positions[0]
              : employerJobPosition
                  ?.job_positions

          const employeePracticalItems =
            (
              practicalItems ?? []
            )
              .filter(
                (item: any) =>
                  item
                    .training_session_employee_id ===
                  row.id
              )
              .map(
                (item: any) => {
                  const hazard =
                    Array.isArray(
                      item.hazards
                    )
                      ? item.hazards[0]
                      : item.hazards

                  const ppeItem =
                    Array.isArray(
                      item.ppe_items
                    )
                      ? item.ppe_items[0]
                      : item.ppe_items

                  const isHazard =
                    item.assessment_type ===
                    'HAZARD'

                  return {
                    id:
                      item.id,

                    assessmentType:
                      item.assessment_type,

                    code:
                      isHazard
                        ? hazard?.code ??
                          null
                        : ppeItem?.code ??
                          null,

                    name:
                      isHazard
                        ? hazard?.name ??
                          null
                        : ppeItem?.name ??
                          null,

                    description:
                      item.description ??
                      '',

                    passed:
                      item.passed,

                    notes:
                      item.notes,

                    sortOrder:
                      item.sort_order ?? 0,
                  }
                }
              )
              .sort(
                (
                  a: any,
                  b: any
                ) =>
                  a.sortOrder -
                  b.sortOrder
              )

          return {
            id:
              row.id,

            firstName:
              employee
                ?.first_name ??
              '',

            lastName:
              employee
                ?.last_name ??
              '',

            jobPositionName:
              jobPosition
                ?.name ??
              '',

            practicalPassed:
              row.practical_passed,

            practicalAssessmentDate:
              row
                .practical_assessment_date,

            practicalItems:
              employeePracticalItems,
          }
        }
      )

    // =====================================================
    // 8. PODACI ZA PDF
    // =====================================================

    const documentData:
      TrainingPracticalAssessmentData = {
      trainingSessionId,

      trainingNumber:
        session.training_number ??
        trainingSessionId,

      employerName:
        employer?.name ?? '',

      practicalInstructorName:
        session
          .practical_instructor_name ??
        '',

      safetyAdvisorName,

      employees,
    }

    // =====================================================
    // 9. GENERISANJE PDF-A
    // =====================================================

   const buffer =
  await renderToBuffer(
    createElement(
      TrainingPracticalAssessmentDocument,
      {
        data: documentData,
      }
    ) as any
  )
    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `inline; filename="prakticna-provera-${
              session.training_number ??
              trainingSessionId
            }.pdf"`,

          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error(
      'GREŠKA GENERISANJE PRAKTIČNE PROVERE:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Došlo je do greške pri generisanju praktične provere.',
      },
      {
        status: 500,
      }
    )
  }
}