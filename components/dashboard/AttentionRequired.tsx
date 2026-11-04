import Panel from '@/components/ui/Panel'
import type { CSSProperties } from 'react'

type AttentionItem = {
  id: string
  title: string
  description: string
  level: 'critical' | 'warning'
}

const items: AttentionItem[] = [
  {
    id: '1',
    title: 'Nedostaje instruktor praktične obuke',
    description: 'INKOM DOO • Obuka OB-2026-014',
    level: 'critical',
  },
  {
    id: '2',
    title: 'Nije uneta ocena lekarskog pregleda',
    description: 'RMF • 2 zaposlena',
    level: 'warning',
  },
  {
    id: '3',
    title: 'Nedostaje zapisnik o proveri obučenosti',
    description: 'Nacionalni park Tara',
    level: 'critical',
  },
]

export default function AttentionRequired() {
  return (
    <Panel
  title="Zahteva pažnju"
>
  <div style={list}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              ...row,
              borderLeftColor:
                item.level === 'critical'
                  ? '#dc2626'
                  : '#f59e0b',
            }}
          >
            <div style={rowTitle}>
              {item.level === 'critical'
                ? '🔴 '
                : '🟠 '}
              {item.title}
            </div>

            <div style={description}>
              {item.description}
            </div>
          </div>
        ))}
       </div>
</Panel>
  )
}



const list: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const row: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderLeftWidth: 5,
  borderRadius: 8,
  padding: 12,
}

const rowTitle: CSSProperties = {
  fontWeight: 700,
  color: '#111827',
}

const description: CSSProperties = {
  marginTop: 5,
  fontSize: 13,
  color: '#6b7280',
}