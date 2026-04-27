'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const BUCKET = 'inspection-images'

export default function PhotoUpload({
  inspectionId,
}: {
  inspectionId: string
}) {
  const supabase = createClient()

  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        setUploading(false)
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
        setUploading(false)
        return
      }

      setMessage('Slika uspešno dodata.')
      e.target.value = ''
    } catch (error: any) {
      setMessage(error?.message || 'Neočekivana greška pri uploadu slike.')
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
        borderRadius: 8,
        backgroundColor: '#fafafa',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Dodaj fotografiju</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && <p style={{ marginTop: 10 }}>Upload u toku...</p>}
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}