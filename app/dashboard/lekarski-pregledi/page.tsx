import { getEmployers } from '@/lib/employers'
import { createClient } from '@/lib/supabase/server'

import ProcessContent from '@/app/components/process/ProcessContent'
import ProcessLayout from '@/app/components/process/ProcessLayout'
import ProcessStep from '@/app/components/process/ProcessStep'
import ProcessSteps from '@/app/components/process/ProcessSteps'

import EmployerSelection from './EmployerSelection'

type MedicalExaminationsPageProps = {
  searchParams: Promise<{
    sessionId?: string
  }>
}

export default async function MedicalExaminationsPage({
  searchParams,
}: MedicalExaminationsPageProps) {
  const employers = await getEmployers()

  const params =
    await searchParams

  const sessionId =
    params.sessionId ?? ''

  let isSessionCompleted = false

  if (sessionId) {
    const supabase =
      await createClient()

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'medical_examination_sessions'
        )
        .select(`
          status_id
        `)
        .eq(
          'id',
          sessionId
        )
        .maybeSingle()

    if (error) {
      console.error(
        'MEDICAL EXAMINATION PAGE SESSION STATUS:',
        error
      )
    }

    isSessionCompleted =
      data?.status_id === 4
  }

  return (
    <main
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <ProcessLayout>
        <ProcessSteps title="Tok postupka">
          <ProcessStep
            number={1}
            title="Poslodavac"
            status={
              isSessionCompleted
                ? 'completed'
                : 'active'
            }
          />

          <ProcessStep
            number={2}
            title="Zaposleni i radna mesta"
            status={
              isSessionCompleted
                ? 'completed'
                : 'upcoming'
            }
          />

          <ProcessStep
            number={3}
            title="Vrsta pregleda"
            status={
              isSessionCompleted
                ? 'completed'
                : 'upcoming'
            }
          />

          <ProcessStep
            number={4}
            title="Generisanje uputa"
            status={
              isSessionCompleted
                ? 'completed'
                : 'upcoming'
            }
          />

          <ProcessStep
            number={5}
            title="Rezultati pregleda"
            status={
              isSessionCompleted
                ? 'completed'
                : 'upcoming'
            }
          />

          <ProcessStep
            number={6}
            title="Završetak"
            status={
              isSessionCompleted
                ? 'active'
                : 'upcoming'
            }
          />
        </ProcessSteps>

        <ProcessContent>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Izbor poslodavca
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: '#6b7280',
            }}
          >
            Izaberite poslodavca za kojeg se pokreće postupak
            lekarskih pregleda.
          </p>

          <EmployerSelection
            employers={employers}
          />
        </ProcessContent>
      </ProcessLayout>
    </main>
  )
}