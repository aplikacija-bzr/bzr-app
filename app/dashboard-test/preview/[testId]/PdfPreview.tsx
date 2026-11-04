'use client';

import {
  PDFViewer,
  PDFDownloadLink,
  pdf,
} from '@react-pdf/renderer';
import TestPdfDocument from './TestPdfDocument';
type PdfOption = {
  id: string;
  option_text: string;
  sort_order: number;
};
type PdfMedia = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};
type PdfQuestion = {
  id: string;
  question_text: string;
  options: PdfOption[];
  media: PdfMedia[];
};

type PdfModule = {
  id: string;
  code: string;
  name: string;
  questions: PdfQuestion[];
};

type PdfPreviewProps = {
  testName: string;
  modules: PdfModule[];
};

export default function PdfPreview({
  testName,
  modules,
}: PdfPreviewProps) {
  const handlePrint = async () => {
  const blob = await pdf(
    <TestPdfDocument
      testName={testName}
      modules={modules}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);

  const printWindow = window.open(
    url,
    '_blank'
  );

  if (!printWindow) {
    URL.revokeObjectURL(url);
    return;
  }


printWindow.focus();

};
return (
  <div>
    <div
      style={{
        marginBottom: 12,
        display: 'flex',
  gap: 10,
  alignItems: 'center',
      }}
    >
      <PDFDownloadLink
        document={
          <TestPdfDocument
            testName={testName}
            modules={modules}
          />
        }
        fileName={`${testName}.pdf`}
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          backgroundColor: '#111827',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {({ loading }) =>
          loading
            ? 'PRIPREMA PDF...'
            : 'PREUZMI PDF'
        }
      </PDFDownloadLink>
      <button
  type="button"
  onClick={handlePrint}
  style={{
    padding: '10px 18px',
    backgroundColor: '#111827',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  }}
>
  ŠTAMPAJ PDF
</button>
    </div>

    <PDFViewer
      style={{
        width: '100%',
        height: '800px',
        border: 'none',
      }}
    >
      <TestPdfDocument
        testName={testName}
        modules={modules}
      />
    </PDFViewer>
  </div>
);
}