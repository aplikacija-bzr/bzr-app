import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'

export const dynamic =
  'force-dynamic'

type InitialMedicalExaminationRecordRequest = {
  employerId?: string
  employeeId?: string
  employerJobPositionId?: string
  examinationType?: string
  intervalMonths?: number
  examinationDate?: string
  reportNumber?: string
  fitnessAssessment?: string
  measures?: string
}

function addMonths(
  dateValue: string,
  months: number,
) {
  const [
    year,
    month,
    day,
  ] = dateValue
    .split('-')
    .map(Number)

  const sourceDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  const targetDate =
    new Date(
      Date.UTC(
        year,
        month - 1 + months,
        1,
      ),
    )

  const lastDayOfTargetMonth =
    new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate()

  targetDate.setUTCDate(
    Math.min(
      sourceDate.getUTCDate(),
      lastDayOfTargetMonth,
    ),
  )

  return targetDate
    .toISOString()
    .slice(0, 10)
}

function subtractDays(
  dateValue: string,
  days: number,
) {
  const [
    year,
    month,
    day,
  ] = dateValue
    .split('-')
    .map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  date.setUTCDate(
    date.getUTCDate() - days,
  )

  return date
    .toISOString()
    .slice(0, 10)
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request.json()) as
        InitialMedicalExaminationRecordRequest

    const {
      employerId,
      employeeId,
      employerJobPositionId,
      examinationType,
      intervalMonths,
      examinationDate,
      reportNumber,
      fitnessAssessment,
      measures,
    } = body

    if (
      !employerId ||
      !employeeId ||
      !employerJobPositionId ||
      !examinationType ||
      !examinationDate ||
      !intervalMonths ||
      intervalMonths < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaju obavezni podaci za prvi lekarski pregled.',
        },
        {
          status: 400,
        },
      )
    }

    if (
      examinationType !==
        'PREVIOUS' &&
      examinationType !==
        'PERIODIC'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Vrsta pregleda nije ispravna.',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      await createClient()

    // -----------------------------------------
    // PROVERA ZAPOSLENOG I POSLODAVCA
    // -----------------------------------------

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from('employees')
      .select(`
        id,
        employer_id
      `)
      .eq(
        'id',
        employeeId,
      )
      .maybeSingle()

    if (employeeError) {
      throw employeeError
    }

    if (
      !employee ||
      employee.employer_id !==
        employerId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Zaposleni nije povezan sa izabranim poslodavcem.',
        },
        {
          status: 400,
        },
      )
    }

    // -----------------------------------------
    // PROVERA RADNOG MESTA POSLODAVCA
    // -----------------------------------------

    const {
      data: employerJobPosition,
      error:
        employerJobPositionError,
    } = await supabase
      .from(
        'employer_job_positions',
      )
      .select(`
        id,
        employer_id
      `)
      .eq(
        'id',
        employerJobPositionId,
      )
      .maybeSingle()

    if (
      employerJobPositionError
    ) {
      throw employerJobPositionError
    }

    if (
      !employerJobPosition ||
      employerJobPosition.employer_id !==
        employerId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Radno mesto nije povezano sa izabranim poslodavcem.',
        },
        {
          status: 400,
        },
      )
    }

    // -----------------------------------------
    // ZAŠTITA OD DUPLOG PRVOG UNOSA
    // ZA ISTO RADNO MESTO
    // -----------------------------------------

    const {
      data: existingRecord,
      error: existingRecordError,
    } = await supabase
      .from(
        'medical_examination_records',
      )
      .select(`
        id
      `)
      .eq(
        'employer_id',
        employerId,
      )
      .eq(
        'employee_id',
        employeeId,
      )
      .eq(
        'employer_job_position_id',
        employerJobPositionId,
      )
      .eq(
        'status',
        'RECORDED',
      )
      .limit(1)
      .maybeSingle()

    if (existingRecordError) {
      throw existingRecordError
    }

    if (existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Za ovo radno mesto već postoji evidentiran lekarski pregled.',
        },
        {
          status: 409,
        },
      )
    }

    const nextExaminationDate =
      addMonths(
        examinationDate,
        intervalMonths,
      )

    const reminderDate =
      subtractDays(
        nextExaminationDate,
        30,
      )

    const sourceRecordId =
      `INITIAL:${employeeId}:${employerJobPositionId}:${examinationDate}:${reportNumber?.trim() || 'NO-REPORT'}`

    // -----------------------------------------
    // PRVI EVIDENTIRANI PREGLED
    // -----------------------------------------

    const {
      data: record,
      error: recordError,
    } = await supabase
      .from(
        'medical_examination_records',
      )
      .insert({
        employer_id:
          employerId,

        employee_id:
          employeeId,

        employer_job_position_id:
          employerJobPositionId,

        examination_type:
          examinationType,

        interval_months:
          intervalMonths,

        examination_date:
          examinationDate,

        next_examination_date:
          nextExaminationDate,

        reminder_date:
          reminderDate,

        report_number:
          reportNumber?.trim() ||
          null,

        fitness_assessment:
          fitnessAssessment?.trim() ||
          null,

        measures:
          measures?.trim() ||
          null,

        status:
          'RECORDED',

        source_record_id:
          sourceRecordId,
      })
      .select('*')
      .single()

    if (recordError) {
      throw recordError
    }

    return NextResponse.json(
      {
        success: true,
        record,
      },
      {
        status: 201,
      },
    )
  } catch (error: unknown) {
    console.error(
      'INITIAL MEDICAL EXAMINATION RECORD:',
      error,
    )

    const errorDetails =
      error &&
      typeof error === 'object'
        ? {
            message:
              'message' in error
                ? String(
                    error.message,
                  )
                : null,

            code:
              'code' in error
                ? String(
                    error.code,
                  )
                : null,

            details:
              'details' in error
                ? String(
                    error.details,
                  )
                : null,

            hint:
              'hint' in error
                ? String(
                    error.hint,
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
      },
    )
  }
}