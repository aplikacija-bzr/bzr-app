
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

export type TrainingRecordHazard = {
  code: string
  name: string
  category: 'OPASNOST' | 'STETNOST'
  activities: string
}

export type TrainingRecordEmployee = {
  firstName: string
  lastName: string
  jobPositionName?: string

  theoryIncorrectPercent?: number | null
  theoryPassed?: boolean | null
  practicalPassed?: boolean | null

  note?: string | null
}

export type TrainingInstruction = {
  title: string
  version?: string | null
}

type TrainingRecordDocumentProps = {
  trainingSessionId?: string

  employerName: string
  trainingNumber?: string | null

  employeeName?: string
  jobPositionName: string
  jobDescription?: string | null

  trainingReason: string
  trainingReasonCode?: string | null

  scheduleLocation?: string | null

  theoryTrainingDate?: string | null
  practicalTrainingDate?: string | null
  theoryAssessmentDate?: string | null
  practicalAssessmentDate?: string | null

  practicalInstructorName?: string | null
  safetyAdvisorName?: string | null

  theoryIncorrectPercent?: number | null
  theoryPassed?: boolean | null
  practicalPassed?: boolean | null

  hazards?: TrainingRecordHazard[]

  employees?: TrainingRecordEmployee[]

  instructions?: TrainingInstruction[]

  includeWorkAtHeightModule?: boolean
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return '—'
  }

  const [year, month, day] =
    value.split('-')

  if (
    !year ||
    !month ||
    !day
  ) {
    return value
  }

  return `${day}.${month}.${year}.`
}

function formatResult(
  value?: boolean | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—'
  }

  return value
    ? 'POLOŽIO'
    : 'NIJE POLOŽIO'
}

const trainingReasons = [
  {
    code: '01',
    text:
      'prilikom zasnivanja radnog odnosa, odnosno drugog radnog angažovanja',
  },
  {
    code: '02',
    text:
      'usled premeštaja na druge poslove',
  },
  {
    code: '03',
    text:
      'prilikom uvođenja nove tehnologije ili novih sredstava za rad ili promene opreme za rad',
  },
  {
    code: '04',
    text:
      'prilikom promene radnog procesa',
  },
  {
    code: '05',
    text:
      'ako poslodavac odredi zaposlenom da obavlja poslove na dva ili više radnih mesta',
  },
  {
    code: '06',
    text:
      'ako kod poslodavca rad obavljaju zaposleni drugog poslodavca',
  },
  {
    code: '07',
    text:
      'dodatna obuka kada to zahteva radni proces',
  },
  {
    code: '08',
    text:
      'dodatna obuka u slučaju teške, smrtne ili kolektivne povrede na radu',
  },
  {
    code: '09',
    text:
      'periodična obuka zaposlenih',
  },
  {
    code: '10',
    text:
      'obuka neposrednih rukovodilaca',
  },
]

const permanentInstructions = [
  'Opšte uputstvo za bezbedan i zdrav rad',
  'Uputstvo za bezbedan i zdrav rad – ručno rukovanje teretima',
  'Uputstvo za bezbedan i zdrav rad – sprečavanje saplitanja, klizanja i padova na istom nivou',
  'Uputstvo za bezbedan i zdrav rad – bezbedno korišćenje ručnog alata',
  'Uputstvo za bezbedan i zdrav rad – upotreba sredstava i opreme za ličnu zaštitu na radu',
  'Uputstvo za bezbedan i zdrav rad – prva pomoć',
  'Uputstvo za zaštitu od požara i postupanje u slučaju požara',
  'Uputstvo za postupanje u slučaju povrede na radu, vanrednog događaja i neposredne opasnosti',
]

