import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/*
  POST
  Automatski generiše stavke praktične provere
  za konkretnog zaposlenog u konkretnoj obuci.

  Izvori:

  training_session_employee
  -> employee_job_position
  -> employer_job_position

  A) OPASNOSTI 8.x
  -> employer_job_position_hazard_activities
  -> hazard_activities

  B) propisana LZO
  -> ppe_practical_assessment_templates

  Rezultat:
  -> training_practical_assessment_items
*/
async function generateForEmployee(
  trainingSessionEmployeeId: string
) {
  try {

    /*
      1. Zaposleni u konkretnoj obuci
    */
    const {
      data: trainingEmployee,
      error: trainingEmployeeError,
    } = await supabase
      .from('training_session_employees')
      .select(`
        id,
        employee_job_position_id
      `)
      .eq(
        'id',
        trainingSessionEmployeeId
      )
      .single()

    if (trainingEmployeeError) {
      throw trainingEmployeeError
    }

    if (
      !trainingEmployee
        ?.employee_job_position_id
    ) {
      throw new Error(
        'Zaposleni u obuci nema povezano radno mesto.'
      )
    }

    /*
      2. Konkretno radno mesto zaposlenog
         kod poslodavca
    */
    const {
      data: employeeJobPosition,
      error: employeeJobPositionError,
    } = await supabase
      .from('employee_job_positions')
      .select(`
        id,
        employer_job_position_id
      `)
      .eq(
        'id',
        trainingEmployee
          .employee_job_position_id
      )
      .single()

    if (employeeJobPositionError) {
      throw employeeJobPositionError
    }

    const employerJobPositionId =
      employeeJobPosition
        ?.employer_job_position_id

    if (!employerJobPositionId) {
      throw new Error(
        'Nije pronađeno radno mesto zaposlenog kod poslodavca.'
      )
    }

   /*
  ==================================================
  A. OPASNOSTI 8.x
  ==================================================

  Za izabrane opasnosti konkretnog radnog mesta
  praktične stavke preuzimamo iz centralne biblioteke:

  hazard_practical_assessment_templates

  U praktičnu proveru ulaze samo aktivni kriterijumi
  za opasnosti 8.x koje su izabrane za konkretno
  radno mesto zaposlenog.
*/

    const {
      data: employerHazards,
      error: employerHazardsError,
    } = await supabase
      .from(
        'employer_job_position_hazards'
      )
.select(`
  hazard_id
`)
      .eq(
        'employer_job_position_id',
        employerJobPositionId
      )

    if (employerHazardsError) {
      throw employerHazardsError
    }

    const allHazardIds = [
      ...new Set(
        (employerHazards ?? [])
          .map(
            (row) => row.hazard_id
          )
          .filter(Boolean)
      ),
    ] as string[]

    let hazardRows: {
      id: string
      code: string
      name: string
    }[] = []

    if (allHazardIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('hazards')
        .select(`
          id,
          code,
          name
        `)
        .in('id', allHazardIds)
        .like('code', '8.%')
        .order('code', {
          ascending: true,
        })

      if (error) {
        throw error
      }

      hazardRows =
        (data ?? []) as typeof hazardRows
    }

    const practicalHazardIds =
      new Set(
        hazardRows.map(
          (hazard) => hazard.id
        )
      )


 let selectedHazardActivities: {
  hazard_id: string
  hazard_activity_id: string | null
  description: string
  sort_order: number
}[] = []

const practicalHazardIdList = [
  ...practicalHazardIds,
]

if (practicalHazardIdList.length > 0) {
  const {
    data: hazardTemplates,
    error: hazardTemplatesError,
  } = await supabase
    .from(
      'hazard_practical_assessment_templates'
    )
    .select(`
      hazard_id,
      hazard_activity_id,
      description,
      sort_order
    `)
    .in(
      'hazard_id',
      practicalHazardIdList
    )
    .eq('active', true)
    .order('sort_order', {
      ascending: true,
    })

  if (hazardTemplatesError) {
    throw hazardTemplatesError
  }

selectedHazardActivities =
  (hazardTemplates ?? []).map(
    (template) => ({
      hazard_id:
        template.hazard_id,
      hazard_activity_id:
        template.hazard_activity_id,
      description:
        template.description,
      sort_order:
        template.sort_order,
    })
  )
  }
  /*
  Uređujemo HAZARD stavke:

  prvo po šifri opasnosti,
  zatim po sort_order kriterijuma
  praktične provere.

  9.x ovde ne može da uđe jer su
  practicalHazardIds formirani isključivo
  iz hazards.code LIKE '8.%'.
*/

    const hazardCodeById =
      new Map(
        hazardRows.map(
          (hazard) => [
            hazard.id,
            hazard.code,
          ]
        )
      )

    selectedHazardActivities.sort(
      (a, b) => {
        const codeA =
          hazardCodeById.get(
            a.hazard_id
          ) ?? ''

        const codeB =
          hazardCodeById.get(
            b.hazard_id
          ) ?? ''

        const codeCompare =
          codeA.localeCompare(
            codeB,
            'sr',
            {
              numeric: true,
            }
          )

        if (codeCompare !== 0) {
          return codeCompare
        }

        return (
          a.sort_order -
          b.sort_order
        )
      }
    )
    const hazardTemplateCount =
  new Map<string, number>()

selectedHazardActivities =
  selectedHazardActivities.filter(
    (activity) => {
      const count =
        hazardTemplateCount.get(
          activity.hazard_id
        ) ?? 0

      if (count >= 3) {
        return false
      }

      hazardTemplateCount.set(
        activity.hazard_id,
        count + 1
      )

      return true
    }
  )

    /*
      ==================================================
      B. LZO
      ==================================================
    */

    const {
      data: employerPpe,
      error: employerPpeError,
    } = await supabase
      .from(
        'employer_job_position_ppe'
      )
      .select(`
        ppe_item_id
      `)
      .eq(
        'employer_job_position_id',
        employerJobPositionId
      )
      .eq('required', true)

    if (employerPpeError) {
      throw employerPpeError
    }

    const ppeItemIds = [
      ...new Set(
        (employerPpe ?? [])
          .map(
            (row) =>
              row.ppe_item_id
          )
          .filter(Boolean)
      ),
    ] as string[]

    let ppeRows: {
      id: string
      code: string
      name: string
    }[] = []

    if (ppeItemIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('ppe_items')
        .select(`
          id,
          code,
          name
        `)
        .in('id', ppeItemIds)
        .order('code', {
          ascending: true,
        })

      if (error) {
        throw error
      }

      ppeRows =
        (data ?? []) as typeof ppeRows
    }

    let ppeTemplates: {
      id: string
      ppe_item_id: string
      description: string
      sort_order: number
    }[] = []

    if (ppeItemIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'ppe_practical_assessment_templates'
        )
        .select(`
          id,
          ppe_item_id,
          description,
          sort_order
        `)
        .in(
          'ppe_item_id',
          ppeItemIds
        )
        .eq('active', true)
        .order('sort_order', {
          ascending: true,
        })

      if (error) {
        throw error
      }

      ppeTemplates =
        (data ??
          []) as typeof ppeTemplates
    }

    /*
      Po našem modelu:
      jedna LZO = jedna objedinjena
      praktična provera.

      Ako bi greškom postojalo više
      aktivnih šablona za isti PPE,
      uzimamo prvi po sort_order.
    */

    const firstPpeTemplateByItem =
      new Map<
        string,
        {
          id: string
          ppe_item_id: string
          description: string
          sort_order: number
        }
      >()

    for (
      const template of
      ppeTemplates
    ) {
      if (
        !firstPpeTemplateByItem.has(
          template.ppe_item_id
        )
      ) {
        firstPpeTemplateByItem.set(
          template.ppe_item_id,
          template
        )
      }
    }

    const ppeCodeById =
      new Map(
        ppeRows.map(
          (ppe) => [
            ppe.id,
            ppe.code,
          ]
        )
      )

    const selectedPpeTemplates =
      Array.from(
        firstPpeTemplateByItem.values()
      )

    selectedPpeTemplates.sort(
      (a, b) => {
        const codeA =
          ppeCodeById.get(
            a.ppe_item_id
          ) ?? ''

        const codeB =
          ppeCodeById.get(
            b.ppe_item_id
          ) ?? ''

        return codeA.localeCompare(
          codeB,
          'sr',
          {
            numeric: true,
          }
        )
      }
    )

    /*
      ==================================================
      3. Postojeće stavke
      ==================================================
    */

    const {
      data: existingItems,
      error: existingItemsError,
    } = await supabase
      .from(
        'training_practical_assessment_items'
      )
      .select(`
        id,
        assessment_type,
        hazard_id,
        ppe_item_id,
        description
      `)
      .eq(
        'training_session_employee_id',
        trainingSessionEmployeeId
      )

    if (existingItemsError) {
      throw existingItemsError
    }

    /*
      Ključ za HAZARD:
      hazard_id + description aktivnosti

      Ključ za PPE:
      ppe_item_id
    */

    const desiredHazardKeys =
      new Set(
        selectedHazardActivities.map(
          (activity) =>
            `${activity.hazard_id}::${activity.description}`
        )
      )

    const existingHazardItems =
      (existingItems ?? [])
        .filter(
          (item) =>
            item.assessment_type ===
            'HAZARD'
        )

    const staleHazardItemIds =
      existingHazardItems
        .filter(
          (item) =>
            !desiredHazardKeys.has(
              `${item.hazard_id}::${item.description}`
            )
        )
        .map(
          (item) => item.id
        )

    /*
      Brišemo samo stare HAZARD stavke
      koje više nisu među izabranim
      aktivnostima radnog mesta.

      Ovo je važno da prethodno generisani
      opšti šabloni ne ostanu u Fazi 5.
    */

    if (staleHazardItemIds.length > 0) {
      const {
        error: deleteStaleHazardItemsError,
      } = await supabase
        .from(
          'training_practical_assessment_items'
        )
        .delete()
        .in(
          'id',
          staleHazardItemIds
        )

      if (deleteStaleHazardItemsError) {
        throw deleteStaleHazardItemsError
      }
    }

    const existingHazardKeys =
      new Set(
        existingHazardItems
          .filter(
            (item) =>
              desiredHazardKeys.has(
                `${item.hazard_id}::${item.description}`
              )
          )
          .map(
            (item) =>
              `${item.hazard_id}::${item.description}`
          )
      )

    const existingPpeIds =
      new Set(
        (existingItems ?? [])
          .filter(
            (item) =>
              item.assessment_type ===
              'PPE'
          )
          .map(
            (item) =>
              item.ppe_item_id
          )
          .filter(Boolean)
      )

    /*
      ==================================================
      4. Priprema novih stavki
      ==================================================
    */

    const rowsToInsert: {
      training_session_employee_id: string
      assessment_type:
        | 'HAZARD'
        | 'PPE'
      hazard_id: string | null
      ppe_item_id: string | null
      description: string
      passed: null
      notes: null
      sort_order: number
    }[] = []

    let hazardSortOrder = 1

    for (
      const activity of
      selectedHazardActivities
    ) {
      const key =
        `${activity.hazard_id}::${activity.description}`

      if (
        !existingHazardKeys.has(
          key
        )
      ) {
        rowsToInsert.push({
          training_session_employee_id:
            trainingSessionEmployeeId,

          assessment_type:
            'HAZARD',

          hazard_id:
            activity.hazard_id,

          ppe_item_id: null,

          description:
            activity.description,

          passed: null,

          notes: null,

          sort_order:
            hazardSortOrder,
        })
      }

      hazardSortOrder += 1
    }

    let ppeSortOrder = 101

    for (
      const template of
      selectedPpeTemplates
    ) {
      if (
        !existingPpeIds.has(
          template.ppe_item_id
        )
      ) {
        rowsToInsert.push({
          training_session_employee_id:
            trainingSessionEmployeeId,

          assessment_type:
            'PPE',

          hazard_id: null,

          ppe_item_id:
            template.ppe_item_id,

          description:
            template.description,

          passed: null,

          notes: null,

          sort_order:
            ppeSortOrder,
        })
      }

      ppeSortOrder += 1
    }

    /*
      ==================================================
      5. Upis samo novih stavki
      ==================================================
    */

    let insertedItems: any[] = []

    /*
      Upisujemo red po red.

      Razlog:
      generisanje može biti pozvano dva puta gotovo
      istovremeno. U tom slučaju oba poziva mogu pre
      INSERT-a utvrditi da stavka još ne postoji.

      UNIQUE zaštita u bazi tada ispravno odbija
      duplikat kodom 23505. Takav duplikat samo
      preskačemo, dok svaku drugu grešku i dalje
      prijavljujemo.
    */
    for (const row of rowsToInsert) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'training_practical_assessment_items'
        )
        .insert(row)
        .select(`
          id,
          training_session_employee_id,
          assessment_type,
          hazard_id,
          ppe_item_id,
          description,
          passed,
          notes,
          sort_order
        `)
        .maybeSingle()

      if (error) {
        if (error.code === '23505') {
          continue
        }

        throw error
      }

      if (data) {
        insertedItems.push(data)
      }
    }

    /*
      Informativno:
      8.x opasnosti bez izabrane aktivnosti
      i LZO bez centralnog praktičnog šablona.
    */

    const hazardIdsWithActivities =
      new Set(
        selectedHazardActivities.map(
          (activity) =>
            activity.hazard_id
        )
      )

    const hazardsWithoutTemplate =
      hazardRows
        .filter(
          (hazard) =>
            !hazardIdsWithActivities.has(
              hazard.id
            )
        )
        .map(
          (hazard) => ({
            id: hazard.id,
            code: hazard.code,
            name: hazard.name,
          })
        )

    const ppeIdsWithTemplate =
      new Set(
        selectedPpeTemplates.map(
          (template) =>
            template.ppe_item_id
        )
      )

    const ppeWithoutTemplate =
      ppeRows
        .filter(
          (ppe) =>
            !ppeIdsWithTemplate.has(
              ppe.id
            )
        )
        .map(
          (ppe) => ({
            id: ppe.id,
            code: ppe.code,
            name: ppe.name,
          })
        )

    return {
      success: true,

      trainingSessionEmployeeId,

      employerJobPositionId,

      insertedCount:
        insertedItems.length,

      insertedItems,

      availableHazardTemplates:
        selectedHazardActivities.length,

      availablePpeTemplates:
        selectedPpeTemplates.length,

      hazardsWithoutTemplate,

      ppeWithoutTemplate,
    }
  } catch (error) {
    console.error(
      'training-practical-assessment-items generate error:',
      error
    )
    throw error
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()

    const {
      trainingSessionEmployeeId,
      trainingSessionId,
    } = body

    if (
      !trainingSessionEmployeeId &&
      !trainingSessionId
    ) {
      return NextResponse.json(
        {
          error:
            'Nedostaje trainingSessionEmployeeId ili trainingSessionId.',
        },
        { status: 400 }
      )
    }

    // Kompatibilnost sa postojećim pozivom za jednog zaposlenog.
    if (trainingSessionEmployeeId) {
      const result =
        await generateForEmployee(
          trainingSessionEmployeeId
        )

      return NextResponse.json(result)
    }

    // Nova mogućnost: obradi sve zaposlene konkretne obuke.
    const {
      data: sessionJobPositions,
      error: sessionJobPositionsError,
    } = await supabase
      .from('training_session_job_positions')
      .select('id')
      .eq(
        'training_session_id',
        trainingSessionId
      )

    if (sessionJobPositionsError) {
      throw sessionJobPositionsError
    }

    const sessionJobPositionIds =
      (sessionJobPositions ?? [])
        .map((row) => row.id)
        .filter(Boolean)

    if (sessionJobPositionIds.length === 0) {
      return NextResponse.json({
        success: true,
        trainingSessionId,
        employeeCount: 0,
        insertedCount: 0,
        results: [],
      })
    }

    const {
      data: trainingEmployees,
      error: trainingEmployeesError,
    } = await supabase
      .from('training_session_employees')
      .select(`
        id,
        sort_order
      `)
      .in(
        'training_session_job_position_id',
        sessionJobPositionIds
      )
      .order('sort_order', {
        ascending: true,
      })

    if (trainingEmployeesError) {
      throw trainingEmployeesError
    }

    const results = []

    for (
      const trainingEmployee of
      trainingEmployees ?? []
    ) {
      const result =
        await generateForEmployee(
          trainingEmployee.id
        )

      results.push(result)
    }

    const insertedCount =
      results.reduce(
        (sum, result) =>
          sum + result.insertedCount,
        0
      )

    return NextResponse.json({
      success: true,
      trainingSessionId,
      employeeCount: results.length,
      insertedCount,
      results,
    })
  } catch (error) {
    console.error(
      'training-practical-assessment-items POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Greška pri generisanju praktične provere.',
      },
      { status: 500 }
    )
  }
}

