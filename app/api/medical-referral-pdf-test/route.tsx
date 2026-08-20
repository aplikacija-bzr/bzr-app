import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  renderToBuffer,
} from '@react-pdf/renderer'

import MedicalReferralDocument from '@/components/medical-examinations/MedicalReferralDocument'

import {
  getMedicalReferralData,
} from '@/lib/medical-examination-session'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest
) {
  try {
    const itemId =
      request.nextUrl.searchParams.get(
        'itemId'
      )

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaje itemId.',
        },
        {
          status: 400,
        }
      )
    }

    const referralData =
      await getMedicalReferralData(
        itemId
      )

    if (!referralData) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stavka lekarskog pregleda nije pronađena.',
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

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/pdf',
          'Content-Disposition':
            `inline; filename="uput-${referralData.referralNumber ?? referralData.itemId}.pdf"`,
        },
      }
    )
  } catch (error) {
    console.error(
      'MEDICAL REFERRAL PDF TEST:',
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