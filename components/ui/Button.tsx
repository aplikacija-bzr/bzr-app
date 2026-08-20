import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from './theme'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode
    variant?: ButtonVariant
    fullWidth?: boolean
  }

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...(fullWidth ? fullWidthStyle : {}),
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,

  minHeight: 48,

  padding: `0 ${theme.spacing.lg}px`,

  borderRadius: theme.radius.md,

  border: 'none',

  cursor: 'pointer',

  fontSize: theme.fontSize.sm,

  fontWeight: 700,

  lineHeight: 1,

  whiteSpace: 'nowrap',

  transition:
    'background-color .2s ease, opacity .2s ease',
}

const fullWidthStyle: CSSProperties = {
  width: '100%',
}

const variants: Record<
  ButtonVariant,
  CSSProperties
> = {
  primary: {
    background: '#2563eb',
    color: '#ffffff',
  },

  secondary: {
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
  },

  danger: {
    background: '#dc2626',
    color: '#ffffff',
  },
}