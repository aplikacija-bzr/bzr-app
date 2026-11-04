import Panel from '@/components/ui/Panel'
import type { CSSProperties } from 'react'

type PlatformSuggestion = {
  id: string
  title: string
  description: string
  actionLabel: string
}

const suggestions: PlatformSuggestion[] = [
  {
    id: 'training-group',
    title: 'Objedini periodične obuke',
    description:
      'Kod poslodavca INKOM DOO više zaposlenih ulazi u isti period za periodičnu obuku.',
    actionLabel: 'Pregledaj',
  },
  {
    id: 'installation-tests',
    title: 'Zajednički organizuj ispitivanja',
    description:
      'Električne i gromobranske instalacije kod RMF-a ističu u sličnom periodu.',
    actionLabel: 'Pregledaj',
  },
  {
    id: 'medical-appointments',
    title: 'Predloži zajednički termin pregleda',
    description:
      'Tri zaposlena kod Nacionalnog parka Tara imaju pregled u narednih 30 dana.',
    actionLabel: 'Pregledaj',
  },
]

export default function PlatformSuggestions() {
  return (
    <Panel
  title="Predlozi platforme"
  subtitle="Predlozi za efikasniju organizaciju rada"
>
  <div style={list}>
        {suggestions.map((suggestion) => (
          <article key={suggestion.id} style={row}>
            <div style={icon}>💡</div>

            <div style={content}>
              <div style={suggestionTitle}>{suggestion.title}</div>

              <div style={description}>{suggestion.description}</div>

              <button type="button" style={actionButton}>
                {suggestion.actionLabel}
              </button>
            </div>
          </article>
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
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: 12,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#ffffff',
}

const icon: CSSProperties = {
  flexShrink: 0,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  background: '#fef3c7',
  fontSize: 15,
}

const content: CSSProperties = {
  minWidth: 0,
}

const suggestionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#111827',
}

const description: CSSProperties = {
  marginTop: 5,
  fontSize: 13,
  lineHeight: 1.45,
  color: '#6b7280',
}

const actionButton: CSSProperties = {
  marginTop: 9,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}