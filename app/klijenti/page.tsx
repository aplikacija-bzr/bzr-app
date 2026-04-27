'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Klijent = {
  id: string
  naziv: string
  aktivan: boolean
}

export default function KlijentiAdminPage() {
  const supabase = createClient()

  const [klijenti, setKlijenti] = useState<Klijent[]>([])
  const [naziv, setNaziv] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNaziv, setEditNaziv] = useState('')

  const loadKlijenti = async () => {
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('klijenti')
      .select('id, naziv, aktivan')
      .order('naziv', { ascending: true })

    if (error) {
      setErrorMsg(error.message)
      setKlijenti([])
      setLoading(false)
      return
    }

    setKlijenti((data as Klijent[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadKlijenti()
  }, [])

  const filteredKlijenti = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return klijenti
    return klijenti.filter((k) => k.naziv.toLowerCase().includes(q))
  }, [klijenti, search])

  const handleAddKlijent = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanNaziv = naziv.trim().toUpperCase()

    if (!cleanNaziv) {
      alert('Unesi naziv klijenta')
      return
    }

    const postoji = klijenti.some((k) => k.naziv === cleanNaziv)
    if (postoji) {
      alert('Klijent već postoji')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('klijenti').insert([
      {
        naziv: cleanNaziv,
        aktivan: true,
      },
    ])

    setSaving(false)

    if (error) {
      alert('Greška: ' + error.message)
      return
    }

    setNaziv('')
    await loadKlijenti()
  }

  const handleToggleAktivan = async (klijent: Klijent) => {
    const { error } = await supabase
      .from('klijenti')
      .update({ aktivan: !klijent.aktivan })
      .eq('id', klijent.id)

    if (error) {
      alert('Greška: ' + error.message)
      return
    }

    await loadKlijenti()
  }

  const handleStartEdit = (klijent: Klijent) => {
    setEditingId(klijent.id)
    setEditNaziv(klijent.naziv)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditNaziv('')
  }

  const handleSaveEdit = async (id: string) => {
    const cleanNaziv = editNaziv.trim().toUpperCase()

    if (!cleanNaziv) {
      alert('Unesi naziv klijenta')
      return
    }

    const postoji = klijenti.some(
      (k) => k.id !== id && k.naziv === cleanNaziv
    )

    if (postoji) {
      alert('Klijent sa tim nazivom već postoji')
      return
    }

    const { error } = await supabase
      .from('klijenti')
      .update({ naziv: cleanNaziv })
      .eq('id', id)

    if (error) {
      alert('Greška: ' + error.message)
      return
    }

    setEditingId(null)
    setEditNaziv('')
    await loadKlijenti()
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin klijenti</h1>
        <p className="text-sm text-gray-600">
          Dodavanje, pretraga, izmena i aktivacija/deaktivacija klijenata
        </p>
      </div>

      <div className="mb-6 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Dodaj novog klijenta</h2>

        <form onSubmit={handleAddKlijent} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Naziv klijenta"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            {saving ? 'Čuvanje...' : 'Dodaj klijenta'}
          </button>
        </form>
      </div>

      <div className="mb-6 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Pretraga</h2>

        <input
          type="text"
          placeholder="Pretraži klijenta"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {loading && (
        <div className="rounded-lg border p-4 text-sm">Učitavanje klijenata...</div>
      )}

      {!loading && errorMsg && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Greška: {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && (
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lista klijenata</h2>
            <span className="text-sm text-gray-600">
              Ukupno: <b>{filteredKlijenti.length}</b>
            </span>
          </div>

          {filteredKlijenti.length === 0 ? (
            <p className="text-sm text-gray-600">Nema rezultata.</p>
          ) : (
            <div className="space-y-3">
              {filteredKlijenti.map((klijent) => (
                <div
                  key={klijent.id}
                  className="rounded-lg border p-4"
                >
                  {editingId === klijent.id ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editNaziv}
                          onChange={(e) => setEditNaziv(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                        <div className="mt-2 text-sm text-gray-600">
                          Status:{' '}
                          <b className={klijent.aktivan ? 'text-green-700' : 'text-gray-500'}>
                            {klijent.aktivan ? 'Aktivan' : 'Neaktivan'}
                          </b>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(klijent.id)}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                        >
                          Sačuvaj
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                          Otkaži
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold">{klijent.naziv}</div>
                        <div className="text-sm text-gray-600">
                          Status:{' '}
                          <b className={klijent.aktivan ? 'text-green-700' : 'text-gray-500'}>
                            {klijent.aktivan ? 'Aktivan' : 'Neaktivan'}
                          </b>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(klijent)}
                          className="rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                          Izmeni
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAktivan(klijent)}
                          className="rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                          {klijent.aktivan ? 'Deaktiviraj' : 'Aktiviraj'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}