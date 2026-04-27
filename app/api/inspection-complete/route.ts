import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const body = await req.json()
    const { inspection_id } = body

    if (!inspection_id) {
      return NextResponse.json(
        { error: 'Nedostaje inspection_id.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('inspections')
      .update({ status: 'completed' })
      .eq('id', inspection_id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Greška na serveru.' },
      { status: 500 }
    )
  }
}