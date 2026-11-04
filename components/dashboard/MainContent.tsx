import type { CSSProperties } from 'react'

import OperationalPriorities from '@/components/dashboard/OperationalPriorities'
import WorkInbox from '@/components/dashboard/WorkInbox'

export default function MainContent() {
  return (
    <main style={mainContent}>
      <div style={topRow}>
        <OperationalPriorities />
        <WorkInbox />
      </div>
    </main>
  )
}

const mainContent: CSSProperties = {
  minWidth: 0,
}

const topRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '380px minmax(0, 760px)',
  gap: 16,
  alignItems: 'start',
  justifyContent: 'start',
}