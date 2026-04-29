'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const BUCKET = 'inspection-images'

export default function PhotoUpload({
  inspectionId,
  onUploaded,
}: {
  inspectionId: string
  onUploaded?: () => void
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!inspectionId) {
      setMessage('Nedostaje ID kontrole.')
      return
    }

    setUploading(true)
    setMessage('')

    const safeName = file.name.replace(/\s+/g, '-')
    const filePath = `${inspectionId}/${Date.now()}-${safeName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || 'image/jpeg',
        })

      if (uploadError) {
        setMessage(`Greška pri uploadu: ${uploadError.message}`)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl

      if (!fileUrl) {
        setMessage('Greška: nije napravljen URL fotografije.')
        return
      }

      const { error: dbError } = await supabase
        .from('inspection_photos')
        .insert({
          inspection_id: inspectionId,
          file_path: filePath,
          file_url: fileUrl,
        })

      if (dbError) {
        console.error(dbError)
        setMessage(`Greška u bazi: ${dbError.message}`)
        return
      }

      setMessage('✅ Slika uspešno dodata.')
      e.target.value = ''

      onUploaded?.()
    } catch (err: any) {
      setMessage(err?.message || 'Neočekivana greška.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        border: '1px solid #ddd',
        borderRadius: 10,
        backgroundColor: '#fafafa',
      }}
    >
      <h3>Fotografije</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: 14,
          background: '#2563eb',
          color: '#fff',
          borderRadius: 10,
          border: 'none',
          fontWeight: 'bold',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Upload...' : '📷 Dodaj fotografiju'}
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}