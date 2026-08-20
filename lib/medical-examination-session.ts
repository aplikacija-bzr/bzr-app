import { createClient } from '@/lib/supabase/server'

export type MedicalExaminationStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type MedicalExaminationType =
  | 'PREVIOUS'
  | 'PERIODIC'

export type MedicalExaminationSession = {
  id: string
  sessionNumber: string
  employerId: string
  examinationType: string
  status: MedicalExaminationStatus
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type MedicalExaminationSessionItem = {
  id: string
  sessionId: string
  employeeId: string
  employeeJobPositionId: string
  intervalMonths: number | null
  examinationDate: string | null
  nextExaminationDate: string | null
  reminderDate: string | null
  reportNumber: string | null
  fitnessAssessment: string | null
  measures: string | null
  status: string
  medicalExaminationRecordId: string | null
  createdAt: string
  updatedAt: string
}

type MedicalExaminationSessionRow = {
  id: string
  session_number: string
  employer_id: string
  examination_type: string
  status_id: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  medical_examination_statuses:
    | {
        code: MedicalExaminationStatus
      }
    | {
        code: MedicalExaminationStatus
      }[]
    | null
}

type MedicalExaminationSessionItemRow = {
  id: string
  session_id: string
  employee_id: string
  employee_job_position_id: string
  interval_months: number | null
  examination_date: string | null
  next_examination_date: string | null
  reminder_date: string | null
  report_number: string | null
  fitness_assessment: string | null
  measures: string | null
  status: string
  medical_examination_record_id: string | null
  created_at: string
  updated_at: string
}

type CreateMedicalExaminationSessionInput = {
  employerId: string
  examinationType: MedicalExaminationType
  notes?: string | null
  createdBy?: string | null
}

function getSessionStatusCode(
  row: MedicalExaminationSessionRow
): MedicalExaminationStatus {
  const statusRelation =
    row.medical_examination_statuses

  if (Array.isArray(statusRelation)) {
    return statusRelation[0]?.code ?? 'DRAFT'
  }

  return statusRelation?.code ?? 'DRAFT'
}

async function generateMedicalExaminationSessionNumber() {
  const supabase = await createClient()

  const year =
    new Date().getFullYear()

  const prefix =
    `MED-${year}-`

  const { data, error } =
    await supabase
      .from('medical_examination_sessions')
      .select('session_number')
      .like(
        'session_number',
        `${prefix}%`
      )

  if (error) {
    throw error
  }

  let highestSequence = 0

  for (const row of data ?? []) {
    const sessionNumber =
      row.session_number

    if (
      typeof sessionNumber !== 'string'
    ) {
      continue
    }

    const sequenceText =
      sessionNumber.slice(
        prefix.length
      )

    if (
      !/^\d{4}$/.test(sequenceText)
    ) {
      continue
    }

    const sequence =
      Number(sequenceText)

    if (
      Number.isInteger(sequence) &&
      sequence > highestSequence
    ) {
      highestSequence =
        sequence
    }
  }

  const nextNumber =
    highestSequence + 1

  return (
    prefix +
    String(nextNumber).padStart(
      4,
      '0'
    )
  )
}
export async function createMedicalExaminationSession(
  input: CreateMedicalExaminationSessionInput
): Promise<MedicalExaminationSession> {
  const supabase = await createClient()

  const sessionNumber =
    await generateMedicalExaminationSessionNumber()

  const { data, error } =
    await supabase
      .from('medical_examination_sessions')
      .insert({
        session_number:
          sessionNumber,
        employer_id:
          input.employerId,
        examination_type:
          input.examinationType,
        status_id: 1,
        notes:
          input.notes ?? null,
        created_by:
          input.createdBy ?? null,
      })
      .select(`
        id,
        session_number,
        employer_id,
        examination_type,
        status_id,
        notes,
        created_by,
        created_at,
        updated_at,
        medical_examination_statuses (
          code
        )
      `)
      .single()

  if (error) {
    throw error
  }

  const row =
    data as MedicalExaminationSessionRow

  return {
    id: row.id,
    sessionNumber:
      row.session_number,
    employerId:
      row.employer_id,
    examinationType:
      row.examination_type,
    status:
      getSessionStatusCode(row),
    notes:
      row.notes,
    createdBy:
      row.created_by,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }
}

export async function getMedicalExaminationSessionById(
  sessionId: string
): Promise<MedicalExaminationSession | null> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('medical_examination_sessions')
      .select(`
        id,
        session_number,
        employer_id,
        examination_type,
        status_id,
        notes,
        created_by,
        created_at,
        updated_at,
        medical_examination_statuses (
          code
        )
      `)
      .eq('id', sessionId)
      .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const row =
    data as MedicalExaminationSessionRow

  return {
    id: row.id,
    sessionNumber:
      row.session_number,
    employerId:
      row.employer_id,
    examinationType:
      row.examination_type,
    status:
      getSessionStatusCode(row),
    notes:
      row.notes,
    createdBy:
      row.created_by,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }
}

