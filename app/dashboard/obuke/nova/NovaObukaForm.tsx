'use client'

import { useEffect, useState } from 'react'

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
 currentPhase: 1 | 2 | 3 | 4 | 5 | 6
setCurrentPhase: React.Dispatch<
  React.SetStateAction<1 | 2 | 3 | 4 | 5 | 6>
>
initialEmployerId?: string
initialJobPositionId?: string
initialEmployeeId?: string
initialTrainingSessionId?: string
}

export default function NovaObukaForm({
  employers,
  practicalInstructors,
  safetyAdvisors,
  jobPositions,
  currentPhase,
  setCurrentPhase,
   initialEmployerId,
   initialJobPositionId,
   initialEmployeeId,
   initialTrainingSessionId,
}: Props) {
  console.log(
  'INITIAL TRAINING SESSION ID U FORMI:',
  initialTrainingSessionId
)
  const [employerId, setEmployerId] = useState(
  initialEmployerId ?? ''
)

  const [reasonCode, setReasonCode] = useState(
  initialEmployeeId ? '09' : ''
)
  const [startDate, setStartDate] = useState('')
  const [practicalInstructorName, setPracticalInstructorName] = useState('')
  const [safetyAdvisorId, setSafetyAdvisorId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [trainingSessionId, setTrainingSessionId] = useState(
  initialTrainingSessionId ?? ''
)
  const [assessments, setAssessments] = useState<any[]>([])
const [loadingAssessments, setLoadingAssessments] = useState(false)
const [availableTests, setAvailableTests] = useState<any[]>([])

const [selectedArchiveTestIds, setSelectedArchiveTestIds] =
  useState<string[]>([])

const [archivedTests, setArchivedTests] =
  useState<any[]>([])

useEffect(() => {
  if (!trainingSessionId) {
    setArchivedTests([])
    return
  }

  let cancelled = false

  async function loadArchivedTests() {
    try {
      const response = await fetch(
        `/api/training-session-generated-tests?sessionId=${trainingSessionId}`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Greška pri učitavanju arhive.')
      }

      const result = await response.json()

      if (!cancelled) {
        setArchivedTests(result.tests ?? [])
      }
    } catch (error) {
      console.error('Učitavanje arhive testova:', error)
    }
  }

  loadArchivedTests()

  return () => {
    cancelled = true
  }
}, [trainingSessionId])

const [
  selectedArchiveJobPositionId,
  setSelectedArchiveJobPositionId
] = useState('')

const [savingArchiveTests, setSavingArchiveTests] =
  useState(false)

const [archivingPdf, setArchivingPdf] = useState(false)

async function handleArchivePdf(recordId: string) {
  if (!recordId || archivingPdf) return

  try {
    setArchivingPdf(true)

    const response = await fetch(
      '/api/training-test-archive-pdf',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri arhiviranju PDF-a.'
      )
    }

    alert(
      result.alreadyArchived
        ? 'PDF je već arhiviran.'
        : 'PDF je uspešno arhiviran.'
    )

    if (!trainingSessionId) return

    const archiveResponse = await fetch(
      `/api/training-session-generated-tests?sessionId=${trainingSessionId}`
    )

    if (!archiveResponse.ok) {
      throw new Error('Greška pri osvežavanju arhive.')
    }

    const archiveResult = await archiveResponse.json()

    setArchivedTests(archiveResult.tests ?? [])
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Nepoznata greška.'
    )
  } finally {
    setArchivingPdf(false)
  }
}

async function handleSaveArchiveTests() {
  if (
    !trainingSessionId ||
    !selectedArchiveJobPositionId ||
    selectedArchiveTestIds.length === 0
  ) {
    alert('Izaberite radno mesto i najmanje jedan test.')
    return
  }

  try {
    setSavingArchiveTests(true)

    const response = await fetch(
      '/api/training-session-generated-tests',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingSessionId,
          sessionJobPositionId:
            selectedArchiveJobPositionId,
          testIds: selectedArchiveTestIds,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri čuvanju testova.'
      )
    }

    alert(
      `Testovi su povezani sa obukom.\n` +
      `Novih: ${result.addedCount}\n` +
      `Već postojećih: ${result.existingCount}`
    )

    const archiveResponse = await fetch(
      `/api/training-session-generated-tests?sessionId=${trainingSessionId}`
    )

    if (!archiveResponse.ok) {
      throw new Error('Greška pri učitavanju arhive.')
    }

    const archiveResult = await archiveResponse.json()

    setArchivedTests(archiveResult.tests ?? [])
    setSelectedArchiveTestIds([])
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Nepoznata greška.'
    )
  } finally {
    setSavingArchiveTests(false)
  }
}

const [selectedJobPositionIds, setSelectedJobPositionIds] =
  useState<string[]>(
    initialJobPositionId
      ? [initialJobPositionId]
      : []
  )
const [savedSessionJobPositions, setSavedSessionJobPositions] = useState<any[]>([])
const [trainingProgramVersionId, setTrainingProgramVersionId] = useState('')
const [savedTrainingSessionPrograms, setSavedTrainingSessionPrograms] =
  useState<any[]>([])


 const [theoryTrainingDate, setTheoryTrainingDate] = useState('')
const [theoryTrainingEndDate, setTheoryTrainingEndDate] = useState('')

const [practicalTrainingDate, setPracticalTrainingDate] = useState('')
const [practicalTrainingEndDate, setPracticalTrainingEndDate] = useState('')

const [theoryAssessmentDate, setTheoryAssessmentDate] = useState('')
const [practicalAssessmentDate, setPracticalAssessmentDate] = useState('')


const [scheduleLocation, setScheduleLocation] = useState('')

useEffect(() => {

  async function loadTrainingProgramVersion() {
    try {
      console.log('LOAD ASSESSMENTS', trainingSessionId)
      const response = await fetch(
        '/api/training-program-versions?programCode=BZR_OSNOVNI_PROGRAM'
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Greška pri učitavanju programa obuke.'
        )
      }

      setTrainingProgramVersionId(result.version.id)

      console.log(
        'AKTIVNA VERZIJA PROGRAMA:',
        result.version
      )
    } catch (error) {
      console.error(
        'Greška pri učitavanju programa obuke:',
        error
      )
    }
  }


  loadTrainingProgramVersion()
}, [])
useEffect(() => {
  async function loadAvailableTests() {
    try {
      const response = await fetch(
        '/api/training-tests'
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Greška pri učitavanju testova.'
        )
      }

      setAvailableTests(
        (result.tests ?? []).filter(
          (test: any) =>
            test.questionCount > 0
        )
      )
    } catch (error) {
      console.error(
        'Greška pri učitavanju testova:',
        error
      )
    }
  }

  loadAvailableTests()
}, [])
const [employees, setEmployees] = useState<any[]>([])
const [selectedEmployeeIds, setSelectedEmployeeIds] =
  useState<string[]>(
    initialEmployeeId
      ? [initialEmployeeId]
      : []
  )
