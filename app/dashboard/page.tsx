import WorkInboxActionButton from './WorkInboxActionButton'
import Link from 'next/link'
import { getWorkInboxItems } from '@/lib/work-inbox'

type InboxPriority =
  | 'critical'
  | 'high'

type InboxStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting'

type WorkInboxItem = {
  id: string
  sourceType:
    | 'training'
    | 'medical'
    | 'work_equipment'
  sourceId: string
  targetUrl: string
  employerName: string
  category: string
  title: string
  subject: string
  deadline: string
  reason: string
  priority: InboxPriority
  status: InboxStatus
}

const priorities = [
  {
    id: 'training',
    title: 'Obuka BZR',
    countLabel: '7 zaposlenih',
  },
  {
    id: 'medical',
    title: 'Lekarski pregledi',
    countLabel: '3 zaposlena',
  },
  {
    id: 'equipment',
    title: 'Oprema za rad',
    countLabel: '1 stručni nalaz',
  },
]

function getStatusLabel(
  status: InboxStatus
) {
  switch (status) {
    case 'not_started':
      return 'Nije pokrenuto'

    case 'in_progress':
      return 'U toku'

    case 'waiting':
      return 'Čeka poslodavca'
  }
}

export default async function DashboardPage() {
  const workInboxItems =
    await getWorkInboxItems()

  const databaseInboxItems:
    WorkInboxItem[] =
    workInboxItems.map(
      (item) => ({
        id: item.id,
        sourceType:
          item.sourceType,
        sourceId:
          item.sourceId,
        targetUrl:
          item.targetUrl,
        employerName:
          item.employerName,
        category:
          item.category,
        title:
          item.title,
        subject:
          item.subject,
        deadline:
          item.deadlineLabel,
        reason:
          item.reasonLabel,
        priority:
          item.priority,
        status:
          item.status,
      })
    )

  return (
    <div style={page}>
      <header style={header}>
        <div style={logo}>
          INPRO BZR
        </div>

        <div style={searchWrapper}>
          <input
            type="text"
            placeholder="Pretraži poslodavce, zaposlene, aktivnosti..."
            style={searchInput}
          />
        </div>

        <div style={headerActions}>
          <button
            type="button"
            style={newButton}
          >
            + Novo
          </button>

          <button
            type="button"
            style={iconButton}
            aria-label="Obaveštenja"
          >
            🔔
          </button>

          <button
            type="button"
            style={profileButton}
          >
            👤 Slobodan
          </button>
        </div>
      </header>

      <div style={workspace}>
        <aside style={sidebar}>
          <nav style={navigation}>
            <a
              href="/dashboard"
              style={activeNavigationItem}
            >
              🏠 Komandni centar
            </a>

            <a
              href="/employers"
              style={navigationItem}
            >
              🏢 Poslodavci
            </a>

            <a
              href="/dashboard/poslodavci"
              style={navigationItem}
            >
              📋 Dnevne kontrole
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              📋 Postupci
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              ✅ Aktivnosti
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              👷 Zaposleni
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              📄 Dokumentacija
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              📊 Izveštaji
            </a>

            <a
              href="/dashboard"
              style={navigationItem}
            >
              ⚙ Podešavanja
            </a>
          </nav>

          <div style={sidebarFooter}>
            <div>INPRO BZR</div>
            <div>v1.0.0</div>
          </div>
        </aside>

        <main style={main}>
          <div style={dashboardGrid}>
            <section
              style={prioritiesPanel}
            >
              <div style={sectionHeader}>
                <h2 style={sectionTitle}>
                  Operativni prioriteti
                </h2>

                <p style={sectionSubtitle}>
                  Gde danas treba da radiš
                </p>
              </div>

              <div style={priorityList}>
                {priorities.map(
                  (priority) => (
                    <article
                      key={priority.id}
                      style={priorityCard}
                    >
                      <div
                        style={priorityHeader}
                      >
                        <h3
                          style={priorityTitle}
                        >
                          {priority.title}
                        </h3>

                        {priority.id ===
                        'medical' ? (
                          <div
                            style={
                              priorityActions
                            }
                          >
                            <Link
                              href="/dashboard/lekarski-pregledi"
                              style={
                                smallPrimaryButton
                              }
                            >
                              Otvori
                            </Link>

                            <Link
                              href="/dashboard/lekarski-pregledi/obrazac-1"
                              style={
                                form1Button
                              }
                            >
                              Obrazac 1
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            style={
                              smallPrimaryButton
                            }
                          >
                            Otvori
                          </button>
                        )}
                      </div>

                      <div
                        style={
                          priorityCount
                        }
                      >
                        {
                          priority.countLabel
                        }
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>

            <section
              style={inboxPanel}
            >
              <div
                style={inboxHeader}
              >
                <div>
                  <h2
                    style={sectionTitle}
                  >
                    Radni Inbox
                  </h2>

                  <p
                    style={
                      sectionSubtitle
                    }
                  >
                    Moji otvoreni zadaci
                  </p>
                </div>

                <button
                  type="button"
                  style={showAllButton}
                >
                  Prikaži sve (
                  {
                    databaseInboxItems.length
                  }
                  )
                </button>
              </div>

              <div style={inboxList}>
                {databaseInboxItems.map(
                  (item) => {
                    const isCritical =
                      item.priority ===
                      'critical'

                    return (
                      <article
                        key={item.id}
                        style={{
                          ...inboxCard,

                          borderLeftColor:
                            isCritical
                              ? '#dc2626'
                              : '#f97316',
                        }}
                      >
                        <div
                          style={
                            inboxTopRow
                          }
                        >
                          <div>
                            <div
                              style={
                                employerName
                              }
                            >
                              {
                                item.employerName
                              }
                            </div>

                            <div
                              style={
                                categoryLabel
                              }
                            >
                              {
                                item.category
                              }
                            </div>
                          </div>

                          <div
                            style={badges}
                          >
                            <span
                              style={{
                                ...priorityBadge,

                                background:
                                  isCritical
                                    ? '#fee2e2'
                                    : '#ffedd5',

                                color:
                                  isCritical
                                    ? '#991b1b'
                                    : '#9a3412',
                              }}
                            >
                              {isCritical
                                ? '🔴 Kritičan'
                                : '🟠 Visok'}
                            </span>

                            <span
                              style={
                                statusBadge
                              }
                            >
                              {
                                getStatusLabel(
                                  item.status
                                )
                              }
                            </span>
                          </div>
                        </div>

                        <div
                          style={taskTitle}
                        >
                          {item.title}
                        </div>

                        <div
                          style={
                            subjectLabel
                          }
                        >
                          {item.subject}
                        </div>

                        <div
                          style={{
                            ...deadlineLabel,

                            color:
                              isCritical
                                ? '#b91c1c'
                                : '#c2410c',
                          }}
                        >
                          {item.deadline}
                        </div>

                        <div
                          style={{
                            ...reasonBox,

                            background:
                              isCritical
                                ? '#fef2f2'
                                : '#fff7ed',

                            color:
                              isCritical
                                ? '#991b1b'
                                : '#9a3412',
                          }}
                        >
                          <strong>
                            Razlog:
                          </strong>{' '}
                          {item.reason}
                        </div>

                        <div
                          style={
                            cardActions
                          }
                        >
                          <WorkInboxActionButton
                            sourceType={
                              item.sourceType
                            }
                            sourceId={
                              item.sourceId
                            }
                            targetUrl={
                              item.targetUrl
                            }
                            status={
                              item.status
                            }
                          />

                          {item.sourceType ===
                            'medical' &&
                            item.status ===
                              'not_started' && (
                              <Link
                                href={`/dashboard/lekarski-pregledi/evidentiraj?recordId=${encodeURIComponent(
                                  item.sourceId
                                )}`}
                                style={
                                  completedMedicalButton
                                }
                              >
                                Evidentiraj
                                obavljen pregled
                              </Link>
                            )}

                          <button
                            type="button"
                            style={moreButton}
                            aria-label={`Dodatne akcije za ${item.title}`}
                          >
                            ⋮
                          </button>
                        </div>
                      </article>
                    )
                  }
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

const page:
  React.CSSProperties = {
  minHeight: '100vh',
  background: '#f1f5f9',
  color: '#111827',
}

const header:
  React.CSSProperties = {
  height: 64,
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  background: '#ffffff',
  borderBottom:
    '1px solid #e5e7eb',
  boxSizing: 'border-box',
}

const logo:
  React.CSSProperties = {
  width: 180,
  flexShrink: 0,
  fontSize: 20,
  fontWeight: 700,
}

const searchWrapper:
  React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '0 16px',
}

const searchInput:
  React.CSSProperties = {
  width: '100%',
  height: 38,
  boxSizing: 'border-box',
  padding: '0 13px',
  border:
    '1px solid #d1d5db',
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
}

const headerActions:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}

const newButton:
  React.CSSProperties = {
  height: 38,
  padding: '0 16px',
  border: 'none',
  borderRadius: 7,
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const iconButton:
  React.CSSProperties = {
  width: 38,
  height: 38,
  border:
    '1px solid #d1d5db',
  borderRadius: 7,
  background: '#ffffff',
  cursor: 'pointer',
}

const profileButton:
  React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  border:
    '1px solid #d1d5db',
  borderRadius: 7,
  background: '#ffffff',
  cursor: 'pointer',
}

const workspace:
  React.CSSProperties = {
  display: 'flex',
  minHeight:
    'calc(100vh - 64px)',
}

const sidebar:
  React.CSSProperties = {
  width: 180,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent:
    'space-between',
  background: '#ffffff',
  borderRight:
    '1px solid #e5e7eb',
}

const navigation:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 10px',
  gap: 5,
}

const navigationItem:
  React.CSSProperties = {
  padding: '11px 10px',
  borderRadius: 7,
  color: '#111827',
  textDecoration: 'none',
  fontSize: 14,
}

const activeNavigationItem:
  React.CSSProperties = {
  ...navigationItem,
  background: '#eff6ff',
  color: '#1d4ed8',
  fontWeight: 700,
}

const sidebarFooter:
  React.CSSProperties = {
  padding: 16,
  borderTop:
    '1px solid #e5e7eb',
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
}

const main:
  React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 16,
}

const dashboardGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '285px minmax(0, 900px)',
  gap: 12,
  alignItems: 'start',
  justifyContent: 'start',
}

const prioritiesPanel:
  React.CSSProperties = {
  padding: 16,
  background: '#ffffff',
  border:
    '1px solid #e5e7eb',
  borderRadius: 9,
}

const inboxPanel:
  React.CSSProperties = {
  minWidth: 0,
  padding: 16,
  background: '#ffffff',
  border:
    '1px solid #e5e7eb',
  borderRadius: 9,
}

const sectionHeader:
  React.CSSProperties = {
  marginBottom: 14,
}

const sectionTitle:
  React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 700,
}

const sectionSubtitle:
  React.CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: 13,
}

