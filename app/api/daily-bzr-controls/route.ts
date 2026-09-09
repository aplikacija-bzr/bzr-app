import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createAdminClient,
} from '@/lib/supabase/admin'
import {
  createClient as createServerClient,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type DailyBzrControlRequest = {
  employerName?: string
  sourceSpreadsheetId?: string
  sourceSheetName?: string

  controlDate?: string
  sentAt?: string

  statusValue?: number

  location?: string
  coordinator?: string
  photoUrl?: string

  sourceRowKey?: string
}

export async function POST(
  request: NextRequest
) {
  try {
    const apiKey =
      request.headers.get(
        'x-bzr-master-api-key'
      )

    if (
      !apiKey ||
      apiKey !==
        process.env.BZR_MASTER_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body =
      (await request.json()) as
        DailyBzrControlRequest

    const {
      employerName,
      sourceSpreadsheetId,
      sourceSheetName,
      controlDate,
      sentAt,
      statusValue,
      location,
      coordinator,
      photoUrl,
      sourceRowKey,
    } = body

    if (
      !controlDate ||
      !sourceRowKey ||
      (
        statusValue !== 0 &&
        statusValue !== 1
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaju obavezni podaci.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase =
      createAdminClient()

    let mappingQuery =
      supabase
        .from(
          'daily_bzr_employer_map'
        )
        .select(`
          employer_id,
          master_employer_name,
          source_spreadsheet_id,
          source_sheet_name,
          active
        `)
        .eq(
          'active',
          true
        )

    if (
  sourceSpreadsheetId?.trim() &&
  employerName?.trim()
) {
  mappingQuery =
    mappingQuery
      .eq(
        'source_spreadsheet_id',
        sourceSpreadsheetId.trim()
      )
      .eq(
        'master_employer_name',
        employerName.trim()
      )
} else if (
  employerName?.trim()
) {
  mappingQuery =
    mappingQuery.eq(
      'master_employer_name',
      employerName.trim()
    )
} else if (
  sourceSpreadsheetId?.trim()
) {
  mappingQuery =
    mappingQuery.eq(
      'source_spreadsheet_id',
      sourceSpreadsheetId.trim()
    )
} else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaje identifikacija poslodavca.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data: mapping,
      error: mappingError,
    } = await mappingQuery
      .maybeSingle()

    if (mappingError) {
      throw mappingError
    }

    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Poslodavac nije mapiran u BZR INPRO.',
        },
        {
          status: 404,
        }
      )
    }

    const {
      data: existingControl,
      error: existingControlError,
    } = await supabase
      .from(
        'daily_bzr_controls'
      )
      .select('*')
      .eq(
        'employer_id',
        mapping.employer_id
      )
      .eq(
        'control_date',
        controlDate
      )
      .eq(
        'source_row_key',
        sourceRowKey
      )
      .maybeSingle()

    if (existingControlError) {
      throw existingControlError
    }

    if (existingControl) {
      return NextResponse.json({
        success: true,
        existing: true,
        control: existingControl,
      })
    }

    const {
      data: control,
      error: controlError,
    } = await supabase
      .from(
        'daily_bzr_controls'
      )
      .insert({
        employer_id:
          mapping.employer_id,

        control_date:
          controlDate,

        sent_at:
          sentAt || null,

        status_value:
          statusValue,

        location:
          location?.trim() || null,

        coordinator:
          coordinator?.trim() || null,

        photo_url:
          photoUrl?.trim() || null,

        source_spreadsheet_id:
          sourceSpreadsheetId?.trim() ||
          mapping.source_spreadsheet_id ||
          null,

        source_row_key:
          sourceRowKey,

        reaction_status:
          'NEW',
      })
      .select('*')
      .single()

    if (controlError) {
      throw controlError
    }

    return NextResponse.json(
      {
        success: true,
        existing: false,
        control,
      },
      {
        status: 201,
      }
    )
  } catch (error: unknown) {
    console.error(
      'DAILY BZR CONTROL:',
      error
    )

    const errorDetails =
      error &&
      typeof error === 'object'
        ? {
            message:
              'message' in error
                ? String(
                    error.message
                  )
                : null,

            code:
              'code' in error
                ? String(
                    error.code
                  )
                : null,

            details:
              'details' in error
                ? String(
                    error.details
                  )
                : null,

            hint:
              'hint' in error
                ? String(
                    error.hint
                  )
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
type DailyBzrControlStatusRequest = {
  controlId?: string
  reactionStatus?:
    | 'NEW'
    | 'IN_PROGRESS'
    | 'COMPLETED'
}

export async function PATCH(
  request: NextRequest
) {
  try {
        const authClient =
      await createServerClient()

    const {
      data: { user },
      error: authError,
    } =
      await authClient.auth.getUser()

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Korisnik nije prijavljen.',
        },
        {
          status: 401,
        }
      )
    }
    const body =
      (await request.json()) as
        DailyBzrControlStatusRequest

    const {
      controlId,
      reactionStatus,
    } = body

    if (
      !controlId ||
      !reactionStatus ||
      ![
        'NEW',
        'IN_PROGRESS',
        'COMPLETED',
      ].includes(reactionStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Neispravni podaci za promenu statusa.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase =
      createAdminClient()

    const {
      data: control,
      error,
    } =
      await supabase
        .from(
          'daily_bzr_controls'
        )
        .update({
          reaction_status:
            reactionStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          controlId
        )
        .select('*')
        .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      control,
    })
  } catch (error: unknown) {
    console.error(
      'DAILY BZR CONTROL STATUS:',
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