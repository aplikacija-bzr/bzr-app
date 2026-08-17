import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

import {
  getWorkInboxItems,
  type WorkInboxItem,
} from '@/lib/work-inbox'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RECIPIENT_EMAIL =
  'office@inpro.rs'

const transporter =
  nodemailer.createTransport({
    host:
      process.env.SMTP_HOST,

    port:
      Number(
        process.env.SMTP_PORT ||
        587,
      ),

    secure: false,

    auth: {
      user:
        process.env.SMTP_USER,

      pass:
        process.env.SMTP_PASS,
    },
  })

function escapeHtml(
  value: string,
): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDateSr(
  value: string,
): string {
  if (!value) {
    return '-'
  }

  const parts =
    value.split('-')

  if (
    parts.length !== 3
  ) {
    return value
  }

  const [
    year,
    month,
    day,
  ] = parts

  return (
    `${day}.${month}.${year}.`
  )
}

const BELGRADE_TIME_ZONE =
  'Europe/Belgrade'

function getBelgradeDateTimeParts(
  date: Date = new Date(),
) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-GB',
      {
        timeZone:
          BELGRADE_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      },
    )

  const parts =
    formatter.formatToParts(
      date,
    )

  const map =
    new Map(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ],
      ),
    )

  return {
    day:
      map.get('day') ?? '',
    month:
      map.get('month') ?? '',
    year:
      map.get('year') ?? '',
    hour:
      map.get('hour') ?? '',
  }
}

function getTodayLabel():
  string {
  const {
    day,
    month,
    year,
  } =
    getBelgradeDateTimeParts()

  return (
    `${day}.${month}.${year}.`
  )
}

function isBelgradeSevenOClock():
  boolean {
  const { hour } =
    getBelgradeDateTimeParts()

  return hour === '07'
}

function isAuthorizedCron(
  request: Request,
): boolean {
  const cronSecret =
    process.env.CRON_SECRET

  if (!cronSecret) {
    return false
  }

  const authorization =
    request.headers.get(
      'authorization',
    )

  return (
    authorization ===
    `Bearer ${cronSecret}`
  )
}

function getCategoryLabel(
  item: WorkInboxItem,
): string {
  if (
    item.sourceType ===
    'training'
  ) {
    return 'OBUKA ZA BZR'
  }

  if (
    item.sourceType ===
    'medical'
  ) {
    return 'LEKARSKI PREGLED'
  }

  return 'OPREMA ZA RAD'
}

function getPriorityLabel(
  item: WorkInboxItem,
): string {
  if (
    item.priority ===
    'critical'
  ) {
    return 'KRITIČNO'
  }

  return 'VISOK PRIORITET'
}

function buildItemHtml(
  item: WorkInboxItem,
): string {
  const employer =
    escapeHtml(
      item.employerName,
    )

  const category =
    escapeHtml(
      getCategoryLabel(
        item,
      ),
    )

  const title =
    escapeHtml(
      item.title,
    )

  const subject =
    escapeHtml(
      item.subject,
    )

  const deadlineLabel =
    escapeHtml(
      item.deadlineLabel,
    )

  const deadlineDate =
    escapeHtml(
      formatDateSr(
        item.deadlineDate,
      ),
    )

  const reason =
    escapeHtml(
      item.reasonLabel,
    )

  const priority =
    escapeHtml(
      getPriorityLabel(
        item,
      ),
    )

  return `
    <div
      style="
        border:1px solid #e5e7eb;
        border-left:4px solid ${
          item.priority ===
          'critical'
            ? '#dc2626'
            : '#2563eb'
        };
        border-radius:8px;
        padding:16px;
        margin-bottom:14px;
        background:#ffffff;
      "
    >
      <div
        style="
          font-size:16px;
          font-weight:700;
          color:#111827;
          margin-bottom:4px;
        "
      >
        ${employer}
      </div>

      <div
        style="
          font-size:12px;
          font-weight:700;
          color:#4b5563;
          margin-bottom:10px;
        "
      >
        ${category}
      </div>

      <div
        style="
          font-size:15px;
          font-weight:700;
          color:#111827;
          margin-bottom:8px;
        "
      >
        ${title}
      </div>

      <div
        style="
          font-size:14px;
          color:#374151;
          margin-bottom:8px;
        "
      >
        ${subject}
      </div>

      <div
        style="
          font-size:14px;
          font-weight:700;
          color:${
            item.priority ===
            'critical'
              ? '#dc2626'
              : '#1d4ed8'
          };
          margin-bottom:6px;
        "
      >
        ${deadlineLabel}
      </div>

      <div
        style="
          font-size:13px;
          color:#6b7280;
          margin-bottom:8px;
        "
      >
        Datum isteka:
        <strong>
          ${deadlineDate}
        </strong>
      </div>

      <div
        style="
          background:#f9fafb;
          border-radius:6px;
          padding:10px;
          font-size:13px;
          color:#374151;
          margin-bottom:8px;
        "
      >
        ${reason}
      </div>

      <div
        style="
          font-size:12px;
          font-weight:700;
          color:${
            item.priority ===
            'critical'
              ? '#dc2626'
              : '#1d4ed8'
          };
        "
      >
        ${priority}
      </div>
    </div>
  `
}

