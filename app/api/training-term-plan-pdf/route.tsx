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

import TrainingTermPlanDocument, {
  type TrainingTermPlanData,
} from '@/components/trainings/TrainingTermPlanDocument'

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
    // 2. ZAPOSLENI U OBUCI
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
        sort_order,
        training_session_job_positions!inner (
          training_session_id,
          job_positions (
            name
          )
        ),
        employee_job_positions (
          employees (
            first_name,
            last_name
          )
        )
      `)
      .eq(
        'training_session_job_positions.training_session_id',
        trainingSessionId
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
            'Greška pri učitavanju zaposlenih za terminski plan.',
        },
        {
          status: 500,
        }
      )
    }

    // =====================================================
    // 3. RADNA MESTA SESIJE
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
        'GREŠKA RADNA MESTA ZA TERMINE:',
        sessionJobPositionsError
      )

      return NextResponse.json(
        {
          error:
            'Greška pri učitavanju radnih mesta za termine obuke.',
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

    // =====================================================
    // 4. PROGRAMI I TERMINI
    // =====================================================

    let schedules: any[] = []

    if (
      sessionJobPositionIds.length >
      0
    ) {
      const {
        data: sessionPrograms,
        error:
          sessionProgramsError,
      } = await supabase
        .from(
          'training_session_programs'
        )
        .select('id')
        .in(
          'training_session_job_position_id',
          sessionJobPositionIds
        )

      if (
        sessionProgramsError
      ) {
        console.error(
          'GREŠKA PROGRAMI ZA TERMINE:',
          sessionProgramsError
        )

        return NextResponse.json(
          {
            error:
              'Greška pri učitavanju programa za termine obuke.',
          },
          {
            status: 500,
          }
        )
      }

      const trainingSessionProgramIds =
        (
          sessionPrograms ?? []
        ).map(
          (row) => row.id
        )

      if (
        trainingSessionProgramIds
          .length > 0
      ) {
        const {
          data: scheduleRows,
          error:
            schedulesError,
        } = await supabase
          .from(
            'training_session_schedule'
          )
          .select(`
            activity_type,
            schedule_type,
            event_date,
            location
          `)
          .in(
            'training_session_program_id',
            trainingSessionProgramIds
          )
          .order(
            'event_date',
            {
              ascending: true,
            }
          )

        if (
          schedulesError
        ) {
          console.error(
            'GREŠKA TERMINI:',
            schedulesError
          )

          return NextResponse.json(
            {
              error:
                'Greška pri učitavanju termina obuke.',
            },
            {
              status: 500,
            }
          )
        }

        schedules =
          scheduleRows ?? []
      }
    }

    // =====================================================
    // 5. MAPIRANJE TERMINA
    // =====================================================

    const scheduleMap = {
  theoryTrainingDate: '',
  theoryTrainingEndDate: '',
  practicalTrainingDate: '',
  practicalTrainingEndDate: '',
  theoryAssessmentDate: '',
  practicalAssessmentDate: '',
}

    let scheduleLocation = ''

    for (
      const schedule of schedules
    ) {
      if (
        !scheduleLocation &&
        schedule.location
      ) {
        scheduleLocation =
          schedule.location
      }

      if (
        schedule.activity_type ===
          'TRAINING' &&
        schedule.schedule_type ===
          'THEORY'
      ) {
        scheduleMap
          .theoryTrainingDate =
          schedule.event_date ?? ''
      }
      if (
  schedule.activity_type ===
    'TRAINING' &&
  schedule.schedule_type ===
    'THEORY_END'
) {
  scheduleMap
    .theoryTrainingEndDate =
    schedule.event_date ?? ''
}

      if (
        schedule.activity_type ===
          'TRAINING' &&
        schedule.schedule_type ===
          'PRACTICAL'
      ) {
        scheduleMap
          .practicalTrainingDate =
          schedule.event_date ?? ''
      }

      if (
        schedule.activity_type ===
          'ASSESSMENT' &&
        schedule.schedule_type ===
          'TEST'
      ) {
        scheduleMap
          .theoryAssessmentDate =
          schedule.event_date ?? ''
      }
      if (
  schedule.activity_type ===
    'TRAINING' &&
  schedule.schedule_type ===
    'PRACTICAL_END'
) {
  scheduleMap
    .practicalTrainingEndDate =
    schedule.event_date ?? ''
}

      if (
        schedule.activity_type ===
          'ASSESSMENT' &&
        schedule.schedule_type ===
          'PRACTICAL_CHECK'
      ) {
        scheduleMap
          .practicalAssessmentDate =
          schedule.event_date ?? ''
      }
    }

    // =====================================================
    // 6. POSLODAVAC
    // =====================================================

    const employer =
      Array.isArray(
        session.employers
      )
        ? session.employers[0]
        : session.employers

    // =====================================================
    // 7. SAVETNIK ZA BZR
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
    // 8. ZAPOSLENI ZA PDF
    // =====================================================

    const employees =
      (
        sessionEmployees ?? []
      ).map(
        (row: any) => {
          const employeeJobPosition =
            Array.isArray(
              row
                .employee_job_positions
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

          const sessionJobPosition =
            Array.isArray(
              row
                .training_session_job_positions
            )
              ? row
                  .training_session_job_positions[0]
              : row
                  .training_session_job_positions

          const jobPosition =
            Array.isArray(
              sessionJobPosition
                ?.job_positions
            )
              ? sessionJobPosition
                  .job_positions[0]
              : sessionJobPosition
                  ?.job_positions

          return {
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
          }
        }
      )

    // =====================================================
    // 9. PODACI ZA PDF
    // =====================================================

    const documentData:
      TrainingTermPlanData = {
      trainingSessionId,

      employerName:
        employer?.name ?? '',

      practicalInstructorName:
        session
          .practical_instructor_name ??
        '',

      safetyAdvisorName,

      scheduleLocation,

      employees,

      schedule:
        scheduleMap,
    }

    // =====================================================
    // 10. GENERISANJE PDF-A
    // =====================================================

    const buffer =
      await renderToBuffer(
        <TrainingTermPlanDocument
          data={documentData}
        />
      )

    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `inline; filename="terminski-plan-${
              session
                .training_number ??
              trainingSessionId
            }.pdf"`,

          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error(
      'GREŠKA GENERISANJE TERMINSKOG PLANA:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Došlo je do greške pri generisanju terminskog plana.',
      },
      {
        status: 500,
      }
    )
  }
}