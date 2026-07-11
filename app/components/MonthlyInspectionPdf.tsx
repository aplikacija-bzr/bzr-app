import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

Font.register({
  family: "DejaVu",
  src: "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans.ttf",
});

Font.register({
  family: "DejaVuBold",
  src: "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans-Bold.ttf",
});

type MonthlyControl = {
  id: string;
  date: string;
  objectName: string;
  totalQuestions: number;
  yesCount: number;
  noCount: number;
  noPercent: number;
  grade: string;
  defects: {
    text: string;
    comment: string;
  }[];
  photos: string[];
};

type Props = {
  companyName: string;
  employerName: string;
  advisorName: string;
  monthLabel: string;
  reportNumber?: string;
  issueDate?: string;
  controls: MonthlyControl[];
  summary: {
    totalControls: number;
    totalQuestions: number;
    totalYes: number;
    totalNo: number;
    noPercent: number;
    grade: string;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "DejaVu",
    color: "#111827",
  },

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 8,
    marginBottom: 12,
  },

  logo: {
    fontSize: 18,
    fontFamily: "DejaVuBold",
  },

  subtitle: {
    fontSize: 9,
    marginTop: 2,
  },

  title: {
    fontSize: 16,
    fontFamily: "DejaVuBold",
    marginTop: 12,
    marginBottom: 10,
    textAlign: "center",
  },

  infoBox: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 8,
    marginBottom: 12,
  },

  infoText: {
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "DejaVuBold",
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: "#E5E7EB",
    padding: 5,
  },

  smallTitle: {
    fontSize: 10,
    fontFamily: "DejaVuBold",
    marginTop: 6,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 3,
  },

  cellLabel: {
    width: "45%",
    fontFamily: "DejaVuBold",
  },

  cellValue: {
    width: "55%",
  },

  defect: {
    marginBottom: 4,
    paddingLeft: 6,
  },

  defectText: {
    fontFamily: "DejaVuBold",
  },

  defectComment: {
    marginTop: 2,
  },

  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  tableRow: {
    flexDirection: "row",
  },

  tableHeader: {
    backgroundColor: "#E5E7EB",
  },

  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    fontSize: 8,
  },

  tableHeaderText: {
    fontFamily: "DejaVuBold",
  },

  wDate: { width: "22%" },
  wSmall: { width: "13%" },
  wGrade: { width: "39%" },

  scaleActive: {
    backgroundColor: "#FEF3C7",
  },

  finalGrade: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#111827",
    fontSize: 12,
    fontFamily: "DejaVuBold",
    textAlign: "center",
  },

  photo: {
    width: 160,
    height: 120,
    objectFit: "cover",
    marginTop: 6,
    marginRight: 6,
  },

  photosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  note: {
    fontSize: 8,
    marginTop: 6,
    color: "#374151",
  },

  pageNumber: {
    position: "absolute",
    bottom: 15,
    right: 28,
    fontSize: 9,
    color: "#666666",
  },
});

function fmtPercent(value: number) {
  return `${value.toFixed(2).replace(".", ",")} %`;
}

function isActiveScale(summaryGrade: string, grade: string) {
  return summaryGrade === grade;
}

