import type { ReactNode } from 'react'

type ProcessLayoutProps = {
  children: ReactNode
}

export default function ProcessLayout({
  children,
}: ProcessLayoutProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          '300px minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  )
}