import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Nedostaju Supabase environment variables.',
        },
        { status: 500 }
      )
    }

    const body = await request.json()

    const employerId =
      typeof body?.employerId === 'string'
        ? body.employerId.trim()
        : ''

    const email =
      typeof body?.email === 'string'
        ? body.email.trim()
        : ''

    if (!employerId) {
      return NextResponse.json(
        {
          error: 'Nedostaje ID poslodavca.',
        },
        { status: 400 }
      )
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          error: 'Email adresa nije ispravna.',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { data, error } = await supabase
      .from('employers')
      .update({
        monthly_report_email:
          email || null,
      })
      .eq('id', employerId)
      .select(
        'id, name, monthly_report_email'
      )
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      employer: data,
    })
  } catch (error) {
    console.error(
      'EMPLOYER MONTHLY REPORT EMAIL ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nepoznata greška.',
      },
      { status: 500 }
    )
  }
}