function buildTextEmail(
  items: WorkInboxItem[],
): string {
  const today =
    getTodayLabel()

  if (
    items.length === 0
  ) {
    return (
      `INPRO - Dnevni Radni Inbox\n` +
      `Datum: ${today}\n\n` +
      `Nema obaveza koje ističu ` +
      `u narednih 30 dana.\n`
    )
  }

  const rows =
    items.map(
      (
        item,
        index,
      ) => {
        return (
          `${index + 1}. ` +
          `${item.employerName}\n` +
          `${getCategoryLabel(item)}\n` +
          `${item.title}\n` +
          `${item.subject}\n` +
          `${item.deadlineLabel}\n` +
          `Datum isteka: ` +
          `${formatDateSr(
            item.deadlineDate,
          )}\n` +
          `${item.reasonLabel}\n` +
          `Prioritet: ` +
          `${getPriorityLabel(
            item,
          )}\n`
        )
      },
    )

  return (
    `INPRO - Dnevni Radni Inbox\n` +
    `Datum: ${today}\n` +
    `Ukupno otvorenih obaveza: ` +
    `${items.length}\n\n` +
    rows.join('\n')
  )
}

function buildHtmlEmail(
  items: WorkInboxItem[],
): string {
  const today =
    getTodayLabel()

  const trainingCount =
    items.filter(
      (item) =>
        item.sourceType ===
        'training',
    ).length

  const medicalCount =
    items.filter(
      (item) =>
        item.sourceType ===
        'medical',
    ).length

  const equipmentCount =
    items.filter(
      (item) =>
        item.sourceType ===
        'work_equipment',
    ).length

  const criticalCount =
    items.filter(
      (item) =>
        item.priority ===
        'critical',
    ).length

  const itemsHtml =
    items.length > 0
      ? items
          .map(
            buildItemHtml,
          )
          .join('')
      : `
        <div
          style="
            padding:20px;
            border:1px solid #d1fae5;
            background:#ecfdf5;
            border-radius:8px;
            color:#065f46;
            font-size:15px;
          "
        >
          Nema obaveza koje ističu
          u narednih 30 dana.
        </div>
      `

  return `
    <!DOCTYPE html>

    <html>
      <body
        style="
          margin:0;
          padding:0;
          background:#f3f4f6;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        "
      >
        <div
          style="
            max-width:800px;
            margin:0 auto;
            padding:24px 16px;
          "
        >
          <div
            style="
              background:#ffffff;
              border-radius:10px;
              padding:24px;
              margin-bottom:18px;
              border:1px solid #e5e7eb;
            "
          >
            <div
              style="
                font-size:22px;
                font-weight:700;
                color:#111827;
                margin-bottom:6px;
              "
            >
              INPRO - Dnevni Radni Inbox
            </div>

            <div
              style="
                font-size:14px;
                color:#6b7280;
                margin-bottom:20px;
              "
            >
              Pregled obaveza koje ističu
              od danas do narednih 30 dana
              • ${today}
            </div>

            <table
              cellpadding="0"
              cellspacing="0"
              style="
                width:100%;
                border-collapse:collapse;
              "
            >
              <tr>
                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:13px;
                  "
                >
                  Ukupno
                </td>

                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${items.length}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:13px;
                  "
                >
                  Kritično
                </td>

                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:15px;
                    font-weight:700;
                    color:#dc2626;
                  "
                >
                  ${criticalCount}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:13px;
                  "
                >
                  Obuke BZR
                </td>

                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${trainingCount}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:13px;
                  "
                >
                  Lekarski pregledi
                </td>

                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${medicalCount}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:13px;
                  "
                >
                  Oprema za rad
                </td>

                <td
                  style="
                    padding:10px;
                    border:1px solid #e5e7eb;
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${equipmentCount}
                </td>
              </tr>
            </table>
          </div>

          ${itemsHtml}

          <div
            style="
              text-align:center;
              color:#6b7280;
              font-size:12px;
              padding:14px;
            "
          >
            Ovaj email je automatski
            generisan iz
            INPRO Knowledge Platform.
          </div>
        </div>
      </body>
    </html>
  `
}

