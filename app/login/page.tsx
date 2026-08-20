'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (
        loginError ||
        !loginData.user
      ) {
        setMessage(
          'Greška: proveri email i lozinku.'
        )
        return
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from('user_profiles')
          .select(`
            id,
            full_name,
            role,
            active
          `)
          .eq(
            'id',
            loginData.user.id
          )
          .maybeSingle()

      if (
        profileError ||
        !profile
      ) {
        await supabase.auth.signOut()

        setMessage(
          'Korisnički profil nije pronađen.'
        )
        return
      }

      if (!profile.active) {
        await supabase.auth.signOut()

        setMessage(
          'Korisnički nalog nije aktivan.'
        )
        return
      }

      if (profile.role === 'ADMIN') {
        router.push('/dashboard')
        router.refresh()
        return
      }

      if (profile.role === 'OPERATER') {
  router.push('/dashboard')
  router.refresh()
  return
}

      await supabase.auth.signOut()

      setMessage(
        'Korisnički nalog nema dozvoljenu ulogu.'
      )
    } catch (error) {
      console.error(error)

      setMessage(
        'Došlo je do greške pri prijavi.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">
          Prijava
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Unesi email i lozinku za pristup aplikaciji.
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring"
            required
          />

          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border bg-black px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loading
              ? 'Prijava...'
              : 'Prijavi se'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-red-600">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}