const [employerSafetyAdvisors, setEmployerSafetyAdvisors] = useState<Instructor[]>([])
const [employerPracticalInstructors, setEmployerPracticalInstructors] = useState<Instructor[]>([])
const [showNewPracticalInstructor, setShowNewPracticalInstructor] = useState(false)
const [newPracticalInstructorFirstName, setNewPracticalInstructorFirstName] = useState('')
const [newPracticalInstructorLastName, setNewPracticalInstructorLastName] = useState('')
const [newPracticalInstructorProfessionalTitle, setNewPracticalInstructorProfessionalTitle] = useState('')
const [showNewSafetyAdvisor, setShowNewSafetyAdvisor] = useState(false)
const [newSafetyAdvisorFirstName, setNewSafetyAdvisorFirstName] = useState('')
const [newSafetyAdvisorLastName, setNewSafetyAdvisorLastName] = useState('')
const [newSafetyAdvisorProfessionalTitle, setNewSafetyAdvisorProfessionalTitle] = useState('')
function toggleJobPosition(jobPositionId: string) {
  setSelectedJobPositionIds((current) =>
    current.includes(jobPositionId)
      ? current.filter((id) => id !== jobPositionId)
      : [...current, jobPositionId]
  )
}
function toggleEmployee(employeeId: string) {
  setSelectedEmployeeIds((current) =>
    current.includes(employeeId)
      ? current.filter((id) => id !== employeeId)
      : [...current, employeeId]
  )
}
async function loadEmployerTrainingInstructors(
  selectedEmployerId: string
) {
  setEmployerSafetyAdvisors([])
  setEmployerPracticalInstructors([])
  setSafetyAdvisorId('')
  setPracticalInstructorName('')
  setShowNewPracticalInstructor(false)
  setNewPracticalInstructorFirstName('')
  setNewPracticalInstructorLastName('')
  setNewPracticalInstructorProfessionalTitle('')
  setShowNewSafetyAdvisor(false)
  setNewSafetyAdvisorFirstName('')
  setNewSafetyAdvisorLastName('')
  setNewSafetyAdvisorProfessionalTitle('')

  if (!selectedEmployerId) {
    return
  }

  try {
    const response = await fetch(
      `/api/employer-training-instructors?employerId=${selectedEmployerId}`
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Greška pri učitavanju BZR lica poslodavca.'
      )
    }

    const safetyAdvisors =
      result.safetyAdvisors ?? []

    const practicalInstructors =
      result.practicalInstructors ?? []

    setEmployerSafetyAdvisors(
      safetyAdvisors
    )

    setEmployerPracticalInstructors(
      practicalInstructors
    )

    const defaultSafetyAdvisor =
      safetyAdvisors.find(
        (
          person: Instructor & {
            is_default?: boolean
          }
        ) => person.is_default
      )

    if (defaultSafetyAdvisor) {
      setSafetyAdvisorId(
        defaultSafetyAdvisor.id
      )
    }

    const defaultPracticalInstructor =
      practicalInstructors.find(
        (
          person: Instructor & {
            is_default?: boolean
          }
        ) => person.is_default
      )

    if (defaultPracticalInstructor) {
      setPracticalInstructorName(
        `${defaultPracticalInstructor.first_name} ${defaultPracticalInstructor.last_name}`
      )
    }
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  }
}

