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

export type TrainingTermPlanEmployee = {
  firstName: string
  lastName: string
  jobPositionName: string
}

export type TrainingTermPlanData = {
  trainingSessionId: string
  employerName: string
  practicalInstructorName: string
  safetyAdvisorName: string
  scheduleLocation?: string
  employees: TrainingTermPlanEmployee[]
 schedule: {
  theoryTrainingDate: string
  theoryTrainingEndDate: string
  theoryAssessmentDate: string
  practicalTrainingDate: string
  practicalTrainingEndDate: string
  practicalAssessmentDate: string
}
}

type Props = {
  data: TrainingTermPlanData
}

function formatDate(value?: string) {
  if (!value) return '—'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${day}.${month}.${year}.`
}

function ActivityRow({
  title,
  startDate,
  endDate,
  assessmentDate,
}: {
  title: string
  startDate: string
  endDate: string
  assessmentDate: string
}) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text style={[styles.cell, styles.activityCell]}>{title}</Text>
      <Text style={[styles.cell, styles.dateCell]}>
        {formatDate(startDate)}
      </Text>
      <Text style={[styles.cell, styles.dateCell]}>
        {formatDate(endDate)}
      </Text>
      <Text style={[styles.cell, styles.noteCell]}>
        {formatDate(assessmentDate)}
      </Text>
    </View>
  )
}

export default function TrainingTermPlanDocument({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          TERMINSKI PLAN OBUKE ZA BEZBEDAN I ZDRAV RAD
        </Text>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Naziv poslodavca:</Text>
            <Text style={styles.infoValue}>{data.employerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instruktor praktične obuke:</Text>
            <Text style={styles.infoValue}>{data.practicalInstructorName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Savetnik za BZR:</Text>
            <Text style={styles.infoValue}>{data.safetyAdvisorName}</Text>
          </View>

          {data.scheduleLocation ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mesto održavanja:</Text>
              <Text style={styles.infoValue}>{data.scheduleLocation}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>RADNA MESTA</Text>

        <View style={styles.employeeTable}>
          <View style={styles.tableHeader} wrap={false}>
            <Text style={[styles.headerCell, styles.numberCell]}>Red. br.</Text>
            <Text style={[styles.headerCell, styles.employeeCell]}>
              Ime i prezime zaposlenog
            </Text>
            <Text style={[styles.headerCell, styles.jobCell]}>
              Naziv radnog mesta
            </Text>
          </View>

          {data.employees.map((employee, index) => (
            <View
              key={`${employee.firstName}-${employee.lastName}-${employee.jobPositionName}-${index}`}
              style={styles.tableRow}
              wrap={false}
            >
              <Text style={[styles.cell, styles.numberCell]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.employeeCell]}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text style={[styles.cell, styles.jobCell]}>
                {employee.jobPositionName}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>PLAN OBUKE I PROVERE</Text>

        <View style={styles.activityTable}>
          <View style={styles.tableHeader} wrap={false}>
            <Text style={[styles.headerCell, styles.activityCell]}>
              Vrsta aktivnosti
            </Text>
            <Text style={[styles.headerCell, styles.dateCell]}>
              Datum početka
            </Text>
            <Text style={[styles.headerCell, styles.dateCell]}>
              Datum završetka
            </Text>
            <Text style={[styles.headerCell, styles.noteCell]}>
  Datum provere obučenosti
</Text>
          </View>

        <ActivityRow
  title="Teorijska obuka"
  startDate={data.schedule.theoryTrainingDate}
  endDate={data.schedule.theoryTrainingEndDate}
  assessmentDate={data.schedule.theoryAssessmentDate}
/>

<ActivityRow
  title="Praktična obuka"
  startDate={data.schedule.practicalTrainingDate}
  endDate={data.schedule.practicalTrainingEndDate}
  assessmentDate={data.schedule.practicalAssessmentDate}
/>
        </View>

        <View style={styles.signatures} wrap={false}>
          <Text style={styles.signatureTitle}>Potpisi:</Text>

          <View style={styles.signatureRow}>
            <Text>Instruktor praktične obuke:</Text>
            <Text style={styles.signatureLine}>____________________________</Text>
          </View>

          <View style={styles.signatureRow}>
            <Text>Savetnik za BZR:</Text>
            <Text style={styles.signatureLine}>____________________________</Text>
          </View>

          <View style={styles.signatureRow}>
            <Text>Datum:</Text>
            <Text style={styles.signatureLine}>____________________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 42,
    fontFamily: 'DejaVuSans',
    fontSize: 9.5,
    color: '#111827',
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 22,
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 5,
    marginBottom: 7,
  },
  employeeTable: {
    borderTopWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: '#334155',
    marginBottom: 20,
  },
  activityTable: {
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
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#334155',
    fontWeight: 700,
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#334155',
  },
  numberCell: {
    width: 52,
    textAlign: 'center',
  },
  employeeCell: {
    width: 205,
  },
  jobCell: {
    flex: 1,
  },
  activityCell: {
    width: 185,
  },
  dateCell: {
    width: 92,
    textAlign: 'center',
  },
  noteCell: {
    flex: 1,
  },
  signatures: {
    marginTop: 28,
  },
  signatureTitle: {
    fontWeight: 700,
    marginBottom: 12,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  signatureLine: {
    marginLeft: 10,
  },
})