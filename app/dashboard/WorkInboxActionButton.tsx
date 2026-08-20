'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type WorkInboxActionButtonProps = {
  sourceType:
    | 'training'
    | 'medical'
    | 'work_equipment'

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

  async function handleClick() {
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