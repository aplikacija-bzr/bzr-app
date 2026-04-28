import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type Client = {
  id: string
  naziv: string | null
  aktivan: boolean | null
  employer_id: string | null
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
    .select('id, naziv, aktivan, employer_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return (
      <div className="p-6">
        <Link href="/dashboard/poslodavci" className="underline">
          ← Nazad na poslodavce
        </Link>
        <p className="text-red-600 mt-4">Greška pri učitavanju poslodavca.</p>
      </div>
    )
  }

  const employerId = client.employer_id || ''

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
      throw new Error('Nema prijavljenog korisnika.')
    }

    const objectName = String(formData.get('object_name') || '').trim()
    const advisorName = String(formData.get('advisor_name') || '').trim()
    const inspectionDate =
      String(formData.get('inspection_date') || '').trim() ||
      new Date().toISOString().slice(0, 10)

    const checklistId = String(formData.get('checklist_id') || '').trim()
    const clientName = String(formData.get('client_name') || '').trim()
    const employerIdFromForm = String(formData.get('employer_id') || '').trim()

    if (!employerIdFromForm) throw new Error('Nedostaje employer_id.')
    if (!checklistId) throw new Error('Nedostaje checklist_id.')
    if (!clientName) throw new Error('Nedostaje naziv klijenta.')

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        user_id: user.id,
        employer_id: employerIdFromForm,
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
      throw new Error(error?.message || 'Greška pri čuvanju kontrole.')
    }

    redirect(`/dashboard/kontrole/${data.id}`)
  }

  const today = new Date().toISOString().slice(0, 10)

  const checklistLabel =
    (checklist as Checklist | null)?.name ||
    (checklist as Checklist | null)?.naziv ||
    (checklist as Checklist | null)?.title ||
    'Kontrolna lista'

  return (
    <div className="p-6 space-y-6">
      <Link href={`/dashboard/poslodavci/${clientId}`} className="underline">
        ← Nazad na poslodavca
      </Link>

      <div className="rounded-xl border p-5 bg-white">
        <h1 className="text-2xl font-bold">Nova kontrola</h1>
        <p className="text-sm mt-2">
          Poslodavac: <b>{client.naziv}</b>
        </p>
      </div>

      <div className="rounded-xl border p-5 bg-white">
        {!employerId ? (
          <p className="text-sm text-red-600">
            Nema employer_id za ovog poslodavca.
          </p>
        ) : checklistError ? (
          <p className="text-sm text-red-600">
            Greška: {checklistError.message}
          </p>
        ) : !checklist?.id ? (
          <p className="text-sm text-red-600">
            Nema kontrolne liste u bazi.
          </p>
        ) : (
          <form action={createInspection} className="space-y-4">
            <input type="hidden" name="client_name" value={client.naziv || ''} />
            <input type="hidden" name="checklist_id" value={checklist.id} />
            <input type="hidden" name="employer_id" value={employerId} />

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
              <label className="block text-sm font-medium mb-1">Objekat</label>
              <input
                name="object_name"
                placeholder="Unesi naziv objekta"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Savetnik</label>
              <input
                name="advisor_name"
                placeholder="Unesi ime savetnika"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Datum kontrole
              </label>
              <input
                type="date"
                name="inspection_date"
                defaultValue={today}
                required
                className="w-full max-w-xs rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <button className="bg-black text-white px-4 py-2 rounded-lg">
              Kreiraj kontrolu
            </button>
          </form>
        )}
      </div>
    </div>
  )
}