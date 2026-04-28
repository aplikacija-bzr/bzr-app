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
        setMessage(`Greška pri uploadu slike: ${uploadError.message}`)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('inspection_photos')
        .insert({
          inspection_id: inspectionId,
          file_path: filePath,
          file_url: publicUrl,
        })

      if (dbError) {
        setMessage(`Greška pri upisu u bazu: ${dbError.message}`)
        return
      }

      setMessage('✅ Slika uspešno dodata.')
      e.target.value = ''

      if (onUploaded) {
        onUploaded()
      }
    } catch (error: any) {
      setMessage(error?.message || 'Neočekivana greška.')
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
      <h3 style={{ marginTop: 0 }}>Fotografije</h3>

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
          padding: '12px 18px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Upload u toku...' : '📷 Dodaj fotografiju'}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  )
}