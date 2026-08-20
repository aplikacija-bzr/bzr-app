import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from '@/components/ui/theme'

type InfoRowProps = {
  label: string
  value: ReactNode
  bordered?: boolean
  labelWidth?: number
}

export default function InfoRow({
  label,
  value,
  labelWidth = 180,
}: InfoRowProps) {
  const rowStyle: CSSProperties = {
    ...row,
    gridTemplateColumns:
      `${labelWidth}px minmax(0, 1fr)`,
  }

  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {label}
      </div>

      <div style={valueStyle}>
        {value ?? '-'}
      </div>
    </div>
  )
}

const row: CSSProperties = {
  display: 'grid',
  gap: theme.spacing.md,
  alignItems: 'center',
  padding: '10px 0',
}

const labelStyle: CSSProperties = {
  fontSize: theme.fontSize.sm,
  fontWeight: 700,
  color: '#475569',
}

const valueStyle: CSSProperties = {
  fontSize: theme.fontSize.sm,
  color: '#0f172a',
  minWidth: 0,
  overflowWrap: 'anywhere',
}