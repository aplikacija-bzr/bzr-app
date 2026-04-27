import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('email_logs')
    .select('recipient_email')
    .not('recipient_email', 'is', null)
    .order('sent_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const emails = Array.from(
    new Set(
      (data || [])
        .map((row) => row.recipient_email)
        .filter(Boolean)
    )
  )

  return NextResponse.json({ emails })
}