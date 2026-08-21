import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'

export const dynamic =
  'force-dynamic'

type DirectMedicalExaminationRecordRequest = {
  previousRecordId?: string
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
        DirectMedicalExaminationRecordRequest

    const {
      previousRecordId,
      examinationDate,
      reportNumber,
      fitnessAssessment,
      measures,
    } = body

    if (
      !previousRecordId ||
      !examinationDate ||
      !fitnessAssessment
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaju obavezni podaci za evidentiranje pregleda.',
        },
        {
          status: 400,
        },
      )
    }

    const supabase =
      await createClient()

    // -----------------------------------------
    // PRETHODNI EVIDENTIRANI PREGLED
    // -----------------------------------------

    const {
      data: previousRecord,
      error: previousRecordError,
    } = await supabase
      .from(
        'medical_examination_records',
      )
      .select(`
        id,
        employer_id,
        employee_id,
        employer_job_position_id,
        examination_type,
        interval_months,
        examination_date,
        next_examination_date,
        report_number,
        fitness_assessment,
        measures,
        status
      `)
      .eq(
        'id',
        previousRecordId,
      )
      .maybeSingle()

    if (previousRecordError) {
      throw previousRecordError
    }

    if (!previousRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Prethodni lekarski pregled nije pronađen.',
        },
        {
          status: 404,
        },
      )
    }

    if (
      !previousRecord.interval_months ||
      previousRecord.interval_months < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Prethodni pregled nema ispravno definisan interval.',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !previousRecord.employer_job_position_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Prethodni pregled nije povezan sa radnim mestom.',
        },
        {
          status: 400,
        },
      )
    }

    const nextExaminationDate =
      addMonths(
        examinationDate,
        previousRecord.interval_months,
      )

    const reminderDate =
      subtractDays(
        nextExaminationDate,
        30,
      )

    const sourceRecordId =
      `DIRECT:${previousRecord.id}:${examinationDate}:${reportNumber?.trim() || 'NO-REPORT'}`

    // -----------------------------------------
    // ZAŠTITA OD DUPLOG UNOSA
    // -----------------------------------------

    const {
      data: existingRecord,
      error: existingRecordError,
    } = await supabase
      .from(
        'medical_examination_records',
      )
      .select('*')
      .eq(
        'source_record_id',
        sourceRecordId,
      )
      .maybeSingle()

    if (existingRecordError) {
      throw existingRecordError
    }

    if (existingRecord) {
      return NextResponse.json({
        success: true,
        existing: true,
        record: existingRecord,
      })
    }

    // -----------------------------------------
    // NOVI EVIDENTIRANI PREGLED
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
          previousRecord.employer_id,

        employee_id:
          previousRecord.employee_id,

        employer_job_position_id:
          previousRecord.employer_job_position_id,

        examination_type:
          previousRecord.examination_type,

        interval_months:
          previousRecord.interval_months,

        examination_date:
          examinationDate,

        next_examination_date:
          nextExaminationDate,

        reminder_date:
          reminderDate,

        report_number:
          reportNumber?.trim() || null,

        fitness_assessment:
          fitnessAssessment.trim(),

        measures:
          measures?.trim() || null,

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
        existing: false,
        record,
      },
      {
        status: 201,
      },
    )
  } catch (error: unknown) {
    console.error(
      'DIRECT MEDICAL EXAMINATION RECORD:',
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