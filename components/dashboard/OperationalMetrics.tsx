import Panel from '@/components/ui/Panel'
import type { CSSProperties } from 'react'

type Metric = {
  id: string
  label: string
  value: number
}

const metrics: Metric[] = [
  {
    id: 'employers',
    label: 'Aktivni poslodavci',
    value: 80,
  },
  {
    id: 'employees',
    label: 'Aktivni zaposleni',
    value: 412,
  },
  {
    id: 'tasks',
    label: 'Otvoreni zadaci',
    value: 27,
  },
  {
    id: 'today',
    label: 'Današnje aktivnosti',
    value: 8,
  },
]

export default function OperationalMetrics() {
  return (
    <Panel
  title="Operativni pokazatelji"
>
  <div style={grid}>
        {metrics.map((metric) => (
          <div key={metric.id} style={card}>
            <div style={value}>{metric.value}</div>
            <div style={label}>{metric.label}</div>
          </div>
        ))}
       </div>
</Panel>
  )
}



const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const card: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 14,
  textAlign: 'center',
}

const value: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#2563eb',
}

const label: CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: '#6b7280',
}