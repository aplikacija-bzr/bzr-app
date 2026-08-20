import { createClient } from '@/lib/supabase/server'

export type WorkInboxPriority =
  | 'critical'
  | 'high'

export type WorkInboxStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting'

export type WorkInboxSourceType =
  | 'training'
  | 'medical'
  | 'work_equipment'

export type WorkInboxItem = {
  id: string
  sourceType: WorkInboxSourceType
  sourceId: string
  targetUrl: string
  employerId: string
  employerName: string
  category: string
  title: string
  subject: string
  deadlineLabel: string
  deadlineDate: string
  reasonLabel: string
  priority: WorkInboxPriority
  status: WorkInboxStatus
}

type TrainingSessionRow = {
  id: string
  training_number: string
  employer_id: string
  status_id: number
  reason_code: string | null
  start_date: string
}

type MedicalExaminationRow = {
  id: string
  employer_id: string
  employee_id: string
  employer_job_position_id: string | null
  examination_type: string
  next_examination_date: string
  reminder_date: string | null
  report_number: string | null
  fitness_assessment: string | null
  status: string
}

type WaitingMedicalSessionRow = {
  id: string
  session_number: string
  employer_id: string
  examination_type: string
  status_id: number
  created_at: string
}

type WorkEquipmentReportItemRow = {
  work_equipment: {
    designation: string
    name: string
  }[]
}

type WorkEquipmentReportRow = {
  id: string
  employer_id: string
  report_number: string
  inspection_date: string
  next_inspection_date: string
  reminder_date: string
  inspected_by: string | null
  result: string | null
  active: boolean
  work_equipment_report_items:
    WorkEquipmentReportItemRow[]
}

function mapTrainingStatus(
  statusId: number,
): WorkInboxStatus {
  if (statusId === 1) {
    return 'not_started'
  }

  if (
    statusId === 2 ||
    statusId === 3
  ) {
    return 'in_progress'
  }

  return 'waiting'
}

function getStartOfToday(): Date {
  const today = new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  return today
}

function formatDateValue(
  date: Date,
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return (
    `${year}-${month}-${day}`
  )
}

function getTodayDateValue(): string {
  return formatDateValue(
    getStartOfToday(),
  )
}

function getUpperDateLimit(): string {
  const today =
    getStartOfToday()

  const thirtyDaysFromToday =
    new Date(today)

  thirtyDaysFromToday.setDate(
    today.getDate() + 30,
  )

  return formatDateValue(
    thirtyDaysFromToday,
  )
}

function parseDate(
  dateValue: string,
): Date {
  const date =
    new Date(
      `${dateValue}T00:00:00`,
    )

  date.setHours(
    0,
    0,
    0,
    0,
  )

  return date
}

function getDaysUntil(
  dateValue: string,
): number {
  const today =
    getStartOfToday()

  const targetDate =
    parseDate(
      dateValue,
    )

  const millisecondsPerDay =
    1000 * 60 * 60 * 24

  return Math.round(
    (
      targetDate.getTime() -
      today.getTime()
    ) /
      millisecondsPerDay,
  )
}

function getPriority(
  dateValue: string,
): WorkInboxPriority {
  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil <= 7) {
    return 'critical'
  }

  return 'high'
}

function getDeadlineLabel(
  dateValue: string,
): string {
  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil === 0) {
    return 'Rok ističe danas'
  }

  if (daysUntil === 1) {
    return 'Rok ističe sutra'
  }

  return (
    `Rok ističe za ${daysUntil} dana`
  )
}

function getTrainingReasonLabel(
  dateValue: string,
  reasonCode: string | null,
): string {
  if (reasonCode) {
    return (
      `Razlog pokretanja postupka: ${reasonCode}`
    )
  }

  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil <= 7) {
    return (
      'Rok za realizaciju aktivnosti ' +
      'je veoma blizu.'
    )
  }

  return (
    'Rok za realizaciju aktivnosti ' +
    'približava se isteku.'
  )
}

function getMedicalReasonLabel(
  dateValue: string,
  fitnessAssessment: string | null,
): string {
  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil <= 7) {
    return (
      'Potrebno je pokrenuti postupak ' +
      'upućivanja zaposlenog na lekarski pregled.'
    )
  }

  if (fitnessAssessment) {
    return (
      `Prethodna ocena sposobnosti: ${fitnessAssessment}`
    )
  }

  return (
    'Približava se rok za sledeći ' +
    'lekarski pregled zaposlenog.'
  )
}

