import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type TrainingInstructor = {
  id: string
  first_name: string
  last_name: string
  professional_title: string | null
  is_practical_instructor: boolean
  is_safety_advisor: boolean
  active: boolean
}

type EmployerTrainingInstructorRow = {
  id: string
  instructor_role: string
  is_default: boolean
  active: boolean
  training_instructor:
    | TrainingInstructor
    | TrainingInstructor[]
    | null
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url)

    const employerId =
      searchParams.get('employerId')

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

    const { data, error } =
      await supabase
        .from(
          'employer_training_instructors'
        )
        .select(`
          id,
          instructor_role,
          is_default,
          active,
          training_instructor:training_instructors (
            id,
            first_name,
            last_name,
            professional_title,
            is_practical_instructor,
            is_safety_advisor,
            active
          )
        `)
        .eq(
          'employer_id',
          employerId
        )
        .eq(
          'active',
          true
        )

    if (error) {
      throw error
    }

    const rows =
      (data ?? []) as unknown as
        EmployerTrainingInstructorRow[]

    const normalizedRows =
      rows.map((row) => {
        const trainingInstructor =
          Array.isArray(
            row.training_instructor
          )
            ? row.training_instructor[0] ?? null
            : row.training_instructor

        return {
          ...row,
          training_instructor:
            trainingInstructor,
        }
      })

    const safetyAdvisors =
      normalizedRows
        .filter(
          (row) =>
            row.instructor_role ===
              'safety_advisor' &&
            row.training_instructor
              ?.active
        )
        .map((row) => ({
          ...row.training_instructor!,
          is_default:
            row.is_default,
        }))

    const practicalInstructors =
      normalizedRows
        .filter(
          (row) =>
            row.instructor_role ===
              'practical_instructor' &&
            row.training_instructor
              ?.active
        )
        .map((row) => ({
          ...row.training_instructor!,
          is_default:
            row.is_default,
        }))

    return NextResponse.json({
      safetyAdvisors,
      practicalInstructors,
    })
  } catch (error) {
    console.error(
      'employer-training-instructors GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Greška pri učitavanju BZR lica poslodavca.',
      },
      {
        status: 500,
      }
    )
  }
}