import type { ReactNode } from 'react'

type ProcessContentProps = {
  children: ReactNode
}

export default function ProcessContent({
  children,
}: ProcessContentProps) {
  return (
    <section
      style={{
        minWidth: 0,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {children}
    </section>
  )
}