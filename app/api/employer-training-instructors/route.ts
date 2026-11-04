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

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()

    const employerId =
      typeof body.employerId === 'string'
        ? body.employerId.trim()
        : ''

    const firstName =
      typeof body.firstName === 'string'
        ? body.firstName.trim()
        : ''

    const lastName =
      typeof body.lastName === 'string'
        ? body.lastName.trim()
        : ''

    const professionalTitle =
      typeof body.professionalTitle === 'string'
        ? body.professionalTitle.trim()
        : ''

    const instructorRole =
      typeof body.instructorRole === 'string'
        ? body.instructorRole.trim()
        : ''

    const isDefault =
      body.isDefault === true

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

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          error:
            'Unesite ime i prezime lica.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      instructorRole !==
        'safety_advisor' &&
      instructorRole !==
        'practical_instructor'
    ) {
      return NextResponse.json(
        {
          error:
            'Uloga BZR lica nije ispravna.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Prvo proveravamo da li lice već
     * postoji u centralnom registru.
     *
     * Za sada koristimo ime i prezime.
     * Time sprečavamo da isto lice
     * nepotrebno kreiramo više puta.
     */
    const {
      data: existingInstructors,
      error: existingInstructorError,
    } =
      await supabase
        .from('training_instructors')
        .select(`
          id,
          first_name,
          last_name,
          professional_title,
          is_practical_instructor,
          is_safety_advisor,
          active
        `)
        .ilike(
          'first_name',
          firstName
        )
        .ilike(
          'last_name',
          lastName
        )
        .limit(1)

    if (existingInstructorError) {
      throw existingInstructorError
    }

    let instructor =
      existingInstructors?.[0] ?? null

    if (!instructor) {
      const {
        data: createdInstructor,
        error: createInstructorError,
      } =
        await supabase
          .from('training_instructors')
          .insert({
            first_name: firstName,
            last_name: lastName,
            professional_title:
              professionalTitle || null,

            is_practical_instructor:
              instructorRole ===
              'practical_instructor',

            is_safety_advisor:
              instructorRole ===
              'safety_advisor',

            active: true,
          })
          .select(`
            id,
            first_name,
            last_name,
            professional_title,
            is_practical_instructor,
            is_safety_advisor,
            active
          `)
          .single()

      if (createInstructorError) {
        throw createInstructorError
      }

      instructor =
        createdInstructor
    } else {
      const updateData: {
        active: boolean
        is_practical_instructor?: boolean
        is_safety_advisor?: boolean
        professional_title?: string
      } = {
        active: true,
      }

      if (
        instructorRole ===
        'practical_instructor'
      ) {
        updateData.is_practical_instructor =
          true
      }

      if (
        instructorRole ===
        'safety_advisor'
      ) {
        updateData.is_safety_advisor =
          true
      }

      if (
        professionalTitle &&
        !instructor.professional_title
      ) {
        updateData.professional_title =
          professionalTitle
      }

      const {
        data: updatedInstructor,
        error: updateInstructorError,
      } =
        await supabase
          .from('training_instructors')
          .update(updateData)
          .eq(
            'id',
            instructor.id
          )
          .select(`
            id,
            first_name,
            last_name,
            professional_title,
            is_practical_instructor,
            is_safety_advisor,
            active
          `)
          .single()

      if (updateInstructorError) {
        throw updateInstructorError
      }

      instructor =
        updatedInstructor
    }

    /*
     * Ako novo lice treba da bude
     * podrazumevano za ovu ulogu,
     * prethodnim vezama skidamo default.
     *
     * Ne brišemo ih i ne deaktiviramo.
     */
    if (isDefault) {
      const {
        error: clearDefaultError,
      } =
        await supabase
          .from(
            'employer_training_instructors'
          )
          .update({
            is_default: false,
          })
          .eq(
            'employer_id',
            employerId
          )
          .eq(
            'instructor_role',
            instructorRole
          )
          .eq(
            'active',
            true
          )

      if (clearDefaultError) {
        throw clearDefaultError
      }
    }

    /*
     * Proveravamo da li ovo lice već
     * postoji kod ovog poslodavca
     * u istoj ulozi.
     */
    const {
      data: existingLinks,
      error: existingLinkError,
    } =
      await supabase
        .from(
          'employer_training_instructors'
        )
        .select(`
          id,
          active,
          is_default
        `)
        .eq(
          'employer_id',
          employerId
        )
        .eq(
          'training_instructor_id',
          instructor.id
        )
        .eq(
          'instructor_role',
          instructorRole
        )
        .limit(1)

    if (existingLinkError) {
      throw existingLinkError
    }

    const existingLink =
      existingLinks?.[0] ?? null

    let employerInstructorLink

    if (existingLink) {
      const {
        data: updatedLink,
        error: updateLinkError,
      } =
        await supabase
          .from(
            'employer_training_instructors'
          )
          .update({
            active: true,
            is_default: isDefault,
          })
          .eq(
            'id',
            existingLink.id
          )
          .select(`
            id,
            employer_id,
            training_instructor_id,
            instructor_role,
            is_default,
            active
          `)
          .single()

      if (updateLinkError) {
        throw updateLinkError
      }

      employerInstructorLink =
        updatedLink
    } else {
      const {
        data: createdLink,
        error: createLinkError,
      } =
        await supabase
          .from(
            'employer_training_instructors'
          )
          .insert({
            employer_id:
              employerId,

            training_instructor_id:
              instructor.id,

            instructor_role:
              instructorRole,

            is_default:
              isDefault,

            active:
              true,
          })
          .select(`
            id,
            employer_id,
            training_instructor_id,
            instructor_role,
            is_default,
            active
          `)
          .single()

      if (createLinkError) {
        throw createLinkError
      }

      employerInstructorLink =
        createdLink
    }

    return NextResponse.json(
      {
        instructor,
        employerInstructorLink,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'employer-training-instructors POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Greška pri čuvanju BZR lica poslodavca.',
      },
      {
        status: 500,
      }
    )
  }
}