export default function TrainingRecordDocument({
  trainingSessionId,

  employerName,
  trainingNumber,

  employeeName,
  jobPositionName,
  jobDescription,

  trainingReason,
  trainingReasonCode,

  scheduleLocation,

  theoryTrainingDate,
  practicalTrainingDate,
  theoryAssessmentDate,
  practicalAssessmentDate,

  practicalInstructorName,
  safetyAdvisorName,

  theoryIncorrectPercent,
  theoryPassed,
  practicalPassed,

  hazards = [],

  employees = [],

  instructions = [],

  includeWorkAtHeightModule = false,
}: TrainingRecordDocumentProps) {
  const dangers =
    hazards.filter(
      (hazard) =>
        hazard.category === 'OPASNOST',
    )

  const harmfulEffects =
    hazards.filter(
      (hazard) =>
        hazard.category === 'STETNOST',
    )

  /*
   * Privremeni fallback za sadašnju
   * test API rutu.
   *
   * Kada kasnije API počne da šalje
   * pravu listu zaposlenih, koristiće se
   * employees umesto ovog jednog reda.
   */
  const documentEmployees =
    employees.length > 0
      ? employees
      : employeeName
        ? [
            {
              firstName:
                employeeName,
              lastName: '',
              jobPositionName,
              theoryIncorrectPercent,
              theoryPassed,
              practicalPassed,
              note: null,
            },
          ]
        : []

  return (
    <Document>
      <Page
        size="A4"
        style={styles.page}
      >
        <Text style={styles.companyHeader}>
          INPRO d.o.o. – BEZBEDNOST I ZDRAVLJE NA RADU
        </Text>

        <Text style={styles.title}>
          EVIDENCIJA I ZAPISNIK O SPROVEDENOJ OBUCI I PROVERI OBUČENOSTI
        </Text>

        <Text style={styles.subtitle}>
          ZA BEZBEDAN I ZDRAV RAD
        </Text>

        <View style={styles.basicInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Poslodavac:
            </Text>

            <Text style={styles.infoValue}>
              {employerName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Broj obuke:
            </Text>

            <Text style={styles.infoValue}>
              {trainingNumber ||
                trainingSessionId ||
                '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Radno mesto:
            </Text>

            <Text style={styles.infoValue}>
              {jobPositionName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Mesto sprovođenja:
            </Text>

            <Text style={styles.infoValue}>
              {scheduleLocation || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            OSNOV SPROVOĐENJA OBUKE
          </Text>

          <Text style={styles.normalText}>
            Obuka i provera obučenosti zaposlenih sprovedene su u skladu sa:
          </Text>

          <Text style={styles.bullet}>
            • Zakonom o bezbednosti i zdravlju na radu;
          </Text>

          <Text style={styles.bullet}>
            • Aktom o proceni rizika kod poslodavca;
          </Text>

          <Text style={styles.bullet}>
            • Uputstvima za bezbedan i zdrav rad;
          </Text>

          <Text style={styles.bullet}>
            • Tehničkom dokumentacijom i uputstvima proizvođača opreme za rad i sredstava i opreme za ličnu zaštitu.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            VRSTA / RAZLOG OBUKE
          </Text>

          {trainingReasons.map(
            (reason) => {
              const selected =
                trainingReasonCode ===
                reason.code

              return (
                <Text
                  key={reason.code}
                  style={styles.reasonRow}
                >
                  {reason.code} –{' '}
                  {reason.text};{' '}
                  {selected
                    ? '[X]'
                    : '[ ]'}
                </Text>
              )
            },
          )}


        </View>

        <View style={styles.section}>
          <Text style={styles.majorSectionTitle}>
            A. OPŠTI SADRŽAJ OBUKE
          </Text>

          <Text style={styles.subsectionTitle}>
            A.1. Sadržaj obuke
          </Text>

          <Text style={styles.normalText}>
            A.1.1. Upoznavanje zaposlenog sa:
          </Text>

          <Text style={styles.bullet}>
            • pravima, obavezama i odgovornostima poslodavca i zaposlenih u oblasti bezbednosti i zdravlja na radu;
          </Text>

          <Text style={styles.bullet}>
            • osnovnim principima procene rizika, prepoznatim opasnostima i štetnostima i primenom preventivnih mera;
          </Text>

          <Text style={styles.bullet}>
            • pravilnom upotrebom sredstava i opreme za ličnu zaštitu na radu;
          </Text>

          <Text style={styles.bullet}>
            • postupanjem u slučaju povrede na radu, neposredne opasnosti, vanrednog događaja i požara;
          </Text>

          <Text style={styles.bullet}>
            • osnovnim pravilima pružanja prve pomoći i obaveštavanja odgovornih lica.
          </Text>

          <Text style={styles.subsectionTitle}>
            A.2. Uputstva za bezbedan i zdrav rad
          </Text>

          <Text style={styles.normalText}>
            Zaposleni je/su upoznat/i sa sledećim opštim uputstvima za bezbedan i zdrav rad:
          </Text>

          {permanentInstructions.map(
            (
              instruction,
              index,
            ) => (
              <Text
                key={instruction}
                style={styles.bullet}
              >
                • {index + 1}.{' '}
                {instruction};
              </Text>
            ),
          )}
        </View>

        <View style={styles.section} break>
          <Text style={styles.majorSectionTitle}>
      B. SADRŽAJ OBUKE ZA KONKRETNO RADNO MESTO
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Radno mesto:
            </Text>

            <Text style={styles.infoValue}>
              {jobPositionName}
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>
            B.1. Opis poslova radnog mesta
          </Text>

          {jobDescription ? (
            <Text style={styles.descriptionText}>
              {jobDescription}
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              Opis poslova nije učitan.
            </Text>
          )}

          <Text style={styles.subsectionTitle}>
            B.2. Sadržaj obuke
          </Text>

          <Text style={styles.normalText}>
            B.2.1. Upoznavanje zaposlenog sa:
          </Text>

          <Text style={styles.bullet}>
            • opasnostima i štetnostima koje su karakteristične za poslove radnog mesta;
          </Text>

          <Text style={styles.bullet}>
            • preventivnim merama utvrđenim Aktom o proceni rizika;
          </Text>

          <Text style={styles.bullet}>
            • bezbednim radnim postupcima i načinima korišćenja opreme za rad;
          </Text>

          <Text style={styles.bullet}>
            • posebnim sredstvima i opremom za ličnu zaštitu koja se koriste na radnom mestu.
          </Text>

          <Text
            style={[
              styles.normalText,
              {
                marginTop: 6,
              },
            ]}
          >
            B.2.2. Praktična demonstracija i vežba radnih operacija relevantnih za konkretno radno mesto.
          </Text>

          <Text style={styles.subsectionTitle}>
            B.2.3. Opasnosti i štetnosti karakteristične za radno mesto
          </Text>

          {hazards.length === 0 ? (
            <Text style={styles.emptyText}>
              Opasnosti i štetnosti nisu učitane.
            </Text>
          ) : (
            <>
              {dangers.length > 0 && (
                <View>
                  <Text style={styles.hazardGroupTitle}>
                    OPASNOSTI
                  </Text>

                  {dangers.map(
  (
    hazard,
    index,
  ) => (
    <Text
      key={`${hazard.code}-${index}`}
      style={styles.hazardItem}
    >
      {hazard.code} – {hazard.name}
    </Text>
  ),
)}
                </View>
              )}

              {harmfulEffects.length >
                0 && (
                <View>
                  <Text style={styles.hazardGroupTitle}>
                    ŠTETNOSTI
                  </Text>

                  {harmfulEffects.map(
  (
    hazard,
    index,
  ) => (
    <Text
      key={`${hazard.code}-${index}`}
      style={styles.hazardItem}
    >
      {hazard.code} – {hazard.name}
    </Text>
  ),
)}
                </View>
              )}
            </>
          )}

          <Text style={styles.subsectionTitle}>
            B.3. Uputstva i procedure za bezbedan i zdrav rad
          </Text>

          <Text style={styles.normalText}>
            Zaposleni je/su, u skladu sa poslovima koje obavljaju, opremom za rad koju koriste i utvrđenim opasnostima i štetnostima, upoznat/i sa sledećim uputstvima i procedurama:
          </Text>

          {instructions.length === 0 ? (
            <Text style={styles.emptyText}>
              Uputstva i procedure još nisu učitani iz Baze znanja.
            </Text>
          ) : (
            instructions.map(
              (
                instruction,
                index,
              ) => (
                <Text
                  key={`${instruction.title}-${index}`}
                  style={styles.bullet}
                >
                  • {instruction.title}
                  {instruction.version
                    ? ` – verzija ${instruction.version}`
                    : ''}
                </Text>
              ),
            )
          )}
        </View>

        {includeWorkAtHeightModule && (
          <View style={styles.section}>
            <Text style={styles.majorSectionTitle}>
              C. POSEBNI MODUL – RAD NA VISINI I LZO
            </Text>

            <Text style={styles.cTitle}>
              EVIDENCIJA O OBUCI I PROVERI OBUČENOSTI ZA UPOTREBU SREDSTAVA I OPREME ZA LIČNU ZAŠTITU PRI BEZBEDNOM RADU NA VISINI
            </Text>

            <Text style={styles.subsectionTitle}>
              I. TEORIJSKO OSPOSOBLJAVANJE
            </Text>

            <Text style={styles.normalText}>
              Teorijsko osposobljavanje zaposlenih izvršeno je u okviru redovne obuke za bezbedan i zdrav rad na radnom mestu, u skladu sa propisanim programom obuke.
            </Text>

            <Text style={styles.normalText}>
              Zaposleni su osposobljeni da koriste sredstva i/ili opremu za ličnu zaštitu pri radu na visini u skladu sa bezbednosno-tehničkim podacima, namenom i uputstvima proizvođača, i to:
            </Text>

            <Text style={styles.bullet}>
              • opasač za rad na visini – SRPS EN 358 i SRPS EN 361;
            </Text>

            <Text style={styles.bullet}>
              • jednostruko uže za pozicioniranje – SRPS EN 358;
            </Text>

            <Text style={styles.bullet}>
              • dvostruko („Y“) uže sa apsorberom energije – SRPS EN 354 i SRPS EN 355;
            </Text>

            <Text style={styles.bullet}>
              • sigurnosno uže – SRPS EN 354;
            </Text>

            <Text style={styles.bullet}>
              • automatski karabin i automatski kljunasti karabin – SRPS EN 362;
            </Text>

            <Text style={styles.bullet}>
              • automatska kočnica za rad na visini sa apsorberom energije i karabinom;
            </Text>

            <Text style={styles.bullet}>
              • sidrišta i uređaji za vezivanje – SRPS EN 795.
            </Text>

            <Text style={styles.subsectionTitle}>
              II. PRAKTIČNO OSPOSOBLJAVANJE
            </Text>

            <Text style={styles.normalText}>
              Praktično osposobljavanje zaposlenih izvršeno je praktičnom demonstracijom i vežbom pravilne upotrebe sredstava i opreme za ličnu zaštitu pri radu na visini, uključujući:
            </Text>

            <Text style={styles.bullet}>
              • pravilno oblačenje i podešavanje opasača za rad na visini;
            </Text>

            <Text style={styles.bullet}>
              • pravilno vezivanje i pozicioniranje;
            </Text>

            <Text style={styles.bullet}>
              • korišćenje apsorbera energije;
            </Text>

            <Text style={styles.bullet}>
              • pravilno kačenje karabina i kljunastih karabina;
            </Text>

            <Text style={styles.bullet}>
              • upotrebu automatske kočnice za rad na visini;
            </Text>

            <Text style={styles.bullet}>
              • proveru ispravnosti i pravilno skladištenje opreme.
            </Text>

            <Text style={styles.subsectionTitle}>
              III. PROVERA OBUČENOSTI
            </Text>

            <Text style={styles.normalText}>
              Provera obučenosti zaposlenih izvršena je kroz:
            </Text>

            <Text style={styles.bullet}>
              • proveru razumevanja namene i ograničenja opreme;
            </Text>

            <Text style={styles.bullet}>
              • praktičnu proveru pravilne upotrebe sredstava za zaštitu od pada sa visine;
            </Text>

            <Text style={styles.bullet}>
              • proveru postupanja u slučaju opasnosti i nepravilne upotrebe opreme.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.majorSectionTitle}>
            D. PROVERA OBUČENOSTI I EVIDENCIJA
          </Text>

          <View style={styles.scheduleBlock}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Teorijska obuka:
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(
                  theoryTrainingDate,
                )}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Praktična obuka:
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(
                  practicalTrainingDate,
                )}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Teorijska provera:
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(
                  theoryAssessmentDate,
                )}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Praktična provera:
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(
                  practicalAssessmentDate,
                )}
              </Text>
            </View>
          </View>

          <Text style={styles.normalText}>
            Teorijska provera obučenosti izvršena je putem pisanog testa / drugog odgovarajućeg načina provere.
          </Text>

          <Text style={styles.normalText}>
            Praktična osposobljenost proverena je kroz izvođenje radnih operacija u kontrolisanim uslovima rada.
          </Text>

          <View style={styles.employeeTable}>
            <View style={styles.tableHeader}>
              <Text
                style={[
                  styles.headerCell,
                  styles.numberCell,
                ]}
              >
                R.br.
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.employeeCell,
                ]}
              >
                Ime i prezime
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.jobCell,
                ]}
              >
                Radno mesto
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.resultCell,
                ]}
              >
                Teorijska provera
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.resultCell,
                ]}
              >
                Praktična provera
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.noteCell,
                ]}
              >
                Ocena / napomena
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.signatureCell,
                ]}
              >
                Potpis
              </Text>
            </View>

            {documentEmployees.map(
              (
                employee,
                index,
              ) => (
                <View
                  key={`${employee.firstName}-${employee.lastName}-${index}`}
                  style={styles.tableRow}
                >
                  <Text
                    style={[
                      styles.cell,
                      styles.numberCell,
                    ]}
                  >
                    {index + 1}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.employeeCell,
                    ]}
                  >
                    {employee.firstName}{' '}
                    {employee.lastName}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.jobCell,
                    ]}
                  >
                    {employee.jobPositionName ||
                      jobPositionName}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.resultCell,
                    ]}
                  >
                    {formatResult(
                      employee.theoryPassed,
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.resultCell,
                    ]}
                  >
                    {formatResult(
                      employee.practicalPassed,
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.noteCell,
                    ]}
                  >
                    {employee.theoryIncorrectPercent !==
                      null &&
                    employee.theoryIncorrectPercent !==
                      undefined
                      ? `Netačnih odgovora: ${employee.theoryIncorrectPercent}`
                      : employee.note || ''}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.signatureCell,
                    ]}
                  >
                    {' '}
                  </Text>
                </View>
              ),
            )}
          </View>

          <Text style={styles.subsectionTitle}>
            IZJAVA ZAPOSLENIH
          </Text>

          <Text style={styles.normalText}>
            Zaposleni svojim potpisom potvrđuju da su prisustvovali obuci i proveri obučenosti, da su upoznati sa opasnostima i štetnostima, preventivnim merama, uputstvima i procedurama navedenim u ovoj evidenciji i zapisniku, kao i da su razumeli način bezbednog obavljanja poslova.
          </Text>
        </View>

        <View
          style={styles.finalSignatures}
          wrap={false}
        >


          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>
              Savetnik / saradnik za BZR
            </Text>

            <Text style={styles.signatureName}>
              {safetyAdvisorName || '—'}
            </Text>

            <Text>
              ______________________________
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
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 36,
    fontFamily: 'DejaVuSans',
    fontSize: 8.5,
    color: '#111827',
  },

  companyHeader: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 10,
  },

  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 18,
  },

  basicInfo: {
    marginBottom: 16,
  },

  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 7,
    borderBottomWidth: 0.8,
    borderBottomColor: '#475569',
    paddingBottom: 3,
  },

  majorSectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: '#e2e8f0',
  },

  subsectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 5,
  },

  cTitle: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 9,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  infoLabel: {
    width: 125,
    fontWeight: 700,
  },

  infoValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#94a3b8',
    paddingBottom: 1,
  },

  normalText: {
    fontSize: 8.2,
    lineHeight: 1.35,
    marginBottom: 3,
  },

  descriptionText: {
    fontSize: 8.2,
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
  },

  bullet: {
    fontSize: 8.2,
    lineHeight: 1.35,
    marginBottom: 2,
    paddingLeft: 6,
  },

  reasonRow: {
    fontSize: 8,
    lineHeight: 1.3,
    marginBottom: 2,
  },

  bold: {
    fontWeight: 700,
  },

  emptyText: {
    fontSize: 8.2,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 6,
  },

  hazardGroupTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginTop: 7,
    marginBottom: 5,
  },
  hazardItem: {
  fontSize: 8.3,
  lineHeight: 1.35,
  marginBottom: 3,
},

  hazardBox: {
    marginBottom: 7,
    padding: 6,
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
  },

  hazardTitle: {
    fontSize: 8.3,
    fontWeight: 700,
    marginBottom: 4,
  },

  activityLabel: {
    fontSize: 7.8,
    fontWeight: 700,
    marginBottom: 2,
  },

  activitiesText: {
    fontSize: 7.8,
    lineHeight: 1.35,
  },

  scheduleBlock: {
    marginBottom: 8,
  },

  employeeTable: {
    borderTopWidth: 0.7,
    borderLeftWidth: 0.7,
    borderColor: '#475569',
    marginTop: 8,
    marginBottom: 12,
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
    paddingHorizontal: 3,
    borderRightWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: '#475569',
    fontSize: 6.8,
    fontWeight: 700,
  },

  cell: {
    paddingVertical: 5,
    paddingHorizontal: 3,
    borderRightWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: '#475569',
    fontSize: 6.8,
  },

  numberCell: {
    width: 28,
    textAlign: 'center',
  },

  employeeCell: {
    width: 95,
  },

  jobCell: {
    width: 95,
  },

  resultCell: {
    width: 66,
    textAlign: 'center',
  },

  noteCell: {
    flex: 1,
  },

  signatureCell: {
    width: 90,
  },

  finalSignatures: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  signatureBox: {
    width: '46%',
    textAlign: 'center',
  },

  signatureTitle: {
    fontSize: 8,
    fontWeight: 700,
    minHeight: 18,
  },

  signatureName: {
    fontSize: 8,
    marginTop: 7,
    marginBottom: 8,
  },
    pageNumber: {
    position: 'absolute',
    bottom: 18,
    right: 42,
    fontSize: 8,
  },
})