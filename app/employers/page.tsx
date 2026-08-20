import Link from 'next/link'

import {
  getEmployers,
} from '@/lib/employers'

export const dynamic = 'force-dynamic'

export default async function EmployersPage() {
  const employers =
    await getEmployers()

  return (
    <main
      style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          marginBottom: '18px',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na radni sto
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '30px',
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Poslodavci
          </h1>

          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: '#6b7280',
              fontSize: '15px',
            }}
          >
            Pregled aktivnih poslodavaca u
            INPRO Knowledge Platform.
          </p>
        </div>

        <Link
          href="/employers/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 18px',
            borderRadius: '8px',
            background: '#16a34a',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          + Novi poslodavac
        </Link>
      </div>

      <div
        style={{
          marginBottom: '18px',
          padding: '14px 16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb',
          color: '#374151',
          fontSize: '14px',
        }}
      >
        Ukupno aktivnih poslodavaca:{' '}
        <strong>
          {employers.length}
        </strong>
      </div>

      {employers.length === 0 ? (
        <div
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            background: '#ffffff',
            color: '#6b7280',
          }}
        >
          Nema aktivnih poslodavaca.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '12px',
          }}
        >
          {employers.map(
            (employer) => (
              <Link
                key={employer.id}
                href={`/employers/${employer.id}`}
                style={{
                  display: 'block',
                  padding: '18px 20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  background: '#ffffff',
                  textDecoration: 'none',
                  color: '#111827',
                }}
              >
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    marginBottom: '6px',
                  }}
                >
                  {employer.name}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px 20px',
                    fontSize: '13px',
                    color: '#6b7280',
                  }}
                >
                  {employer.code && (
                    <span>
                      Šifra: {employer.code}
                    </span>
                  )}

                  {employer.city && (
                    <span>
                      Mesto: {employer.city}
                    </span>
                  )}

                  {employer.contact_person && (
                    <span>
                      Kontakt: {employer.contact_person}
                    </span>
                  )}

                  {employer.contact_phone && (
                    <span>
                      Telefon: {employer.contact_phone}
                    </span>
                  )}
                </div>
              </Link>
            ),
          )}
        </div>
      )}
    </main>
  )
}