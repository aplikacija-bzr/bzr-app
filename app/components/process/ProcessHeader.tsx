import type { ReactNode } from 'react'

type ProcessHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

export default function ProcessHeader({
  title,
  description,
  action,
}: ProcessHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 20,
        alignItems: 'flex-start',
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {title}
        </h1>

        {description ? (
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: '#6b7280',
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <div>
          {action}
        </div>
      ) : null}
    </header>
  )
}