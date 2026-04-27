import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      inspection_id,
      checklist_item_id,
      answer,
      comment,
    }: {
      inspection_id?: string
      checklist_item_id?: string
      answer?: 'da' | 'ne'
      comment?: string
    } = body

    if (!inspection_id || !checklist_item_id) {
      return NextResponse.json({ error: 'Nedostaju podaci.' }, { status: 400 })
    }

    if (
      answer !== undefined &&
      answer !== null &&
      !['da', 'ne'].includes(answer)
    ) {
      return NextResponse.json(
        { error: 'Odgovor mora biti "da" ili "ne".' },
        { status: 400 }
      )
    }

    const payload: {
      inspection_id: string
      checklist_item_id: string
      answer?: 'da' | 'ne'
      comment?: string
    } = {
      inspection_id,
      checklist_item_id,
    }

    if (answer !== undefined) {
      payload.answer = answer
    }

    if (comment !== undefined) {
      payload.comment = comment
    }

    const { error } = await supabase
      .from('inspection_answers')
      .upsert(payload, {
        onConflict: 'inspection_id,checklist_item_id',
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}