import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase =
    await createClient()

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        active
      `)
      .eq('id', user.id)
      .maybeSingle()

  if (
    profileError ||
    !profile ||
    !profile.active
  ) {
    redirect('/login')
  }

  return children
}