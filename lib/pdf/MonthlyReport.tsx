import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "DejaVuSans",
  src: path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"),
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "DejaVuSans",
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    marginBottom: 4,
  },
  section: {
    marginTop: 15,
  },
  card: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
});

export default function MonthlyReport({
  companyName,
  month,
  controls,
}: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Mesečni BZR izveštaj</Text>

        <Text style={styles.text}>Firma: {companyName}</Text>
        <Text style={styles.text}>Period: {month}</Text>
        <Text style={styles.text}>
          Ukupan broj kontrola: {controls?.length || 0}
        </Text>

        <View style={styles.section}>
          <Text style={styles.title}>Kontrole</Text>

          {controls?.map((c: any, i: number) => (
            <View key={i} style={styles.card}>
              <Text style={styles.text}>Kontrola #{i + 1}</Text>
              <Text style={styles.text}>
                Objekat: {c.objectName || "-"}
              </Text>
              <Text style={styles.text}>
                Datum: {c.date || "-"}
              </Text>
              <Text style={styles.text}>
                Status: {c.status || "-"}
              </Text>
              <Text style={styles.text}>
                Savetnik: {c.adviser || "-"}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}