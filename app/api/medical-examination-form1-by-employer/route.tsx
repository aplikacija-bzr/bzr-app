import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  renderToBuffer,
} from '@react-pdf/renderer'

import MedicalExaminationForm1Document from '@/components/medical-examinations/MedicalExaminationForm1Document'

import {
  getMedicalExaminationForm1DataByEmployerId,
} from '@/lib/medical-examination-form1-direct'

export const dynamic =
  'force-dynamic'

function makeSafeFileName(
  value: string,
) {
  return value
    .replace(/Đ/g, 'Dj')
    .replace(/đ/g, 'dj')
    .replace(/Č/g, 'C')
    .replace(/č/g, 'c')
    .replace(/Ć/g, 'C')
    .replace(/ć/g, 'c')
    .replace(/Š/g, 'S')
    .replace(/š/g, 's')
    .replace(/Ž/g, 'Z')
    .replace(/ž/g, 'z')
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      '_',
    )
    .replace(
      /^_+|_+$/g,
      '',
    )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const employerId =
      request.nextUrl.searchParams.get(
        'employerId',
      )

    if (!employerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nedostaje employerId.',
        },
        {
          status: 400,
        },
      )
    }

    const form1Data =
      await getMedicalExaminationForm1DataByEmployerId(
        employerId,
      )

    if (!form1Data) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Poslodavac nije pronađen.',
        },
        {
          status: 404,
        },
      )
    }

    const pdfBuffer =
      await renderToBuffer(
        <MedicalExaminationForm1Document
          data={form1Data}
        />,
      )

    const safeEmployerName =
      makeSafeFileName(
        form1Data.employer.name,
      )

    const fileName =
      `BZR_Obrazac_1_${
        safeEmployerName ||
        'poslodavac'
      }.pdf`

    return new NextResponse(
      new Uint8Array(
        pdfBuffer,
      ),
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `inline; filename="${fileName}"`,
        },
      },
    )
  } catch (error) {
    console.error(
      'MEDICAL EXAMINATION FORM 1 BY EMPLOYER:',
      error,
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
      },
    )
  }
}