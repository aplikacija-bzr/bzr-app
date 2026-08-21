import {
  createClient,
} from '@/lib/supabase/server'

export type DirectMedicalExaminationForm1Data = {
  employer: {
    id: string
    name: string
    pib: string | null
    address: string | null
    city: string | null
    registrationNumber:
      string | null
    activityCode:
      string | null
  }

  records: {
    id: string
    jobPositionName: string
    employeeName: string
    intervalMonths:
      number | null
    examinationType: string
    examinationDate:
      string | null
    nextExaminationDate:
      string | null
    reportNumber:
      string | null
    fitnessAssessment:
      string | null
    measures:
      string | null
  }[]
}

type MedicalRecordRow = {
  id: string
  employee_id: string
  employer_job_position_id:
    string | null
  examination_type: string
  interval_months:
    number | null
  examination_date:
    string | null
  next_examination_date:
    string | null
  report_number:
    string | null
  fitness_assessment:
    string | null
  measures:
    string | null
}

export async function getMedicalExaminationForm1DataByEmployerId(
  employerId: string,
): Promise<
  DirectMedicalExaminationForm1Data | null
> {
  const supabase =
    await createClient()

  // -----------------------------------------
  // 1. POSLODAVAC
  // -----------------------------------------

  const {
    data: employerData,
    error: employerError,
  } =
    await supabase
      .from('employers')
      .select(`
        id,
        name,
        pib,
        address,
        city,
        registration_number,
        activity_code
      `)
      .eq(
        'id',
        employerId,
      )
      .maybeSingle()

  if (employerError) {
    throw employerError
  }

  if (!employerData) {
    return null
  }

  // -----------------------------------------
  // 2. SVI EVIDENTIRANI PREGLEDI
  //    POSLODAVCA
  // -----------------------------------------

  const {
    data: recordsData,
    error: recordsError,
  } =
    await supabase
      .from(
        'medical_examination_records',
      )
      .select(`
        id,
        employee_id,
        employer_job_position_id,
        examination_type,
        interval_months,
        examination_date,
        next_examination_date,
        report_number,
        fitness_assessment,
        measures
      `)
      .eq(
        'employer_id',
        employerId,
      )
      .eq(
        'status',
        'RECORDED',
      )
      .order(
        'examination_date',
        {
          ascending: true,
        },
      )

  if (recordsError) {
    throw recordsError
  }

  const recordRows =
    (recordsData ??
      []) as MedicalRecordRow[]

  // -----------------------------------------
  // 3. ZAPOSLENI
  // -----------------------------------------

  const employeeIds =
    Array.from(
      new Set(
        recordRows
          .map(
            (row) =>
              row.employee_id,
          )
          .filter(Boolean),
      ),
    )

  const employeeMap =
    new Map<
      string,
      {
        firstName: string
        lastName: string
      }
    >()

  if (
    employeeIds.length > 0
  ) {
    const {
      data: employeesData,
      error: employeesError,
    } =
      await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name
        `)
        .in(
          'id',
          employeeIds,
        )

    if (employeesError) {
      throw employeesError
    }

    for (
      const employee of
        employeesData ?? []
    ) {
      employeeMap.set(
        employee.id,
        {
          firstName:
            employee.first_name ??
            '',

          lastName:
            employee.last_name ??
            '',
        },
      )
    }
  }

  // -----------------------------------------
  // 4. RADNA MESTA
  // -----------------------------------------

  const employerJobPositionIds =
    Array.from(
      new Set(
        recordRows
          .map(
            (row) =>
              row.employer_job_position_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    )

  const jobPositionMap =
    new Map<
      string,
      string
    >()

  if (
    employerJobPositionIds.length >
    0
  ) {
    const {
      data:
        jobPositionsData,
      error:
        jobPositionsError,
    } =
      await supabase
        .from(
          'employer_job_positions',
        )
        .select(`
          id,
          job_positions (
            name
          )
        `)
        .in(
          'id',
          employerJobPositionIds,
        )

    if (
      jobPositionsError
    ) {
      throw jobPositionsError
    }

    for (
      const row of
        jobPositionsData ??
        []
    ) {
      const relation =
        row.job_positions

      const jobPosition =
        Array.isArray(
          relation,
        )
          ? relation[0]
          : relation

      jobPositionMap.set(
        row.id,
        jobPosition?.name ??
          '',
      )
    }
  }

  // -----------------------------------------
  // 5. PODACI ZA OBRAZAC 1
  // -----------------------------------------

  return {
    employer: {
      id:
        employerData.id,

      name:
        employerData.name,

      pib:
        employerData.pib,

      address:
        employerData.address,

      city:
        employerData.city,

      registrationNumber:
        employerData
          .registration_number,

      activityCode:
        employerData
          .activity_code,
    },

    records:
      recordRows.map(
        (row) => {
          const employee =
            employeeMap.get(
              row.employee_id,
            )

          return {
            id:
              row.id,

            jobPositionName:
              row
                .employer_job_position_id
                ? (
                    jobPositionMap.get(
                      row
                        .employer_job_position_id,
                    ) ?? ''
                  )
                : '',

            employeeName:
              [
                employee?.firstName,
                employee?.lastName,
              ]
                .filter(Boolean)
                .join(' '),

            intervalMonths:
              row.interval_months,

            examinationType:
              row.examination_type,

            examinationDate:
              row.examination_date,

            nextExaminationDate:
              row
                .next_examination_date,

            reportNumber:
              row.report_number,

            fitnessAssessment:
              row
                .fitness_assessment,

            measures:
              row.measures,
          }
        },
      ),
  }
}