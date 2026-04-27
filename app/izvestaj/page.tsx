'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Image,
} from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/client'

type Kontrola = {
  id: string
  naziv: string
  opis: string | null
  status: string
  created_at: string
  slika_url: string | null
  klijent_id: string | null
  klijent_ref_id: string | null
  user_email: string | null
  user_ime: string | null
  user_prezime: string | null
}

type Klijent = {
  id: string
  naziv: string
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 18,
    borderBottom: '1 solid #d9d9d9',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 700,
  },
  statsBox: {
    padding: 10,
    border: '1 solid #d9d9d9',
    borderRadius: 4,
  },
  statText: {
    fontSize: 11,
    marginBottom: 4,
  },
  kontrolaCard: {
    marginBottom: 14,
    padding: 10,
    border: '1 solid #d9d9d9',
    borderRadius: 4,
  },
  kontrolaNaziv: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: '#444',
    marginBottom: 3,
  },
  opis: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  image: {
    width: 180,
    height: 120,
    objectFit: 'cover',
  },
  noImage: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  zakljucakBox: {
    padding: 10,
    border: '1 solid #d9d9d9',
    borderRadius: 4,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: '1 solid #d9d9d9',
  },
  signature: {
    marginTop: 24,
    fontSize: 11,
  },
})

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('sr-RS')
  } catch {
    return dateString
  }
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    monthLabel: now.toLocaleDateString('sr-RS', {
      month: 'long',
      year: 'numeric',
    }),
  }
}

function buildZakljucak(total: number, ispravne: number, neispravne: number) {
  if (total === 0) {
    return 'U izabranom periodu nema evidentiranih kontrola za ovog klijenta.'
  }

  if (neispravne === 0) {
    return 'U posmatranom periodu sve evidentirane kontrole za ovog klijenta su prošle bez utvrđenih nepravilnosti.'
  }

  return `U posmatranom periodu evidentirano je ${total} kontrola za izabranog klijenta. Od toga je ${ispravne} kontrola sa pozitivnim statusom, dok je kod ${neispravne} kontrole potrebno preduzeti dodatne korektivne mere.`
}

function formatIzvrsio(kontrola: Kontrola) {
  const punoIme = `${kontrola.user_ime || ''} ${kontrola.user_prezime || ''}`.trim()

  if (punoIme && kontrola.user_email) {
    return `${punoIme} (${kontrola.user_email})`
  }

  if (punoIme) {
    return punoIme
  }

  if (kontrola.user_email) {
    return kontrola.user_email
  }

  return 'Nepoznato'
}

