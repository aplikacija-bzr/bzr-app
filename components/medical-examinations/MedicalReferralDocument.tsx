import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

import type {
  MedicalReferralData,
} from '@/lib/medical-examination-session'

type MedicalReferralDocumentProps = {
  data: MedicalReferralData
}

Font.register({
  family: 'DejaVu Sans',
  fonts: [
    {
      src: '/fonts/DejaVuSans.ttf',
      fontWeight: 400,
    },
    {
      src: '/fonts/DejaVuSans-Bold.ttf',
      fontWeight: 700,
    },
  ],
})

function formatCurrentDate() {
  return new Intl.DateTimeFormat(
    'sr-RS',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(new Date())
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return ''
  }

  const date = new Date(
    `${value}T00:00:00`
  )

  if (Number.isNaN(date.getTime())) {
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

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8,
    fontFamily: 'DejaVu Sans',
  },

  formLabel: {
    textAlign: 'center',
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerColumn: {
    width: '42%',
  },

  fieldBlock: {
    marginBottom: 6,
  },

  fieldValue: {
    minHeight: 14,
    borderBottomWidth: 0.7,
    borderBottomColor: '#000000',
    paddingBottom: 2,
    textAlign: 'center',
  },

  caption: {
    marginTop: 2,
    fontSize: 5.5,
    textAlign: 'center',
  },

  title: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'DejaVu Sans',
    fontWeight: 700,
  },

  referralRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },

  referralLabel: {
    fontSize: 7,
    marginRight: 4,
  },

  flexField: {
    flexGrow: 1,
  },

  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  employeeField: {
    width: '31%',
  },
})