function getWorkEquipmentReasonLabel(
  dateValue: string,
): string {
  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil <= 7) {
    return (
      'Potrebno je organizovati periodični ' +
      'pregled i proveru opreme za rad.'
    )
  }

  return (
    'Približava se rok za periodični ' +
    'pregled i proveru opreme za rad.'
  )
}

async function getEmployerName(
  employerId: string,
): Promise<string> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'employers',
      )
      .select(
        'name',
      )
      .eq(
        'id',
        employerId,
      )
      .single()

  if (error) {
    return 'Nepoznat poslodavac'
  }

  return (
    data?.name ??
    'Nepoznat poslodavac'
  )
}

async function getEmployeeName(
  employeeId: string,
): Promise<string> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'employees',
      )
      .select(
        'first_name, last_name',
      )
      .eq(
        'id',
        employeeId,
      )
      .single()

  if (error) {
    return 'Nepoznat zaposleni'
  }

  const firstName =
    data?.first_name ?? ''

  const lastName =
    data?.last_name ?? ''

  const fullName =
    `${firstName} ${lastName}`.trim()

  return (
    fullName ||
    'Nepoznat zaposleni'
  )
}

// =====================================================
// OBUKE
//
// Prikazuju se samo obuke čiji je start_date:
//
// DANAS <= start_date <= DANAS + 30 DANA
// =====================================================

async function getTrainingInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const today =
    getTodayDateValue()

  const upperDateLimit =
    getUpperDateLimit()

  const { data, error } =
    await supabase
      .from(
        'training_sessions',
      )
      .select(`
        id,
        training_number,
        employer_id,
        status_id,
        reason_code,
        start_date
      `)
      .in(
        'status_id',
        [1, 2, 3],
      )
      .gte(
        'start_date',
        today,
      )
      .lte(
        'start_date',
        upperDateLimit,
      )
      .order(
        'start_date',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as TrainingSessionRow[]

  return Promise.all(
    rows.map(
      async (row) => {
        const employerName =
          await getEmployerName(
            row.employer_id,
          )

        return {
          id:
            `training-${row.id}`,

          sourceType:
            'training',

          sourceId:
            row.id,

          targetUrl:
            `/training-sessions/${row.id}`,

          employerId:
            row.employer_id,

          employerName,

          category:
            'OBUKA ZA BZR',

          title:
            'Obraditi postupak obuke zaposlenih',

          subject:
            `Broj obuke: ${row.training_number}`,

          deadlineLabel:
            getDeadlineLabel(
              row.start_date,
            ),

          deadlineDate:
            row.start_date,

          reasonLabel:
            getTrainingReasonLabel(
              row.start_date,
              row.reason_code,
            ),

          priority:
            getPriority(
              row.start_date,
            ),

          status:
            mapTrainingStatus(
              row.status_id,
            ),
        }
      },
    ),
  )
}

// =====================================================
// LEKARSKI PREGLEDI
//
// Relevantan datum:
// next_examination_date
//
// Prikazuju se samo:
//
// DANAS <= next_examination_date
//       <= DANAS + 30 DANA
//
// Istekli pregledi se NE prikazuju.
// =====================================================