export default function MonthlyInspectionPdf({
  companyName,
  employerName,
  advisorName,
  monthLabel,
  reportNumber,
  issueDate,
  controls,
  summary,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>INPRO BZR</Text>
          <Text style={styles.subtitle}>Bezbednost i zdravlje na radu</Text>
          <Text style={styles.subtitle}>d.o.o. Bajina Basta</Text>
          <Text style={styles.subtitle}>office@inpro.rs</Text>
        </View>

        <Text style={styles.title}>MESECNI BZR IZVESTAJ</Text>

        <View style={styles.infoBox}>
          {reportNumber && (
            <Text style={styles.infoText}>Broj izvestaja: {reportNumber}</Text>
          )}
          {issueDate && (
            <Text style={styles.infoText}>Datum izdavanja: {issueDate}</Text>
          )}
          <Text style={styles.infoText}>Poslodavac: {employerName}</Text>
          <Text style={styles.infoText}>
            Poslodavac sa licencom: {companyName}
          </Text>
          <Text style={styles.infoText}>Mesec: {monthLabel}</Text>
          <Text style={styles.infoText}>Savetnik: {advisorName || "-"}</Text>
        </View>

        {controls.map((control) => (
          <View key={control.id} wrap={false}>
            <Text style={styles.sectionTitle}>
              DNEVNA KONTROLA OD {control.date}
            </Text>

            <Text style={styles.smallTitle}>Zakljucak dnevne kontrole</Text>

            <View>
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Ukupan broj pitanja:</Text>
                <Text style={styles.cellValue}>{control.totalQuestions}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.cellLabel}>Broj odgovora DA:</Text>
                <Text style={styles.cellValue}>{control.yesCount}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.cellLabel}>Broj odgovora NE:</Text>
                <Text style={styles.cellValue}>{control.noCount}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.cellLabel}>Procenat odgovora NE:</Text>
                <Text style={styles.cellValue}>
                  {fmtPercent(control.noPercent)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.cellLabel}>Ocena:</Text>
                <Text style={styles.cellValue}>{control.grade}</Text>
              </View>
            </View>

            <Text style={styles.smallTitle}>Uoceni nedostaci</Text>

            {control.defects.length > 0 ? (
              control.defects.map((d, index) => (
                <View key={index} style={styles.defect}>
                  <Text style={styles.defectText}>
                    {index + 1}. {d.text}
                  </Text>
                  <Text style={styles.defectComment}>
                    Komentar: {d.comment || "—"}
                  </Text>
                </View>
              ))
            ) : (
              <Text>Nema evidentiranih odgovora NE.</Text>
            )}

            {control.photos.length > 0 && (
              <>
                <Text style={styles.smallTitle}>Fotografije kontrole</Text>
                <View style={styles.photosRow}>
                  {control.photos.map((photo, index) => (
                    <Image key={index} src={photo} style={styles.photo} />
                  ))}
                </View>
              </>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>ZAKLJUCAK ZA CEO MESEC</Text>

        <View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Ukupan broj izvrsenih kontrola:</Text>
            <Text style={styles.cellValue}>{summary.totalControls}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.cellLabel}>Ukupan broj pitanja:</Text>
            <Text style={styles.cellValue}>{summary.totalQuestions}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.cellLabel}>Ukupan broj odgovora DA:</Text>
            <Text style={styles.cellValue}>{summary.totalYes}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.cellLabel}>Ukupan broj odgovora NE:</Text>
            <Text style={styles.cellValue}>{summary.totalNo}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.cellLabel}>Procenat odgovora NE:</Text>
            <Text style={styles.cellValue}>{fmtPercent(summary.noPercent)}</Text>
          </View>
        </View>

        <Text style={styles.finalGrade}>OCENA: {summary.grade}</Text>

        <Text style={styles.sectionTitle}>PREGLED PO KONTROLAMA</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text
              style={[
                styles.tableCell,
                styles.wDate,
                styles.tableHeaderText,
              ]}
            >
              Datum
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              Pitanja
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              DA
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              NE
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wGrade,
                styles.tableHeaderText,
              ]}
            >
              Ocena
            </Text>
          </View>

          {controls.map((c) => (
            <View key={c.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.wDate]}>{c.date}</Text>
              <Text style={[styles.tableCell, styles.wSmall]}>
                {c.totalQuestions}
              </Text>
              <Text style={[styles.tableCell, styles.wSmall]}>{c.yesCount}</Text>
              <Text style={[styles.tableCell, styles.wSmall]}>{c.noCount}</Text>
              <Text style={[styles.tableCell, styles.wGrade]}>{c.grade}</Text>
            </View>
          ))}

          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text
              style={[
                styles.tableCell,
                styles.wDate,
                styles.tableHeaderText,
              ]}
            >
              UKUPNO
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              {summary.totalQuestions}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              {summary.totalYes}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wSmall,
                styles.tableHeaderText,
              ]}
            >
              {summary.totalNo}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.wGrade,
                styles.tableHeaderText,
              ]}
            >
              {summary.grade}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SKALA OCENE PRIMENE MERA BZR</Text>

        <View style={styles.table}>
          {[
            ["0–1 %", "MERE ZA BZR ODLICNE"],
            [">1–5 %", "MERE ZA BZR ZADOVOLJAVAJUCE"],
            [">5–8 %", "MERE ZA BZR PRIHVATLJIVE"],
            [">8–10 %", "MERE ZA BZR NEZADOVOLJAVAJUCE"],
            ["Preko 10 %", "MERE ZA BZR NEPRIHVATLJIVE"],
          ].map(([range, grade]) => (
            <View
              key={grade}
              style={[
                styles.tableRow,
                isActiveScale(summary.grade, grade) ? styles.scaleActive : {},
              ]}
            >
              <Text style={[styles.tableCell, { width: "30%" }]}>{range}</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{grade}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Ocena se odredjuje na osnovu procentualnog ucesca odgovora "NE" u
          ukupnom broju pitanja obuhvacenih svim izvrsenim dnevnim BZR
          kontrolama tokom izvestajnog perioda.
        </Text>

        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Strana ${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}