export async function getMedicalExaminationSessionItems(
  sessionId: string
): Promise<MedicalExaminationSessionItem[]> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'medical_examination_session_items'
      )
      .select(`
        id,
        session_id,
        employee_id,
        employee_job_position_id,
        interval_months,
        examination_date,
        next_examination_date,
        reminder_date,
        report_number,
        fitness_assessment,
        measures,
        status,
        medical_examination_record_id,
        created_at,
        updated_at
      `)
      .eq(
        'session_id',
        sessionId
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as
      MedicalExaminationSessionItemRow[]

  return rows.map((row) => ({
    id:
      row.id,
    sessionId:
      row.session_id,
    employeeId:
      row.employee_id,
    employeeJobPositionId:
      row.employee_job_position_id,
    intervalMonths:
      row.interval_months,
    examinationDate:
      row.examination_date,
    nextExaminationDate:
      row.next_examination_date,
    reminderDate:
      row.reminder_date,
    reportNumber:
      row.report_number,
    fitnessAssessment:
      row.fitness_assessment,
    measures:
      row.measures,
    status:
      row.status,
    medicalExaminationRecordId:
      row.medical_examination_record_id,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }))
}

export async function getMedicalExaminationSessions():
  Promise<MedicalExaminationSession[]> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('medical_examination_sessions')
      .select(`
        id,
        session_number,
        employer_id,
        examination_type,
        status_id,
        notes,
        created_by,
        created_at,
        updated_at,
        medical_examination_statuses (
          code
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as
      MedicalExaminationSessionRow[]

  return rows.map((row) => ({
    id:
      row.id,
    sessionNumber:
      row.session_number,
    employerId:
      row.employer_id,
    examinationType:
      row.examination_type,
    status:
      getSessionStatusCode(row),
    notes:
      row.notes,
    createdBy:
      row.created_by,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }))
}
type CreateMedicalExaminationSessionItemInput = {
  sessionId: string
  employeeId: string
  employeeJobPositionId: string
  intervalMonths?: number | null
}

export async function createMedicalExaminationSessionItem(
  input: CreateMedicalExaminationSessionItemInput
): Promise<MedicalExaminationSessionItem> {
  const supabase =
    await createClient()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'medical_examination_session_items'
      )
      .insert({
        session_id:
          input.sessionId,
        employee_id:
          input.employeeId,
        employee_job_position_id:
          input.employeeJobPositionId,
        interval_months:
          input.intervalMonths ?? null,
        status:
          'PENDING',
      })
      .select(`
        id,
        session_id,
        employee_id,
        employee_job_position_id,
        interval_months,
        examination_date,
        next_examination_date,
        reminder_date,
        report_number,
        fitness_assessment,
        measures,
        status,
        medical_examination_record_id,
        created_at,
        updated_at
      `)
      .single()

  if (error) {
    throw error
  }

  const row =
    data as MedicalExaminationSessionItemRow

  return {
    id:
      row.id,
    sessionId:
      row.session_id,
    employeeId:
      row.employee_id,
    employeeJobPositionId:
      row.employee_job_position_id,
    intervalMonths:
      row.interval_months,
    examinationDate:
      row.examination_date,
    nextExaminationDate:
      row.next_examination_date,
    reminderDate:
      row.reminder_date,
    reportNumber:
      row.report_number,
    fitnessAssessment:
      row.fitness_assessment,
    measures:
      row.measures,
    status:
      row.status,
    medicalExaminationRecordId:
      row.medical_examination_record_id,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }
}
export type MedicalReferralData = {
  itemId: string
  referralNumber: string | null

  sessionId: string
  sessionNumber: string
  examinationType: MedicalExaminationType

  riskAssessmentIssuer: string | null
  riskAssessmentYear: number | null

  employer: {
    name: string
    address: string | null
    city: string | null
    registrationNumber: string | null
    activityCode: string | null
  }

  employee: {
    firstName: string
    lastName: string
    jmbg: string | null
    placeOfBirth: string | null
    occupation: string | null
  }

  jobPosition: {
    name: string
    jobTasks: string | null
    hazards: string | null
    medicalRequirements: string | null
  }

  previousExamination: {
    examinationDate: string | null
    reportNumber: string | null
    fitnessAssessment: string | null
    measures: string | null
  } | null
}
export async function getMedicalReferralData(
  itemId: string
): Promise<MedicalReferralData | null> {
  const supabase =
    await createClient()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'medical_examination_session_items'
      )
      .select(`
        id,
        referral_number,
        employee_id,
        employee_job_position_id,

        medical_examination_sessions (
          id,
          session_number,
          examination_type,
          risk_assessment_issuer,
          risk_assessment_year,
          employers (
            name,
            address,
            city,
            registration_number,
            activity_code
          )
        ),

        employees (
          first_name,
          last_name,
          jmbg,
          place_of_birth,
          occupation
        ),

        employee_job_positions (
          employer_job_positions (
            id,
            job_positions (
              id,
              name,
              knowledge_job_profiles (
                job_tasks,
                hazards,
                medical_requirements,
                active
              )
            )
          )
        )
      `)
      .eq(
        'id',
        itemId
      )
      .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

const row =
  data as unknown as
    MedicalReferralQueryRow

const sessionRelation =
  row.medical_examination_sessions

const employerRelation =
  sessionRelation?.employers

const employeeRelation =
  row.employees

const employeeJobPositionRelation =
  row.employee_job_positions

const employerJobPositionRelation =
  employeeJobPositionRelation
    ?.employer_job_positions

const jobPositionRelation =
  employerJobPositionRelation
    ?.job_positions

const knowledgeProfiles =
  jobPositionRelation
    ?.knowledge_job_profiles

const knowledgeProfile =
  Array.isArray(knowledgeProfiles)
    ? (
        knowledgeProfiles.find(
          (profile) =>
            profile.active === true
        ) ??
        knowledgeProfiles[0]
      )
    : knowledgeProfiles

  if (
    !sessionRelation ||
    !employerRelation ||
    !employeeRelation ||
    !employerJobPositionRelation ||
    !jobPositionRelation
  ) {
    throw new Error(
      'Nedostaju povezani podaci za generisanje uputa.'
    )
  }

  const {
    data: previousExaminationData,
    error: previousExaminationError,
  } = await supabase
    .from('medical_examination_records')
    .select(`
      examination_date,
      report_number,
      fitness_assessment,
      measures
    `)
    .eq(
      'employee_id',
      row.employee_id
    )
    .eq(
      'employer_job_position_id',
      employerJobPositionRelation.id
    )
    .eq(
      'status',
      'RECORDED'
    )
    .not(
      'examination_date',
      'is',
      null
    )
    .order(
      'examination_date',
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle()

  if (previousExaminationError) {
    throw previousExaminationError
  }

  return {
    itemId:
      data.id,

    referralNumber:
      data.referral_number,

    sessionId:
      sessionRelation.id,

    sessionNumber:
      sessionRelation.session_number,

    examinationType:
      sessionRelation.examination_type as
        MedicalExaminationType,

    riskAssessmentIssuer:
      sessionRelation
        .risk_assessment_issuer,

    riskAssessmentYear:
      sessionRelation
        .risk_assessment_year,

    employer: {
      name:
        employerRelation.name,
      address:
        employerRelation.address,
      city:
        employerRelation.city,
      registrationNumber:
        employerRelation
          .registration_number,
      activityCode:
        employerRelation.activity_code,
    },

    employee: {
      firstName:
        employeeRelation.first_name,
      lastName:
        employeeRelation.last_name,
      jmbg:
        employeeRelation.jmbg,
      placeOfBirth:
        employeeRelation.place_of_birth,
      occupation:
        employeeRelation.occupation,
    },

    jobPosition: {
      name:
        jobPositionRelation.name,
      jobTasks:
        knowledgeProfile?.job_tasks ??
        null,
      hazards:
        knowledgeProfile?.hazards ??
        null,
      medicalRequirements:
        knowledgeProfile
          ?.medical_requirements ??
        null,
    },

    previousExamination:
      previousExaminationData
        ? {
            examinationDate:
              previousExaminationData
                .examination_date,
            reportNumber:
              previousExaminationData
                .report_number,
            fitnessAssessment:
              previousExaminationData
                .fitness_assessment,
            measures:
              previousExaminationData
                .measures,
          }
        : null,
  }
}
type MedicalReferralQueryRow = {
  id: string
  referral_number: string | null
  employee_id: string
  employee_job_position_id: string

  medical_examination_sessions: {
    id: string
    session_number: string
    examination_type: string
    risk_assessment_issuer: string | null
    risk_assessment_year: number | null

    employers: {
      name: string
      address: string | null
      city: string | null
      registration_number: string | null
      activity_code: string | null
    } | null
  } | null

  employees: {
    first_name: string
    last_name: string
    jmbg: string | null
    place_of_birth: string | null
    occupation: string | null
  } | null

  employee_job_positions: {
    employer_job_positions: {
      id: string
      job_positions: {
        id: string
        name: string

        knowledge_job_profiles: {
          job_tasks: string | null
          hazards: string | null
          medical_requirements: string | null
          active: boolean
        }[]
      } | null
    } | null
  } | null
}
export type MedicalExaminationForm1Data = {
  employer: {
    id: string
    name: string
    pib: string | null
    address: string | null
    city: string | null
    registrationNumber: string | null
    activityCode: string | null
  }

  records: {
    id: string
    jobPositionName: string
    employeeName: string
    intervalMonths: number | null
    examinationType: string
    examinationDate: string | null
    nextExaminationDate: string | null
    reportNumber: string | null
    fitnessAssessment: string | null
    measures: string | null
  }[]
}

type MedicalExaminationForm1RecordRow = {
  id: string
  employee_id: string
  employer_job_position_id: string
  examination_type: string
  interval_months: number | null
  examination_date: string | null
  next_examination_date: string | null
  report_number: string | null
  fitness_assessment: string | null
  measures: string | null
}

export async function getMedicalExaminationForm1Data(
  sessionId: string
): Promise<MedicalExaminationForm1Data | null> {
  const supabase =
    await createClient()

  // -----------------------------------------
  // 1. SESIJA
  // -----------------------------------------

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase
    .from(
      'medical_examination_sessions'
    )
    .select(`
      id,
      employer_id
    `)
    .eq(
      'id',
      sessionId
    )
    .maybeSingle()

  if (sessionError) {
    throw sessionError
  }

  if (!sessionData) {
    return null
  }

  // -----------------------------------------
  // 2. POSLODAVAC
  // -----------------------------------------

  const {
    data: employerData,
    error: employerError,
  } = await supabase
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
      sessionData.employer_id
    )
    .maybeSingle()

  if (employerError) {
    throw employerError
  }

  if (!employerData) {
    throw new Error(
      'Poslodavac za Obrazac 1 nije pronađen.'
    )
  }

  // -----------------------------------------
  // 3. SVI EVIDENTIRANI PREGLEDI
  //    TOG POSLODAVCA
  //
  // Obrazac 1 predstavlja kompletnu
  // evidenciju poslodavca, a ne samo
  // trenutnu sesiju.
  // -----------------------------------------

  const {
    data: recordsData,
    error: recordsError,
  } = await supabase
    .from(
      'medical_examination_records'
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
      sessionData.employer_id
    )
    .eq(
      'status',
      'RECORDED'
    )
    .order(
      'examination_date',
      {
        ascending: true,
      }
    )

  if (recordsError) {
    throw recordsError
  }

  const recordRows =
    (recordsData ?? []) as
      MedicalExaminationForm1RecordRow[]

  // -----------------------------------------
  // 4. ZAPOSLENI
  // -----------------------------------------

  const employeeIds = [
    ...new Set(
      recordRows.map(
        (row) => row.employee_id
      )
    ),
  ]

  const employeeMap =
    new Map<
      string,
      {
        firstName: string
        lastName: string
      }
    >()

  if (employeeIds.length > 0) {
    const {
      data: employeesData,
      error: employeesError,
    } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name
      `)
      .in(
        'id',
        employeeIds
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
            employee.first_name ?? '',
          lastName:
            employee.last_name ?? '',
        }
      )
    }
  }

  // -----------------------------------------
  // 5. RADNA MESTA POSLODAVCA
  // -----------------------------------------

  const employerJobPositionIds = [
    ...new Set(
      recordRows.map(
        (row) =>
          row.employer_job_position_id
      )
    ),
  ]

  const jobPositionMap =
    new Map<string, string>()

  if (
    employerJobPositionIds.length > 0
  ) {
    const {
      data: jobPositionsData,
      error: jobPositionsError,
    } = await supabase
      .from(
        'employer_job_positions'
      )
      .select(`
        id,
        job_positions (
          name
        )
      `)
      .in(
        'id',
        employerJobPositionIds
      )

    if (jobPositionsError) {
      throw jobPositionsError
    }

    for (
      const row of
        jobPositionsData ?? []
    ) {
      const relation =
        row.job_positions

      const jobPosition =
        Array.isArray(relation)
          ? relation[0]
          : relation

      jobPositionMap.set(
        row.id,
        jobPosition?.name ?? ''
      )
    }
  }

  // -----------------------------------------
  // 6. PODACI ZA PDF
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
        employerData.activity_code,
    },

    records:
      recordRows.map(
        (row) => {
          const employee =
            employeeMap.get(
              row.employee_id
            )

          return {
            id:
              row.id,

            jobPositionName:
              jobPositionMap.get(
                row.employer_job_position_id
              ) ?? '',

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
              row.next_examination_date,

            reportNumber:
              row.report_number,

            fitnessAssessment:
              row.fitness_assessment,

            measures:
              row.measures,
          }
        }
      ),
  }
}