/*
  PATCH
  Čuvanje rezultata jedne konkretne
  stavke praktične provere.
*/
export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json()

    const {
      id,
      passed,
      notes,
    } = body

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Nedostaje ID stavke praktične provere.',
        },
        { status: 400 }
      )
    }

    if (
      passed !== true &&
      passed !== false
    ) {
      return NextResponse.json(
        {
          error:
            'Rezultat praktične provere mora biti Položio ili Nije položio.',
        },
        { status: 400 }
      )
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'training_practical_assessment_items'
      )
      .update({
        passed,

        notes:
          typeof notes === 'string' &&
          notes.trim()
            ? notes.trim()
            : null,

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        id,
        training_session_employee_id,
        assessment_type,
        hazard_id,
        ppe_item_id,
        description,
        passed,
        notes,
        sort_order
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,

      item: {
        id: data.id,

        trainingSessionEmployeeId:
          data.training_session_employee_id,

        assessmentType:
          data.assessment_type,

        hazardId:
          data.hazard_id,

        ppeItemId:
          data.ppe_item_id,

        description:
          data.description,

        passed:
          data.passed,

        notes:
          data.notes,

        sortOrder:
          data.sort_order,
      },
    })
  } catch (error) {
    console.error(
      'training-practical-assessment-items PATCH error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Greška pri čuvanju praktične provere.',
      },
      { status: 500 }
    )
  }
}