const priorityList:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const priorityCard:
  React.CSSProperties = {
  padding: '11px 12px',
  border:
    '1px solid #e5e7eb',
  borderLeft:
    '4px solid #dc2626',
  borderRadius: 7,
  background: '#ffffff',
}

const priorityHeader:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent:
    'space-between',
  gap: 8,
}

const priorityActions:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const priorityTitle:
  React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
}

const priorityCount:
  React.CSSProperties = {
  marginTop: 8,
  color: '#4b5563',
  fontSize: 12,
}

const smallPrimaryButton:
  React.CSSProperties = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: 6,
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}

const form1Button:
  React.CSSProperties = {
  padding: '6px 10px',
  border:
    '1px solid #2563eb',
  borderRadius: 6,
  background: '#ffffff',
  color: '#2563eb',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}

const inboxHeader:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent:
    'space-between',
  gap: 16,
  marginBottom: 14,
}

const showAllButton:
  React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: 700,
  cursor: 'pointer',
}

const inboxList:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
}

const inboxCard:
  React.CSSProperties = {
  padding: 13,
  border:
    '1px solid #e5e7eb',
  borderLeftWidth: 4,
  borderRadius: 7,
  background: '#ffffff',
}

const inboxTopRow:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent:
    'space-between',
  gap: 14,
}

const employerName:
  React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#374151',
}

const categoryLabel:
  React.CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.07em',
  color: '#64748b',
}

const badges:
  React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 5,
}

const priorityBadge:
  React.CSSProperties = {
  padding: '3px 7px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const statusBadge:
  React.CSSProperties = {
  padding: '3px 7px',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const taskTitle:
  React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  fontWeight: 700,
}

const subjectLabel:
  React.CSSProperties = {
  marginTop: 6,
  color: '#64748b',
  fontSize: 12,
}

const deadlineLabel:
  React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 700,
}

const reasonBox:
  React.CSSProperties = {
  marginTop: 10,
  padding: '8px 10px',
  borderRadius: 6,
  fontSize: 12,
  lineHeight: 1.4,
}

const cardActions:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginTop: 10,
  flexWrap: 'wrap',
}

const completedMedicalButton:
  React.CSSProperties = {
  padding: '7px 11px',
  border:
    '1px solid #16a34a',
  borderRadius: 6,
  background: '#ffffff',
  color: '#15803d',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}

const moreButton:
  React.CSSProperties = {
  width: 32,
  height: 32,
  border:
    '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  fontSize: 17,
  cursor: 'pointer',
}