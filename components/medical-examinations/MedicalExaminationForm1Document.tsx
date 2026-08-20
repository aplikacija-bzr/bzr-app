import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

import type {
  MedicalExaminationForm1Data,
} from '@/lib/medical-examination-session'

type MedicalExaminationForm1DocumentProps = {
  data: MedicalExaminationForm1Data
}

Font.register({
  family: 'DejaVu Sans',
  fonts: [
    {
      src: 'http://localhost:3000/fonts/DejaVuSans.ttf',
      fontWeight: 400,
    },
    {
      src: 'http://localhost:3000/fonts/DejaVuSans-Bold.ttf',
      fontWeight: 700,
    },
  ],
})

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return ''
  }

  const date =
    new Date(`${value}T00:00:00`)

  if (
    Number.isNaN(date.getTime())
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'sr-RS',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(date)
}

function formatExaminationType(
  value: string
) {
  if (value === 'PREVIOUS') {
    return 'Prethodni'
  }

  if (value === 'PERIODIC') {
    return 'Periodični'
  }

  return value
}

const styles =
  StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 28,
      paddingHorizontal: 20,
      fontFamily: 'DejaVu Sans',
      fontSize: 6.5,
    },

    title: {
      fontSize: 12,
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 14,
    },

    employerBlock: {
      marginBottom: 12,
    },

    employerRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },

    employerLabel: {
      fontWeight: 700,
      marginRight: 4,
    },

    employerName: {
      fontWeight: 700,
    },

    table: {
      width: '100%',
      borderTopWidth: 0.7,
      borderLeftWidth: 0.7,
      borderColor: '#000000',
    },

    tableRow: {
      flexDirection: 'row',
    },

    headerCell: {
      borderRightWidth: 0.7,
      borderBottomWidth: 0.7,
      borderColor: '#000000',
      padding: 3,
      minHeight: 42,
      justifyContent: 'center',
      alignItems: 'center',
    },

    cell: {
      borderRightWidth: 0.7,
      borderBottomWidth: 0.7,
      borderColor: '#000000',
      padding: 3,
      minHeight: 28,
      justifyContent: 'center',
    },

    headerText: {
      fontSize: 5.8,
      fontWeight: 700,
      textAlign: 'center',
    },

    centerText: {
      textAlign: 'center',
    },

    colNumber: {
      width: '4%',
    },

    colJob: {
      width: '14%',
    },

    colEmployee: {
      width: '15%',
    },

    colInterval: {
      width: '7%',
    },

    colType: {
      width: '8%',
    },

    colDate: {
      width: '9%',
    },

    colNextDate: {
      width: '9%',
    },

    colReport: {
      width: '10%',
    },

    colFitness: {
      width: '12%',
    },

    colMeasures: {
      width: '12%',
    },

    emptyMessage: {
      padding: 12,
      textAlign: 'center',
      borderRightWidth: 0.7,
      borderBottomWidth: 0.7,
      borderColor: '#000000',
    },

    pageNumber: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      fontSize: 6,
      textAlign: 'center',
    },
  })

export default function MedicalExaminationForm1Document({
  data,
}: MedicalExaminationForm1DocumentProps) {
  const employerAddress = [
    data.employer.address,
    data.employer.city,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        <Text style={styles.title}>
          EVIDENCIJA O LEKARSKIM PREGLEDIMA
          ZAPOSLENIH NA RADNIM MESTIMA SA
          POVEĆANIM RIZIKOM
        </Text>

        <View style={styles.employerBlock}>
          <View style={styles.employerRow}>
            <Text style={styles.employerLabel}>
              Poslodavac:
            </Text>

            <Text style={styles.employerName}>
              {data.employer.name}
            </Text>
          </View>

          <View style={styles.employerRow}>
            <Text style={styles.employerLabel}>
              PIB:
            </Text>

            <Text>
              {data.employer.pib ?? ''}
            </Text>
          </View>

          <View style={styles.employerRow}>
            <Text style={styles.employerLabel}>
              Adresa:
            </Text>

            <Text>
              {employerAddress}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View
            style={styles.tableRow}
            fixed
          >
            <View
              style={[
                styles.headerCell,
                styles.colNumber,
              ]}
            >
              <Text style={styles.headerText}>
                Redni broj
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colJob,
              ]}
            >
              <Text style={styles.headerText}>
                Radno mesto sa povećanim rizikom
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colEmployee,
              ]}
            >
              <Text style={styles.headerText}>
                Ime i prezime zaposlenog
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colInterval,
              ]}
            >
              <Text style={styles.headerText}>
                Interval u mesecima
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colType,
              ]}
            >
              <Text style={styles.headerText}>
                Vrsta pregleda
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colDate,
              ]}
            >
              <Text style={styles.headerText}>
                Datum pregleda
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colNextDate,
              ]}
            >
              <Text style={styles.headerText}>
                Sledeći pregled
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colReport,
              ]}
            >
              <Text style={styles.headerText}>
                Broj lekarskog izveštaja
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colFitness,
              ]}
            >
              <Text style={styles.headerText}>
                Ocena zdravstvene sposobnosti
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.colMeasures,
              ]}
            >
              <Text style={styles.headerText}>
                Napomena / preduzete mere
              </Text>
            </View>
          </View>

          {data.records.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Nema evidentiranih lekarskih pregleda
              za izabranog poslodavca.
            </Text>
          ) : (
            data.records.map(
              (record, index) => (
                <View
                  key={record.id}
                  style={styles.tableRow}
                  wrap={false}
                >
                  <View
                    style={[
                      styles.cell,
                      styles.colNumber,
                    ]}
                  >
                    <Text
                      style={
                        styles.centerText
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colJob,
                    ]}
                  >
                    <Text>
                      {
                        record.jobPositionName
                      }
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colEmployee,
                    ]}
                  >
                    <Text>
                      {record.employeeName}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colInterval,
                    ]}
                  >
                    <Text
                      style={
                        styles.centerText
                      }
                    >
                      {record.intervalMonths ??
                        ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colType,
                    ]}
                  >
                    <Text
                      style={
                        styles.centerText
                      }
                    >
                      {formatExaminationType(
                        record.examinationType
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colDate,
                    ]}
                  >
                    <Text
                      style={
                        styles.centerText
                      }
                    >
                      {formatDate(
                        record.examinationDate
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colNextDate,
                    ]}
                  >
                    <Text
                      style={
                        styles.centerText
                      }
                    >
                      {formatDate(
                        record.nextExaminationDate
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colReport,
                    ]}
                  >
                    <Text>
                      {record.reportNumber ??
                        ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colFitness,
                    ]}
                  >
                    <Text>
                      {record.fitnessAssessment ??
                        ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.colMeasures,
                    ]}
                  >
                    <Text>
                      {record.measures ?? ''}
                    </Text>
                  </View>
                </View>
              )
            )
          )}
        </View>

        <Text
          style={styles.pageNumber}
          fixed
          render={({
            pageNumber,
            totalPages,
          }) =>
            `Strana ${pageNumber} od ${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}