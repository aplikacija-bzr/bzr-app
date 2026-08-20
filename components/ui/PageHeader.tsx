import Link from 'next/link'
import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from './theme'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  status?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Nazad',
  status,
  actions,
}: PageHeaderProps) {
  return (
    <header style={container}>
      {backHref && (
        <Link
          href={backHref}
          style={backLink}
        >
          ← {backLabel}
        </Link>
      )}

      <div style={mainRow}>
        <div style={titleGroup}>
          <div style={titleRow}>
            <h1 style={titleStyle}>
              {title}
            </h1>

            {status}
          </div>

          {subtitle && (
            <p style={subtitleStyle}>
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={actionsStyle}>
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

const container: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
  marginBottom: theme.spacing.xl,
}

const backLink: CSSProperties = {
  alignSelf: 'flex-start',
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: theme.fontSize.sm,
  fontWeight: 700,
  lineHeight: 1.4,
}

const mainRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing.lg,
}

const titleGroup: CSSProperties = {
  minWidth: 0,
  flex: '1 1 500px',
}

const titleRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing.md,
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: theme.fontSize.xl,
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
}

const subtitleStyle: CSSProperties = {
  margin: `${theme.spacing.sm}px 0 0`,
  color: '#64748b',
  fontSize: theme.fontSize.sm,
  fontWeight: 500,
  lineHeight: 1.5,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  flexShrink: 0,
}