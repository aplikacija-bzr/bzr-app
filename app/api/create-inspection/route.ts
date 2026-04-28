import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const employerId = String(formData.get('employer_id') || '')
    const checklistId = String(formData.get('checklist_id') || '')
    const clientName = String(formData.get('client_name') || '')
    const objectName = String(formData.get('object_name') || '')
    const advisorName = String(formData.get('advisor_name') || '')
    const inspectionDate =
      String(formData.get('inspection_date') || '') ||
      new Date().toISOString().slice(0, 10)

    if (!employerId) {
      return NextResponse.json({ error: 'Nedostaje employer_id' }, { status: 400 })
    }

    if (!checklistId) {
      return NextResponse.json({ error: 'Nedostaje checklist_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert({
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
      return NextResponse.json(
        { error: error?.message || 'Greška pri kreiranju kontrole' },
        { status: 400 }
      )
    }

    return NextResponse.redirect(
      new URL(`/dashboard/kontrole/${data.id}`, req.url)
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Neočekivana greška' },
      { status: 500 }
    )
  }
}