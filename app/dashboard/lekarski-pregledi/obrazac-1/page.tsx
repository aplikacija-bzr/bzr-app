import Link from 'next/link'

import {
  createClient,
} from '@/lib/supabase/server'

export const dynamic =
  'force-dynamic'

export default async function Obrazac1Page() {
  const supabase =
    await createClient()

  const {
    data: employers,
    error,
  } = await supabase
    .from('employers')
    .select(`
      id,
      name
    `)
    .eq(
      'active',
      true,
    )
    .order(
      'name',
      {
        ascending: true,
      },
    )

  if (error) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <section style={cardStyle}>
            <h1 style={titleStyle}>
              Obrazac 1 – lekarski pregledi
            </h1>

            <div style={errorStyle}>
              Nije moguće učitati poslodavce.
            </div>

            <Link
              href="/dashboard"
              style={backLinkStyle}
            >
              ← Vrati se na Radni sto
            </Link>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Obrazac 1 – lekarski pregledi
              </h1>

              <p style={subtitleStyle}>
                Izaberite poslodavca i otvorite
                kompletnu evidenciju lekarskih
                pregleda zaposlenih.
              </p>
            </div>

            <Link
              href="/dashboard"
              style={backLinkStyle}
            >
              ← Vrati se na Radni sto
            </Link>
          </div>

          <form
            action="/api/medical-examination-form1-by-employer"
            method="GET"
            target="_blank"
            style={formStyle}
          >
            <div>
              <label
                htmlFor="employerId"
                style={labelStyle}
              >
                Poslodavac
              </label>

              <select
                id="employerId"
                name="employerId"
                defaultValue=""
                required
                style={selectStyle}
              >
                <option
                  value=""
                  disabled
                >
                  Izaberite poslodavca
                </option>

                {(employers ?? []).map(
                  (employer) => (
                    <option
                      key={employer.id}
                      value={employer.id}
                    >
                      {employer.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div style={infoBoxStyle}>
              <strong>
                Obrazac 1
              </strong>

              <div
                style={{
                  marginTop: 6,
                }}
              >
                PDF će prikazati evidentirane
                lekarske preglede izabranog
                poslodavca sa zaposlenima,
                radnim mestima, datumima
                pregleda, brojevima izveštaja,
                ocenama sposobnosti i
                narednim rokovima.
              </div>
            </div>

            <div style={actionsStyle}>
              <button
                type="submit"
                style={openButtonStyle}
              >
                Otvori Obrazac 1
              </button>

              <Link
                href="/dashboard"
                style={secondaryButtonStyle}
              >
                Odustani
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

const pageStyle:
  React.CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: 24,
}

const containerStyle:
  React.CSSProperties = {
  maxWidth: 850,
  margin: '0 auto',
}

const cardStyle:
  React.CSSProperties = {
  background: '#ffffff',
  border:
    '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 24,
}

const headerStyle:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent:
    'space-between',
  gap: 20,
  flexWrap: 'wrap',
}

const titleStyle:
  React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
}

const subtitleStyle:
  React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: '#64748b',
  lineHeight: 1.5,
}

const backLinkStyle:
  React.CSSProperties = {
  display: 'inline-block',
  padding: '9px 13px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  textDecoration: 'none',
}

const formStyle:
  React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  marginTop: 28,
}

const labelStyle:
  React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 800,
  color: '#374151',
}

const selectStyle:
  React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '9px 11px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontSize: 14,
  boxSizing: 'border-box',
}

const infoBoxStyle:
  React.CSSProperties = {
  padding: 16,
  border:
    '1px solid #bfdbfe',
  borderRadius: 8,
  background: '#eff6ff',
  color: '#1e3a8a',
  fontSize: 14,
  lineHeight: 1.5,
}

const actionsStyle:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const openButtonStyle:
  React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 7,
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle:
  React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 16px',
  border:
    '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  textDecoration: 'none',
}

const errorStyle:
  React.CSSProperties = {
  marginTop: 20,
  marginBottom: 20,
  padding: 14,
  border:
    '1px solid #fecaca',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 700,
}