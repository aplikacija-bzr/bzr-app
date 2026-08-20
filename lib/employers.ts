import { createClient } from '@/lib/supabase/server'

export type Employer = {
  id: string
  name: string
  code: string | null
  address: string | null
  city: string | null
  contact_person: string | null
  contact_phone: string | null
  contact_email: string | null
  email: string | null
  client_id: string | null
  active: boolean
  created_at: string
  updated_at: string
  registration_number: string | null
  activity_code: string | null
  pib: string | null
}

export async function getEmployerById(
  id: string,
) {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('employers')
      .select('*')
      .eq('id', id)
      .single()

  if (error) {
    throw error
  }

  return data as Employer
}

export async function getEmployers() {
  const supabase =
    await createClient()

  const { data, error } =
    await supabase
      .from('employers')
      .select('*')
      .eq('active', true)
      .order('name')

  if (error) {
    throw error
  }

  return data as Employer[]
}