useEffect(() => {
  if (!initialEmployerId) {
    return
  }

  setEmployerId(initialEmployerId)

  loadEmployerTrainingInstructors(
    initialEmployerId
  )
}, [initialEmployerId])
useEffect(() => {
  console.log(
  'POKRENUT useEffect ZA POSTOJEĆU OBUKU:',
  initialTrainingSessionId
)
  if (!initialTrainingSessionId) {
    return
  }

  async function loadExistingSessionJobPositions() {
    try {
      const response = await fetch(
        `/api/training-session-job-positions?sessionId=${initialTrainingSessionId}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Greška pri učitavanju sačuvanih radnih mesta.'
        )
      }

      const savedJobPositions =
        result.jobPositions ?? []

      setSavedSessionJobPositions(
        savedJobPositions
      )

      setSelectedJobPositionIds(
        savedJobPositions
          .map(
            (row: any) =>
              row.job_position_id ??
              row.jobPositionId ??
              row.employer_job_positions?.job_position_id
          )
          .filter(Boolean)
      )

      console.log(
        'UČITANA RADNA MESTA POSTOJEĆE OBUKE:',
        savedJobPositions
      )
    } catch (error) {
      console.error(
        'Greška pri učitavanju radnih mesta postojeće obuke:',
        error
      )
    }
  }

  loadExistingSessionJobPositions()
}, [initialTrainingSessionId])
useEffect(() => {
  if (
    !initialTrainingSessionId ||
    currentPhase !== 3
  ) {
    return
  }

  loadEmployeesForTraining()
}, [
  initialTrainingSessionId,
  currentPhase,
])
async function handleAddPracticalInstructor() {
  setError('')
  setSuccess('')

  if (!employerId) {
    setError('Prvo izaberite poslodavca.')
    return
  }

  if (
    !newPracticalInstructorFirstName.trim() ||
    !newPracticalInstructorLastName.trim()
  ) {
    setError('Unesite ime i prezime instruktora.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch(
      '/api/employer-training-instructors',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employerId,
          firstName: newPracticalInstructorFirstName.trim(),
          lastName: newPracticalInstructorLastName.trim(),
          professionalTitle:
            newPracticalInstructorProfessionalTitle.trim(),
          instructorRole: 'practical_instructor',
          isDefault: false,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Greška pri čuvanju praktičnog instruktora.'
      )
    }

    const savedInstructor = result.instructor

    await loadEmployerTrainingInstructors(employerId)

    setPracticalInstructorName(
      `${savedInstructor.first_name} ${savedInstructor.last_name}`.trim()
    )
    setShowNewPracticalInstructor(false)
    setNewPracticalInstructorFirstName('')
    setNewPracticalInstructorLastName('')
    setNewPracticalInstructorProfessionalTitle('')

    setSuccess(
      `Praktični instruktor ${savedInstructor.first_name} ${savedInstructor.last_name} je sačuvan za poslodavca.`
    )
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}

async function handleAddSafetyAdvisor() {
  setError('')
  setSuccess('')

  if (!employerId) {
    setError('Prvo izaberite poslodavca.')
    return
  }

  if (
    !newSafetyAdvisorFirstName.trim() ||
    !newSafetyAdvisorLastName.trim()
  ) {
    setError('Unesite ime i prezime savetnika.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch(
      '/api/employer-training-instructors',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employerId,
          firstName: newSafetyAdvisorFirstName.trim(),
          lastName: newSafetyAdvisorLastName.trim(),
          professionalTitle:
            newSafetyAdvisorProfessionalTitle.trim(),
          instructorRole: 'safety_advisor',
          isDefault: true,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Greška pri čuvanju savetnika za BZR.'
      )
    }

    const savedAdvisor = result.instructor

    await loadEmployerTrainingInstructors(employerId)

    setSafetyAdvisorId(savedAdvisor.id)
    setShowNewSafetyAdvisor(false)
    setNewSafetyAdvisorFirstName('')
    setNewSafetyAdvisorLastName('')
    setNewSafetyAdvisorProfessionalTitle('')

    setSuccess(
      `Savetnik za BZR ${savedAdvisor.first_name} ${savedAdvisor.last_name} je sačuvan za poslodavca.`
    )
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (
      !employerId ||
      !reasonCode ||
      !startDate ||
      !practicalInstructorName.trim() ||
      !safetyAdvisorId
    ) {
      setError('Popunite sva obavezna polja.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employerId,
          reasonCode,
          startDate,
          practicalInstructorName,
          safetyAdvisorId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri kreiranju obuke.')
      }


  setTrainingSessionId(result.trainingSessionId)

setSuccess(
  `Proces obuke je kreiran. Broj obuke: ${result.trainingNumber}`
)

setCurrentPhase(2)

console.log('TRAINING SESSION ID:', result.trainingSessionId)
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Došlo je do nepoznate greške.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  async function handleSaveAssessments() {
  setError('')
  setSuccess('')

  if (assessments.length === 0) {
    setError('Nema rezultata za čuvanje.')
    return
  }

const incompleteAssessment = assessments.find(
  (assessment) =>
    !assessment.trainingTestId ||
    assessment.theoryIncorrectPercent === null ||
    assessment.theoryIncorrectPercent === undefined ||
    assessment.theoryPassed === null ||
    assessment.theoryPassed === undefined ||
    !Array.isArray(assessment.practicalItems) ||
    assessment.practicalItems.length === 0 ||
    assessment.practicalItems.some(
      (item: any) =>
        item.passed === null ||
        item.passed === undefined
    )
)

  if (incompleteAssessment) {
    setError(
  'Izaberite test, unesite rezultat teorijske provere i ocenite sve stavke praktične provere za sve zaposlene.'
)
    return
  }

  try {
    setIsSubmitting(true)

    for (const assessment of assessments) {
      for (const practicalItem of assessment.practicalItems) {
        const practicalResponse = await fetch(
          '/api/training-practical-assessment-items',
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: practicalItem.id,
              passed: practicalItem.passed,
              notes: practicalItem.notes ?? '',
            }),
          }
        )

        const practicalResult =
          await practicalResponse.json()

        if (!practicalResponse.ok) {
          throw new Error(
            practicalResult.error ||
              'Greška pri čuvanju praktične provere.'
          )
        }
      }
    }

    const assessmentsForSave = assessments.map(
      (assessment) => ({
        ...assessment,
        practicalPassed:
          assessment.practicalItems.every(
            (item: any) => item.passed === true
          ),
      })
    )

    const response = await fetch(
      '/api/training-session-assessments',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessments: assessmentsForSave,
          theoryAssessmentDate,
          practicalAssessmentDate,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Greška pri čuvanju rezultata provere.'
      )
    }

    setAssessments(assessmentsForSave)

    setSuccess(
      `Rezultati provere su uspešno sačuvani za ${result.updatedCount} zaposlenih.`
    )
    setCurrentPhase(6)
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}
  async function handleSaveJobPositions() {
  setError('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  if (selectedJobPositionIds.length === 0) {
    setError('Izaberite najmanje jedno radno mesto.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch('/api/training-session-job-positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingSessionId,
        jobPositionIds: selectedJobPositionIds,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri čuvanju radnih mesta.'
      )
    }

    console.log('SAČUVANA RADNA MESTA:', result.jobPositions)
    setSavedSessionJobPositions(result.jobPositions ?? [])
    console.log('SESSION JOB POSITIONS ZA FAZU 4:', result.jobPositions)
    setSuccess(
  `Radna mesta su uspešno sačuvana. Broj izabranih radnih mesta: ${selectedJobPositionIds.length}`
)
await loadEmployeesForTraining()
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}
async function loadEmployeesForTraining() {
  setError('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch(
      `/api/training-session-employees?sessionId=${trainingSessionId}`
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri učitavanju zaposlenih.'
      )
    }

    setEmployees(result.employees ?? [])
    setCurrentPhase(3)
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}
async function handleSaveEmployees() {
  setError('')
  setSuccess('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  if (selectedEmployeeIds.length === 0) {
    setError('Izaberite najmanje jednog zaposlenog.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch(
      '/api/training-session-selected-employees',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingSessionId,
          employeeIds: selectedEmployeeIds,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri čuvanju zaposlenih.'
      )
    }

    setSuccess(
      `Zaposleni su uspešno sačuvani. Izabrano zaposlenih: ${selectedEmployeeIds.length}`
    )
    setCurrentPhase(4)
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}
const loadAssessments = async () => {
  if (!trainingSessionId) return

  try {
    setLoadingAssessments(true)

    const response = await fetch(
      `/api/training-session-assessments?sessionId=${trainingSessionId}`
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Greška pri učitavanju provere.'
      )
    }

    setAssessments(result.data)
  } catch (error) {
    console.error(error)
  } finally {
    setLoadingAssessments(false)
  }
}

const preparePhase5Assessments = async () => {
  if (!trainingSessionId) return

  try {
    setLoadingAssessments(true)
    setError('')

    const generateResponse = await fetch(
      '/api/training-practical-assessment-items',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingSessionId,
        }),
      }
    )

    const generateResult =
      await generateResponse.json()

    if (!generateResponse.ok) {
      throw new Error(
        generateResult.error ||
          'Greška pri pripremi praktične provere.'
      )
    }

    const assessmentsResponse = await fetch(
      `/api/training-session-assessments?sessionId=${trainingSessionId}`
    )

    const assessmentsResult =
      await assessmentsResponse.json()

    if (!assessmentsResponse.ok) {
      throw new Error(
        assessmentsResult.error ||
          'Greška pri učitavanju provere.'
      )
    }

    setAssessments(
      assessmentsResult.data ?? []
    )
  } catch (error: unknown) {
    console.error(error)

    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setLoadingAssessments(false)
  }
}

useEffect(() => {
  if (
    currentPhase === 5 &&
    trainingSessionId
  ) {
    preparePhase5Assessments()
  }
}, [currentPhase, trainingSessionId])

async function handleSaveTrainingProgram() {
  console.log('POČEO handleSaveTrainingProgram')

  setError('')
  setSuccess('')

  if (savedSessionJobPositions.length === 0) {
    setError('Nisu pronađena sačuvana radna mesta za ovu obuku.')
    return
  }

  if (!trainingProgramVersionId) {
    setError('Aktivna verzija programa obuke nije pronađena.')
    return
  }
  try {
  setIsSubmitting(true)

  const trainingSessionJobPositionIds =
    savedSessionJobPositions.map((row) => row.id)

  const response = await fetch(
    '/api/training-session-programs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingSessionJobPositionIds,
        trainingProgramVersionId,
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.error || 'Greška pri čuvanju programa obuke.'
    )
  }

  console.log('SAČUVANI PROGRAMI OBUKE:', result.programs)
  setSavedTrainingSessionPrograms(result.programs ?? [])
} catch (error: unknown) {
  setError(
    error instanceof Error
      ? error.message
      : 'Došlo je do nepoznate greške.'
  )
} finally {
  setIsSubmitting(false)
}
}
async function handleSaveTrainingSchedule() {
  console.log('POČEO handleSaveTrainingSchedule')
  console.log('KLIK SAČUVAJ TERMIN')
  console.log('PROGRAMI:', savedTrainingSessionPrograms)
console.log(
  'DEBUG FAZA 4:',
  {
    savedSessionJobPositionsLength:
      savedSessionJobPositions.length,
    savedSessionJobPositions,
    trainingProgramVersionId,
  },
)


  setError('')
  setSuccess('')

  if (savedTrainingSessionPrograms.length === 0) {
    setError('Program obuke prvo mora biti sačuvan.')
    return
  }

 if (!theoryTrainingDate) {
  setError('Unesite datum početka teorijske obuke.')
  return
}
if (!practicalTrainingDate) {
  setError('Unesite datum početka praktične obuke.')
  return
}
if (!theoryTrainingDate) {
  setError('Unesite datum početka teorijske obuke.')
  return
}

if (!theoryTrainingEndDate) {
  setError('Unesite datum završetka teorijske obuke.')
  return
}

if (!practicalTrainingDate) {
  setError('Unesite datum početka praktične obuke.')
  return
}

if (!practicalTrainingEndDate) {
  setError('Unesite datum završetka praktične obuke.')
  return
}

if (!theoryAssessmentDate) {
  setError('Unesite datum provere teorijske obučenosti.')
  return
}

if (!practicalAssessmentDate) {
  setError('Unesite datum provere praktične obučenosti.')
  return
}





const trainingSessionProgramIds =
  savedTrainingSessionPrograms.map((row) => row.id)

const scheduleEvents = [
  {
    activityType: 'TRAINING',
    scheduleType: 'THEORY',
    eventDate: theoryTrainingDate,
  },
  {
    activityType: 'TRAINING',
    scheduleType: 'THEORY_END',
    eventDate: theoryTrainingEndDate,
  },
  {
    activityType: 'TRAINING',
    scheduleType: 'PRACTICAL',
    eventDate: practicalTrainingDate,
  },
  {
    activityType: 'TRAINING',
    scheduleType: 'PRACTICAL_END',
    eventDate: practicalTrainingEndDate,
  },
  {
    activityType: 'ASSESSMENT',
    scheduleType: 'TEST',
    eventDate: theoryAssessmentDate,
  },
  {
    activityType: 'ASSESSMENT',
    scheduleType: 'PRACTICAL_CHECK',
    eventDate: practicalAssessmentDate,
  },
] as const
  try {
  setIsSubmitting(true)

 const responses = await Promise.all(
  scheduleEvents.map((event) =>
    fetch('/api/training-session-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingSessionProgramIds,
        activityType: event.activityType,
        scheduleType: event.scheduleType,
        eventDate: event.eventDate,
        location: scheduleLocation,
      }),
    })
  )
)

 const results = await Promise.all(
  responses.map((response) => response.json())
)
const failedIndex = responses.findIndex(
  (response) => !response.ok
)

if (failedIndex !== -1) {
  throw new Error(
    results[failedIndex]?.error ||
      'Greška pri čuvanju termina obuke.'
  )
}

  const savedSchedules = results.flatMap(
  (result) => result.schedules ?? []
)

console.log('SAČUVANI TERMINI OBUKE:', savedSchedules)

setSuccess(
  `Termini obuke su uspešno sačuvani za ${savedSchedules.length} zapisa.`
)
setCurrentPhase(5)
} catch (error: unknown) {
  setError(
    error instanceof Error
      ? error.message
      : 'Došlo je do nepoznate greške.'
  )
} finally {
  setIsSubmitting(false)
}
}
async function handleCompleteTraining() {
  setError('')
  setSuccess('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  try {
    setIsSubmitting(true)

    const response = await fetch(
      '/api/training-session-status',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingSessionId,
          statusCode: 'COMPLETED',
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Postupak obuke nije moguće završiti.'
      )
    }

    setSuccess('Postupak obuke je uspešno završen.')
  } catch (error: unknown) {
    setError(
      error instanceof Error
        ? error.message
        : 'Došlo je do nepoznate greške.'
    )
  } finally {
    setIsSubmitting(false)
  }
}
function handleOpenTrainingTermPlanPdf() {
  setError('')
  setSuccess('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  window.open(
    `/api/training-term-plan-pdf?trainingSessionId=${encodeURIComponent(
      trainingSessionId
    )}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function handleOpenPracticalAssessmentPdf() {
  setError('')
  setSuccess('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  window.open(
    `/api/training-practical-assessment-pdf?trainingSessionId=${encodeURIComponent(
      trainingSessionId
    )}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function handleOpenTrainingRecordPdf() {
  setError('')
  setSuccess('')

  if (!trainingSessionId) {
    setError('Proces obuke nije pronađen.')
    return
  }

  window.open(
    `/api/training-record-pdf?trainingSessionId=${encodeURIComponent(
      trainingSessionId
    )}`,
    '_blank',
    'noopener,noreferrer'
  )
}

return (
  <>
    {currentPhase === 1 && (
      <form onSubmit={handleSubmit}>
        <div style={formGrid}>
          <div style={fullWidthField}>
            <label style={labelStyle}>Poslodavac</label>

            <select
              style={inputStyle}
              value={employerId}
              onChange={(event) => {
  const selectedEmployerId = event.target.value

  setEmployerId(selectedEmployerId)
  loadEmployerTrainingInstructors(selectedEmployerId)
}}
            >
              <option value="">Izaberite poslodavca</option>

              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Razlog obuke</label>

            <select
              style={inputStyle}
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
            >
              <option value="">Izaberite razlog obuke</option>
              <option value="01">
                01 – Prilikom zasnivanja radnog odnosa, odnosno drugog radnog angažovanja
              </option>
              <option value="02">
                02 – Usled premeštaja na druge poslove
              </option>
              <option value="03">
                03 – Prilikom uvođenja nove tehnologije ili novih sredstava za rad ili promene opreme za rad
              </option>
              <option value="04">
                04 – Prilikom promene radnog procesa
              </option>
              <option value="05">
                05 – Ako poslodavac odredi zaposlenom da obavlja poslove na dva ili više radnih mesta
              </option>
              <option value="06">
                06 – Ako kod poslodavca (na osnovu ugovora, sporazuma ili po bilo kom drugom osnovu) rad obavljaju zaposleni drugog poslodavca
              </option>
              <option value="07">
                07 – Dodatna obuka kada to zahteva radni proces
              </option>
              <option value="08">
                08 – Dodatna obuka u slučaju teške, smrtne ili kolektivne povrede na radu sa teškom ili smrtnom povredom na radu
              </option>
              <option value="09">
                09 – Periodična obuka zaposlenih
              </option>
              <option value="10">
                10 – Obuka neposrednih rukovodilaca
              </option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Datum početka obuke</label>

            <input
              type="date"
              style={inputStyle}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Instruktor praktične obuke</label>

            <select
              style={inputStyle}
              value={
                showNewPracticalInstructor
                  ? '__ADD_NEW__'
                  : practicalInstructorName
              }
              onChange={(event) => {
                if (event.target.value === '__ADD_NEW__') {
                  setPracticalInstructorName('')
                  setShowNewPracticalInstructor(true)
                  return
                }

                setShowNewPracticalInstructor(false)
                setPracticalInstructorName(event.target.value)
              }}
            >
              <option value="">Izaberite instruktora</option>

              {employerPracticalInstructors.map((instructor) => {
                const fullName =
                  `${instructor.first_name} ${instructor.last_name}`.trim()

                return (
                  <option key={instructor.id} value={fullName}>
                    {fullName}
                  </option>
                )
              })}

              <option value="__ADD_NEW__">
                + Dodaj novog instruktora
              </option>
            </select>

            {showNewPracticalInstructor && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Ime</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newPracticalInstructorFirstName}
                    onChange={(event) =>
                      setNewPracticalInstructorFirstName(
                        event.target.value
                      )
                    }
                    placeholder="Unesite ime"
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Prezime</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newPracticalInstructorLastName}
                    onChange={(event) =>
                      setNewPracticalInstructorLastName(
                        event.target.value
                      )
                    }
                    placeholder="Unesite prezime"
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>
                    Stručni naziv / zvanje
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newPracticalInstructorProfessionalTitle}
                    onChange={(event) =>
                      setNewPracticalInstructorProfessionalTitle(
                        event.target.value
                      )
                    }
                    placeholder="Opciono"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    style={backButton}
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowNewPracticalInstructor(false)
                      setNewPracticalInstructorFirstName('')
                      setNewPracticalInstructorLastName('')
                      setNewPracticalInstructorProfessionalTitle('')
                    }}
                  >
                    Otkaži
                  </button>

                  <button
                    type="button"
                    style={submitButton}
                    disabled={isSubmitting}
                    onClick={handleAddPracticalInstructor}
                  >
                    {isSubmitting
                      ? 'Čuvanje...'
                      : 'Sačuvaj instruktora'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Savetnik za bezbednost i zdravlje na radu
            </label>

            <select
              style={inputStyle}
              value={
                showNewSafetyAdvisor
                  ? '__ADD_NEW_SAFETY_ADVISOR__'
                  : safetyAdvisorId
              }
              onChange={(event) => {
                if (
                  event.target.value ===
                  '__ADD_NEW_SAFETY_ADVISOR__'
                ) {
                  setSafetyAdvisorId('')
                  setShowNewSafetyAdvisor(true)
                  return
                }

                setShowNewSafetyAdvisor(false)
                setSafetyAdvisorId(event.target.value)
              }}
            >
              <option value="">Izaberite savetnika za BZR</option>

              {employerSafetyAdvisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.last_name} {advisor.first_name}
                  {advisor.professional_title
                    ? ` (${advisor.professional_title})`
                    : ''}
                </option>
              ))}

              <option value="__ADD_NEW_SAFETY_ADVISOR__">
                + Dodaj novog savetnika
              </option>
            </select>

            {showNewSafetyAdvisor && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Ime</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newSafetyAdvisorFirstName}
                    onChange={(event) =>
                      setNewSafetyAdvisorFirstName(
                        event.target.value
                      )
                    }
                    placeholder="Unesite ime"
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Prezime</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newSafetyAdvisorLastName}
                    onChange={(event) =>
                      setNewSafetyAdvisorLastName(
                        event.target.value
                      )
                    }
                    placeholder="Unesite prezime"
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>
                    Stručni naziv / zvanje
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={newSafetyAdvisorProfessionalTitle}
                    onChange={(event) =>
                      setNewSafetyAdvisorProfessionalTitle(
                        event.target.value
                      )
                    }
                    placeholder="Opciono"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    style={backButton}
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowNewSafetyAdvisor(false)
                      setNewSafetyAdvisorFirstName('')
                      setNewSafetyAdvisorLastName('')
                      setNewSafetyAdvisorProfessionalTitle('')
                    }}
                  >
                    Otkaži
                  </button>

                  <button
                    type="button"
                    style={submitButton}
                    disabled={isSubmitting}
                    onClick={handleAddSafetyAdvisor}
                  >
                    {isSubmitting
                      ? 'Čuvanje...'
                      : 'Sačuvaj savetnika'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {success && <div style={successBox}>{success}</div>}


          <div style={actions}>
  <button
    type="submit"
    style={submitButton}
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Kreiranje...' : 'Sačuvaj i nastavi'}
  </button>
</div>
      </form>
    )}

    {currentPhase === 2 && (
      <div>
        <div style={successBox}>
          Faza 1 je završena. Izaberite jedno ili više radnih mesta.
        </div>
        {success && <div style={successBox}>{success}</div>}

        <div style={{ marginTop: 24 }}>
          {jobPositions.map((jobPosition) => (
            <label
              key={jobPosition.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                marginBottom: 8,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selectedJobPositionIds.includes(jobPosition.id)}
                onChange={() => toggleJobPosition(jobPosition.id)}
              />

              <span
  style={{
    color: '#111827',
    fontWeight: 500,
  }}
>
  {jobPosition.name}
</span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 20, fontWeight: 700 }}>
          Izabrano radnih mesta: {selectedJobPositionIds.length}
        </div>
        <div style={actions}>
          <button
  type="button"
  style={backButton}
  onClick={() => setCurrentPhase(1)}
  disabled={isSubmitting}
>
  ← Nazad
</button>
 <button
  type="button"
  style={submitButton}
  onClick={handleSaveJobPositions}
  disabled={selectedJobPositionIds.length === 0 || isSubmitting}
>
  {isSubmitting ? 'Čuvanje...' : 'Sačuvaj i nastavi'}
</button>
</div>
      </div>
    )}
    {currentPhase === 3 && (
  <div>
    <div style={successBox}>
      Faza 2 je završena. Pronađeni su zaposleni za izabrana radna mesta.
    </div>

    <div style={{ marginTop: 24 }}>
      {employees.length === 0 ? (
        <div>Nema zaposlenih za izabrana radna mesta.</div>
      ) : (
        employees.map((employee) => (
          <div
            key={employee.id}
            style={{
              padding: '10px 12px',
              marginBottom: 8,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          >
            <label
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  }}
>
  <input
    type="checkbox"
    checked={selectedEmployeeIds.includes(employee.id)}
    onChange={() => toggleEmployee(employee.id)}
  />

  <span
  style={{
    color: '#111827',
    fontWeight: 500,
  }}
>
  {employee.last_name} {employee.first_name}
</span>
</label>
          </div>
        ))
      )}
    </div>

   <div
  style={{
    marginTop: 20,
    fontWeight: 700,
    color: '#111827',
  }}
>
  Broj pronađenih zaposlenih: {employees.length}
</div>

<div
  style={{
    marginTop: 8,
    fontWeight: 700,
    color: '#111827',
  }}
>
  Izabrano zaposlenih: {selectedEmployeeIds.length}
</div>
{error && <div style={errorBox}>{error}</div>}

{success && <div style={successBox}>{success}</div>}

<div style={actions}>
  <button
  type="button"
  style={backButton}
  onClick={() => setCurrentPhase(2)}
  disabled={isSubmitting}
>
  ← Nazad
</button>

  <button
    type="button"
    style={submitButton}
    onClick={handleSaveEmployees}
    disabled={selectedEmployeeIds.length === 0 || isSubmitting}
  >
    {isSubmitting ? 'Čuvanje...' : 'Sačuvaj i nastavi'}
  </button>
</div>
  </div>
)}
{currentPhase === 4 && (
  <div>
    <div style={successBox}>
      Faza 3 je završena. Zaposleni su sačuvani.
    </div>

    <div
  style={{
    marginTop: 24,
    color: '#111827',
    fontWeight: 700,
  }}
>
  <strong>Faza 4 – Program i termini obuke</strong>
</div>
    <div style={{ marginTop: 20 }}>


</div>
<div style={{ marginTop: 16 }}>
 <label style={labelStyle}>Datum početka teorijske obuke</label>

<input
  type="date"
  style={inputStyle}
  value={theoryTrainingDate}
  onChange={(e) => setTheoryTrainingDate(e.target.value)}
/>
<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Datum završetka teorijske obuke</label>

  <input
    type="date"
    style={inputStyle}
    value={theoryTrainingEndDate}
    onChange={(e) => setTheoryTrainingEndDate(e.target.value)}
  />
</div>
<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Datum početka praktične obuke</label>

  <input
    type="date"
    style={inputStyle}
    value={practicalTrainingDate}
    onChange={(e) => setPracticalTrainingDate(e.target.value)}
  />
</div>
<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Datum završetka praktične obuke</label>

  <input
    type="date"
    style={inputStyle}
    value={practicalTrainingEndDate}
    onChange={(e) => setPracticalTrainingEndDate(e.target.value)}
  />
</div>
</div>
<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Datum provere teorijske obučenosti</label>

  <input
    type="date"
    style={inputStyle}
    value={theoryAssessmentDate}
    onChange={(e) => setTheoryAssessmentDate(e.target.value)}
  />
</div>
<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Datum provere praktične obučenosti</label>

  <input
    type="date"
    style={inputStyle}
    value={practicalAssessmentDate}
    onChange={(e) => setPracticalAssessmentDate(e.target.value)}
  />
</div>

<div style={{ marginTop: 16 }}>
  <label style={labelStyle}>Mesto održavanja</label>

  <input
    type="text"
    style={inputStyle}
    value={scheduleLocation}
    onChange={(e) => setScheduleLocation(e.target.value)}
    placeholder="Unesite mesto održavanja obuke"
  />
</div>
<div style={{ marginTop: 24 }}>
  <button
    type="button"
    style={submitButton}
    onClick={handleSaveTrainingSchedule}
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Čuvanje...' : 'Sačuvaj termin obuke'}
  </button>
</div>
    <div style={actions}>
  <button
    type="button"
    style={backButton}
    onClick={() => setCurrentPhase(3)}
  >
    ← Nazad
  </button>

  <button
    type="button"
    style={submitButton}
    onClick={handleSaveTrainingProgram}
    disabled={
      savedSessionJobPositions.length === 0 ||
      !trainingProgramVersionId ||
      isSubmitting
    }
  >
    {isSubmitting ? 'Čuvanje...' : 'Sačuvaj program'}
  </button>
</div>
  </div>
)}

{currentPhase === 5 && (
  <div>
    <div style={successBox}>
      Faza 4 je završena. Program i termini su sačuvani.
    </div>

    <div style={{ marginTop: 24 }}>
      <strong>Faza 5 – Provera obučenosti</strong>
    </div>

    <div style={{ marginTop: 20 }}>
      {loadingAssessments ? (
        <div>Učitavanje zaposlenih...</div>
      ) : assessments.length === 0 ? (
        <div>Nema zaposlenih za prikaz.</div>
      ) : (
        <div>
          {assessments.map((assessment) => {
            const hazardItems =
              (assessment.practicalItems ?? []).filter(
                (item: any) => item.assessmentType === 'HAZARD'
              )
            const ppeItems =
              (assessment.practicalItems ?? []).filter(
                (item: any) => item.assessmentType === 'PPE'
              )
            const hazardGroups = hazardItems.reduce(
              (groups: Record<string, any[]>, item: any) => {
                const key = item.hazardId ?? item.hazardCode ?? 'unknown-hazard'
                if (!groups[key]) groups[key] = []
                groups[key].push(item)
                return groups
              },
              {}
            )

            const updatePracticalItem = (
              practicalItemId: string,
              changes: Record<string, any>
            ) => {
              setAssessments((current) =>
                current.map((item) =>
                  item.id === assessment.id
                    ? {
                        ...item,
                        practicalItems: (item.practicalItems ?? []).map(
                          (practicalItem: any) =>
                            practicalItem.id === practicalItemId
                              ? { ...practicalItem, ...changes }
                              : practicalItem
                        ),
                      }
                    : item
                )
              )
            }

            const renderPracticalControls = (item: any) => (
              <div style={{ marginTop: 10 }}>
                <div>
                  <label style={{ marginRight: 20 }}>
                    <input
                      type="radio"
                      name={`practical-item-${item.id}`}
                      checked={item.passed === true}
                      onChange={() =>
                        updatePracticalItem(item.id, { passed: true })
                      }
                    />{' '}
                    Položio
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`practical-item-${item.id}`}
                      checked={item.passed === false}
                      onChange={() =>
                        updatePracticalItem(item.id, { passed: false })
                      }
                    />{' '}
                    Nije položio
                  </label>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>
                    Napomena
                  </label>
                  <textarea
                    value={item.notes ?? ''}
                    onChange={(event) =>
                      updatePracticalItem(item.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Unesite napomenu po potrebi"
                    style={{
                      ...inputStyle,
                      minHeight: 70,
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            )

            const allPracticalItems = assessment.practicalItems ?? []
            const practicalComplete =
              allPracticalItems.length > 0 &&
              allPracticalItems.every(
                (item: any) => item.passed === true || item.passed === false
              )
            const practicalPassed =
              practicalComplete &&
              allPracticalItems.every((item: any) => item.passed === true)

            return (
              <div
                key={assessment.id}
                style={{
                  border: '1px solid #d7dce5',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                  color: '#111827',
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {assessment.firstName} {assessment.lastName}
                </div>
                <div style={{ marginTop: 6 }}>
                  Radno mesto: {assessment.jobPositionName}
                </div>
                <div style={{ marginTop: 4 }}>
                  Program obuke: {assessment.trainingProgramName}
                </div>

                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Teorijska provera</div>
 <div style={{ marginTop: 14 }}>
  <label
    style={{
      display: 'block',
      fontWeight: 600,
      marginBottom: 6,
    }}
  >
    Test za teorijsku proveru
  </label>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    }}
  >
    <select
      value={assessment.trainingTestId ?? ''}
      onChange={(event) => {
        const trainingTestId =
          event.target.value

        setAssessments((current) =>
          current.map((item) =>
            item.id === assessment.id
              ? {
                  ...item,
                  trainingTestId:
                    trainingTestId || null,

                  // Promenjen je test:
                  // prethodni rezultat više ne važi.
                  theoryIncorrectPercent: null,
                  theoryPassed: null,
                }
              : item
          )
        )
      }}
      style={{
        width: '100%',
        maxWidth: 520,
        padding: '10px 12px',
        border: '1px solid #cfd5df',
        borderRadius: 8,
        backgroundColor: '#ffffff',
      }}
    >
      <option value="">
        — Izaberite test —
      </option>

      {availableTests.map((test: any) => (
        <option
          key={test.id}
          value={test.id}
        >
          {test.name} — {test.questionCount} pitanja
        </option>
      ))}
    </select>

    <button
      type="button"
      disabled={!assessment.trainingTestId}
      onClick={() => {
        if (!assessment.trainingTestId) {
          return
        }

        window.open(
          `/dashboard-test/preview/${assessment.trainingTestId}`,
          '_blank',
          'noopener,noreferrer'
        )
      }}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderRadius: 8,
        fontWeight: 700,
        whiteSpace: 'nowrap',

        backgroundColor:
          assessment.trainingTestId
            ? '#111827'
            : '#d1d5db',

        color:
          assessment.trainingTestId
            ? '#ffffff'
            : '#6b7280',

        cursor:
          assessment.trainingTestId
            ? 'pointer'
            : 'not-allowed',
      }}
    >
      OTVORI TEST / PDF
    </button>
  </div>

  {assessment.trainingTestId &&
    (() => {
      const selectedTest =
        availableTests.find(
          (test: any) =>
            test.id ===
            assessment.trainingTestId
        )

      if (!selectedTest) {
        return null
      }

      const maxIncorrect = Math.floor(
        selectedTest.questionCount * 0.05
      )

      return (
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: '#475569',
          }}
        >
          Test sadrži{' '}
          <strong>
            {selectedTest.questionCount}
          </strong>{' '}
          pitanja. Dozvoljeno najviše{' '}
          <strong>
            {maxIncorrect}
          </strong>{' '}
          netačnih odgovora (5%).
        </div>
      )
    })()}
</div>

<div style={{ marginTop: 14 }}>
  <label
    style={{
      display: 'block',
      fontWeight: 600,
      marginBottom: 6,
    }}
  >
                      Broj netačnih odgovora
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={
  availableTests.find(
    (test: any) =>
      test.id === assessment.trainingTestId
  )?.questionCount ?? 0
}
                      step="1"
                      disabled={!assessment.trainingTestId}
                      value={assessment.theoryIncorrectPercent ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        setAssessments((current) =>
                          current.map((item) =>
                            item.id === assessment.id
                              ? {
                                  ...item,
                                  theoryIncorrectPercent: value === '' ? null : parseInt(value, 10),
                                  theoryPassed:
  value === ''
    ? null
    : (() => {
        const selectedTest =
          availableTests.find(
            (test: any) =>
              test.id ===
              assessment.trainingTestId
          )

        if (!selectedTest) {
          return false
        }

        const maxIncorrect = Math.floor(
          selectedTest.questionCount * 0.05
        )

        return (
          parseInt(value, 10) <= maxIncorrect
        )
      })(),
                                }
                              : item
                          )
                        )
                      }}
                      style={{ width: '180px', padding: '10px 12px', border: '1px solid #cfd5df', borderRadius: 8 }}
                    />
                  </div>
                <div style={{ marginTop: 12 }}>
  {assessment.trainingTestId &&
    assessment.theoryIncorrectPercent !== null &&
    assessment.theoryIncorrectPercent !== undefined &&
    (() => {
      const selectedTest =
        availableTests.find(
          (test: any) =>
            test.id ===
            assessment.trainingTestId
        )

      if (!selectedTest) {
        return null
      }

      const incorrectPercent =
        selectedTest.questionCount > 0
          ? (
              (assessment.theoryIncorrectPercent /
                selectedTest.questionCount) *
              100
            ).toFixed(2)
          : '0.00'

      return (
        <div style={{ marginBottom: 8 }}>
          <strong>
            Procenat netačnih odgovora:{' '}
          </strong>
          {incorrectPercent.replace('.', ',')}%
        </div>
      )
    })()}

  <div>
    <strong>
      Rezultat teorijske provere:{' '}
    </strong>

    {assessment.theoryPassed === null ||
    assessment.theoryPassed === undefined ? (
      <span>Nije unet rezultat</span>
    ) : assessment.theoryPassed ? (
      <span>✓ Položio</span>
    ) : (
      <span>✕ Nije položio</span>
    )}
  </div>
</div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    A. Praktična provera bezbednog rada – OPASNOSTI
                  </div>
                  {hazardItems.length === 0 ? (
                    <div style={{ marginTop: 12, color: '#6b7280' }}>
                      Nema pripremljenih stavki praktične provere opasnosti.
                    </div>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      {Object.entries(hazardGroups).map(([groupKey, items]) => {
                        const firstItem = (items as any[])[0]
                        return (
                          <div key={groupKey} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: '#f8fafc' }}>
                            <div style={{ fontWeight: 700 }}>
                              {firstItem.hazardCode ? `${firstItem.hazardCode} – ` : ''}
                              {firstItem.hazardName ?? 'Opasnost'}
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {(items as any[]).map((item: any) => (
                                <div key={item.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#ffffff' }}>
                                  <div>{item.description}</div>
                                  {renderPracticalControls(item)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    B. Praktična provera pravilnog korišćenja – LZO
                  </div>
                  {ppeItems.length === 0 ? (
                    <div style={{ marginTop: 12, color: '#6b7280' }}>
                      Nema pripremljenih stavki praktične provere LZO.
                    </div>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      {ppeItems.map((item: any) => (
                        <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: '#f8fafc' }}>
                          <div style={{ fontWeight: 700 }}>
                            {item.ppeCode ? `${item.ppeCode} – ` : ''}
                            {item.ppeName ?? 'LZO'}
                          </div>
                          <div style={{ marginTop: 8 }}>{item.description}</div>
                          {renderPracticalControls(item)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
                  <strong>Zbirni rezultat praktične provere: </strong>
                  {!practicalComplete ? (
                    <span>Nisu ocenjene sve stavke</span>
                  ) : practicalPassed ? (
                    <span>✓ Položio</span>
                  ) : (
                    <span>✕ Nije položio</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>

    {error && <div style={errorBox}>{error}</div>}
    {success && <div style={successBox}>{success}</div>}

    <div style={actions}>
      <button type="button" style={backButton} onClick={() => setCurrentPhase(4)} disabled={isSubmitting}>
        ← Nazad
      </button>
      <button type="button" style={submitButton} onClick={handleSaveAssessments} disabled={isSubmitting}>
        {isSubmitting ? 'Čuvanje...' : 'Sačuvaj rezultate'}
      </button>
    </div>
  </div>
)}

{currentPhase === 6 && (
  <div>
    <div style={successBox}>
      Faza 5 je završena. Rezultati provere obučenosti su sačuvani.
    </div>

    <div style={{ marginTop: 24 }}>
      <strong>Faza 6 – Dokumentacija</strong>
    </div>

    <div style={{ marginTop: 20 }}>
      <div
        style={{
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          backgroundColor: '#f0fdf4',

        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              Terminski plan obuke
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                color: '#166534',
              }}
            >
              SPREMNO
            </div>
          </div>

          <button
            type="button"
            style={submitButton}
            onClick={handleOpenTrainingTermPlanPdf}
          >
            Otvori PDF
          </button>
        </div>
      </div>

      <div
        style={{
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          backgroundColor: '#f0fdf4',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              Praktična provera BZR i korišćenja LZO
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                color: '#166534',
              }}
            >
              SPREMNO
            </div>
          </div>

          <button
            type="button"
            style={submitButton}
            onClick={handleOpenPracticalAssessmentPdf}
          >
            Otvori PDF
          </button>
        </div>
      </div>

      <div
        style={{
          border: '1px solid #bbf7d0',
          borderRadius: 10,

          padding: 16,
          marginBottom: 12,
          backgroundColor: '#f0fdf4',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              Evidencija i zapisnik o sprovedenoj obuci i proveri obučenosti
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                color: '#166534',
              }}
            >
              SPREMNO
            </div>
          </div>

          <button
            type="button"
            style={submitButton}
            onClick={handleOpenTrainingRecordPdf}
          >
            Otvori PDF
          </button>
        </div>
      </div>

{/* IZBOR RADNOG MESTA ZA TESTOVE */}
<div style={{ marginBottom: 16 }}>
  <label style={labelStyle}>
    Radno mesto za koje se biraju testovi
  </label>

  <select
    style={inputStyle}
    value={selectedArchiveJobPositionId}
    onChange={(event) => {
      setSelectedArchiveJobPositionId(
        event.target.value
      )
      setSelectedArchiveTestIds([])
    }}
  >
    <option value="">
      — Izaberite radno mesto —
    </option>

    {savedSessionJobPositions.map((row: any) => (
      <option key={row.id} value={row.id}>
        {jobPositions.find(
          (job) =>
            job.id === row.job_position_id
        )?.name ?? 'Radno mesto'}
      </option>
    ))}
  </select>
</div>

{/* TESTOVI - FAZA 6 */}
<div
  style={{
    border: '1px solid #c4b5fd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#faf5ff',
  }}
>
  <div
    style={{
      fontWeight: 800,
      fontSize: 16,
      marginBottom: 12,
    }}
  >
    Testovi – izbor iz baze INPRO BZR MASTER
  </div>

  <div style={{ marginBottom: 12 }}>
    Izaberite jedan ili više postojećih testova.
  </div>

  {availableTests
    .filter((test: any) => test.questionCount > 0)
    .map((test: any) => (
      <label
        key={test.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          marginBottom: 6,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={selectedArchiveTestIds.includes(test.id)}
          onChange={() => {
            setSelectedArchiveTestIds((current) =>
              current.includes(test.id)
                ? current.filter((id) => id !== test.id)
                : [...current, test.id]
            )
          }}
        />

        <span>
          {test.name} – {test.questionCount} pitanja
        </span>
      </label>
    ))}

  <div
    style={{
      marginTop: 16,
      fontWeight: 700,
    }}
  >
    Izabrano testova: {selectedArchiveTestIds.length}
  </div>
</div>

<div style={{ marginTop: 16 }}>
  <button
    type="button"
    style={submitButton}
    disabled={
      savingArchiveTests ||
      !selectedArchiveJobPositionId ||
      selectedArchiveTestIds.length === 0
    }
    onClick={handleSaveArchiveTests}
  >
    {savingArchiveTests
      ? 'Čuvanje...'
      : 'SAČUVAJ IZABRANE TESTOVE'}
  </button>
</div>

{/* ARHIVA TESTOVA - FAZA 6 */}
<div style={{ marginTop: 20 }}>
  <div
    style={{
      fontWeight: 800,
      fontSize: 16,
      marginBottom: 12,
    }}
  >
    Sačuvani testovi u ovoj obuci
  </div>

  {archivedTests
    .filter(
      (test: any) =>
        test.job_position_id ===
        selectedArchiveJobPositionId
    )
    .map((test: any) => (
      <div
        key={test.id}
        style={{
          padding: 12,
          marginBottom: 10,
          border: '1px solid #ddd6fe',
          borderRadius: 8,
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {test.test_name}
        </div>

        <div
          style={{
            marginTop: 5,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {test.pdf_storage_path
            ? 'PDF ARHIVIRAN'
            : 'PDF NIJE ARHIVIRAN'}
        </div>

        {!test.pdf_storage_path && (
          <button
            type="button"
            disabled={archivingPdf}
            onClick={() => handleArchivePdf(test.id)}
          >
            {archivingPdf
              ? 'Arhiviranje...'
              : 'ARHIVIRAJ PDF'}
          </button>
        )}

        {test.pdf_storage_path && (
          <button
            type="button"
            onClick={() => {
              window.open(
                `/api/training-test-archive-pdf?recordId=${test.id}`,
                '_blank'
              )
            }}
          >
            OTVORI / ŠTAMPAJ PDF
          </button>
        )}
      </div>
    ))}
</div>

      {[
        'Uputstva i procedure BZR',
        'Izjava o upoznavanju sa uputstvima i procedurama',
        'Obrazac 6',
      ].map((documentName) => (
        <div
          key={documentName}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 10,

            padding: 16,
            marginBottom: 12,
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {documentName}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: 700,
              color: '#6b7280',
            }}
          >
            NIJE GENERISANO
          </div>
        </div>
      ))}
    </div>

    {error && <div style={errorBox}>{error}</div>}
    {success && <div style={successBox}>{success}</div>}

    <div
      style={{
        ...actions,
        justifyContent: 'space-between',
      }}
    >
      <button
        type="button"
        style={backButton}
        onClick={() => setCurrentPhase(5)}
        disabled={isSubmitting}
      >
        ← Nazad
      </button>

      <button
        type="button"
        style={{
          ...submitButton,
          cursor: 'not-allowed',
          opacity: 0.5,
        }}
        disabled
      >
        Završi obuku
      </button>
    </div>
  </div>
)}

  </>
)
}
const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 20,
}

const fullWidthField: React.CSSProperties = {
  gridColumn: '1 / -1',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 700,
  color: '#111827',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  backgroundColor: '#ffffff',
  color: '#111827',
  fontWeight: 500,
}

const actions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 24,
}

const submitButton: React.CSSProperties = {
  minWidth: 140,
  minHeight: 44,
  padding: '10px 20px',
  border: 0,
  borderRadius: 8,
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}
const backButton: React.CSSProperties = {
  minWidth: 120,
  minHeight: 44,
  padding: '10px 20px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontWeight: 700,
  cursor: 'pointer',
  backgroundColor: '#ffffff',
}

const errorBox: React.CSSProperties = {
  marginTop: 20,
  padding: 12,
  border: '1px solid #ef4444',
  borderRadius: 8,
}

const successBox: React.CSSProperties = {
  marginTop: 20,
  padding: 12,
  border: '1px solid #22c55e',
  borderRadius: 8,
  color: '#166534',
fontWeight: 600,
}