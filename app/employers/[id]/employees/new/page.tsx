import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type NewEmployeePageProps = {
  params: Promise<{
    id: string
  }>
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical' as const,
}

export default async function NewEmployeePage({
  params,
}: NewEmployeePageProps) {
  const { id } = await params

  async function createEmployee(
    formData: FormData,
  ) {
    'use server'

    const supabase =
      await createClient()

    const firstName =
      String(
        formData.get('first_name') ?? '',
      ).trim()

    const lastName =
      String(
        formData.get('last_name') ?? '',
      ).trim()

    const jmbg =
      String(
        formData.get('jmbg') ?? '',
      ).trim()

    const employeeNumber =
      String(
        formData.get('employee_number') ?? '',
      ).trim()

    const dateOfBirth =
      String(
        formData.get('date_of_birth') ?? '',
      ).trim()

    const placeOfBirth =
      String(
        formData.get('place_of_birth') ?? '',
      ).trim()

    const qualification =
      String(
        formData.get('qualification') ?? '',
      ).trim()

    const occupation =
      String(
        formData.get('occupation') ?? '',
      ).trim()

    const employmentStart =
      String(
        formData.get('employment_start') ?? '',
      ).trim()

    const email =
      String(
        formData.get('email') ?? '',
      ).trim()

    const phone =
      String(
        formData.get('phone') ?? '',
      ).trim()

    const notes =
      String(
        formData.get('notes') ?? '',
      ).trim()

    if (!firstName) {
      throw new Error(
        'Ime zaposlenog je obavezno.',
      )
    }

    if (!lastName) {
      throw new Error(
        'Prezime zaposlenog je obavezno.',
      )
    }

    const { error } =
      await supabase
        .from('employees')
        .insert({
          employer_id: id,
          first_name: firstName,
          last_name: lastName,
          jmbg:
            jmbg || null,
          employee_number:
            employeeNumber || null,
          date_of_birth:
            dateOfBirth || null,
          place_of_birth:
            placeOfBirth || null,
          qualification:
            qualification || null,
          occupation:
            occupation || null,
          employment_start:
            employmentStart || null,
          email:
            email || null,
          phone:
            phone || null,
          notes:
            notes || null,
          active: true,
        })

    if (error) {
      throw error
    }

    revalidatePath(
      `/employers/${id}`,
    )

    redirect(
      `/employers/${id}`,
    )
  }

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
          href={`/employers/${id}`}
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na poslodavca
        </Link>

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Novi zaposleni
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Unos novog zaposlenog kod izabranog
          poslodavca.
        </p>
      </div>

      <form
        action={createEmployee}
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
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
          <div>
            <label
              htmlFor="first_name"
              style={labelStyle}
            >
              Ime *
            </label>

            <input
              id="first_name"
              name="first_name"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              style={labelStyle}
            >
              Prezime *
            </label>

            <input
              id="last_name"
              name="last_name"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="jmbg"
              style={labelStyle}
            >
              JMBG
            </label>

            <input
              id="jmbg"
              name="jmbg"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="employee_number"
              style={labelStyle}
            >
              Broj zaposlenog
            </label>

            <input
              id="employee_number"
              name="employee_number"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="date_of_birth"
              style={labelStyle}
            >
              Datum rođenja
            </label>

            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="place_of_birth"
              style={labelStyle}
            >
              Mesto rođenja
            </label>

            <input
              id="place_of_birth"
              name="place_of_birth"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="qualification"
              style={labelStyle}
            >
              Stručna sprema
            </label>

            <input
              id="qualification"
              name="qualification"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="occupation"
              style={labelStyle}
            >
              Zanimanje
            </label>

            <input
              id="occupation"
              name="occupation"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="employment_start"
              style={labelStyle}
            >
              Datum početka rada
            </label>

            <input
              id="employment_start"
              name="employment_start"
              type="date"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              style={labelStyle}
            >
              Telefon
            </label>

            <input
              id="phone"
              name="phone"
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
              Email
            </label>

            <input
              id="email"
              name="email"
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
              htmlFor="notes"
              style={labelStyle}
            >
              Napomena
            </label>

            <textarea
              id="notes"
              name="notes"
              style={textareaStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Link
            href={`/employers/${id}`}
            style={{
              padding: '11px 18px',
              border: '1px solid #d1d5db',
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
              padding: '11px 20px',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Sačuvaj zaposlenog
          </button>
        </div>
      </form>
    </main>
  )
}