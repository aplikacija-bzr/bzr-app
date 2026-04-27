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
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

const logoUrl = `${appUrl}/logo-transparentan.png`;
const fontRegularUrl = `${appUrl}/fonts/DejaVuSans.ttf`;
const fontBoldUrl = `${appUrl}/fonts/DejaVuSans-Bold.ttf`;

Font.register({
  family: "DejaVuSans",
  fonts: [
    { src: fontRegularUrl, fontWeight: "normal" },
    { src: fontBoldUrl, fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "DejaVuSans",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "column",
    flexGrow: 1,
    paddingRight: 12,
  },
  logoRight: {
    width: 120,
    height: 50,
    objectFit: "contain",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
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
    marginBottom: 4,
    fontWeight: "bold",
  },
  answer: {
    fontSize: 10,
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
    fontSize: 10,
    marginBottom: 4,
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  photoBox: {
    width: 150,
    marginRight: 8,
    marginBottom: 8,
  },
  photo: {
    width: 150,
    height: 100,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  photoCaption: {
    fontSize: 8,
    marginTop: 2,
  },
  photosPageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  conclusionBox: {
    marginTop: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
  },
  conclusionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  conclusionText: {
    marginBottom: 4,
  },
});

function MainContent({
  companyName,
  inspectionDate,
  advisorName,
  employerName,
  employerEmail,
  contactPerson,
  items,
  title,
}: Omit<Props, "photos">) {
  const validItems = items.filter(
    (item) => item.answer === "DA" || item.answer === "NE"
  );

  const daCount = validItems.filter((item) => item.answer === "DA").length;
  const neCount = validItems.filter((item) => item.answer === "NE").length;

  let stanje = "MERE ZA BZR PRIMENJENE";
  let preporuka = "Nisu potrebne dodatne korektivne mere.";

  if (neCount === 1) {
    stanje = "MERE ZA BZR PRIMENJENE ZADOVOLJAVAJUĆE";
    preporuka = "Potrebna korekcija i kontrola.";
  } else if (neCount > 1) {
    stanje = "MERE ZA BZR NEZADOVOLJAVAJUĆE";
    preporuka = "Potrebna korekcija i nadzor.";
  }

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{inspectionDate}</Text>
        </View>

        <Image src={logoUrl} style={styles.logoRight} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaRow}>Poslodavac: {employerName || "-"}</Text>
        <Text style={styles.metaRow}>Firma: {companyName || "-"}</Text>
        <Text style={styles.metaRow}>Email: {employerEmail || "-"}</Text>
        <Text style={styles.metaRow}>Kontakt lice: {contactPerson || "-"}</Text>
        <Text style={styles.metaRow}>Savetnik: {advisorName || "-"}</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.question}>
            {index + 1}. {item.question}
          </Text>

          <Text style={styles.answer}>
            Odgovor:{" "}
            <Text
              style={item.answer === "NE" ? styles.answerNo : styles.answerYes}
            >
              {item.answer || "-"}
            </Text>
          </Text>

          <Text style={styles.comment}>
            Komentar:{" "}
            {item.comment && item.comment.trim() !== "" ? item.comment : "—"}
          </Text>
        </View>
      ))}

      <View style={styles.conclusionBox}>
        <Text style={styles.conclusionTitle}>ZAKLJUČAK</Text>
        <Text style={styles.conclusionText}>
          Ukupan broj pitanja: {validItems.length}
        </Text>
        <Text style={styles.conclusionText}>Broj odgovora DA: {daCount}</Text>
        <Text style={styles.conclusionText}>Broj odgovora NE: {neCount}</Text>
        <Text style={styles.conclusionText}>Ocena: {stanje}</Text>
        <Text style={styles.conclusionText}>Napomena: {preporuka}</Text>
      </View>
    </>
  );
}

function PhotosPage({ photos }: { photos: string[] }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.photosPageTitle}>Fotografije kontrole</Text>

      <View style={styles.photoRow}>
        {photos.map((p, i) => (
          <View key={i} style={styles.photoBox}>
            <Image src={p} style={styles.photo} />
            <Text style={styles.photoCaption}>Fotografija {i + 1}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

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
  const photosFromItems = items.flatMap((item) => item.photos || []);
  const allPhotos = photos.length > 0 ? photos : photosFromItems;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <MainContent
          companyName={companyName}
          inspectionDate={inspectionDate}
          advisorName={advisorName}
          employerName={employerName}
          employerEmail={employerEmail}
          contactPerson={contactPerson}
          items={items}
          title={title}
        />
      </Page>

      {allPhotos.length > 0 ? <PhotosPage photos={allPhotos} /> : null}
    </Document>
  );
}