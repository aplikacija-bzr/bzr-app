import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  renderToBuffer,
} from '@react-pdf/renderer'

import {
  PDFDocument,
} from 'pdf-lib'

import MedicalReferralDocument from '@/components/medical-examinations/MedicalReferralDocument'

import {
  getMedicalReferralData,
} from '@/lib/medical-examination-session'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest
) {
  try {
    const itemIdsParam =
      request.nextUrl.searchParams.get(
        'itemIds'
      )

    if (!itemIdsParam) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaje itemIds.',
        },
        {
          status: 400,
        }
      )
    }

    const itemIds =
      itemIdsParam
        .split(',')
        .map((itemId) =>
          itemId.trim()
        )
        .filter(Boolean)

    if (itemIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nema stavki za generisanje uputa.',
        },
        {
          status: 400,
        }
      )
    }

    const mergedPdf =
      await PDFDocument.create()

    for (const itemId of itemIds) {
      const referralData =
        await getMedicalReferralData(
          itemId
        )

      if (!referralData) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Stavka lekarskog pregleda nije pronađena: ${itemId}`,
          },
          {
            status: 404,
          }
        )
      }

      const pdfBuffer =
        await renderToBuffer(
          <MedicalReferralDocument
            data={referralData}
          />
        )

      const sourcePdf =
        await PDFDocument.load(
          pdfBuffer
        )

      const pageIndices =
        sourcePdf.getPageIndices()

      const copiedPages =
        await mergedPdf.copyPages(
          sourcePdf,
          pageIndices
        )

      copiedPages.forEach(
        (page) => {
          mergedPdf.addPage(page)
        }
      )
    }

    const mergedPdfBytes =
      await mergedPdf.save()

    return new NextResponse(
      new Uint8Array(
        mergedPdfBytes
      ),
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/pdf',
          'Content-Disposition':
            `inline; filename="uputi-${itemIds.length}.pdf"`,
        },
      }
    )
  } catch (error) {
    console.error(
      'MEDICAL REFERRAL PDF BATCH:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nepoznata greška.',
      },
      {
        status: 500,
      }
    )
  }
}