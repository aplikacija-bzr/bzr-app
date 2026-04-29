import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { naziv } = await req.json()

    if (!naziv || !naziv.trim()) {
      return NextResponse.json(
        { error: 'Naziv poslodavca je obavezan.' },
        { status: 400 }
      )
    }

    const { data: employer, error: employerError } = await supabase
      .from('employers')
      .insert({ name: naziv.trim() })
      .select('id')
      .single()

    if (employerError || !employer) {
      return NextResponse.json(
        { error: employerError?.message || 'Greška pri upisu u employers.' },
        { status: 500 }
      )
    }

    const { data: client, error: clientError } = await supabase
      .from('klijenti')
      .insert({
        naziv: naziv.trim(),
        aktivan: true,
        employer_id: employer.id,
      })
      .select('id')
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: clientError?.message || 'Greška pri upisu u klijenti.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server greška.' },
      { status: 500 }
    )
  }
}