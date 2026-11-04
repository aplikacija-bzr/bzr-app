'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import NovaObukaForm from './NovaObukaForm'

type Employer = {
  id: string
  name: string
}

type Instructor = {
  id: string
  first_name: string
  last_name: string
  professional_title?: string | null
}

type JobPosition = {
  id: string
  name: string
}

type Props = {
  employers: Employer[]
  practicalInstructors: Instructor[]
  safetyAdvisors: Instructor[]
  jobPositions: JobPosition[]
  initialEmployerId?: string
  initialJobPositionId?: string
  initialEmployeeId?: string
  initialPhase?: 1 | 2 | 3 | 4 | 5 | 6
   initialTrainingSessionId?: string
}

export default function NovaObukaWorkspace({
  employers,
  practicalInstructors,
  safetyAdvisors,
  jobPositions,
  initialEmployerId,
  initialJobPositionId,
  initialEmployeeId,
  initialPhase,
  initialTrainingSessionId,
}: Props) {
  const [currentPhase, setCurrentPhase] =
  useState<1 | 2 | 3 | 4 | 5 | 6>(
    initialPhase ?? 1
  )

  const phaseInfo = {
    1: {
      title: 'Predmet obuke',
      description: 'Unesite osnovne podatke o procesu obuke.',
    },
    2: {
      title: 'Radno mesto',
      description: 'Izaberite jedno ili više radnih mesta.',
    },
    3: {
      title: 'Zaposleni',
      description:
        'Izaberite zaposlene koji će biti obuhvaćeni obukom.',
    },
    4: {
      title: 'Program i termini',
      description: 'Definišite program i termine obuke.',
    },
    5: {
      title: 'Provera obučenosti',
      description:
        'Evidentirajte rezultate provere teorijske i praktične obučenosti.',
    },
    6: {
      title: 'Dokumentacija',
      description:
        'Pregled dokumentacije i završetak postupka obuke.',
    },
  } as const

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <aside style={stepsPanel}>
        <h2 style={panelTitle}>Tok obuke</h2>

        {currentPhase === 1 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>1</div>

            <div>
              <div style={stepTitle}>Predmet obuke</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : (
          <div style={completedStep}>
            <div style={stepNumberCompleted}>1</div>

            <div>
              <div style={stepTitle}>Predmet obuke</div>
              <div style={completedStatus}>✓ Završeno</div>
            </div>
          </div>
        )}

        {currentPhase === 2 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>2</div>

            <div>
              <div style={stepTitle}>Radno mesto</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : currentPhase > 2 ? (
          <div style={completedStep}>
            <div style={stepNumberCompleted}>2</div>

            <div>
              <div style={stepTitle}>Radno mesto</div>
              <div style={completedStatus}>✓ Završeno</div>
            </div>
          </div>
        ) : (
          <div style={lockedStep}>
            <div style={stepNumberLocked}>2</div>

            <div>
              <div style={stepTitle}>Radno mesto</div>
              <div style={lockedStatus}>🔒 Zaključan</div>
            </div>
          </div>
        )}

        {currentPhase === 3 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>3</div>

            <div>
              <div style={stepTitle}>Zaposleni</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : currentPhase > 3 ? (
          <div style={completedStep}>
            <div style={stepNumberCompleted}>3</div>

            <div>
              <div style={stepTitle}>Zaposleni</div>
              <div style={completedStatus}>✓ Završeno</div>
            </div>
          </div>
        ) : (
          <div style={lockedStep}>
            <div style={stepNumberLocked}>3</div>

            <div>
              <div style={stepTitle}>Zaposleni</div>
              <div style={lockedStatus}>🔒 Zaključan</div>
            </div>
          </div>
        )}

        {currentPhase === 4 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>4</div>

            <div>
              <div style={stepTitle}>Program i termini</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : currentPhase > 4 ? (
          <div style={completedStep}>
            <div style={stepNumberCompleted}>4</div>

            <div>
              <div style={stepTitle}>Program i termini</div>
              <div style={completedStatus}>✓ Završeno</div>
            </div>
          </div>
        ) : (
          <div style={lockedStep}>
            <div style={stepNumberLocked}>4</div>

            <div>
              <div style={stepTitle}>Program i termini</div>
              <div style={lockedStatus}>🔒 Zaključan</div>
            </div>
          </div>
        )}

        {currentPhase === 5 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>5</div>

            <div>
              <div style={stepTitle}>Provera obučenosti</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : currentPhase > 5 ? (
          <div style={completedStep}>
            <div style={stepNumberCompleted}>5</div>

            <div>
              <div style={stepTitle}>Provera obučenosti</div>
              <div style={completedStatus}>✓ Završeno</div>
            </div>
          </div>
        ) : (
          <div style={lockedStep}>
            <div style={stepNumberLocked}>5</div>

            <div>
              <div style={stepTitle}>Provera obučenosti</div>
              <div style={lockedStatus}>🔒 Zaključan</div>
            </div>
          </div>
        )}

        {currentPhase === 6 ? (
          <div style={activeStep}>
            <div style={stepNumberActive}>6</div>

            <div>
              <div style={stepTitle}>Dokumentacija</div>
              <div style={activeStatus}>● Aktivan</div>
            </div>
          </div>
        ) : (
          <div style={lockedStep}>
            <div style={stepNumberLocked}>6</div>

            <div>
              <div style={stepTitle}>Dokumentacija</div>
              <div style={lockedStatus}>🔒 Zaključan</div>
            </div>
          </div>
        )}
      </aside>

      <div>
        <div style={workPanelHeader}>
          <div>
            <p style={stepEyebrow}>FAZA {currentPhase}</p>

            <h2 style={workTitle}>
              {phaseInfo[currentPhase].title}
            </h2>
          </div>

          <span style={activeBadge}>Aktivno</span>
        </div>

        <p style={workDescription}>
          {phaseInfo[currentPhase].description}
        </p>

        <NovaObukaForm
          employers={employers}
          practicalInstructors={practicalInstructors}
          safetyAdvisors={safetyAdvisors}
          jobPositions={jobPositions}
          currentPhase={currentPhase}
          setCurrentPhase={setCurrentPhase}
          initialEmployerId={initialEmployerId}
          initialJobPositionId={initialJobPositionId}
          initialEmployeeId={initialEmployeeId}
          initialTrainingSessionId={initialTrainingSessionId}
        />
      </div>
    </div>
  )
}

const workPanelHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
}

const stepEyebrow: CSSProperties = {
  margin: 0,
  color: '#7c3aed',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1,
}

const workTitle: CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: 26,
  color: '#111827',
  fontWeight: 800,
}

const activeBadge: CSSProperties = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: 999,
  backgroundColor: '#ede9fe',
  color: '#6d28d9',
  fontSize: 13,
  fontWeight: 800,
}

const workDescription: CSSProperties = {
  marginTop: 12,
  marginBottom: 24,
  color: '#4b5563',
}

const stepsPanel: CSSProperties = {
  padding: 20,
  border: '1px solid #d1d5db',
  borderRadius: 14,
  backgroundColor: '#ffffff',
}

const panelTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 18,
  fontSize: 20,
}

const activeStep: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 10,
  padding: 14,
  border: '2px solid #7c3aed',
  borderRadius: 12,
  backgroundColor: '#faf5ff',
}

const stepNumberActive: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontWeight: 800,
}

const stepTitle: CSSProperties = {
  fontWeight: 800,
  marginBottom: 3,
}

const activeStatus: CSSProperties = {
  color: '#7c3aed',
  fontSize: 13,
  fontWeight: 700,
}

const lockedStep: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 10,
  padding: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  backgroundColor: '#f9fafb',
  color: '#6b7280',
}

const stepNumberLocked: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: '#e5e7eb',
  color: '#6b7280',
  fontWeight: 800,
}

const lockedStatus: CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
}

const completedStep: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 10,
  padding: 14,
  border: '1px solid #bbf7d0',
  borderRadius: 12,
  backgroundColor: '#f0fdf4',
}

const stepNumberCompleted: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontWeight: 800,
}

const completedStatus: CSSProperties = {
  color: '#15803d',
  fontSize: 13,
  fontWeight: 700,
}