import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from '@/components/ui/theme'

type CardProps = {
  children: ReactNode
  title?: string
  subtitle?: string
  headerAction?: ReactNode
  footer?: ReactNode
}

export default function Card({
  children,
  title,
 subtitle,
  headerAction,
  footer,
}: CardProps) {
  return (
    <section style={card}>
      {(title || subtitle || headerAction) && (
        <header style={header}>
          <div style={headerText}>
            {title && (
              <h3 style={titleStyle}>
                {title}
              </h3>
            )}

            {subtitle && (
              <p style={subtitleStyle}>
                {subtitle}
              </p>
            )}
          </div>

          {headerAction && (
            <div style={headerActionStyle}>
              {headerAction}
            </div>
          )}
        </header>
      )}

      <div style={body}>
        {children}
      </div>

      {footer && (
        <footer style={footerStyle}>
          {footer}
        </footer>
      )}
    </section>
  )
}

const card: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: theme.radius.md,
  padding: theme.layout.cardPadding,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
}

const header: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing.md,
}

const headerText: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
}

const headerActionStyle: CSSProperties = {
  flexShrink: 0,
}

const body: CSSProperties = {
  minWidth: 0,
  fontSize: theme.fontSize.sm,
}

const footerStyle: CSSProperties = {
  paddingTop: theme.spacing.md,
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing.sm,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: theme.fontSize.lg,
  fontWeight: 700,
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: theme.fontSize.sm,
  color: '#6b7280',
}