function MesecniIzvestajPDF({
  kontrole,
  monthLabel,
  klijentNaziv,
}: {
  kontrole: Kontrola[]
  monthLabel: string
  klijentNaziv: string
}) {
  const total = kontrole.length
  const ispravne = kontrole.filter((k) =>
    ['ispravno', 'završeno', 'ok', 'uredno'].includes(k.status.toLowerCase())
  ).length
  const neispravne = total - ispravne
  const zakljucak = buildZakljucak(total, ispravne, neispravne)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Mesečni BZR izveštaj</Text>
          <Text style={styles.subtitle}>Period: {monthLabel}</Text>
          <Text style={styles.subtitle}>Klijent: {klijentNaziv}</Text>
          <Text style={styles.subtitle}>Broj kontrola: {total}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistika</Text>
          <View style={styles.statsBox}>
            <Text style={styles.statText}>Ukupno kontrola: {total}</Text>
            <Text style={styles.statText}>Ispravne / OK: {ispravne}</Text>
            <Text style={styles.statText}>Potrebna akcija: {neispravne}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pregled kontrola</Text>

          {kontrole.length === 0 ? (
            <Text>Nema kontrola za izabranog klijenta.</Text>
          ) : (
            kontrole.map((kontrola) => (
              <View key={kontrola.id} style={styles.kontrolaCard}>
                <Text style={styles.kontrolaNaziv}>{kontrola.naziv}</Text>
                <Text style={styles.meta}>Status: {kontrola.status}</Text>
                <Text style={styles.meta}>
                  Datum: {formatDate(kontrola.created_at)}
                </Text>
                <Text style={styles.meta}>
                  Izvršio: {formatIzvrsio(kontrola)}
                </Text>

                {kontrola.opis ? (
                  <Text style={styles.opis}>{kontrola.opis}</Text>
                ) : (
                  <Text style={styles.opis}>Nema opisa.</Text>
                )}

                {kontrola.slika_url ? (
                  <Image src={kontrola.slika_url} style={styles.image} />
                ) : (
                  <Text style={styles.noImage}>Nema priložene slike</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zaključak</Text>
          <View style={styles.zakljucakBox}>
            <Text>{zakljucak}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.signature}>Odgovorno lice: ____________________</Text>
          <Text style={styles.signature}>Potpis: ____________________</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function IzvestajPage() {
  const supabase = createClient()

  const [kontrole, setKontrole] = useState<Kontrola[]>([])
  const [klijenti, setKlijenti] = useState<Klijent[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingKlijenti, setLoadingKlijenti] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchKlijent, setSearchKlijent] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedClientNaziv, setSelectedClientNaziv] = useState('')

  const [submittedClientId, setSubmittedClientId] = useState('')
  const [submittedClientNaziv, setSubmittedClientNaziv] = useState('')

  const { start, end, monthLabel } = useMemo(() => getCurrentMonthRange(), [])

  useEffect(() => {
    const loadKlijenti = async () => {
      setLoadingKlijenti(true)

      const { data, error } = await supabase
        .from('klijenti')
        .select('id, naziv')
        .eq('aktivan', true)
        .order('naziv', { ascending: true })

      if (!error && data) {
        setKlijenti(data)
      }

      setLoadingKlijenti(false)
    }

    loadKlijenti()
  }, [supabase])

  const filteredKlijenti = useMemo(() => {
    const q = searchKlijent.trim().toLowerCase()

    if (!q) {
      return klijenti.slice(0, 20)
    }

    return klijenti
      .filter((k) => k.naziv.toLowerCase().includes(q))
      .slice(0, 20)
  }, [klijenti, searchKlijent])

  const handleSelectKlijent = (klijent: Klijent) => {
    setSelectedClientId(klijent.id)
    setSelectedClientNaziv(klijent.naziv)
    setSearchKlijent(klijent.naziv)
  }

  useEffect(() => {
    const loadKontrole = async () => {
      if (!submittedClientId) {
        setKontrole([])
        return
      }

      setLoading(true)
      setErrorMsg('')

      const { data, error } = await supabase
        .from('kontrole')
        .select(
          'id, naziv, opis, status, created_at, slika_url, klijent_id, klijent_ref_id, user_email, user_ime, user_prezime'
        )
        .eq('klijent_ref_id', submittedClientId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMsg(error.message)
        setKontrole([])
        setLoading(false)
        return
      }

      setKontrole((data as Kontrola[]) || [])
      setLoading(false)
    }

    loadKontrole()
  }, [supabase, start, end, submittedClientId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId || !selectedClientNaziv) {
      setSubmittedClientId('')
      setSubmittedClientNaziv('')
      setKontrole([])
      return
    }

    setSubmittedClientId(selectedClientId)
    setSubmittedClientNaziv(selectedClientNaziv)
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mesečni izveštaj</h1>
        <p className="text-sm text-gray-600">Period: {monthLabel}</p>
      </div>

      <div className="mb-6 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Izbor klijenta</h2>

        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div>
            <input
              type="text"
              placeholder={
                loadingKlijenti ? 'Učitavanje klijenata...' : 'Pretraži klijenta'
              }
              value={searchKlijent}
              onChange={(e) => {
                setSearchKlijent(e.target.value)
                setSelectedClientId('')
                setSelectedClientNaziv('')
              }}
              disabled={loadingKlijenti}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />

            {!loadingKlijenti && filteredKlijenti.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border bg-white">
                {filteredKlijenti.map((klijent) => (
                  <button
                    key={klijent.id}
                    type="button"
                    onClick={() => handleSelectKlijent(klijent)}
                    className={`block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 ${
                      selectedClientId === klijent.id ? 'bg-gray-100' : 'bg-white'
                    }`}
                  >
                    {klijent.naziv}
                  </button>
                ))}
              </div>
            )}

            {selectedClientNaziv && (
              <p className="mt-2 text-sm text-gray-600">
                Izabran klijent: <b>{selectedClientNaziv}</b>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Prikaži izveštaj
          </button>
        </form>

        {submittedClientNaziv && (
          <p className="mt-3 text-sm text-gray-600">
            Trenutno izabrani klijent: <b>{submittedClientNaziv}</b>
          </p>
        )}
      </div>

      {!submittedClientId && (
        <div className="rounded-lg border p-4 text-sm">
          Pretraži i izaberi klijenta, pa klikni na <b>Prikaži izveštaj</b>.
        </div>
      )}

      {submittedClientId && loading && (
        <div className="rounded-lg border p-4 text-sm">Učitavanje kontrola...</div>
      )}

      {submittedClientId && !loading && errorMsg && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Greška: {errorMsg}
        </div>
      )}

      {submittedClientId && !loading && !errorMsg && (
        <>
          <div className="mb-6 rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Pregled</h2>
            <p className="text-sm text-gray-700">
              Broj pronađenih kontrola za izabranog klijenta u tekućem mesecu:{' '}
              <b>{kontrole.length}</b>
            </p>
          </div>

          <div className="mb-6 rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Kontrole</h2>

            {kontrole.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nema kontrola za ovaj mesec i izabranog klijenta.
              </p>
            ) : (
              <div className="space-y-4">
                {kontrole.map((kontrola) => (
                  <div key={kontrola.id} className="rounded-lg border p-4">
                    <div className="mb-1 font-semibold">{kontrola.naziv}</div>
                    <div className="text-sm text-gray-600">
                      Status: {kontrola.status}
                    </div>
                    <div className="text-sm text-gray-600">
                      Datum: {formatDate(kontrola.created_at)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Izvršio: {formatIzvrsio(kontrola)}
                    </div>
                    <div className="mt-2 text-sm">
                      {kontrola.opis || 'Nema opisa.'}
                    </div>

                    {kontrola.slika_url ? (
                      <img
                        src={kontrola.slika_url}
                        alt={kontrola.naziv}
                        className="mt-3 h-40 w-60 rounded border object-cover"
                      />
                    ) : (
                      <div className="mt-3 text-sm text-gray-500">
                        Nema priložene slike
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {submittedClientNaziv && (
            <PDFDownloadLink
              document={
                <MesecniIzvestajPDF
                  kontrole={kontrole}
                  monthLabel={monthLabel}
                  klijentNaziv={submittedClientNaziv}
                />
              }
              fileName={`izvestaj-${submittedClientNaziv}-${monthLabel.replace(/\s+/g, '-')}.pdf`}
              className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? 'Generisanje PDF-a...' : 'Preuzmi PDF'
              }
            </PDFDownloadLink>
          )}
        </>
      )}
    </main>
  )
}
