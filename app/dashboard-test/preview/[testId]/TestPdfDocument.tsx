'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

Font.register({
  family: 'DejaVu Sans',
  fonts: [
    {
      src: '/fonts/DejaVuSans.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/DejaVuSans-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 42,
    paddingBottom: 50,
    paddingLeft: 42,
    paddingRight: 42,
    fontSize: 10,
    fontFamily: 'DejaVu Sans',
  },

  content: {},

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
  },
});

type PdfOption = {
  id: string;
  option_text: string;
  sort_order: number;
};

type PdfMedia = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type PdfQuestion = {
  id: string;
  question_text: string;
  options: PdfOption[];
  media: PdfMedia[];
};

type PdfModule = {
  id: string;
  code: string;
  name: string;
  questions: PdfQuestion[];
};

type TestPdfDocumentProps = {
  testName: string;
  modules: PdfModule[];
};

const VISUAL_TASKS = [
  'Navesti opasnosti i štetnosti koje su prisutne u prikazanoj radnoj situaciji.',
  'Navesti koje je mere bezbednosti i zdravlja na radu zaposleni primenio.',
  'Navesti koje mere bezbednosti i zdravlja na radu nisu primenjene, a trebalo ih je primeniti u prikazanoj radnoj situaciji.',
];


export default function TestPdfDocument({
  testName,
  modules,
}: TestPdfDocumentProps) {
  return (
    <Document>
      <Page
        size="A4"
        style={styles.page}
      >
        <View style={styles.content}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 6,
            }}
          >
            TEST
          </Text>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 'bold',
              marginBottom: 16,
            }}
          >
            OBUKA ZA BEZBEDAN I ZDRAV RAD
          </Text>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              marginBottom: 22,
            }}
          >
            {testName}
          </Text>

          <View
            style={{
              marginBottom: 10,
            }}
          >
            <Text>
              Poslodavac:
              {' '}
              __________________________________________
            </Text>
          </View>

          <View
            style={{
              marginBottom: 10,
            }}
          >
            <Text>
              Ime i prezime zaposlenog:
              {' '}
              ______________________________
            </Text>
          </View>

          <View>
            <Text>
              Datum: ____________________
            </Text>
          </View>

          {modules.map(
            (module, moduleIndex) => (
              <View
                key={module.id}
                style={{
                  marginTop: 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    marginBottom: 4,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                  }}
                >
                  {module.code}
                  {' — '}
                  {module.name}
                </Text>

                {module.questions.map(
                  (question, index) => (
                    <View
                      key={question.id}
                      wrap={false}
                      style={{
                        marginBottom: 3,
                      }}
                    >
                      <Text>
                        {index + 1}.
                        {' '}
                        {question.question_text}
                      </Text>

                      {question.media.length >
                        0 && (
                        <View
                          style={{
                            marginTop: 4,
                            marginLeft: 12,
                          }}
                        >
                          {question.media
                            .slice()
                            .sort(
                              (a, b) =>
                                a.sort_order -
                                b.sort_order
                            )
                            .map(
                              (media) => (
                                <Image
                                  key={
                                    media.id
                                  }
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/training-question-media/${media.storage_path}`}

style={{
  width: 350,
  height: 220,
  objectFit: 'contain',
  alignSelf: 'center',
}}

                                />
                              )
                            )}
                        </View>
                      )}


{question.media.length > 0 &&
  question.options.length === 0 && (
    <View
      style={{
        marginTop: 6,
        marginLeft: 12,
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: 'bold',
          marginBottom: 5,
        }}
      >
        Na osnovu prikazane slike odgovoriti
        na sledeća pitanja:
      </Text>

      {VISUAL_TASKS.map((task, index) => (
        <View
          key={index}
          style={{
            marginBottom: 3,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              marginBottom: 5,
            }}
          >
            {index + 1}. {task}
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

{question.options.length > 0 &&
  !(question.media?.length > 0) && (

                        <View
                          style={{
                            flexDirection:
                              'row',
                            flexWrap: 'wrap',
                            marginTop: 4,
                            marginLeft: 12,
                          }}
                        >
                          {question.options
                            .slice()
                            .sort(
                              (a, b) =>
                                a.sort_order -
                                b.sort_order
                            )
                            .map(
                              (option) => (
                                <Text
                                  key={
                                    option.id
                                  }
                                  style={{
                                    marginRight:
                                      18,
                                    marginBottom:
                                      2,
                                  }}
                                >
                                  □{' '}
                                  {
                                    option.option_text
                                  }
                                </Text>
                              )
                            )}
                        </View>
                      )}
                    </View>
                  )
                )}

                {moduleIndex ===
                  modules.length - 1 && (
                  <View
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor:
                        '#999',
                      flexDirection: 'row',
                      justifyContent:
                        'space-between',
                    }}
                  >
                    <View

                      style={{
                        width: '42%',
                      }}
                    >
                      <Text>
                        Potpis zaposlenog:
                      </Text>

                      <Text
                        style={{
                          marginTop: 12,
                        }}
                      >
                        ______________________________
                      </Text>
                    </View>

                    <View

                      style={{
                        width: '48%',
                        textAlign: 'right',
                      }}
                    >
                      <Text>
                        Potpis savetnika za
                        bezbednost i zdravlje na
                        radu:
                      </Text>

                      <Text
                        style={{
                          marginTop: 12,
                        }}
                      >
                        ______________________________
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )
          )}
        </View>

        <View
          style={styles.footer}
          fixed
        >
          <Text
            render={({
              pageNumber,
              totalPages,
            }) =>
              `${pageNumber}/${totalPages}`
            }
          />

          <Text>INPRO DOO BZR</Text>
        </View>
      </Page>
    </Document>
  );
}



