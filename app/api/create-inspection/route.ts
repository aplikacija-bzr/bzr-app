import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const formData = await req.formData()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nema korisnika' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      user_id: user.id,
      employer_id: String(formData.get('employer_id') || ''),
      checklist_id: String(formData.get('checklist_id') || ''),
      client_name: String(formData.get('client_name') || ''),
      object_name: String(formData.get('object_name') || '') || null,
      advisor_name: String(formData.get('advisor_name') || '') || null,
      inspection_date:
        String(formData.get('inspection_date') || '') ||
        new Date().toISOString().slice(0, 10),
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !data?.id) {
    return NextResponse.json(
      { error: error?.message || 'Greška pri kreiranju kontrole' },
      { status: 400 }
    )
  }

  return NextResponse.redirect(
    new URL(`/dashboard/kontrole/${data.id}`, req.url)
  )
}