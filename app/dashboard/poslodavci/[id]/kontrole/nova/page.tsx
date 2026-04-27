import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type Client = {
  id: string
  naziv: string | null
  aktivan: boolean | null
}

type Employer = {
  id: string
  name: string | null
}

type Checklist = {
  id: string
  name?: string | null
  naziv?: string | null
  title?: string | null
}

export default async function NewInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: clientId } = await params

  const { data: client, error: clientError } = await supabase
    .from('klijenti')
    .select('id, naziv, aktivan')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/poslodavci"
          className="inline-block text-sm underline mb-4"
        >
          ← Nazad na poslodavce
        </Link>

        <p className="text-red-600 font-medium">
          Greška pri učitavanju klijenta.
        </p>
        {clientError?.message ? (
          <p className="text-sm text-gray-600 mt-2">{clientError.message}</p>
        ) : null}
      </div>
    )
  }

  const { data: employer, error: employerError } = await supabase
    .from('employers')
    .select('id, name')
    .eq('name', client.naziv || '')
    .maybeSingle()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .select('id, name')
    .limit(1)
    .maybeSingle()

  async function createInspection(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Nema prijavljenog korisnika. Uloguj se ponovo.')
    }

    const objectName = String(formData.get('object_name') || '').trim()
    const advisorName = String(formData.get('advisor_name') || '').trim()
    const inspectionDate = String(formData.get('inspection_date') || '').trim()
    const checklistId = String(formData.get('checklist_id') || '').trim()
    const clientName = String(formData.get('client_name') || '').trim()
    const employerId = String(formData.get('employer_id') || '').trim()

    if (!clientId) {
      throw new Error('Nedostaje ID klijenta.')
    }

    if (!clientName) {
      throw new Error('Nedostaje naziv klijenta.')
    }

    if (!employerId) {
      throw new Error(
        'Nedostaje employer_id. Proveri da li u tabeli employers postoji firma sa istim nazivom kao u tabeli klijenti.'
      )
    }

    if (!checklistId) {
      throw new Error('Nedostaje checklist_id.')
    }

    if (!inspectionDate) {
      throw new Error('Nedostaje datum kontrole.')
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        user_id: user.id,
        employer_id: employerId,
        checklist_id: checklistId,
        client_name: clientName,
        object_name: objectName || null,
        advisor_name: advisorName || null,
        inspection_date: inspectionDate,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      throw new Error(error?.message || 'Neuspešno kreiranje kontrole.')
    }

    redirect(`/dashboard/kontrole/${data.id}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const checklistLabel =
    (checklist as Checklist | null)?.name ||
    (checklist as Checklist | null)?.naziv ||
    (checklist as Checklist | null)?.title ||
    'Osnovna BZR kontrolna lista'

  return (
    <div className="p-6 space-y-6">
      <Link
        href={`/dashboard/poslodavci/${clientId}`}
        className="inline-block text-sm underline"
      >
        ← Nazad na poslodavca
      </Link>

      <div className="rounded-xl border p-5 bg-white">
        <h1 className="text-2xl font-bold">Nova kontrola</h1>
        <p className="mt-2 text-sm text-gray-600">
          Poslodavac: <span className="font-medium text-black">{client.naziv}</span>
        </p>
      </div>

      <div className="rounded-xl border p-5 bg-white">
        {employerError ? (
          <p className="text-sm text-red-600">
            Greška pri učitavanju employers reda: {employerError.message}
          </p>
        ) : !employer?.id ? (
          <p className="text-sm text-red-600">
            U tabeli <strong>employers</strong> nije pronađena firma sa nazivom{' '}
            <strong>{client.naziv}</strong>.
            <br />
            Naziv u tabeli <strong>employers.name</strong> mora da bude isti kao
            naziv u tabeli <strong>klijenti.naziv</strong>.
          </p>
        ) : checklistError ? (
          <p className="text-sm text-red-600">
            Greška pri učitavanju kontrolne liste: {checklistError.message}
          </p>
        ) : !checklist?.id ? (
          <p className="text-sm text-red-600">
            Nema nijedne kontrolne liste u tabeli <strong>checklists</strong>.
          </p>
        ) : (
          <form action={createInspection} className="space-y-4">
            <input type="hidden" name="client_name" value={client.naziv || ''} />
            <input type="hidden" name="checklist_id" value={checklist.id} />
            <input type="hidden" name="employer_id" value={employer.id} />

            <div>
              <label className="block text-sm font-medium mb-1">
                Kontrolna lista
              </label>
              <input
                type="text"
                value={checklistLabel}
                disabled
                className="w-full rounded-lg border px-3 py-2 bg-gray-50 text-sm"
              />
            </div>

            <div>
              <label htmlFor="object_name" className="block text-sm font-medium mb-1">
                Objekat
              </label>
              <input
                id="object_name"
                name="object_name"
                type="text"
                placeholder="Unesi naziv objekta"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="advisor_name" className="block text-sm font-medium mb-1">
                Savetnik
              </label>
              <input
                id="advisor_name"
                name="advisor_name"
                type="text"
                placeholder="Unesi ime savetnika"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="inspection_date"
                className="block text-sm font-medium mb-1"
              >
                Datum kontrole
              </label>
              <input
                id="inspection_date"
                name="inspection_date"
                type="date"
                defaultValue={today}
                required
                className="w-full max-w-xs rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Kreiraj kontrolu
            </button>
          </form>
        )}
      </div>
    </div>
  )
}