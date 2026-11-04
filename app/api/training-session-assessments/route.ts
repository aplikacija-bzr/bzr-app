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

    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Nedostaje sessionId.' },
        { status: 400 }
      )
    }

    const {
      data: sessionJobPositions,
      error: jobPositionsError,
    } = await supabase
      .from('training_session_job_positions')
      .select('id')
      .eq('training_session_id', sessionId)

    if (jobPositionsError) {
      throw jobPositionsError
    }

    const jobPositionIds = sessionJobPositions.map(
      (item) => item.id
    )

    if (jobPositionIds.length === 0) {
      return NextResponse.json({
        success: true,
        sessionId,
        data: [],
      })
    }

    const { data, error } = await supabase
      .from('training_session_employees')
      .select(`
        id,
        employee_job_position_id,
                training_test_id,
        theory_incorrect_percent,
        theory_passed,
        theory_assessment_date,
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
        ),

        training_session_job_positions (
          id,
          training_session_id,
          training_session_programs (
            training_program_versions (
              id,
              training_programs (
                id,
                name
              )
            )
          )
        )
      `)
      .in(
        'training_session_job_position_id',
        jobPositionIds
      )

    if (error) {
      throw error
    }

    const trainingSessionEmployeeIds = data.map(
      (item: any) => item.id
    )

    let practicalItems: any[] = []

    if (trainingSessionEmployeeIds.length > 0) {
      const {
        data: practicalData,
        error: practicalError,
      } = await supabase
        .from('training_practical_assessment_items')
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
        .order('sort_order', {
          ascending: true,
        })

      if (practicalError) {
        throw practicalError
      }

      practicalItems = practicalData ?? []
    }

    const assessments = data.map((item: any) => {
      const employee =
        item.employee_job_positions?.employees

      const employerJobPosition =
        item.employee_job_positions
          ?.employer_job_positions

      const jobPosition =
        employerJobPosition?.job_positions

      const program =
        item.training_session_job_positions
          ?.training_session_programs?.[0]
          ?.training_program_versions
          ?.training_programs

      const employeePracticalItems =
        practicalItems
          .filter(
            (practicalItem: any) =>
              practicalItem.training_session_employee_id ===
              item.id
          )
          .map((practicalItem: any) => ({
            id: practicalItem.id,

            assessmentType:
              practicalItem.assessment_type,

            hazardId:
              practicalItem.hazard_id,

            hazardCode:
              practicalItem.hazards?.code ?? null,

            hazardName:
              practicalItem.hazards?.name ?? null,

            ppeItemId:
              practicalItem.ppe_item_id,

            ppeCode:
              practicalItem.ppe_items?.code ?? null,

            ppeName:
              practicalItem.ppe_items?.name ?? null,

            description:
              practicalItem.description,

            passed:
              practicalItem.passed,

            notes:
              practicalItem.notes,

            sortOrder:
              practicalItem.sort_order,
          }))

      return {
  id: item.id,

  employeeJobPositionId:
    item.employee_job_position_id,

  trainingTestId:
    item.training_test_id,

  employerJobPositionId:
    employerJobPosition?.id ?? null,

        jobPositionName:
          jobPosition?.name ?? '',

        trainingProgramVersionId:
          item.training_session_job_positions
            ?.training_session_programs?.[0]
            ?.training_program_versions?.id ?? null,

        trainingProgramId:
          program?.id ?? null,

        trainingProgramName:
          program?.name ?? '',

        theoryIncorrectPercent:
          item.theory_incorrect_percent,

        theoryPassed:
          item.theory_passed,

        theoryAssessmentDate:
          item.theory_assessment_date,

        practicalPassed:
          item.practical_passed,

        practicalAssessmentDate:
          item.practical_assessment_date,

        practicalItems:
          employeePracticalItems,
      }
    })

    return NextResponse.json({
      success: true,
      sessionId,
      data: assessments,
    })
  } catch (error) {
    console.error(
      'training-session-assessments GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Greška pri učitavanju podataka.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      assessments,
      theoryAssessmentDate,
      practicalAssessmentDate,
    } = body

    if (
      !Array.isArray(assessments) ||
      assessments.length === 0
    ) {
      return NextResponse.json(
        { error: 'Nema rezultata za čuvanje.' },
        { status: 400 }
      )
    }

    if (!theoryAssessmentDate) {
      return NextResponse.json(
        {
          error:
            'Nedostaje datum teorijske provere.',
        },
        { status: 400 }
      )
    }

    if (!practicalAssessmentDate) {
      return NextResponse.json(
        {
          error:
            'Nedostaje datum praktične provere.',
        },
        { status: 400 }
      )
    }

    for (const assessment of assessments) {
      if (!assessment.id) {
        return NextResponse.json(
          {
            error:
              'Nedostaje ID zaposlenog u obuci.',
          },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('training_session_employees')
        .update({
          training_test_id:
  assessment.trainingTestId || null,
          theory_incorrect_percent:
            assessment.theoryIncorrectPercent,

          theory_passed:
            assessment.theoryPassed,

          theory_assessment_date:
            theoryAssessmentDate,

          practical_passed:
            assessment.practicalPassed,

          practical_assessment_date:
            practicalAssessmentDate,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', assessment.id)

      if (error) {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: assessments.length,
    })
  } catch (error) {
    console.error(
      'training-session-assessments POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Greška pri čuvanju rezultata provere.',
      },
      { status: 500 }
    )
  }
}