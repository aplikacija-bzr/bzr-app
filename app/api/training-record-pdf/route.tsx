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

import {
  createElement,
} from 'react'

import TrainingRecordDocument from '@/components/trainings/TrainingRecordDocument'

export const dynamic = 'force-dynamic'

const trainingReasonLabels: Record<
  string,
  string
> = {
  '01':
    'prilikom zasnivanja radnog odnosa, odnosno drugog radnog angažovanja',
  '02':
    'usled premeštaja na druge poslove',
  '03':
    'prilikom uvođenja nove tehnologije ili novih sredstava za rad ili promene opreme za rad',
  '04':
    'prilikom promene radnog procesa',
  '05':
    'ako poslodavac odredi zaposlenom da obavlja poslove na dva ili više radnih mesta',
  '06':
    'ako kod poslodavca rad obavljaju zaposleni drugog poslodavca',
  '07':
    'dodatna obuka kada to zahteva radni proces',
  '08':
    'dodatna obuka u slučaju teške, smrtne ili kolektivne povrede na radu',
  '09':
    'periodična obuka zaposlenih',
  '10':
    'obuka neposrednih rukovodilaca',
}

export async function GET(
  request: NextRequest,
) {
  try {
    const trainingSessionId =
      request.nextUrl.searchParams.get(
        'trainingSessionId',
      )

    if (!trainingSessionId) {
      return NextResponse.json(
        {
          error:
            'Nedostaje trainingSessionId.',
        },
        {
          status: 400,
        },
      )
    }

    const supabase = createClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .SUPABASE_SERVICE_ROLE_KEY!,
    )

    // =====================================================
    // 1. OSNOVNI PODACI O OBUCI
    // =====================================================

    const {
      data: trainingSession,
      error: trainingSessionError,
    } = await supabase
      .from('training_sessions')
      .select(`
        id,
        training_number,
        employer_id,
        reason_code,
        start_date,
        practical_instructor_name,
        safety_advisor_id
      `)
      .eq(
        'id',
        trainingSessionId,
      )
      .maybeSingle()

    if (trainingSessionError) {
      throw trainingSessionError
    }

    if (!trainingSession) {
      return NextResponse.json(
        {
          error:
            'Obuka nije pronađena.',
        },
        {
          status: 404,
        },
      )
    }

    // =====================================================
    // 2. POSLODAVAC
    // =====================================================

    const {
      data: employer,
      error: employerError,
    } = await supabase
      .from('employers')
      .select('id, name')
      .eq(
        'id',
        trainingSession.employer_id,
      )
      .maybeSingle()

    if (employerError) {
      throw employerError
    }

    if (!employer) {
      return NextResponse.json(
        {
          error:
            'Poslodavac nije pronađen.',
        },
        {
          status: 404,
        },
      )
    }

    // =====================================================
    // 3. SAVETNIK ZA BZR
    // =====================================================

    let safetyAdvisorName = '—'

    if (
      trainingSession.safety_advisor_id
    ) {
      const {
        data: safetyAdvisor,
        error: safetyAdvisorError,
      } = await supabase
        .from('training_instructors')
        .select(`
          id,
          first_name,
          last_name,
          professional_title
        `)
        .eq(
          'id',
          trainingSession
            .safety_advisor_id,
        )
        .maybeSingle()

      if (safetyAdvisorError) {
        throw safetyAdvisorError
      }

      if (safetyAdvisor) {
        safetyAdvisorName =
          `${
            safetyAdvisor.first_name ??
            ''
          } ${
            safetyAdvisor.last_name ??
            ''
          }`.trim() || '—'
      }
    }

    // =====================================================
    // 4. INSTRUKTOR PRAKTIČNE OBUKE
    // =====================================================

    const practicalInstructorName =
      trainingSession
        .practical_instructor_name
        ?.trim() ||
      '—'

    // =====================================================
    // 5. RADNA MESTA SESIJE
    // =====================================================

    const {
      data: sessionJobPositions,
      error: sessionJobPositionsError,
    } = await supabase
      .from(
        'training_session_job_positions',
      )
      .select(`
        id,
        job_position_id,
        sort_order
      `)
      .eq(
        'training_session_id',
        trainingSessionId,
      )
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

    if (
      sessionJobPositionsError
    ) {
      throw sessionJobPositionsError
    }

    if (
      !sessionJobPositions ||
      sessionJobPositions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Radno mesto nije pronađeno za ovu obuku.',
        },
        {
          status: 404,
        },
      )
    }

    const firstSessionJobPosition =
      sessionJobPositions[0]

    // =====================================================
    // 6. NAZIV RADNOG MESTA
    // =====================================================

    const {
      data: jobPosition,
      error: jobPositionError,
    } = await supabase
      .from('job_positions')
      .select('id, name')
      .eq(
        'id',
        firstSessionJobPosition
          .job_position_id,
      )
      .maybeSingle()

    if (jobPositionError) {
      throw jobPositionError
    }

    if (!jobPosition) {
      return NextResponse.json(
        {
          error:
            'Naziv radnog mesta nije pronađen.',
        },
        {
          status: 404,
        },
      )
    }

    // =====================================================
    // 7. RADNO MESTO KOD POSLODAVCA
    // =====================================================

    const {
      data: employerJobPosition,
      error: employerJobPositionError,
    } = await supabase
      .from(
        'employer_job_positions',
      )
      .select(`
        id,
        internal_name,
        organizational_unit,
        job_description,
        increased_risk
      `)
      .eq(
        'employer_id',
        trainingSession.employer_id,
      )
      .eq(
        'job_position_id',
        firstSessionJobPosition
          .job_position_id,
      )
      .eq(
        'active',
        true,
      )
      .maybeSingle()

    if (employerJobPositionError) {
      throw employerJobPositionError
    }

    if (!employerJobPosition) {
      return NextResponse.json(
        {
          error:
            'Radno mesto kod poslodavca nije pronađeno.',
        },
        {
          status: 404,
        },
      )
    }

    // =====================================================
    // 8. ZAPOSLENI U OBUCI + STVARNI REZULTATI
    // =====================================================

    const {
      data: sessionEmployees,
      error: sessionEmployeesError,
    } = await supabase
      .from(
        'training_session_employees',
      )
      .select(`
        id,
        sort_order,
        theory_incorrect_percent,
        theory_passed,
        theory_assessment_date,
        practical_passed,
        practical_assessment_date,

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
        trainingSessionId,
      )
      .order(
        'sort_order',
        {
          ascending: true,
        },
      )

    if (sessionEmployeesError) {
      throw sessionEmployeesError
    }

    if (
      !sessionEmployees ||
      sessionEmployees.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Zaposleni nisu pronađeni za ovu obuku.',
        },
        {
          status: 404,
        },
      )
    }

    const employees =
      sessionEmployees.map(
        (row: any) => {
          const employeeJobPosition =
            Array.isArray(
              row.employee_job_positions,
            )
              ? row
                  .employee_job_positions[0]
              : row
                  .employee_job_positions

          const employee =
            Array.isArray(
              employeeJobPosition
                ?.employees,
            )
              ? employeeJobPosition
                  .employees[0]
              : employeeJobPosition
                  ?.employees

          const trainingJobPosition =
            Array.isArray(
              row
                .training_session_job_positions,
            )
              ? row
                  .training_session_job_positions[0]
              : row
                  .training_session_job_positions

          const employeeJob =
            Array.isArray(
              trainingJobPosition
                ?.job_positions,
            )
              ? trainingJobPosition
                  .job_positions[0]
              : trainingJobPosition
                  ?.job_positions

          return {
            firstName:
              employee?.first_name ??
              '',
            lastName:
              employee?.last_name ??
              '',
            jobPositionName:
              employeeJob?.name ??
              '',
            theoryIncorrectPercent:
              row
                .theory_incorrect_percent,
            theoryPassed:
              row.theory_passed,
            practicalPassed:
              row.practical_passed,
            note: null,
          }
        },
      )

    // =====================================================
    // 9. OPASNOSTI I ŠTETNOSTI
    // =====================================================

    const {
      data: hazardLinks,
      error: hazardLinksError,
    } = await supabase
      .from(
        'employer_job_position_hazards',
      )
      .select(`
        id,
        hazard_id,
        activities
      `)
      .eq(
        'employer_job_position_id',
        employerJobPosition.id,
      )

    if (hazardLinksError) {
      throw hazardLinksError
    }

    const hazardIds =
      (hazardLinks ?? []).map(
        (item) =>
          item.hazard_id,
      )

    let hazards: {
      code: string
      name: string
      category:
        | 'OPASNOST'
        | 'STETNOST'
      activities: string
    }[] = []

    if (hazardIds.length > 0) {
      const {
        data: hazardDefinitions,
        error:
          hazardDefinitionsError,
      } = await supabase
        .from('hazards')
        .select(`
          id,
          code,
          name,
          category,
          article_number,
          sort_order
        `)
        .in(
          'id',
          hazardIds,
        )
        .order(
          'article_number',
          {
            ascending: true,
          },
        )
        .order(
          'sort_order',
          {
            ascending: true,
          },
        )
        .order(
          'code',
          {
            ascending: true,
          },
        )

      if (
        hazardDefinitionsError
      ) {
        throw hazardDefinitionsError
      }

      hazards =
        (
          hazardDefinitions ?? []
        ).map(
          (hazard) => {
            const link =
              (
                hazardLinks ?? []
              ).find(
                (item) =>
                  item.hazard_id ===
                  hazard.id,
              )

            return {
              code:
                hazard.code ?? '',
              name:
                hazard.name ?? '',
              category:
                hazard.category ===
                'STETNOST'
                  ? 'STETNOST'
                  : 'OPASNOST',
              activities:
                link?.activities ??
                '',
            }
          },
        )
    }

    // =====================================================
    // 10. TERMINI OBUKE IZ BAZE
    // =====================================================

    const sessionJobPositionIds =
      sessionJobPositions.map(
        (row) => row.id,
      )

    let schedules: any[] = []

    const {
      data: sessionPrograms,
      error: sessionProgramsError,
    } = await supabase
      .from(
        'training_session_programs',
      )
      .select('id')
      .in(
        'training_session_job_position_id',
        sessionJobPositionIds,
      )

    if (sessionProgramsError) {
      throw sessionProgramsError
    }

    const trainingSessionProgramIds =
      (sessionPrograms ?? []).map(
        (row) => row.id,
      )

    if (
      trainingSessionProgramIds.length >
      0
    ) {
      const {
        data: scheduleRows,
        error: scheduleRowsError,
      } = await supabase
        .from(
          'training_session_schedule',
        )
        .select(`
          activity_type,
          schedule_type,
          event_date,
          location
        `)
        .in(
          'training_session_program_id',
          trainingSessionProgramIds,
        )
        .order(
          'event_date',
          {
            ascending: true,
          },
        )

      if (scheduleRowsError) {
        throw scheduleRowsError
      }

      schedules =
        scheduleRows ?? []
    }

    const scheduleMap = {
      theoryTrainingDate: '',
      practicalTrainingDate: '',
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
        scheduleMap.theoryTrainingDate =
          schedule.event_date ?? ''
      }

      if (
        schedule.activity_type ===
          'TRAINING' &&
        schedule.schedule_type ===
          'PRACTICAL'
      ) {
        scheduleMap.practicalTrainingDate =
          schedule.event_date ?? ''
      }

      if (
        schedule.activity_type ===
          'ASSESSMENT' &&
        schedule.schedule_type ===
          'TEST'
      ) {
        scheduleMap.theoryAssessmentDate =
          schedule.event_date ?? ''
      }

      if (
        schedule.activity_type ===
          'ASSESSMENT' &&
        schedule.schedule_type ===
          'PRACTICAL_CHECK'
      ) {
        scheduleMap.practicalAssessmentDate =
          schedule.event_date ?? ''
      }
    }

    // =====================================================
    // 11. PODACI ZA DOKUMENT
    // =====================================================

    const jobPositionName =
      employerJobPosition
        .internal_name
        ?.trim() ||
      jobPosition.name

    const trainingReasonCode =
      trainingSession.reason_code ??
      ''

    const trainingReason =
      trainingReasonLabels[
        trainingReasonCode
      ] ??
      trainingReasonCode

    // Ako postoje datumi provere po zaposlenom,
    // oni su već sačuvani u training_session_employees.
    // Termini dokumenta ostaju termini cele obuke iz rasporeda.
    const firstEmployee =
      employees[0]

    // =====================================================
    // 12. PDF
    // =====================================================

    const buffer =
      await renderToBuffer(
        createElement(
          TrainingRecordDocument,
          {
            trainingSessionId,

            trainingNumber:
              trainingSession
                .training_number,

            employerName:
              employer.name,

            jobPositionName,

            jobDescription:
              employerJobPosition
                .job_description ??
              '',

            trainingReason,
            trainingReasonCode,

            scheduleLocation,

            theoryTrainingDate:
              scheduleMap
                .theoryTrainingDate,

            practicalTrainingDate:
              scheduleMap
                .practicalTrainingDate,

            theoryAssessmentDate:
              scheduleMap
                .theoryAssessmentDate,

            practicalAssessmentDate:
              scheduleMap
                .practicalAssessmentDate,

            practicalInstructorName,

            safetyAdvisorName,

            theoryIncorrectPercent:
              firstEmployee
                ?.theoryIncorrectPercent ??
              null,

            theoryPassed:
              firstEmployee
                ?.theoryPassed ??
              null,

            practicalPassed:
              firstEmployee
                ?.practicalPassed ??
              null,

            hazards,

            employees,

            instructions: [],

            includeWorkAtHeightModule:
              false,
          },
        ) as any,
      )

    return new NextResponse(
      new Uint8Array(
        buffer,
      ),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `inline; filename="evidencija-zapisnik-${
              trainingSession
                .training_number ??
              trainingSessionId
            }.pdf"`,

          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      'GREŠKA GENERISANJE EVIDENCIJE I ZAPISNIKA:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Došlo je do greške pri generisanju evidencije i zapisnika.',
      },
      {
        status: 500,
      },
    )
  }
}
