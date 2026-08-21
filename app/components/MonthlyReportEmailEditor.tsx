'use client'

import { useState } from 'react'

type Props = {
  employerId: string
  initialEmail: string | null
}

export default function MonthlyReportEmailEditor({
  employerId,
  initialEmail,
}: Props) {
  const [email, setEmail] = useState(initialEmail || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const saveEmail = async () => {
    setMessage('')
    setError('')

    setSaving(true)

    try {
      const res = await fetch(
        '/api/employer-monthly-report-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employerId,
            email: email.trim(),
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(
          data?.error ||
            'Greška pri čuvanju email adrese.'
        )
        return
      }

      setMessage('Email je sačuvan.')
    } catch (err: any) {
      setError(
        err?.message ||
          'Greška pri čuvanju email adrese.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        placeholder="Email za mesečni izveštaj"
        style={{
          minWidth: 320,
          padding: '10px 12px',
          border: '1px solid #ccc',
          borderRadius: 8,
          fontSize: 14,
        }}
      />

      <button
        type="button"
        onClick={saveEmail}
        disabled={saving}
        style={{
          padding: '10px 16px',
          background: '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: saving
            ? 'default'
            : 'pointer',
          opacity: saving
            ? 0.6
            : 1,
        }}
      >
        {saving
          ? 'Čuvanje...'
          : 'Sačuvaj email'}
      </button>

      {message && (
        <span
          style={{
            color: 'green',
            fontWeight: 'bold',
          }}
        >
          ✅ {message}
        </span>
      )}

      {error && (
        <span
          style={{
            color: 'red',
            fontWeight: 'bold',
          }}
        >
          ❌ {error}
        </span>
      )}
    </div>
  )
}