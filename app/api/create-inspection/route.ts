import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nema korisnika' }, { status: 401 })
    }

    const {
      employer_id,
      client_name,
      checklist_id,
      object_name,
      advisor_name,
      inspection_date,
    } = body

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        user_id: user.id,
        employer_id,
        checklist_id,
        client_name,
        object_name,
        advisor_name,
        inspection_date,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}