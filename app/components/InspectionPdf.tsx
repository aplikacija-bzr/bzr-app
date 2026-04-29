import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

type InspectionPdfItem = {
  question: string;
  answer: "DA" | "NE" | string;
  comment?: string | null;
  photos?: string[];
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
  process.env.NEXT_PUBLIC_SITE_URL || "https://bzr-app.vercel.app";

const fullImageUrl = (src: string) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${appUrl}${src}`;
  return `${appUrl}/${src}`;
};

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

  memorandum: {
    borderWidth: 2,
    borderColor: "#000",
    padding: 12,
    marginBottom: 16,
  },

  firmName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },

  firmSub: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 2,
  },

  line: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginTop: 8,
    marginBottom: 8,
  },

  title: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  meta: {
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
    marginBottom: 4,
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
    marginTop: 3,
  },

  photosWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  photo: {
    width: 150,
    height: 105,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#ccc",
  },

  conclusion: {
    marginTop: 18,
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

  let stanje = "MERE ZA BZR PRIMENJENE";

  if (ne === 1) {
    stanje = "MERE ZA BZR PRIMENJENE ZADOVOLJAVAJUĆE";
  }

  if (ne > 1) {
    stanje = "MERE ZA BZR NEZADOVOLJAVAJUĆE";
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.memorandum}>
          <Text style={styles.firmName}>INPRO BZR</Text>
          <Text style={styles.firmSub}>Bezbednost i zdravlje na radu</Text>
          <Text style={styles.firmSub}>d.o.o. Bajina Bašta</Text>
          <Text style={styles.firmSub}>office@inpro.rs</Text>

          <View style={styles.line} />

          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaRow}>Poslodavac: {employerName || "-"}</Text>
          <Text style={styles.metaRow}>Firma: {companyName || "-"}</Text>
          <Text style={styles.metaRow}>Email: {employerEmail || "-"}</Text>
          <Text style={styles.metaRow}>Kontakt: {contactPerson || "-"}</Text>
          <Text style={styles.metaRow}>Datum: {inspectionDate || "-"}</Text>
          <Text style={styles.metaRow}>Savetnik: {advisorName || "-"}</Text>
        </View>

        {items.map((item, i) => {
          const itemPhotos = item.photos || [];

          return (
            <View key={i} style={styles.item}>
              <Text style={styles.question}>
                {i + 1}. {item.question}
              </Text>

              <Text>
                Odgovor:{" "}
                <Text
                  style={
                    item.answer === "NE" ? styles.answerNo : styles.answerYes
                  }
                >
                  {item.answer || "-"}
                </Text>
              </Text>

              <Text style={styles.comment}>
                Komentar: {item.comment || "—"}
              </Text>

              {itemPhotos.length > 0 && (
                <View style={styles.photosWrap}>
                  {itemPhotos.map((src, idx) => (
                    <Image
                      key={idx}
                      src={fullImageUrl(src)}
                      style={styles.photo}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {photos.length > 0 && (
          <View style={styles.item}>
            <Text style={styles.question}>Fotografije kontrole</Text>

            <View style={styles.photosWrap}>
              {photos.map((src, idx) => (
                <Image
                  key={idx}
                  src={fullImageUrl(src)}
                  style={styles.photo}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.conclusion}>
          <Text style={styles.conclusionTitle}>ZAKLJUČAK</Text>
          <Text>Ukupan broj pitanja: {valid.length}</Text>
          <Text>Broj odgovora DA: {da}</Text>
          <Text>Broj odgovora NE: {ne}</Text>
          <Text>Ocena: {stanje}</Text>
        </View>
      </Page>
    </Document>
  );
}