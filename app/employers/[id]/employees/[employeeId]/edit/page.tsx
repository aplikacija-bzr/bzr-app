import Link from 'next/link'
import {
  notFound,
  redirect,
} from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getEmployeeById } from '@/lib/employees'

type EditEmployeePageProps = {
  params: Promise<{
    id: string
    employeeId: string
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

const textareaStyle = {
  ...inputStyle,
  minHeight: '110px',
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const {
    id,
    employeeId,
  } = await params

  const employee =
    await getEmployeeById(employeeId)

  if (
    !employee ||
    employee.employer_id !== id
  ) {
    notFound()
  }

  async function updateEmployee(
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

    

    const dateOfBirth =
      String(
        formData.get(
          'date_of_birth',
        ) ?? '',
      ).trim()

    const placeOfBirth =
      String(
        formData.get(
          'place_of_birth',
        ) ?? '',
      ).trim()

    const qualification =
      String(
        formData.get(
          'qualification',
        ) ?? '',
      ).trim()

    const occupation =
      String(
        formData.get(
          'occupation',
        ) ?? '',
      ).trim()

    const employmentStart =
      String(
        formData.get(
          'employment_start',
        ) ?? '',
      ).trim()

    const employmentEnd =
      String(
        formData.get(
          'employment_end',
        ) ?? '',
      ).trim()

    const phone =
      String(
        formData.get('phone') ?? '',
      ).trim()

    const email =
      String(
        formData.get('email') ?? '',
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
        .update({
          first_name:
            firstName,
          last_name:
            lastName,
          jmbg:
            jmbg || null,
          
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
          employment_end:
            employmentEnd || null,
          phone:
            phone || null,
          email:
            email || null,
          notes:
            notes || null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          employeeId,
        )
        .eq(
          'employer_id',
          id,
        )

    if (error) {
      throw error
    }

    revalidatePath(
      `/employers/${id}`,
    )

    revalidatePath(
      `/employers/${id}/employees/${employeeId}`,
    )

    redirect(
      `/employers/${id}/employees/${employeeId}`,
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
          href={`/employers/${id}/employees/${employeeId}`}
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#2563eb',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Nazad na zaposlenog
        </Link>

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Izmeni zaposlenog
        </h1>

        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          {employee.first_name}{' '}
          {employee.last_name}
        </p>
      </div>

      <form
        action={updateEmployee}
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
              defaultValue={
                employee.first_name
              }
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
              defaultValue={
                employee.last_name
              }
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
              defaultValue={
                employee.jmbg ?? ''
              }
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
              defaultValue={
                employee.date_of_birth ??
                ''
              }
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
              defaultValue={
                employee.place_of_birth ??
                ''
              }
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
              defaultValue={
                employee.qualification ??
                ''
              }
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
              defaultValue={
                employee.occupation ??
                ''
              }
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
              defaultValue={
                employee.employment_start ??
                ''
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="employment_end"
              style={labelStyle}
            >
              Datum prestanka rada
            </label>

            <input
              id="employment_end"
              name="employment_end"
              type="date"
              defaultValue={
                employee.employment_end ??
                ''
              }
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
              defaultValue={
                employee.phone ?? ''
              }
              style={inputStyle}
            />
          </div>

          <div>
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
              defaultValue={
                employee.email ?? ''
              }
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
              defaultValue={
                employee.notes ?? ''
              }
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
            href={`/employers/${id}/employees/${employeeId}`}
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
            Sačuvaj izmene
          </button>
        </div>
      </form>
    </main>
  )
}