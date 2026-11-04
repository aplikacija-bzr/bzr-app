import NovaObukaWorkspace from './NovaObukaWorkspace'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { createClient } from '@supabase/supabase-js'

export default async function NovaObukaPage({
  searchParams,
}: {
 searchParams?: Promise<{
  recordId?: string
  sessionId?: string
}>
}) {
  const params = searchParams
    ? await searchParams
    : {}

  const recordId = params.recordId ?? ''
  const sessionId = params.sessionId ?? ''

let initialPhase: 1 | 2 | 3 | 4 | 5 | 6 = 1
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
let initialEmployerId = ''
let initialJobPositionId = ''
let initialEmployeeId = ''

if (recordId) {
  const { data: trainingRecord } =
    await supabase
      .from('training_records')
      .select(`
        employer_id,
        employee_id,
        employer_job_positions (
          job_position_id
        )
      `)
      .eq('id', recordId)
      .maybeSingle()

  initialEmployerId =
    trainingRecord?.employer_id ?? ''

  initialEmployeeId =
    trainingRecord?.employee_id ?? ''

  const employerJobPosition =
    Array.isArray(
      trainingRecord?.employer_job_positions
    )
      ? trainingRecord?.employer_job_positions[0]
      : trainingRecord?.employer_job_positions

  initialJobPositionId =
    employerJobPosition?.job_position_id ?? ''
}
if (sessionId) {
  const {
    data: trainingSession,
    error: trainingSessionError,
  } = await supabase
    .from('training_sessions')
    .select(`
      id,
      employer_id
    `)
    .eq('id', sessionId)
    .maybeSingle()

  if (trainingSessionError) {
    throw new Error(
      trainingSessionError.message ||
        'Greška pri učitavanju postojeće obuke.'
    )
  }

  if (trainingSession) {
    initialEmployerId =
      trainingSession.employer_id ?? ''

    const {
      count: jobPositionCount,
      error: jobPositionCountError,
    } = await supabase
      .from('training_session_job_positions')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('training_session_id', sessionId)

    if (jobPositionCountError) {
      throw new Error(
        jobPositionCountError.message ||
          'Greška pri proveri radnih mesta obuke.'
      )
    }

    const {
      data: sessionJobPositions,
      error: sessionJobPositionsError,
    } = await supabase
      .from('training_session_job_positions')
      .select('id')
      .eq('training_session_id', sessionId)

    if (sessionJobPositionsError) {
      throw new Error(
        sessionJobPositionsError.message ||
          'Greška pri učitavanju radnih mesta obuke.'
      )
    }

    const sessionJobPositionIds =
      (sessionJobPositions ?? []).map(
        (row) => row.id
      )

    let employeeCount = 0
    let programCount = 0
    let scheduleCount = 0
    let assessmentCount = 0

    if (sessionJobPositionIds.length > 0) {
      const {
        count,
        error,
      } = await supabase
        .from('training_session_employees')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .in(
          'training_session_job_position_id',
          sessionJobPositionIds
        )

      if (error) {
        throw new Error(
          error.message ||
            'Greška pri proveri zaposlenih.'
        )
      }

      employeeCount = count ?? 0

      const {
        data: sessionPrograms,
        error: sessionProgramsError,
      } = await supabase
        .from('training_session_programs')
        .select('id')
        .in(
          'training_session_job_position_id',
          sessionJobPositionIds
        )

      if (sessionProgramsError) {
        throw new Error(
          sessionProgramsError.message ||
            'Greška pri proveri programa obuke.'
        )
      }

      programCount =
        sessionPrograms?.length ?? 0

      const sessionProgramIds =
        (sessionPrograms ?? []).map(
          (row) => row.id
        )

      if (sessionProgramIds.length > 0) {
        const {
          count,
          error,
        } = await supabase
          .from('training_session_schedule')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .in(
            'training_session_program_id',
            sessionProgramIds
          )

        if (error) {
          throw new Error(
            error.message ||
              'Greška pri proveri termina obuke.'
          )
        }

        scheduleCount = count ?? 0
      }

      const {
        count: completedAssessmentCount,
        error: assessmentError,
      } = await supabase
        .from('training_session_employees')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .in(
          'training_session_job_position_id',
          sessionJobPositionIds
        )
        .not(
          'theory_passed',
          'is',
          null
        )
        .not(
          'practical_passed',
          'is',
          null
        )

      if (assessmentError) {
        throw new Error(
          assessmentError.message ||
            'Greška pri proveri rezultata obuke.'
        )
      }

      assessmentCount =
        completedAssessmentCount ?? 0
    }

    if ((jobPositionCount ?? 0) === 0) {
      initialPhase = 2
    } else if (employeeCount === 0) {
      initialPhase = 3
    } else if (
      programCount === 0 ||
      scheduleCount === 0
    ) {
      initialPhase = 4
    } else if (assessmentCount === 0) {
      initialPhase = 5
    } else {
      initialPhase = 6
    }
  }
}

  const { data: employers } = await supabase
    .from('employers')
    .select('id, name')
    .eq('active', true)
    .order('name')
const {
  data: practicalInstructors,
  error: practicalInstructorsError,
} = await supabase
  .from('training_instructors')
  .select('id, first_name, last_name, professional_title')
  .eq('active', true)
  .eq('is_practical_instructor', true)
  .order('last_name')
  .order('first_name')

const {
  data: safetyAdvisors,
  error: safetyAdvisorsError,
} = await supabase
  .from('training_instructors')
  .select('id, first_name, last_name, professional_title')
  .eq('active', true)
  .eq('is_safety_advisor', true)
  .order('last_name')
  .order('first_name')
  const { data: jobPositions, error: jobPositionsError } = await supabase
  .from('job_positions')
  .select('id, name')
  .eq('active', true)
  .order('name')

console.log('PRAKTIČNI INSTRUKTORI:', {
  data: practicalInstructors,
  error: practicalInstructorsError,
})

console.log('SAVETNICI ZA BZR:', {
  data: safetyAdvisors,
  error: safetyAdvisorsError,
})
console.log('RADNA MESTA:', {
  data: jobPositions,
  error: jobPositionsError,
})
  return (
    <main style={pageStyle}>
      <Link href="/dashboard/obuke" style={backButton}>
        ← Nazad na Obuke
      </Link>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>MODUL OBUKE</p>
        <h1 style={titleStyle}>Nova obuka za bezbedan i zdrav rad</h1>
        <p style={descriptionStyle}>
          Jedinstveni proces za izbor predmeta obuke, radnog mesta,
          zaposlenih, programa, termina, rezultata i kompletnog paketa
          dokumentacije.
        </p>
      </header>

      <div style={statusBox}>
        <div>
          <div style={statusLabel}>STATUS OBUKE</div>
          <div style={statusValue}>● U pripremi</div>
        </div>
      </div>


      <div style={workspaceStyle}>


        <section style={workPanel}>


<NovaObukaWorkspace
  employers={employers ?? []}
  practicalInstructors={practicalInstructors ?? []}
  safetyAdvisors={safetyAdvisors ?? []}
  jobPositions={jobPositions ?? []}
  initialEmployerId={initialEmployerId}
  initialJobPositionId={initialJobPositionId}
  initialEmployeeId={initialEmployeeId}
  initialPhase={initialPhase}
  initialTrainingSessionId={sessionId}
/>


        </section>
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = { padding: 30, maxWidth: 1200, margin: '0 auto' }
const backButton: CSSProperties = { display: 'inline-block', marginBottom: 24, color: '#111827', textDecoration: 'none', fontWeight: 700 }
const headerStyle: CSSProperties = { marginBottom: 22 }
const eyebrowStyle: CSSProperties = { margin: 0, color: '#7c3aed', fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }
const titleStyle: CSSProperties = { marginTop: 8, marginBottom: 10, fontSize: 34 }
const descriptionStyle: CSSProperties = { maxWidth: 820, margin: 0, color: '#4b5563', fontSize: 16, lineHeight: 1.6 }
const statusBox: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '14px 18px', border: '1px solid #ddd6fe', borderRadius: 12, backgroundColor: '#faf5ff' }
const statusLabel: CSSProperties = { marginBottom: 4, color: '#6b7280', fontSize: 12, fontWeight: 800, letterSpacing: 1 }
const statusValue: CSSProperties = { color: '#7c3aed', fontWeight: 800 }
const workspaceStyle: CSSProperties = {
  display: 'block',
}
const stepsPanel: CSSProperties = { padding: 20, border: '1px solid #d1d5db', borderRadius: 14, backgroundColor: '#ffffff' }
const panelTitle: CSSProperties = { marginTop: 0, marginBottom: 18, fontSize: 20 }
const activeStep: CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, padding: 14, border: '2px solid #7c3aed', borderRadius: 12, backgroundColor: '#faf5ff' }
const lockedStep: CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, padding: 14, border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb', color: '#6b7280' }
const stepNumberActive: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0, borderRadius: '50%', backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: 800 }
const stepNumberLocked: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0, borderRadius: '50%', backgroundColor: '#e5e7eb', color: '#6b7280', fontWeight: 800 }
const stepTitle: CSSProperties = { fontWeight: 800, marginBottom: 3 }
const activeStatus: CSSProperties = { color: '#7c3aed', fontSize: 13, fontWeight: 700 }
const lockedStatus: CSSProperties = { color: '#6b7280', fontSize: 13 }
const workPanel: CSSProperties = { minHeight: 520, padding: 26, border: '1px solid #d1d5db', borderRadius: 14, backgroundColor: '#ffffff' }
const workPanelHeader: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }
const stepEyebrow: CSSProperties = { margin: 0, color: '#7c3aed', fontSize: 12, fontWeight: 800, letterSpacing: 1 }
const workTitle: CSSProperties = { marginTop: 6, marginBottom: 0, fontSize: 26 }
const activeBadge: CSSProperties = { display: 'inline-block', padding: '6px 12px', borderRadius: 999, backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: 13, fontWeight: 800 }
const workDescription: CSSProperties = { marginTop: 18, marginBottom: 24, color: '#4b5563', lineHeight: 1.5 }
const formGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }
const fullWidthField: CSSProperties = { gridColumn: '1 / -1' }
const labelStyle: CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 800 }
const inputStyle: CSSProperties = { width: '100%', padding: '13px 14px', border: '1px solid #cbd5e1', borderRadius: 10, backgroundColor: '#ffffff', fontSize: 15, boxSizing: 'border-box' }
const emptyState: CSSProperties = { marginTop: 22, padding: 18, border: '1px dashed #cbd5e1', borderRadius: 10, backgroundColor: '#f8fafc', color: '#64748b', lineHeight: 1.5 }