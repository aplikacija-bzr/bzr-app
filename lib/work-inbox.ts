import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  | 'daily_bzr_control'

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

type TrainingRecordRow = {
  id: string
  employer_id: string
  employee_id: string
  employer_job_position_id: string
  assessment_date: string | null
  next_training_date: string
  reminder_date: string | null
  status: string
  employees:
    | {
        first_name: string
        last_name: string
      }
    | {
        first_name: string
        last_name: string
      }[]
    | null
  employer_job_positions:
    | {
        internal_name: string | null
        job_positions:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
      }
    | {
        internal_name: string | null
        job_positions:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
      }[]
    | null
}

type MedicalExaminationRow = {
  id: string
  employer_id: string
  employee_id: string
  employer_job_position_id:
    | string
    | null
  examination_type: string
  examination_date:
    | string
    | null
  next_examination_date: string
  reminder_date: string | null
  report_number: string | null
  fitness_assessment:
    | string
    | null
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
type DailyBzrControlRow = {
  id: string
  employer_id: string
  control_date: string
  sent_at: string | null
  status_value: number
  location: string | null
  coordinator: string | null
  photo_url: string | null
  reaction_status:
    | 'NEW'
    | 'IN_PROGRESS'
    | 'COMPLETED'
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
  const today =
    new Date()

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

function getTodayDateValue():
  string {
  return formatDateValue(
    getStartOfToday(),
  )
}

function getUpperDateLimit():
  string {
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


function getTrainingRecordReasonLabel(
  dateValue: string,
): string {
  const daysUntil =
    getDaysUntil(
      dateValue,
    )

  if (daysUntil <= 7) {
    return (
      'Potrebno je organizovati periodičnu ' +
      'obuku i proveru obučenosti zaposlenog.'
    )
  }

  return (
    'Približava se rok za periodičnu ' +
    'obuku i proveru obučenosti zaposlenog.'
  )
}

function getMedicalReasonLabel(
  dateValue: string,
  fitnessAssessment:
    | string
    | null,
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

  const {
    data,
    error,
  } =
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
    return (
      'Nepoznat poslodavac'
    )
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

  const {
    data,
    error,
  } =
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
    return (
      'Nepoznat zaposleni'
    )
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

  const {
    data,
    error,
  } =
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
    (data ?? []) as
      TrainingSessionRow[]

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
// ROKOVI OBUKE IZ CENTRALNE EVIDENCIJE
//
// Prikazuju se evidentirani zaposleni kojima:
// DANAS <= next_training_date <= DANAS + 30 DANA
//
// Ovo je odvojeno od već pokrenutih postupaka obuke
// koji se i dalje čitaju iz training_sessions.
// =====================================================

async function getTrainingRecordInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const today =
    getTodayDateValue()

  const upperDateLimit =
    getUpperDateLimit()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'training_records',
      )
      .select(`
        id,
        employer_id,
        employee_id,
        employer_job_position_id,
        assessment_date,
        next_training_date,
        reminder_date,
        status,
        employees (
          first_name,
          last_name
        ),
        employer_job_positions (
          internal_name,
          job_positions (
            name
          )
        )
      `)
      .eq(
        'status',
        'RECORDED',
      )
      .not(
        'next_training_date',
        'is',
        null,
      )
      .gte(
        'next_training_date',
        today,
      )
      .lte(
        'next_training_date',
        upperDateLimit,
      )
      .order(
        'next_training_date',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as
      TrainingRecordRow[]

  return rows.map(
    (row): Omit<WorkInboxItem, 'employerName'> => {
      const employeeRelation =
        Array.isArray(
          row.employees,
        )
          ? row.employees[0]
          : row.employees

      const employerJobPositionRelation =
        Array.isArray(
          row.employer_job_positions,
        )
          ? row.employer_job_positions[0]
          : row.employer_job_positions

      const jobPositionRelation =
        Array.isArray(
          employerJobPositionRelation
            ?.job_positions,
        )
          ? employerJobPositionRelation
              ?.job_positions[0]
          : employerJobPositionRelation
              ?.job_positions

      const employeeName =
        [
          employeeRelation?.first_name ??
            '',
          employeeRelation?.last_name ??
            '',
        ]
          .join(' ')
          .trim() ||
        'Nepoznat zaposleni'

      const jobPositionName =
        employerJobPositionRelation
          ?.internal_name ||
        jobPositionRelation?.name ||
        'Nepoznato radno mesto'

      return {
        id:
          `training-record-${row.id}`,

        sourceType:
          'training',

        sourceId:
          row.id,

        targetUrl:
          `/dashboard/obuke/evidencija?employerId=${encodeURIComponent(
            row.employer_id,
          )}&recordId=${encodeURIComponent(
            row.id,
          )}`,

        employerId:
          row.employer_id,

        category:
          'OBUKA ZA BZR',

        title:
          'Organizovati periodičnu obuku zaposlenog',

        subject:
          `${employeeName} – ${jobPositionName}`,

        deadlineLabel:
          getDeadlineLabel(
            row.next_training_date,
          ),

        deadlineDate:
          row.next_training_date,

        reasonLabel:
          getTrainingRecordReasonLabel(
            row.next_training_date,
          ),

        priority:
          getPriority(
            row.next_training_date,
          ),

        status:
          'not_started',
      }
    },
  ).reduce<
    Promise<WorkInboxItem[]>
  >(
    async (
      previousPromise,
      item,
    ) => {
      const items =
        await previousPromise

      const employerName =
        await getEmployerName(
          item.employerId,
        )

      items.push({
        ...item,
        employerName,
      })

      return items
    },
    Promise.resolve([]),
  )
}

// =====================================================
// LEKARSKI PREGLEDI
//
// Za svakog zaposlenog + radno mesto uzima se
// SAMO NAJNOVIJI evidentirani pregled.
//
// Tek nakon toga proverava se:
//
// DANAS <= next_examination_date
//       <= DANAS + 30 DANA
//
// Na ovaj način stari pregledi ostaju istorija,
// ali više ne stvaraju lažne zadatke ako postoji
// noviji evidentirani pregled.
// =====================================================

async function getMedicalInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    await createClient()

  const today =
    getTodayDateValue()

  const upperDateLimit =
    getUpperDateLimit()

  // -----------------------------------------
  // 1. SVI EVIDENTIRANI PREGLEDI
  // -----------------------------------------

  const {
    data,
    error,
  } =
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
        examination_date,
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
      .not(
        'examination_date',
        'is',
        null,
      )
      .not(
        'next_examination_date',
        'is',
        null,
      )
      .order(
        'examination_date',
        {
          ascending: false,
        },
      )

  if (error) {
    throw error
  }

  const allRows =
    (data ?? []) as
      MedicalExaminationRow[]

  // -----------------------------------------
  // 2. NAJNOVIJI PREGLED PO:
  //    poslodavac + zaposleni + radno mesto
  //
  // Pošto su redovi već sortirani od najnovijeg
  // ka najstarijem, prvi red za dati ključ ostaje.
  // -----------------------------------------

  const latestRecordMap =
    new Map<
      string,
      MedicalExaminationRow
    >()

  for (
    const row of allRows
  ) {
    const key =
      [
        row.employer_id,
        row.employee_id,
        row.employer_job_position_id ??
          'NO_JOB_POSITION',
      ].join(':')

    if (
      !latestRecordMap.has(
        key,
      )
    ) {
      latestRecordMap.set(
        key,
        row,
      )
    }
  }

  const latestRows =
    Array.from(
      latestRecordMap.values(),
    )

  // -----------------------------------------
  // 3. SAMO ONI ČIJI SLEDEĆI PREGLED
  //    ISTIČE U NAREDNIH 30 DANA
  // -----------------------------------------

  const dueRows =
    latestRows.filter(
      (row) => {
        return (
          row.next_examination_date >=
            today &&
          row.next_examination_date <=
            upperDateLimit
        )
      },
    )

  // -----------------------------------------
  // 4. POSTUPCI KOJI SU VEĆ POKRENUTI
  //    I ČEKAJU REZULTATE
  // -----------------------------------------

  const {
    data:
      waitingSessionItemsData,
    error:
      waitingSessionItemsError,
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

  if (
    waitingSessionItemsError
  ) {
    throw (
      waitingSessionItemsError
    )
  }

  const waitingKeys =
    new Set<string>()

  for (
    const item of
      waitingSessionItemsData ??
      []
  ) {
    const employeeId =
      item.employee_id

    const employeeJobPositionRelation =
      Array.isArray(
        item.employee_job_positions,
      )
        ? item
            .employee_job_positions[0]
        : item
            .employee_job_positions

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

  // -----------------------------------------
  // 5. AKO JE POSTUPAK VEĆ POKRENUT,
  //    NE PRIKAZUJ "OBRADITI POSTUPAK"
  // -----------------------------------------

  const visibleRows =
    dueRows.filter(
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

  // -----------------------------------------
  // 6. WORK INBOX STAVKE
  // -----------------------------------------

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

  const {
    data,
    error,
  } =
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
    (data ?? []) as
      WaitingMedicalSessionRow[]

  return Promise.all(
    rows.map(
      async (row) => {
        const employerName =
          await getEmployerName(
            row.employer_id,
          )

        const {
          data:
            sessionItemsData,
          error:
            sessionItemsError,
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

        if (
          sessionItemsError
        ) {
          throw (
            sessionItemsError
          )
        }

        const employeeIds =
          Array.from(
            new Set(
              (
                sessionItemsData ??
                []
              )
                .map(
                  (item) =>
                    item.employee_id,
                )
                .filter(
                  Boolean,
                ),
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
          employeeNames.length >
          0
            ? employeeNames.join(
                ', ',
              )
            : 'Nepoznat zaposleni'

        const createdDate =
          row.created_at.slice(
            0,
            10,
          )

        const examinationTypeLabel =
          row.examination_type ===
          'PREVIOUS'
            ? 'PRETHODNI'
            : row.examination_type ===
                'PERIODIC'
              ? 'PERIODIČNI'
              : row
                  .examination_type

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

  const {
    data,
    error,
  } =
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
    (data ?? []) as
      WorkEquipmentReportRow[]

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
          equipmentNames.length >
          0
            ? (
                remainingEquipmentCount >
                0
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
async function getDailyBzrControlInboxItems():
  Promise<WorkInboxItem[]> {
  const supabase =
    createAdminClient()

  const today =
    getTodayDateValue()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'daily_bzr_controls',
      )
      .select(`
        id,
        employer_id,
        control_date,
        sent_at,
        status_value,
        location,
        coordinator,
        photo_url,
        reaction_status
      `)
      .eq(
        'control_date',
        today,
      )
      .eq(
        'status_value',
        1,
      )
      .neq(
        'reaction_status',
        'COMPLETED',
      )
      .order(
        'sent_at',
        {
          ascending: true,
        },
      )

  if (error) {
    throw error
  }

  const rows =
    (data ?? []) as
      DailyBzrControlRow[]

  return Promise.all(
    rows.map(
      async (row) => {
        const employerName =
          await getEmployerName(
            row.employer_id,
          )

        const locationLabel =
          row.location
            ? `Lokacija: ${row.location}`
            : 'Lokacija nije navedena'

        const coordinatorLabel =
          row.coordinator
            ? `Koordinator: ${row.coordinator}`
            : 'Koordinator nije naveden'

        return {
          id:
            `daily-bzr-control-${row.id}`,

          sourceType:
            'daily_bzr_control',

          sourceId:
            row.id,

          targetUrl:
            '/dashboard',

          employerId:
            row.employer_id,

          employerName,

          category:
            'SVAKODNEVNA KONTROLA',

          title:
            'Prijavljena promena stanja na lokaciji',

          subject:
            `${locationLabel} – ${coordinatorLabel}`,

          deadlineLabel:
            'Potrebna reakcija danas',

          deadlineDate:
            row.control_date,

          reasonLabel:
            'Poslodavac je u svakodnevnoj kontroli prijavio promenu koja zahteva reakciju INPRO.',

          priority:
            'critical',

          status:
            row.reaction_status ===
            'IN_PROGRESS'
              ? 'in_progress'
              : 'not_started',
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
  trainingRecordItems,
  medicalItems,
  waitingMedicalItems,
  workEquipmentItems,
  dailyBzrControlItems,
] =
  await Promise.all([
    getTrainingInboxItems(),
    getTrainingRecordInboxItems(),
    getMedicalInboxItems(),
    getWaitingMedicalSessionInboxItems(),
    getWorkEquipmentInboxItems(),
    getDailyBzrControlInboxItems(),
  ])

  const allItems:
  WorkInboxItem[] = [
    ...trainingItems,
    ...trainingRecordItems,
    ...medicalItems,
    ...waitingMedicalItems,
    ...workEquipmentItems,
    ...dailyBzrControlItems,
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
    (
      a,
      b,
    ) => {
      const priorityDifference =
        priorityOrder[
          a.priority
        ] -
        priorityOrder[
          b.priority
        ]

      if (
        priorityDifference !==
        0
      ) {
        return (
          priorityDifference
        )
      }

      const deadlineDifference =
        a.deadlineDate.localeCompare(
          b.deadlineDate,
        )

      if (
        deadlineDifference !==
        0
      ) {
        return (
          deadlineDifference
        )
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