async function sendDailyInboxEmail() {
  const items =
    await getWorkInboxItems()

  const today =
    getTodayLabel()

  const subject =
    (
      `INPRO - Radni Inbox - ` +
      `${today} - ` +
      `${items.length} obaveza`
    )

  const text =
    buildTextEmail(
      items,
    )

  const html =
    buildHtmlEmail(
      items,
    )

  const info =
    await transporter.sendMail({
      from:
        process.env.SMTP_FROM,

      to:
        RECIPIENT_EMAIL,

      subject,

      text,

      html,
    })

  return {
    recipient:
      RECIPIENT_EMAIL,

    count:
      items.length,

    messageId:
      info.messageId,
  }
}

/*
 * Ručni test.
 *
 * Lokalno je dozvoljen bez CRON_SECRET-a.
 * U production okruženju zahteva isti
 * Authorization Bearer token kao cron.
 */
export async function POST(
  request: Request,
) {
  try {
    const isProduction =
      process.env.NODE_ENV ===
      'production'

    if (
      isProduction &&
      !isAuthorizedCron(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        },
      )
    }

    const result =
      await sendDailyInboxEmail()

    return NextResponse.json({
      success: true,
      mode: 'manual',
      ...result,
    })
  } catch (error) {
    console.error(
      'WORK INBOX DAILY EMAIL ERROR:',
      error,
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'Greška pri slanju dnevnog Work Inbox emaila.',
      },
      {
        status: 500,
      },
    )
  }
}

/*
 * Vercel Cron poziva GET.
 *
 * vercel.json poziva rutu u 05:00 UTC
 * i 06:00 UTC. Samo jedan od ta dva
 * poziva pada u 07:xx po Europe/Belgrade,
 * zavisno od letnjeg/zimskog vremena.
 */
export async function GET(
  request: Request,
) {
  try {
    if (
      !isAuthorizedCron(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        },
      )
    }

    const belgradeTime =
      getBelgradeDateTimeParts()

    if (
      !isBelgradeSevenOClock()
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          'Nije 07:00 po vremenu Europe/Belgrade.',
        belgradeHour:
          belgradeTime.hour,
        date:
          getTodayLabel(),
      })
    }

    const result =
      await sendDailyInboxEmail()

    return NextResponse.json({
      success: true,
      skipped: false,
      mode: 'cron',
      belgradeHour:
        belgradeTime.hour,
      ...result,
    })
  } catch (error) {
    console.error(
      'WORK INBOX DAILY EMAIL ERROR:',
      error,
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'Greška pri slanju dnevnog Work Inbox emaila.',
      },
      {
        status: 500,
      },
    )
  }
}