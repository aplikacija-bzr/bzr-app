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

type InspectionPdfItem = {
  question: string;
  answer: "DA" | "NE" | string;
  comment?: string | null;
};

type Props = {
  companyName: string;
  inspectionDate: string;
  advisorName?: string | null;
  employerName?: string | null;
  employerEmail?: string | null;
  contactPerson?: string | null;
  items: InspectionPdfItem[];
  photos?: string[];
  title?: string;
};

const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://bzr-app.vercel.app";

const logoUrl = `${appUrl}/logo-transparentan.png`;

Font.register({
  family: "DejaVuSans",
  src: `${appUrl}/fonts/DejaVuSans.ttf`,
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "DejaVuSans",
  },

  // 🔵 MEMORANDUM
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  companyBlock: {
    flexDirection: "column",
  },

  companyNameBig: {
    fontSize: 16,
    fontWeight: "bold",
  },

  companySub: {
    fontSize: 9,
    marginTop: 2,
  },

  logo: {
    width: 120,
    height: 50,
  },

  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },

  meta: {
    marginTop: 10,
    marginBottom: 12,
  },

  metaRow: {
    marginBottom: 3,
  },

  item: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },

  question: {
    fontSize: 11,
    fontWeight: "bold",
  },

  answerYes: {
    color: "green",
    fontWeight: "bold",
  },

  answerNo: {
    color: "red",
    fontWeight: "bold",
  },

  comment: {
    marginTop: 2,
  },

  conclusion: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
  },

  conclusionTitle: {
    fontWeight: "bold",
    marginBottom: 6,
  },
});

export default function InspectionPdf({
  companyName,
  inspectionDate,
  advisorName,
  employerName,
  employerEmail,
  contactPerson,
  items,
  photos = [],
  title = "DNEVNA BZR KONTROLNA LISTA",
}: Props) {
  const valid = items.filter((i) => i.answer === "DA" || i.answer === "NE");
  const da = valid.filter((i) => i.answer === "DA").length;
  const ne = valid.filter((i) => i.answer === "NE").length;

  let stanje = "MERE PRIMENJENE";
  if (ne === 1) stanje = "MANJE NEPRAVILNOSTI";
  if (ne > 1) stanje = "NEZADOVOLJAVAJUĆE";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* 🔥 MEMORANDUM */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.companyBlock}>
              <Text style={styles.companyNameBig}>INPRO BZR</Text>
              <Text style={styles.companySub}>
                Bezbednost i zdravlje na radu
              </Text>
              <Text style={styles.companySub}>
                Užice | office@inpro.rs
              </Text>
            </View>

            <Image src={logoUrl} style={styles.logo} />
          </View>

          <Text style={styles.title}>{title}</Text>
        </View>

        {/* META */}
        <View style={styles.meta}>
          <Text style={styles.metaRow}>Poslodavac: {employerName}</Text>
          <Text style={styles.metaRow}>Firma: {companyName}</Text>
          <Text style={styles.metaRow}>Email: {employerEmail}</Text>
          <Text style={styles.metaRow}>Kontakt: {contactPerson}</Text>
          <Text style={styles.metaRow}>Datum: {inspectionDate}</Text>
          <Text style={styles.metaRow}>Savetnik: {advisorName}</Text>
        </View>

        {/* PITANJA */}
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.question}>
              {i + 1}. {item.question}
            </Text>

            <Text>
              Odgovor:{" "}
              <Text style={item.answer === "NE" ? styles.answerNo : styles.answerYes}>
                {item.answer}
              </Text>
            </Text>

            <Text style={styles.comment}>
              Komentar: {item.comment || "—"}
            </Text>
          </View>
        ))}

        {/* ZAKLJUČAK */}
        <View style={styles.conclusion}>
          <Text style={styles.conclusionTitle}>ZAKLJUČAK</Text>
          <Text>Ukupno: {valid.length}</Text>
          <Text>DA: {da}</Text>
          <Text>NE: {ne}</Text>
          <Text>Ocena: {stanje}</Text>
        </View>

      </Page>
    </Document>
  );
}