export default function MedicalReferralDocument({
  data,
}: MedicalReferralDocumentProps) {
  const isPrevious =
    data.examinationType === 'PREVIOUS'

  const fullName =
    `${data.employee.firstName} ${data.employee.lastName}`

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
        style={styles.page}
      >
        <Text style={styles.formLabel}>
          {isPrevious
            ? 'Obrazac 1'
            : 'Obrazac 2'}
        </Text>

        <View style={styles.headerRow}>
          <View style={styles.headerColumn}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {data.employer.name}
              </Text>

              <Text style={styles.caption}>
                (poslodavac)
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {employerAddress}
              </Text>

              <Text style={styles.caption}>
                (adresa)
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {formatCurrentDate()}
              </Text>

              <Text style={styles.caption}>
                (datum)
              </Text>
            </View>
          </View>

          <View style={styles.headerColumn}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {data.employer.registrationNumber ?? ''}
              </Text>

              <Text style={styles.caption}>
                (matični broj iz jedinstvenog registra)
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {data.employer.activityCode ?? ''}
              </Text>

              <Text style={styles.caption}>
                (šifra delatnosti)
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldValue}>
                {data.referralNumber ?? ''}
              </Text>

              <Text style={styles.caption}>
                (broj uputa)
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          {isPrevious
            ? 'UPUT ZA PRETHODNI LEKARSKI PREGLED ZAPOSLENOG(E)'
            : 'UPUT ZA PERIODIČNI LEKARSKI PREGLED ZAPOSLENOG'}
        </Text>

        <View style={styles.referralRow}>
          <Text style={styles.referralLabel}>
            Upućuje se na{' '}
            {isPrevious
              ? 'PRETHODNI'
              : 'PERIODIČNI/KONTROLNI'}{' '}
            pregled
          </Text>

          <View style={styles.flexField}>
            <Text style={styles.fieldValue}>
              {fullName}
            </Text>

            <Text style={styles.caption}>
              (ime, očevo ime i prezime)
            </Text>
          </View>
        </View>

        <View style={styles.employeeRow}>
          <View style={styles.employeeField}>
            <Text style={styles.fieldValue}>
              {data.employee.jmbg ?? ''}
            </Text>

            <Text style={styles.caption}>
              (JMBG)
            </Text>
          </View>

          <View style={styles.employeeField}>
            <Text style={styles.fieldValue}>
              {data.employee.placeOfBirth ?? ''}
            </Text>

            <Text style={styles.caption}>
              (mesto rođenja)
            </Text>
          </View>

          <View style={styles.employeeField}>
            <Text style={styles.fieldValue}>
              {data.employee.occupation ?? ''}
            </Text>

            <Text style={styles.caption}>
              (zanimanje)
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginTop: 5,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              marginRight: 4,
            }}
          >
            koji treba da radi na radnom mestu
          </Text>

          <View style={{ flexGrow: 1 }}>
            <Text style={styles.fieldValue}>
              {data.jobPosition.name}
            </Text>

            <Text style={styles.caption}>
              (naziv radnog mesta)
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 2,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              lineHeight: 1.5,
            }}
          >
            radi ocene ispunjenosti posebnih zdravstvenih sposobnosti za obavljanje
            poslova na tom radnom mestu - koje je Aktom o proceni rizika
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginTop: 3,
            }}
          >
            <View style={{ flexGrow: 1 }}>
              <Text style={styles.fieldValue}>
                {[
                  data.riskAssessmentIssuer,
                  data.riskAssessmentYear
                    ? `iz ${data.riskAssessmentYear}. godine`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </Text>

              <Text style={styles.caption}>
                (naziv poslodavca, broj i datum donošenja Akta)
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 7,
              marginTop: 4,
            }}
          >
            utvrđeno kao radno mesto sa povećanim rizikom.
          </Text>
        </View>


        {!isPrevious && (
          <View
            wrap={false}
            style={{
              marginTop: 2,
              marginBottom: 5,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  marginRight: 4,
                }}
              >
                Pri prethodnom/periodičnom pregledu obavljenom
              </Text>

              <View style={{ width: '38%' }}>
                <Text style={styles.fieldValue}>
                  {formatDate(
                    data.previousExamination
                      ?.examinationDate
                  )}
                </Text>

                <Text style={styles.caption}>
                  (dan, mesec i godina)
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  marginRight: 4,
                }}
              >
                u zdravstvenoj ustanovi
              </Text>

              <View
                style={{
                  width: '28%',
                  marginRight: 8,
                }}
              >
                <Text style={styles.fieldValue}>
                  {' '}
                </Text>

                <Text style={styles.caption}>
                  (naziv zdravstvene ustanove)
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 7,
                  marginRight: 4,
                }}
              >
                šifra medicine rada, utvrđeno je:
              </Text>

              <View style={{ flexGrow: 1 }}>
                <Text style={styles.fieldValue}>
                  {' '}
                </Text>
              </View>
            </View>

            <Text style={styles.fieldValue}>
              {data.previousExamination
                ?.fitnessAssessment ?? ''}
            </Text>

            <Text style={styles.caption}>
              (sposoban; sposoban sa ograničenjem)
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  marginRight: 4,
                }}
              >
                Broj izveštaja:
              </Text>

              <View style={{ width: '35%' }}>
                <Text style={styles.fieldValue}>
                  {data.previousExamination
                    ?.reportNumber ?? ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View
          style={{
            marginTop: 4,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              marginBottom: 4,
            }}
          >
            • Kratak opis poslova na radnom mestu:
          </Text>

          <Text
            style={{
              minHeight: 28,
              borderBottomWidth: 0.7,
              borderBottomColor: '#000000',
              paddingBottom: 3,
              fontSize: 7,
              lineHeight: 1.4,
            }}
          >
            {data.jobPosition.jobTasks ?? ''}
          </Text>
        </View>

        <View
          style={{
            marginTop: 4,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              marginBottom: 4,
            }}
          >
            • Procenjeni rizici na radnom mestu i u radnoj okolini - utvrđeni Aktom o proceni rizika:
          </Text>

          <Text
            style={{
              minHeight: 28,
              borderBottomWidth: 0.7,
              borderBottomColor: '#000000',
              paddingBottom: 3,
              fontSize: 7,
              lineHeight: 1.4,
            }}
          >
            {data.jobPosition.hazards ?? ''}
          </Text>

          <Text style={styles.caption}>
            (opasnosti i štetnosti sa izmerenim vrednostima)
          </Text>
        </View>

        <View
          style={{
            marginTop: 4,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              marginBottom: 4,
            }}
          >
            • Posebni zdravstveni uslovi utvrđeni Aktom o proceni rizika - koje zaposleni(a) mora ispunjavati:
          </Text>

          <Text
            style={{
              minHeight: 28,
              borderBottomWidth: 0.7,
              borderBottomColor: '#000000',
              paddingBottom: 3,
              fontSize: 7,
              lineHeight: 1.4,
            }}
          >
            {data.jobPosition.medicalRequirements ?? ''}
          </Text>
        </View>

        <View
          wrap={false}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 12,
          }}
        >
          <View style={{ width: '28%' }}>
            <Text
              style={{
                fontSize: 6,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Mesto i datum:
            </Text>

            <Text style={styles.fieldValue}>
              {[
                data.employer.city,
                formatCurrentDate(),
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          <View
            style={{
              width: '20%',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Text
              style={{
                fontSize: 6,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              (M.P.)
            </Text>
          </View>

          <View style={{ width: '28%' }}>
            <Text
              style={{
                fontSize: 6,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Poslodavac:
            </Text>

            <Text style={styles.fieldValue}>
              {' '}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}