async function getMedicalInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const today =
    getTodayDateValue()

  const upperDateLimit =
    getUpperDateLimit()

  const { data, error } =
    await supabase
      .from(
        'medical_examination_records',
      )
      .select(`
        id,
        employer_id,
        employee_id,
        employer_job_position_id,
        examination_type,
        next_examination_date,
        reminder_date,
        report_number,
        fitness_assessment,
        status
      `)
      .eq(
        'status',
        'RECORDED',
      )
      .gte(
        'next_examination_date',
        today,
      )
      .lte(
        'next_examination_date',
        upperDateLimit,
      )
      .order(
        'next_examination_date',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as MedicalExaminationRow[]

  const {
    data: waitingSessionItemsData,
    error: waitingSessionItemsError,
  } =
    await supabase
      .from(
        'medical_examination_session_items',
      )
      .select(`
        employee_id,
        employee_job_positions (
          employer_job_position_id
        ),
        medical_examination_sessions!inner (
          status_id
        )
      `)
      .eq(
        'medical_examination_sessions.status_id',
        3,
      )

  if (waitingSessionItemsError) {
    throw waitingSessionItemsError
  }

  const waitingKeys =
    new Set<string>()

  for (
    const item of
      waitingSessionItemsData ?? []
  ) {
    const employeeId =
      item.employee_id

    const employeeJobPositionRelation =
      Array.isArray(
        item.employee_job_positions
      )
        ? item.employee_job_positions[0]
        : item.employee_job_positions

    const employerJobPositionId =
      employeeJobPositionRelation
        ?.employer_job_position_id

    if (
      employeeId &&
      employerJobPositionId
    ) {
      waitingKeys.add(
        `${employeeId}:${employerJobPositionId}`,
      )
    }
  }

  const visibleRows =
    rows.filter(
      (row) => {
        if (
          !row.employer_job_position_id
        ) {
          return true
        }

        return !waitingKeys.has(
          `${row.employee_id}:${row.employer_job_position_id}`,
        )
      },
    )

  return Promise.all(
    visibleRows.map(
      async (row) => {
        const [
          employerName,
          employeeName,
        ] =
          await Promise.all([
            getEmployerName(
              row.employer_id,
            ),

            getEmployeeName(
              row.employee_id,
            ),
          ])

        const reportLabel =
          row.report_number
            ? (
              ` – izveštaj broj ` +
              row.report_number
            )
            : ''

        const operationalDate =
          row.next_examination_date

        return {
          id:
            `medical-${row.id}`,

          sourceType:
            'medical',

          sourceId:
            row.id,

          targetUrl:
            `/medical-examinations/${row.id}`,

          employerId:
            row.employer_id,

          employerName,

          category:
            'LEKARSKI PREGLED',

          title:
            'Obraditi postupak lekarskog pregleda',

          subject:
            (
              `${employeeName} – ` +
              `${row.examination_type}` +
              reportLabel
            ),

          deadlineLabel:
            getDeadlineLabel(
              operationalDate,
            ),

          deadlineDate:
            operationalDate,

          reasonLabel:
            getMedicalReasonLabel(
              operationalDate,
              row.fitness_assessment,
            ),

          priority:
            getPriority(
              operationalDate,
            ),

          status:
            'not_started',
        }
      },
    ),
  )
}

// =====================================================
// LEKARSKI PREGLEDI - ČEKAJU SE REZULTATI
//
// Prikazuju se sve sesije sa status_id = 3
// (IN_PROGRESS).
//
// Takav postupak je već pokrenut i uput je
// generisan, ali rezultati medicine rada još
// nisu evidentirani.
// =====================================================

async function getWaitingMedicalSessionInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from(
        'medical_examination_sessions',
      )
      .select(`
        id,
        session_number,
        employer_id,
        examination_type,
        status_id,
        created_at
      `)
      .eq(
        'status_id',
        3,
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as WaitingMedicalSessionRow[]

  return Promise.all(
    rows.map(
      async (row) => {
        const employerName =
          await getEmployerName(
            row.employer_id,
          )

        const {
          data: sessionItemsData,
          error: sessionItemsError,
        } =
          await supabase
            .from(
              'medical_examination_session_items',
            )
            .select(`
              employee_id
            `)
            .eq(
              'session_id',
              row.id,
            )

        if (sessionItemsError) {
          throw sessionItemsError
        }

        const employeeIds =
          Array.from(
            new Set(
              (sessionItemsData ?? [])
                .map(
                  (item) =>
                    item.employee_id,
                )
                .filter(Boolean),
            ),
          )

        const employeeNames =
          await Promise.all(
            employeeIds.map(
              (employeeId) =>
                getEmployeeName(
                  employeeId,
                ),
            ),
          )

        const employeeLabel =
          employeeNames.length > 0
            ? employeeNames.join(', ')
            : 'Nepoznat zaposleni'

        const createdDate =
          row.created_at.slice(0, 10)

        const examinationTypeLabel =
          row.examination_type === 'PREVIOUS'
            ? 'PRETHODNI'
            : row.examination_type === 'PERIODIC'
              ? 'PERIODIČNI'
              : row.examination_type

        return {
          id:
            `medical-waiting-${row.id}`,

          sourceType:
            'medical',

          sourceId:
            row.id,

          targetUrl:
            `/dashboard/lekarski-pregledi?sessionId=${encodeURIComponent(
              row.id,
            )}`,

          employerId:
            row.employer_id,

          employerName,

          category:
            'LEKARSKI PREGLED',

          title:
            'Čekaju se rezultati lekarskog pregleda',

          subject:
            `${employeeLabel} – ${row.session_number} – ${examinationTypeLabel}`,

          deadlineLabel:
            'Čekaju se rezultati pregleda',

          deadlineDate:
            createdDate,

          reasonLabel:
            'Uput je generisan. Kada stignu rezultati medicine rada, otvorite ovaj postupak i evidentirajte rezultate pregleda.',

          priority:
            'high',

          status:
            'waiting',
        }
      },
    ),
  )
}

