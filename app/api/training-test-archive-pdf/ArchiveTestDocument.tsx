
import path from 'node:path'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'




Font.register({
  family: 'INPRO Archive Sans',
  fonts: [
    {
src: `${process.cwd()}/public/fonts/DejaVuSans.ttf`,

      fontWeight: 'normal',
    },
    {
src: `${process.cwd()}/public/fonts/DejaVuSans-Bold.ttf`,

      fontWeight: 'bold',
    },
  ],
})




export type ArchiveOption = {
  id: string
  option_text: string
  sort_order: number
}

export type ArchiveMedia = {
  id: string
  image_data: string
  sort_order: number
}

export type ArchiveQuestion = {
  id: string
  question_text: string
  options: ArchiveOption[]
  media: ArchiveMedia[]
}

export type ArchiveModule = {
  id: string
  code: string
  name: string
  questions: ArchiveQuestion[]
}

type Props = {
  testName: string
  modules: ArchiveModule[]
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 50,
    paddingHorizontal: 42,
    fontSize: 10,
    fontFamily: 'INPRO Archive Sans',
  },
  question: {
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
  },
})

const visualTasks = [
  'Navesti opasnosti i štetnosti koje su prisutne u prikazanoj radnoj situaciji.',
  'Navesti koje mere bezbednosti i zdravlja na radu su primenjene.',
  'Navesti koje mere nisu primenjene, a trebalo ih je primeniti.',
]

export default function ArchiveTestDocument({
  testName,
  modules,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            TEST
          </Text>

          <Text
            style={{
              textAlign: 'center',
              marginTop: 6,
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            OBUKA ZA BEZBEDAN I ZDRAV RAD
          </Text>

          <Text
            style={{
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 22,
              fontWeight: 'bold',
            }}
          >
            {testName}
          </Text>

          <Text>
            Poslodavac: ______________________________
          </Text>

          <Text style={{ marginTop: 10 }}>
            Ime i prezime zaposlenog:
            __________________________
          </Text>

          <Text style={{ marginTop: 10 }}>
            Datum: ____________________
          </Text>

          {modules.map((module) => (
            <View key={module.id} style={{ marginTop: 18 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                {module.code} — {module.name}
              </Text>

              {module.questions.map((question, index) => (
                <View
                  key={question.id}
                  wrap={false}
                  style={styles.question}
                >
                  <Text>
                    {index + 1}. {question.question_text}
                  </Text>

                  {question.media.map((media) => (
                    <Image
                      key={media.id}
                      src={media.image_data}
                      style={{
                        width: 250,
                        height: 165,
                        objectFit: 'contain',
                        alignSelf: 'center',
                        marginTop: 5,
                      }}
                    />
                  ))}

                  {question.media.length > 0 &&
                    question.options.length === 0 && (
                      <View style={{ marginTop: 6 }}>
                        {visualTasks.map((task, i) => (
                          <View
                            key={i}
                            style={{ marginBottom: 7 }}
                          >
                            <Text>
                              {i + 1}. {task}
                            </Text>
                            <View
                              style={{
                                height: 10,
                                borderBottomWidth: 0.6,
                                borderBottomColor: '#777',
                              }}
                            />
                          </View>
                        ))}
                      </View>
                    )}

                  {question.media.length === 0 &&
                    question.options.map((option) => (
                      <Text
                        key={option.id}
                        style={{
                          marginLeft: 12,
                          marginTop: 3,
                        }}
                      >
                        □ {option.option_text}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          ))}

          <View
            style={{
              marginTop: 22,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text>Potpis zaposlenog: ______________</Text>
            <Text>Potpis savetnika za BZR: __________</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
          <Text>INPRO DOO BZR</Text>
        </View>
      </Page>
    </Document>
  )
}
