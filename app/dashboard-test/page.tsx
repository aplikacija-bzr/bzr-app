import { createClient } from '@supabase/supabase-js'
import TestModuleSelector from './TestModuleSelector'

import { redirect } from 'next/navigation'
import { createClient as createUserClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardTestPage() {

  const userSupabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } =
    await userSupabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .maybeSingle()

  if (
    profileError ||
    !profile ||
    !profile.active ||
    !['ADMIN', 'OPERATER'].includes(profile.role)
  ) {
    redirect('/dashboard')
  }

  const { data: modules, error } = await supabase
    .from('training_modules')
    .select(`
      id,
      code,
      name,
      sort_order,
      training_module_questions (
        id,
        sort_order,
        training_question:training_questions (
          id,
          question_text,
          active,
          training_question_options (
            id,
            option_text,
            sort_order,
            active
          ),
          training_question_media (
            id,
            media_type,
            storage_path,
            alt_text,
            sort_order,
            active
          )
        )
      )
    `)
    .eq('active', true)
    .eq('training_module_questions.active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <main style={{ padding: 40, backgroundColor: "#ffffff", color: "#111827", minHeight: "100vh" }}>
        <h1>Kreiranje testa</h1>

<a
  href="/dashboard/obuke"
  style={{
    display: 'inline-block',
    marginBottom: 20,
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: 8,
    fontWeight: 700,
    textDecoration: 'none',
  }}
>
  ← POVRATAK NA OBUKE BZR
</a>

        <p>
          Greška pri učitavanju modula:{' '}
          {error.message}
        </p>
      </main>
    )
  }

  const normalizedModules = (modules ?? []).map(
    (module) => {
      const questions =
        module.training_module_questions
          ?.map((item) => {
            const question = Array.isArray(
              item.training_question
            )
              ? item.training_question[0]
              : item.training_question

            if (!question) {
              return null
            }

            const options =
              (
                question.training_question_options ??
                []
              )
                .filter(
                  (option) =>
                    option.active !== false
                )
                .sort(
                  (a, b) =>
                    a.sort_order -
                    b.sort_order
                )
                .map((option) => ({
                  id: option.id,
                  option_text:
                    option.option_text,
                  sort_order:
                    option.sort_order,
                }))

            const media =
              (
                question.training_question_media ??
                []
              )
                .filter(
                  (item) =>
                    item.active !== false
                )
                .sort(
                  (a, b) =>
                    a.sort_order -
                    b.sort_order
                )
                .map((item) => ({
                  id: item.id,
                  media_type:
                    item.media_type,
                  storage_path:
                    item.storage_path,
                  alt_text:
                    item.alt_text,
                  sort_order:
                    item.sort_order,
                }))

            return {
              id: question.id,
              question_text:
                question.question_text,
              sort_order: item.sort_order,
              options,
              media,
            }
          })
          .filter(
            (
              question
            ): question is NonNullable<
              typeof question
            > => question !== null
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order
          ) ?? []

      return {
        id: module.id,
        code: module.code,
        name: module.name,
        sort_order: module.sort_order,
        question_count: questions.length,
        questions,
      }
    }
  )

  return (
    <main style={{ padding: 40, backgroundColor: "#ffffff", color: "#111827", minHeight: "100vh" }}>
      <h1>Kreiranje testa</h1>

<a
  href="/dashboard/obuke"
  style={{
    display: 'inline-block',
    marginTop: 12,
    marginBottom: 24,
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: 8,
    fontWeight: 700,
    textDecoration: 'none',
  }}
>
  ← POVRATAK NA OBUKE BZR
</a>


      <p>
        Aktivni moduli:{' '}
        <strong>
          {normalizedModules.length}
        </strong>
      </p>

      <TestModuleSelector
        modules={normalizedModules}
      />
    </main>
  )
}
