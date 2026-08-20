import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CreateMedicalExaminationRecordRequest = {
  sessionItemId?: string
  intervalMonths?: number
  examinationDate?: string
  reportNumber?: string
  fitnessAssessment?: string
  measures?: string
}

function addMonths(
  dateValue: string,
  months: number
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
        day
      )
    )

  const targetDate =
    new Date(
      Date.UTC(
        year,
        month - 1 + months,
        1
      )
    )

  const lastDayOfTargetMonth =
    new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth() + 1,
        0
      )
    ).getUTCDate()

  targetDate.setUTCDate(
    Math.min(
      sourceDate.getUTCDate(),
      lastDayOfTargetMonth
    )
  )

  return targetDate
    .toISOString()
    .slice(0, 10)
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
      CreateMedicalExaminationRecordRequest

    const {
      sessionItemId,
      intervalMonths,
      examinationDate,
      reportNumber,
      fitnessAssessment,
      measures,
    } = body

    if (
      !sessionItemId ||
      !intervalMonths ||
      intervalMonths < 1 ||
      !examinationDate ||
      !fitnessAssessment
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaju obavezni podaci za rezultat lekarskog pregleda.',
        },
        {
          status: 400,
        }
      )
    }

    const supabase =
      await createClient()

    // -----------------------------------------
    // UČITAVANJE STAVKE POSTUPKA
    // -----------------------------------------

    const {
      data: sessionItem,
      error: sessionItemError,
    } = await supabase
      .from(
        'medical_examination_session_items'
      )
      .select(`
        id,
        session_id,
        employee_id,
        employee_job_position_id,
        medical_examination_record_id
      `)
      .eq(
        'id',
        sessionItemId
      )
      .single()

    if (sessionItemError) {
      throw sessionItemError
    }

    // -----------------------------------------
    // UČITAVANJE SESIJE
    // -----------------------------------------

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from(
        'medical_examination_sessions'
      )
      .select(`
        id,
        employer_id,
        examination_type
      `)
      .eq(
        'id',
        sessionItem.session_id
      )
      .single()

    if (sessionError) {
      throw sessionError
    }

    // -----------------------------------------
    // PRONALAŽENJE employer_job_position_id
    // -----------------------------------------

    let employerJobPositionId:
      string | null = null

    if (
      sessionItem.employee_job_position_id
    ) {
      const {
        data: employeeJobPosition,
        error: employeeJobPositionError,
      } = await supabase
        .from(
          'employee_job_positions'
        )
        .select(
          'employer_job_position_id'
        )
        .eq(
          'id',
          sessionItem.employee_job_position_id
        )
        .single()

      if (employeeJobPositionError) {
        throw employeeJobPositionError
      }

      employerJobPositionId =
        employeeJobPosition
          .employer_job_position_id ??
        null
    }

    const nextExaminationDate =
      addMonths(
        examinationDate,
        intervalMonths
      )

    // -----------------------------------------
    // PROVERA DA LI ZAPIS VEĆ POSTOJI
    // -----------------------------------------

    const {
      data: existingRecord,
      error: existingRecordError,
    } = await supabase
      .from(
        'medical_examination_records'
      )
      .select('*')
      .eq(
        'source_record_id',
        sessionItemId
      )
      .maybeSingle()

    if (existingRecordError) {
      throw existingRecordError
    }

    // -----------------------------------------
    // AKO ZAPIS VEĆ POSTOJI:
    // POVEŽI GA SA STAVKOM
    // -----------------------------------------

    if (existingRecord) {
      const {
        error: updateItemError,
      } = await supabase
        .from(
          'medical_examination_session_items'
        )
        .update({
          medical_examination_record_id:
            existingRecord.id,

          examination_date:
            existingRecord.examination_date,

          report_number:
            existingRecord.report_number,

          fitness_assessment:
            existingRecord.fitness_assessment,

          status:
            'RECORDED',
        })
        .eq(
          'id',
          sessionItemId
        )

      if (updateItemError) {
        throw updateItemError
      }

      const {
        data: updatedItem,
        error: updatedItemError,
      } = await supabase
        .from(
          'medical_examination_session_items'
        )
        .select('*')
        .eq(
          'id',
          sessionItemId
        )
        .single()

      if (updatedItemError) {
        throw updatedItemError
      }

      return NextResponse.json({
        success: true,
        existing: true,
        record: existingRecord,
        sessionItem: updatedItem,
      })
    }

    // -----------------------------------------
    // KREIRANJE NOVOG MEDICAL RECORD-A
    // -----------------------------------------

    const {
      data: record,
      error: recordError,
    } = await supabase
      .from(
        'medical_examination_records'
      )
      .insert({
        employer_id:
          session.employer_id,

        employee_id:
          sessionItem.employee_id,

        employer_job_position_id:
          employerJobPositionId,

        examination_type:
          session.examination_type,

        interval_months:
          intervalMonths,

        examination_date:
          examinationDate,

        next_examination_date:
          nextExaminationDate,

        report_number:
          reportNumber?.trim() || null,

        fitness_assessment:
          fitnessAssessment,

        measures:
          measures?.trim() || null,

        status:
          'RECORDED',

        source_record_id:
          sessionItemId,
      })
      .select('*')
      .single()

    if (recordError) {
      throw recordError
    }

    // -----------------------------------------
    // POVEZIVANJE RECORD-A SA STAVKOM POSTUPKA
    // -----------------------------------------

    const {
      error: updateItemError,
    } = await supabase
      .from(
        'medical_examination_session_items'
      )
      .update({
        medical_examination_record_id:
          record.id,

        examination_date:
          examinationDate,

        report_number:
          reportNumber?.trim() || null,

        fitness_assessment:
          fitnessAssessment,

        status:
          'RECORDED',
      })
      .eq(
        'id',
        sessionItemId
      )

    if (updateItemError) {
      throw updateItemError
    }

    const {
      data: updatedItem,
      error: updatedItemError,
    } = await supabase
      .from(
        'medical_examination_session_items'
      )
      .select('*')
      .eq(
        'id',
        sessionItemId
      )
      .single()

    if (updatedItemError) {
      throw updatedItemError
    }

    return NextResponse.json(
      {
        success: true,
        existing: false,
        record,
        sessionItem: updatedItem,
      },
      {
        status: 201,
      }
    )
  } catch (error: unknown) {
    console.error(
      'CREATE MEDICAL EXAMINATION RECORD:',
      error
    )

    const errorDetails =
      error &&
      typeof error === 'object'
        ? {
            message:
              'message' in error
                ? String(error.message)
                : null,

            code:
              'code' in error
                ? String(error.code)
                : null,

            details:
              'details' in error
                ? String(error.details)
                : null,

            hint:
              'hint' in error
                ? String(error.hint)
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