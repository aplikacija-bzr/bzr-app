
import type { CSSProperties } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

type SystemMessage = {
  id: string
  title: string
  description: string
  timeLabel: string
  type: 'info' | 'success' | 'warning'
}

const messages: SystemMessage[] = [
  {
    id: 'database-sync',
    title: 'Sinhronizacija podataka završena',
    description: 'Podaci o poslodavcima i zaposlenima uspešno su osveženi.',
    timeLabel: 'Danas u 08:15',
    type: 'success',
  },
  {
    id: 'document-generation',
    title: 'Dokumentacija je spremna',
    description: 'Za obuku OB-2026-014 uspešno je pripremljena dokumentacija.',
    timeLabel: 'Danas u 09:40',
    type: 'info',
  },
  {
    id: 'incomplete-import',
    title: 'Uvoz zahteva proveru',
    description: 'Tri zapisa nisu uvezena zbog nedostajućih obaveznih podataka.',
    timeLabel: 'Juče u 16:20',
    type: 'warning',
  },
]

export default function SystemMessages() {
  return (
  <Card
  title="Sistemske poruke"
  subtitle="Obaveštenja o radu platforme"
  headerAction={
    <Button type="button" variant="secondary">
      Prikaži sve
    </Button>
  }
  footer={
    <span style={{ fontSize: 13, color: '#6b7280' }}>
      Poslednje ažuriranje: danas
    </span>
  }
>

    <section style={panel}>


      <div style={list}>
        {messages.map((message) => {
          const appearance = getMessageAppearance(message.type)

          return (
            <article key={message.id} style={row}>
              <div
                style={{
                  ...icon,
                  background: appearance.background,
                  color: appearance.color,
                }}
                aria-hidden="true"
              >
                {appearance.symbol}
              </div>

              <div style={content}>
                <div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  }}
>
  <div style={messageTitle}>{message.title}</div>

  <Badge variant={message.type}>
    {message.type === 'success'
      ? 'Uspeh'
      : message.type === 'warning'
      ? 'Upozorenje'
      : 'Informacija'}
  </Badge>
</div>

                <div style={description}>{message.description}</div>

                <div style={timeLabel}>{message.timeLabel}</div>
              </div>
            </article>
          )
        })}
      </div>
        </section>
  </Card>
  )
}
function getMessageAppearance(type: SystemMessage['type']) {
  if (type === 'success') {
    return {
      symbol: '✓',
      background: '#dcfce7',
      color: '#166534',
    }
  }

  if (type === 'warning') {
    return {
      symbol: '!',
      background: '#fef3c7',
      color: '#92400e',
    }
  }

  return {
    symbol: 'i',
    background: '#dbeafe',
    color: '#1d4ed8',
  }
}

const panel: CSSProperties = {
  padding: 20,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
}

const panelHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 16,
}

const title: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#111827',
}

const subtitle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  color: '#6b7280',
}

const showAllButton: CSSProperties = {
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
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
  fontSize: 14,
  fontWeight: 800,
}

const content: CSSProperties = {
  minWidth: 0,
}

const messageTitle: CSSProperties = {
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

const timeLabel: CSSProperties = {
  marginTop: 7,
  fontSize: 12,
  color: '#9ca3af',
}