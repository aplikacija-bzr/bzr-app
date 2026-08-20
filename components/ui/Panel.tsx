import type { CSSProperties, ReactNode } from 'react'

type PanelProps = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Panel({
  title,
  subtitle,
  actions,
  children,
}: PanelProps) {
  return (
    <section style={panel}>
      {(title || subtitle || actions) && (
        <header style={header}>
          <div>
            {title && <h2 style={titleStyle}>{title}</h2>}

            {subtitle && (
              <p style={subtitleStyle}>{subtitle}</p>
            )}
          </div>

          {actions && (
            <div style={actionsContainer}>
              {actions}
            </div>
          )}
        </header>
      )}

      {children}
    </section>
  )
}

const panel: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#111827',
}

const subtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  color: '#6b7280',
}

const actionsContainer: CSSProperties = {
  flexShrink: 0,
}