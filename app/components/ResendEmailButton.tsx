'use client'

import { useState } from 'react'

export default function ResendEmailButton({ logId }: { logId: string }) {
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const resendEmail = async () => {
    setSending(true)
    setMessage('')

    try {
      const res = await fetch('/api/resend-inspection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data?.error || 'Greška pri slanju.')
        return
      }

      setMessage(data?.message || 'Email je ponovo poslat.')
    } catch {
      setMessage('Greška pri slanju.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <button
        onClick={resendEmail}
        disabled={sending}
        style={{
          padding: '7px 10px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: sending ? '#999' : '#2563eb',
          color: 'white',
          fontWeight: 'bold',
          cursor: sending ? 'not-allowed' : 'pointer',
        }}
      >
        {sending ? 'Slanje...' : 'Ponovo pošalji'}
      </button>

      {message && (
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 'bold' }}>
          {message}
        </div>
      )}
    </div>
  )
}