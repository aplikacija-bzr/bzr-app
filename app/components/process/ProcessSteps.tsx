import type { ReactNode } from 'react'

type ProcessStepsProps = {
  title: string
  children: ReactNode
}

export default function ProcessSteps({
  title,
  children,
}: ProcessStepsProps) {
  return (
    <aside
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 18,
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {children}
      </div>
    </aside>
  )
}