// =====================================================
// OPREMA ZA RAD
//
// Relevantan datum:
// next_inspection_date
//
// Prikazuju se samo:
//
// DANAS <= next_inspection_date
//       <= DANAS + 30 DANA
//
// Istekli pregledi opreme se NE prikazuju.
// =====================================================

async function getWorkEquipmentInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const today =
    getTodayDateValue()

  const upperDateLimit =
    getUpperDateLimit()

  const { data, error } =
    await supabase
      .from(
        'work_equipment_reports',
      )
      .select(`
        id,
        employer_id,
        report_number,
        inspection_date,
        next_inspection_date,
        reminder_date,
        inspected_by,
        result,
        active,
        work_equipment_report_items!work_equipment_report_items_work_equipment_report_id_fkey (
          work_equipment!work_equipment_report_items_work_equipment_id_fkey (
            designation,
            name
          )
        )
      `)
      .eq(
        'active',
        true,
      )
      .gte(
        'next_inspection_date',
        today,
      )
      .lte(
        'next_inspection_date',
        upperDateLimit,
      )
      .order(
        'next_inspection_date',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as WorkEquipmentReportRow[]

  return Promise.all(
    rows.map(
      async (row) => {
        const employerName =
          await getEmployerName(
            row.employer_id,
          )

        const equipmentNames =
          row
            .work_equipment_report_items
            .flatMap(
              (item) =>
                item.work_equipment,
            )
            .map(
              (equipment) =>
                (
                  `${equipment.designation}` +
                  ` – ${equipment.name}`
                ),
            )

        const visibleEquipmentNames =
          equipmentNames.slice(
            0,
            2,
          )

        const remainingEquipmentCount =
          equipmentNames.length -
          visibleEquipmentNames.length

        const equipmentSubject =
          equipmentNames.length > 0
            ? (
              remainingEquipmentCount > 0
                ? (
                  `${visibleEquipmentNames.join(', ')}` +
                  ` (+${remainingEquipmentCount})`
                )
                : visibleEquipmentNames.join(
                  ', ',
                )
            )
            : (
              `Stručni nalaz: ` +
              row.report_number
            )

        const operationalDate =
          row.next_inspection_date

        return {
          id:
            `work-equipment-${row.id}`,

          sourceType:
            'work_equipment',

          sourceId:
            row.id,

          targetUrl:
            `/work-equipment-reports/${row.id}`,

          employerId:
            row.employer_id,

          employerName,

          category:
            'OPREMA ZA RAD',

          title:
            'Organizovati periodični pregled i proveru opreme za rad',

          subject:
            equipmentSubject,

          deadlineLabel:
            getDeadlineLabel(
              operationalDate,
            ),

          deadlineDate:
            operationalDate,

          reasonLabel:
            getWorkEquipmentReasonLabel(
              operationalDate,
            ),

          priority:
            getPriority(
              operationalDate,
            ),

          status:
            'not_started',
        }
      },
    ),
  )
}

// =====================================================
// KOMBINOVANI WORK INBOX
// =====================================================

export async function getWorkInboxItems():
  Promise<WorkInboxItem[]> {
  const [
    trainingItems,
    medicalItems,
    waitingMedicalItems,
    workEquipmentItems,
  ] =
    await Promise.all([
      getTrainingInboxItems(),
      getMedicalInboxItems(),
      getWaitingMedicalSessionInboxItems(),
      getWorkEquipmentInboxItems(),
    ])

  const allItems:
    WorkInboxItem[] = [
      ...trainingItems,
      ...medicalItems,
      ...waitingMedicalItems,
      ...workEquipmentItems,
    ]

  const priorityOrder:
    Record<
      WorkInboxPriority,
      number
    > = {
      critical: 0,
      high: 1,
    }

  return allItems.sort(
    (a, b) => {
      const priorityDifference =
        priorityOrder[a.priority] -
        priorityOrder[b.priority]

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference
      }

      const deadlineDifference =
        a.deadlineDate.localeCompare(
          b.deadlineDate,
        )

      if (
        deadlineDifference !== 0
      ) {
        return deadlineDifference
      }

      return (
        a.employerName.localeCompare(
          b.employerName,
          'sr',
        )
      )
    },
  )
}