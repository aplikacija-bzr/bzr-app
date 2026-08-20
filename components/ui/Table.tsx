import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from './theme'

type TableProps = {
  children: ReactNode
}

export default function Table({
  children,
}: TableProps) {
  return (
    <div style={wrapperStyle}>
      <table style={tableStyle}>
        {children}
      </table>
    </div>
  )
}

const wrapperStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: theme.radius.md,
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: theme.fontSize.sm,
  tableLayout: 'auto',
}