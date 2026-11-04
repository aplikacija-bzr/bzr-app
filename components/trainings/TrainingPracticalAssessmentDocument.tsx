import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
Font.register({
  family: 'DejaVuSans',
  fonts: [
    {
      src: `${process.cwd()}/public/fonts/DejaVuSans.ttf`,
      fontWeight: 400,
    },
    {
      src: `${process.cwd()}/public/fonts/DejaVuSans-Bold.ttf`,
      fontWeight: 700,
    },
  ],
})

export type TrainingPracticalAssessmentItem = {
  id: string
  assessmentType: 'HAZARD' | 'PPE'
  code?: string | null
  name?: string | null
  description: string
  passed: boolean | null
  notes?: string | null
  sortOrder: number
}

export type TrainingPracticalAssessmentEmployee = {
  id: string
  firstName: string
  lastName: string
  jobPositionName: string
  practicalPassed: boolean | null
  practicalAssessmentDate?: string | null
  practicalItems: TrainingPracticalAssessmentItem[]
}

export type TrainingPracticalAssessmentData = {
  trainingSessionId: string
  trainingNumber: string
  employerName: string
  practicalInstructorName: string
  safetyAdvisorName: string
  employees: TrainingPracticalAssessmentEmployee[]
}

type Props = {
  data: TrainingPracticalAssessmentData
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${day}.${month}.${year}.`
}

function formatResult(value: boolean | null) {
  if (value === true) return 'POLOŽIO'
  if (value === false) return 'NIJE POLOŽIO'

  return 'NIJE OCENJENO'
}

function PracticalItemRow({
  item,
  index,
}: {
  item: TrainingPracticalAssessmentItem
  index: number
}) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text style={[styles.cell, styles.numberCell]}>
        {index + 1}
      </Text>

      <View style={[styles.cell, styles.descriptionCell]}>
        {item.code || item.name ? (
          <Text style={styles.itemTitle}>
            {item.code ? `${item.code} – ` : ''}
            {item.name ?? ''}
          </Text>
        ) : null}

        <Text>{item.description}</Text>
      </View>

      <Text style={[styles.cell, styles.resultCell]}>
        {formatResult(item.passed)}
      </Text>

      <Text style={[styles.cell, styles.noteCell]}>
        {item.notes || ''}
      </Text>
    </View>
  )
}

function PracticalSection({
  title,
  items,
}: {
  title: string
  items: TrainingPracticalAssessmentItem[]
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>
          Nema pripremljenih stavki praktične provere.
        </Text>
      ) : (
        <View style={styles.assessmentTable}>
          <View style={styles.tableHeader} wrap={false}>
            <Text style={[styles.headerCell, styles.numberCell]}>
              Red. br.
            </Text>

            <Text style={[styles.headerCell, styles.descriptionCell]}>
              Kriterijum praktične provere
            </Text>

            <Text style={[styles.headerCell, styles.resultCell]}>
              Rezultat
            </Text>

            <Text style={[styles.headerCell, styles.noteCell]}>
              Napomena
            </Text>
          </View>

          {items.map((item, index) => (
            <PracticalItemRow
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </View>
      )}
    </View>
  )
}

export default function TrainingPracticalAssessmentDocument({
  data,
}: Props) {
  return (
    <Document>
      {data.employees.map((employee) => {
        const hazardItems =
          employee.practicalItems
            .filter(
              (item) =>
                item.assessmentType === 'HAZARD'
            )
            .sort(
              (a, b) =>
                a.sortOrder - b.sortOrder
            )

        const ppeItems =
          employee.practicalItems
            .filter(
              (item) =>
                item.assessmentType === 'PPE'
            )
            .sort(
              (a, b) =>
                a.sortOrder - b.sortOrder
            )

        return (
          <Page
            key={employee.id}
            size="A4"
            style={styles.page}
          >
            <Text style={styles.title}>
              PRAKTIČNA PROVERA OBUČENOSTI ZA BEZBEDAN I ZDRAV RAD
            </Text>

            <Text style={styles.subtitle}>
              I PRAVILNOG KORIŠĆENJA LIČNE ZAŠTITNE OPREME
            </Text>

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Poslodavac:
                </Text>

                <Text style={styles.infoValue}>
                  {data.employerName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Broj obuke:
                </Text>

                <Text style={styles.infoValue}>
                  {data.trainingNumber}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Zaposleni:
                </Text>

                <Text style={styles.infoValue}>
                  {employee.firstName}{' '}
                  {employee.lastName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Radno mesto:
                </Text>

                <Text style={styles.infoValue}>
                  {employee.jobPositionName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Datum praktične provere:
                </Text>

                <Text style={styles.infoValue}>
                  {formatDate(
                    employee.practicalAssessmentDate
                  )}
                </Text>
              </View>
            </View>

            <PracticalSection
              title="A. PRAKTIČNA PROVERA BEZBEDNOG RADA – OPASNOSTI"
              items={hazardItems}
            />

            <PracticalSection
              title="B. PRAKTIČNA PROVERA PRAVILNOG KORIŠĆENJA – LZO"
              items={ppeItems}
            />

            <View
              style={styles.finalResult}
              wrap={false}
            >
              <Text style={styles.finalResultLabel}>
                ZBIRNI REZULTAT PRAKTIČNE PROVERE:
              </Text>

              <Text style={styles.finalResultValue}>
                {formatResult(
                  employee.practicalPassed
                )}
              </Text>
            </View>

            <View
              style={styles.signatures}
              wrap={false}
            >
              <Text style={styles.signatureTitle}>
                Potpisi:
              </Text>
<View style={styles.signatureRow}>
  <View style={styles.signatureBlock}>
    <Text>
      Zaposleni:
    </Text>

    <Text style={styles.signatureName}>
      {employee.firstName}{' '}
      {employee.lastName}
    </Text>

    <Text style={styles.signatureLine}>
      ____________________________
    </Text>
  </View>

  <View style={styles.signatureBlock}>
    <Text>
      Instruktor praktične obuke:
    </Text>

    <Text style={styles.signatureName}>
      {data.practicalInstructorName}
    </Text>

    <Text style={styles.signatureLine}>
      ____________________________
    </Text>
  </View>

  <View style={styles.signatureBlock}>
    <Text>
      Savetnik za BZR:
    </Text>

    <Text style={styles.signatureName}>
      {data.safetyAdvisorName}
    </Text>

    <Text style={styles.signatureLine}>
      ____________________________
    </Text>
  </View>
</View>

              <View style={styles.dateRow}>
                <Text>Datum:</Text>

                <Text style={styles.dateLine}>
                  {formatDate(
                    employee.practicalAssessmentDate
                  )}
                </Text>
              </View>
            </View>
                        <Text
              style={styles.pageNumber}
              fixed
              render={({ pageNumber, totalPages }) =>
                `Strana ${pageNumber} od ${totalPages}`
              }
            />
          </Page>
        )
      })}
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 42,
    fontFamily: 'DejaVuSans',
    fontSize: 8.5,
    color: '#111827',
  },

  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  infoBlock: {
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },

  infoLabel: {
    width: 150,
    fontWeight: 700,
  },

  infoValue: {
    flex: 1,
    borderBottomWidth: 0.7,
    borderBottomColor: '#64748b',
    paddingBottom: 2,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 7,
  },

  emptyText: {
    paddingVertical: 8,
  },

  assessmentTable: {
    borderTopWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: '#334155',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
  },

  tableRow: {
    flexDirection: 'row',
  },

  headerCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#334155',
    fontWeight: 700,
  },

  cell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#334155',
  },

  numberCell: {
    width: 42,
    textAlign: 'center',
  },

  descriptionCell: {
    flex: 1,
  },

  resultCell: {
    width: 76,
    textAlign: 'center',
  },

  noteCell: {
    width: 105,
  },

  itemTitle: {
    fontWeight: 700,
    marginBottom: 3,
  },

  finalResult: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },

  finalResultLabel: {
    fontWeight: 700,
    flex: 1,
  },

  finalResultValue: {
    width: 110,
    fontWeight: 700,
    textAlign: 'center',
  },

  signatures: {
    marginTop: 28,
  },

  signatureTitle: {
    fontWeight: 700,
    marginBottom: 14,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  signatureBlock: {
    width: '31%',
  },

  signatureName: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 700,
  },

  signatureLine: {
    marginTop: 8,
  },

  dateRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'flex-end',
  },

  dateLine: {
    marginLeft: 10,
    borderBottomWidth: 0.7,
    borderBottomColor: '#64748b',
    minWidth: 100,
    paddingBottom: 2,
  },
    pageNumber: {
    position: 'absolute',
    bottom: 18,
    right: 42,
    fontSize: 8,
  },
})