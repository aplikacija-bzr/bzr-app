// BITNE IZMENE SU SAMO U STILOVIMA (LAKŠE ZA TABLET)

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InspectionPdf from '@/app/components/InspectionPdf'
import PhotoUpload from '@/app/components/inspection/PhotoUpload'

const BUCKET = 'inspection-images'
const SUPABASE_URL = 'https://awvrwilxbvibzyegwila.supabase.co'

export default function InspectionDetailPage() {

  // ... OSTALO OSTAVI ISTO ...

  return (
    <>
      <div
        style={{
          padding: 24,
          paddingBottom: status === 'draft' ? 130 : 20,
          maxWidth: 1000, // 👈 ŠIRE ZA TABLET
          margin: '0 auto',
        }}
      >

        <h1 style={{ fontSize: 26 }}>Kontrolna lista</h1>

        {/* 🔽 PITANJA */}
        {items.map((item, index) => {
          const currentAnswer = answers[item.id]
          const currentComment = comments[item.id] || ''

          return (
            <div
              key={item.id}
              style={{
                marginBottom: 20,
                padding: 20,
                border: '1px solid #ddd',
                borderRadius: 12,
                background:
                  currentAnswer === 'ne'
                    ? '#ffe5e5'
                    : currentAnswer === 'da'
                    ? '#e6ffe6'
                    : '#fff',
              }}
            >
              <p style={{ fontSize: 20, marginBottom: 12 }}>
                <b>{index + 1}.</b> {item.title}
              </p>

              {/* 🔥 VEĆA DUGMAD */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <button
                  onClick={() => handleAnswer(item.id, 'da')}
                  style={{
                    flex: 1,
                    padding: '18px',
                    fontSize: 20,
                    fontWeight: 'bold',
                    borderRadius: 12,
                    backgroundColor:
                      currentAnswer === 'da' ? '#16a34a' : '#fff',
                    color: currentAnswer === 'da' ? '#fff' : '#111',
                    border: '2px solid #16a34a',
                  }}
                >
                  DA
                </button>

                <button
                  onClick={() => handleAnswer(item.id, 'ne')}
                  style={{
                    flex: 1,
                    padding: '18px',
                    fontSize: 20,
                    fontWeight: 'bold',
                    borderRadius: 12,
                    backgroundColor:
                      currentAnswer === 'ne' ? '#dc2626' : '#fff',
                    color: currentAnswer === 'ne' ? '#fff' : '#111',
                    border: '2px solid #dc2626',
                  }}
                >
                  NE
                </button>
              </div>

              {/* 🔥 VEĆI KOMENTAR */}
              <textarea
                value={currentComment}
                onChange={(e) =>
                  handleCommentChange(item.id, e.target.value)
                }
                placeholder="Komentar..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 16,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                }}
              />
            </div>
          )
        })}

        {/* 🔥 FOTOGRAFIJE VEĆE */}
        <div style={{ marginTop: 20 }}>
          <h3>Fotografije</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {photos.map((photo) => {
              const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${photo.file_path}`

              return (
                <div key={photo.id}>
                  <img
                    src={imageUrl}
                    style={{
                      width: 220, // 👈 VEĆE
                      height: 160,
                      objectFit: 'cover',
                      borderRadius: 10,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 🔥 EMAIL VEĆI */}
        <div style={{ marginTop: 24 }}>
          <h3>Pošalji PDF</h3>

          <input
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: 14,
              fontSize: 18,
              borderRadius: 10,
              border: '1px solid #ccc',
            }}
          />

          <button
            onClick={sendInspectionEmail}
            style={{
              marginTop: 10,
              width: '100%',
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              backgroundColor: '#111827',
              color: 'white',
            }}
          >
            Pošalji email
          </button>
        </div>
      </div>

      {/* 🔥 STICKY DUGME VEĆE */}
      {status === 'draft' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            padding: 16,
            borderTop: '1px solid #ddd',
          }}
        >
          <button
            onClick={saveInspection}
            style={{
              width: '100%',
              padding: 18,
              fontSize: 20,
              fontWeight: 'bold',
              backgroundColor: '#16a34a',
              color: 'white',
              borderRadius: 14,
            }}
          >
            Snimi kontrolu
          </button>
        </div>
      )}
    </>
  )
}