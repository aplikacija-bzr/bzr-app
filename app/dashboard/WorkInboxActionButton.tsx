'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type WorkInboxActionButtonProps = {
  sourceType:
    | 'training'
    | 'medical'
    | 'work_equipment'
    | 'daily_bzr_control'

  sourceId: string

  targetUrl: string

  status:
    | 'not_started'
    | 'in_progress'
    | 'waiting'
}

function getActionLabel(
  
  sourceType: WorkInboxActionButtonProps['sourceType'],
  status: WorkInboxActionButtonProps['status'],
) {
 if (sourceType === 'daily_bzr_control') {
  return status === 'in_progress'
    ? 'Završi reakciju'
    : 'Pokreni reakciju'
}
  if (
    sourceType === 'medical' &&
    status === 'waiting'
  ) {
    return 'Unesi rezultate pregleda'
  }

  if (sourceType === 'medical') {
    return 'Unos novog pregleda'
  }

  if (sourceType === 'work_equipment') {
    return 'Unos stručnog nalaza'
  }

  switch (status) {
    case 'not_started':
      return 'Pokreni postupak'

    case 'in_progress':
      return 'Nastavi postupak'

    case 'waiting':
      return 'Pregledaj'
  }
}

export default function WorkInboxActionButton({
  sourceType,
  sourceId,
  targetUrl,
  status,
}: WorkInboxActionButtonProps) {
  const [isLoading, setIsLoading] =
    useState(false)

  const router = useRouter()

  const isTrainingRecord =
    sourceType === 'training' &&
    targetUrl.startsWith(
      '/dashboard/obuke/evidencija',
    )

 function handleRecordTrainingStart() {
  router.push(
    `/dashboard/obuke/nova?recordId=${encodeURIComponent(sourceId)}`
  )
}

  function handleRecordTrainingEvidence() {
    router.push(targetUrl)
  }

  async function handleClick() {
 if (sourceType === 'daily_bzr_control') {
  try {
    setIsLoading(true)

    const response = await fetch(
      '/api/daily-bzr-controls',
      {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
  controlId: sourceId,
  reactionStatus:
    status === 'in_progress'
      ? 'COMPLETED'
      : 'IN_PROGRESS',
}),
      },
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Promena statusa nije uspela.',
      )
    }

    router.refresh()
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Nepoznata greška.'

    window.alert(message)
  } finally {
    setIsLoading(false)
  }

  return
}
    if (sourceType === 'medical') {
      router.push(targetUrl)
      return
    }

    if (
      sourceType === 'work_equipment'
    ) {
      router.push(targetUrl)
      return
    }

    if (isTrainingRecord) {
      handleRecordTrainingStart()
      return
    }

    if (
      sourceType !== 'training' ||
      status !== 'not_started'
    ) {
      if (targetUrl) {
        router.push(targetUrl)
      }

      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(
        '/api/training-session-status',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            trainingSessionId:
              sourceId,
          }),
        },
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Promena statusa nije uspela.',
        )
      }

      if (targetUrl) {
        router.push(targetUrl)
      } else {
        router.refresh()
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nepoznata greška.'

      window.alert(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isTrainingRecord) {
    return (
      <div style={actionsStyle}>
        <button
          type="button"
          style={buttonStyle}
          onClick={handleRecordTrainingStart}
        >
          Pokreni postupak
        </button>

        <button
          type="button"
          style={evidenceButtonStyle}
          onClick={handleRecordTrainingEvidence}
        >
          Evidentiraj izvršenu obuku
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      style={buttonStyle}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading
        ? 'Pokretanje...'
        : getActionLabel(
            sourceType,
            status,
          )}
    </button>
  )
}

const actionsStyle:
  React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const buttonStyle:
  React.CSSProperties = {
  padding: '7px 11px',
  border: 'none',
  borderRadius: 6,
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const evidenceButtonStyle:
  React.CSSProperties = {
  padding: '7px 11px',
  border: '1px solid #16a34a',
  borderRadius: 6,
  background: '#ffffff',
  color: '#15803d',
  fontWeight: 700,
  cursor: 'pointer',
}