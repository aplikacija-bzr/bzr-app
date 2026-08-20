import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function createEmployer(
  formData: FormData,
) {
  'use server'

  const supabase =
    await createClient()

  const name =
    String(
      formData.get('name') ?? '',
    ).trim()

  const code =
    String(
      formData.get('code') ?? '',
    ).trim()

  const pib =
    String(
      formData.get('pib') ?? '',
    ).trim()

  const registrationNumber =
    String(
      formData.get(
        'registration_number',
      ) ?? '',
    ).trim()

  const activityCode =
    String(
      formData.get(
        'activity_code',
      ) ?? '',
    ).trim()

  const address =
    String(
      formData.get('address') ?? '',
    ).trim()

  const city =
    String(
      formData.get('city') ?? '',
    ).trim()

  const contactPerson =
    String(
      formData.get(
        'contact_person',
      ) ?? '',
    ).trim()

  const contactPhone =
    String(
      formData.get(
        'contact_phone',
      ) ?? '',
    ).trim()

  const contactEmail =
    String(
      formData.get(
        'contact_email',
      ) ?? '',
    ).trim()

  const email =
    String(
      formData.get('email') ?? '',
    ).trim()

  if (!name) {
    throw new Error(
      'Naziv poslodavca je obavezan.',
    )
  }

  const { data, error } =
    await supabase
      .from('employers')
      .insert({
        name,
        code:
          code || null,
        pib:
          pib || null,
        registration_number:
          registrationNumber || null,
        activity_code:
          activityCode || null,
        address:
          address || null,
        city:
          city || null,
        contact_person:
          contactPerson || null,
        contact_phone:
          contactPhone || null,
        contact_email:
          contactEmail || null,
        email:
          email || null,
        active: true,
      })
      .select('id')
      .single()

  if (error) {
    throw error
  }

  revalidatePath('/employers')

  redirect(
    `/employers/${data.id}`,
  )
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  fontSize: '14px',
  boxSizing:
    'border-box' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

export default function NewEmployerPage() {
  return (
    <main
      style={{
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div
  style={{
    marginBottom: '28px',
  }}
>
  <Link
    href="/dashboard"
    style={{
      display: 'inline-block',
      marginBottom: '18px',
      color: '#2563eb',
      fontSize: '14px',
      fontWeight: 700,
      textDecoration: 'none',
    }}
  >
    ← Vrati se na radni sto
  </Link>

  <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Novi poslodavac
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Unos novog poslodavca u
          INPRO Knowledge Platform.
        </p>
      </div>

      <form
        action={createEmployer}
        style={{
          background: '#ffffff',
          border:
            '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '20px',
          }}
        >
          <div
            style={{
              gridColumn: '1 / -1',
            }}
          >
            <label
              htmlFor="name"
              style={labelStyle}
            >
              Naziv poslodavca *
            </label>

            <input
              id="name"
              name="name"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="pib"
              style={labelStyle}
            >
              PIB
            </label>

            <input
              id="pib"
              name="pib"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="registration_number"
              style={labelStyle}
            >
              Matični broj
            </label>

            <input
              id="registration_number"
              name="registration_number"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="activity_code"
              style={labelStyle}
            >
              Šifra delatnosti
            </label>

            <input
              id="activity_code"
              name="activity_code"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="code"
              style={labelStyle}
            >
              Interna šifra
            </label>

            <input
              id="code"
              name="code"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
            }}
          >
            <label
              htmlFor="address"
              style={labelStyle}
            >
              Adresa
            </label>

            <input
              id="address"
              name="address"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="city"
              style={labelStyle}
            >
              Mesto
            </label>

            <input
              id="city"
              name="city"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="contact_person"
              style={labelStyle}
            >
              Kontakt osoba
            </label>

            <input
              id="contact_person"
              name="contact_person"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="contact_phone"
              style={labelStyle}
            >
              Telefon
            </label>

            <input
              id="contact_phone"
              name="contact_phone"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="contact_email"
              style={labelStyle}
            >
              Email kontakt osobe
            </label>

            <input
              id="contact_email"
              name="contact_email"
              type="email"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
            }}
          >
            <label
              htmlFor="email"
              style={labelStyle}
            >
              Opšti email poslodavca
            </label>

            <input
              id="email"
              name="email"
              type="email"
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            gap: '12px',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop:
              '1px solid #e5e7eb',
          }}
        >
          <Link
            href="/employers"
            style={{
              padding:
                '11px 18px',
              border:
                '1px solid #d1d5db',
              borderRadius: '7px',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 700,
            }}
          >
            Otkaži
          </Link>

          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: '7px',
              padding:
                '11px 20px',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Sačuvaj poslodavca
          </button>
        </div>
      </form>
    </main>
  )
}