import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from './theme'

type TableHeaderCellProps = {
  children: ReactNode
}

export default function TableHeaderCell({
  children,
}: TableHeaderCellProps) {
  return (
    <th style={headerStyle}>
      {children}
    </th>
  )
}

const headerStyle: CSSProperties = {
  textAlign: 'left',
  padding: `${theme.spacing.md}px ${theme.spacing.md}px`,
  borderBottom: '2px solid #e5e7eb',
  fontSize: theme.fontSize.sm,
  fontWeight: 700,
  color: '#334155',
  whiteSpace: 'nowrap',
  background: '#f8fafc',
}