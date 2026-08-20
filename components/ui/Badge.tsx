import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from '@/components/ui/theme'

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
}

export default function Badge({
  children,
  variant = 'neutral',
}: BadgeProps) {
  return (
    <span
      style={{
        ...baseStyle,
        ...variants[variant],
      }}
    >
      {children}
    </span>
  )
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 16px',
  borderRadius: 999,
  fontSize: theme.fontSize.sm,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const variants: Record<BadgeVariant, CSSProperties> = {
  success: {
    background: '#dcfce7',
    color: '#166534',
  },

  warning: {
    background: '#fef3c7',
    color: '#92400e',
  },

  danger: {
    background: '#fee2e2',
    color: '#991b1b',
  },

  info: {
    background: '#dbeafe',
    color: '#1d4ed8',
  },

  neutral: {
    background: '#f3f4f6',
    color: '#374151',
  },
}