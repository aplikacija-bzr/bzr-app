import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { pdf } from '@react-pdf/renderer'
import React from 'react'
import InspectionPdf from '@/app/components/InspectionPdf'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'inspection-images'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: Request) {
  try {
    const { log_id } = await req.json()

    if (!log_id) {
      return NextResponse.json({ error: 'Nedostaje ID email loga.' }, { status: 400 })
    }

    const { data: log, error: logError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', log_id)
      .single()

    if (logError || !log) {
      return NextResponse.json({ error: 'Email log nije pronađen.' }, { status: 404 })
    }

    if (!log.inspection_id) {
      return NextResponse.json({ error: 'Ovaj email nema povezanu kontrolu.' }, { status: 400 })
    }

    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, client_name, object_name, inspection_date, advisor_name, created_at')
      .eq('id', log.inspection_id)
      .single()

    const { data: items } = await supabase
      .from('checklist_items')
      .select('id, title')
      .order('sort_order', { ascending: true })

    const { data: answers } = await supabase
      .from('inspection_answers')
      .select('checklist_item_id, answer, comment')
      .eq('inspection_id', log.inspection_id)

    const { data: photos } = await supabase
      .from('inspection_photos')
      .select('file_path')
      .eq('inspection_id', log.inspection_id)

    const answersMap: Record<string, any> = {}

    ;(answers || []).forEach((answer: any) => {
      answersMap[answer.checklist_item_id] = answer
    })

    const pdfItems = (items || []).map((item: any) => {
      const answer = answersMap[item.id]

      return {
        question: item.title || 'Pitanje',
        answer:
          answer?.answer === 'da'
            ? 'DA'
            : answer?.answer === 'ne'
              ? 'NE'
              : '',
        comment: answer?.comment || '',
      }
    })

    const photoUrls = (photos || [])
      .map((photo: any) =>
        photo.file_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${photo.file_path}`
          : ''
      )
      .filter(Boolean)

    let inspectionDate = ''

    if (inspection?.inspection_date) {
      const date = new Date(inspection.inspection_date)
      inspectionDate = `${String(date.getDate()).padStart(2, '0')}.${String(
        date.getMonth() + 1
      ).padStart(2, '0')}.${date.getFullYear()}`
    }

    const pdfElement = React.createElement(InspectionPdf, {
      title: 'DNEVNA BZR KONTROLNA LISTA',
      items: pdfItems,
      companyName: inspection?.client_name || '',
      employerName: inspection?.client_name || '',
      advisorName: inspection?.advisor_name || '',
      inspectionDate,
      photos: photoUrls,
    })

    const pdfBuffer = await pdf(pdfElement).toBuffer()

    const subject = log.subject || `BZR kontrolna lista - ${inspection?.client_name || ''}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: log.recipient_email,
      subject,
      html: `
        <p>Poštovani,</p>
        <p>Ponovo Vam dostavljamo dnevnu BZR kontrolnu listu.</p>
        <p>Srdačan pozdrav,<br/>INPRO BZR</p>
      `,
      attachments: [
        {
          filename: 'dnevna_kontrola.pdf',
          content: pdfBuffer,
        },
      ],
    })

    await supabase.from('email_logs').insert({
      inspection_id: log.inspection_id,
      email_type: 'daily_inspection',
      recipient_email: log.recipient_email,
      subject,
      status: 'sent',
      error_message: null,
    })

    return NextResponse.json({ success: true, message: 'Email je ponovo poslat.' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Greška pri ponovnom slanju emaila.' },
      { status: 500 }
    )
  }
}