# INPRO BZR

# ARHITEKTURA PROCESA OSPOSOBLJAVANJA

Verzija: 1.0.0  
Datum: 14.07.2026.  
Status: U izradi  
Autor: Slobodan Maksimović / ChatGPT

---

# 1. Namena dokumenta

Ovaj dokument definiše poslovni proces sprovođenja osposobljavanja zaposlenih u informacionom sistemu INPRO BZR.

Za razliku od dokumenta:

```
TRAINING_MODULE_ARCHITECTURE.md
```

koji opisuje strukturu modula i baze podataka, ovaj dokument opisuje tok rada od planiranja obuke do izdavanja potvrde i praćenja narednog roka.

Dokument predstavlja osnovu za:

- SQL migracije 015–023,
- API rute,
- korisnički interfejs,
- automatizaciju procesa,
- generisanje zakonskih obrazaca.

---

# 2. Cilj procesa

Proces mora omogućiti da se svako osposobljavanje evidentira na način koji je:

- usklađen sa propisima Republike Srbije,
- potpuno sledljiv,
- istorijski nepromenljiv,
- jednostavan za korisnika,
- pogodan za automatsko generisanje dokumentacije.

Proces mora podržati:

- pojedinačna osposobljavanja,
- grupna osposobljavanja,
- internu obuku,
- eksternu obuku,
- teorijski deo,
- praktični deo,
- proveru znanja,
- praktičnu proveru,
- izdavanje potvrde,
- automatsko formiranje Obrasca 6,
- automatsko praćenje rokova.

---

# 3. Glavni tok procesa

Proces osposobljavanja odvija se sledećim redosledom:

```text
Planiranje obuke
        │
        ▼
Training Session
        │
        ▼
Dodavanje učesnika
        │
        ▼
Teorijska obuka
        │
        ▼
Test znanja
        │
        ▼
Praktična obuka
        │
        ▼
Praktična provera
        │
        ▼
Konačna evidencija
        │
        ▼
Obrazac 6
        │
        ▼
Potvrda
        │
        ▼
Praćenje narednog roka
```

---

# 4. Glavne tabele procesa

Proces koristi sledeće tabele:

```text
training_sessions

training_participants

test_attempts

test_attempt_answers

practical_checks

employee_trainings

training_certificates

form_6_records

training_reminder_logs
```

---

# 5. Veza sa postojećim sistemom

Proces koristi postojeće zajedničke tabele:

```text
employers

employees

employee_job_positions

training_program_versions

training_tests
```

Ne postoje posebni zaposleni niti posebna radna mesta za modul osposobljavanja.

Svi podaci koriste zajedničku bazu sistema INPRO BZR.

---

# 6. Jedno osposobljavanje

Jedno održano osposobljavanje predstavlja:

```text
training_session
```

Primer:

Datum:

15.09.2026.

Poslodavac:

DOO INKOM

Program:

Prethodno osposobljavanje

Verzija programa:

2

Instruktor:

Slobodan Maksimović

Lokacija:

Beograd

Na jedno osposobljavanje može biti prijavljeno više zaposlenih.

---

# 7. Jedan učesnik

Svaki zaposleni predstavlja poseban zapis u tabeli:

```text
training_participants
```

Jedan učesnik ima:

- zaposlenog,
- konkretno radno mesto,
- status prisustva,
- rezultat testa,
- rezultat praktične provere,
- konačan status osposobljavanja.

Na taj način jedan zaposleni može uspešno završiti obuku, dok drugi ne mora, iako su prisustvovali istoj sesiji.

---

# 8. Poslovni princip

Najvažnije pravilo modula glasi:

Jedna obuka → više učesnika.

Svaki učesnik ima sopstvene rezultate.

Ne postoje zajednički rezultati testa ili praktične provere za celu grupu.

Sve evidencije vode se po zaposlenom.
---

# 9. Statusi procesa

Svaka tabela procesa mora imati jasno definisane statuse.

Statusi se u SQL bazi čuvaju na engleskom jeziku, a u korisničkom interfejsu prikazuju na srpskom jeziku.

---

## 9.1. Status training_session

Planirani statusi sesije osposobljavanja:

| SQL status | Prikaz u aplikaciji |
|---|---|
| `PLANNED` | Planirana |
| `IN_PROGRESS` | U toku |
| `COMPLETED` | Završena |
| `CANCELLED` | Otkazana |

Poslovna pravila:

### TS-01

Nova sesija dobija status:

```text
PLANNED
```

### TS-02

Sesija može preći u status `IN_PROGRESS` kada je započelo osposobljavanje.

### TS-03

Sesija može preći u status `COMPLETED` tek kada je završen planirani proces osposobljavanja.

### TS-04

Otkazana sesija ostaje sačuvana u istoriji.

### TS-05

Sesija sa statusom `COMPLETED` ne sme se fizički brisati.

---

## 9.2. Status prisustva učesnika

Planirani statusi:

| SQL status | Prikaz u aplikaciji |
|---|---|
| `REGISTERED` | Prijavljen |
| `PRESENT` | Prisutan |
| `ABSENT` | Odsutan |
| `PARTIALLY_PRESENT` | Delimično prisutan |
| `CANCELLED` | Odjavljen |

Poslovna pravila:

### TPART-01

Dodavanjem zaposlenog u sesiju dobija se status:

```text
REGISTERED
```

### TPART-02

Pre završetka obuke mora se evidentirati prisustvo.

### TPART-03

Učesnik sa statusom `ABSENT` ne može uspešno završiti osposobljavanje.

### TPART-04

Za status `PARTIALLY_PRESENT` konačnu odluku o ispunjenosti uslova donosi ovlašćeno lice.

---

## 9.3. Konačan status učesnika

Planirani statusi:

| SQL status | Prikaz u aplikaciji |
|---|---|
| `PENDING` | U obradi |
| `PASSED` | Osposobljen |
| `FAILED` | Nije osposobljen |
| `INCOMPLETE` | Nepotpuno |
| `CANCELLED` | Otkazano |

Učesnik dobija status `PASSED` samo ako su ispunjeni svi obavezni elementi osposobljavanja.

---

# 10. Training sessions

## 10.1. Namena

Tabela:

```text
training_sessions
```

predstavlja jedno konkretno održavanje osposobljavanja.

Sesija povezuje:

- poslodavca,
- verziju programa,
- datum i vreme,
- mesto održavanja,
- instruktora,
- organizatora,
- status procesa.

---

## 10.2. Planirana polja

| Polje | Tip | Obavezno | Opis |
|---|---|---:|---|
| `id` | UUID | DA | Primarni ključ |
| `employer_id` | UUID | DA | Poslodavac za koga se obuka održava |
| `training_program_version_id` | UUID | DA | Verzija programa |
| `session_number` | TEXT | NE | Interni broj sesije |
| `title` | TEXT | DA | Naziv održane obuke |
| `scheduled_start` | TIMESTAMPTZ | DA | Planirani početak |
| `scheduled_end` | TIMESTAMPTZ | NE | Planirani završetak |
| `actual_start` | TIMESTAMPTZ | NE | Stvarni početak |
| `actual_end` | TIMESTAMPTZ | NE | Stvarni završetak |
| `location` | TEXT | NE | Mesto održavanja |
| `instructor_name` | TEXT | DA | Ime i prezime instruktora |
| `instructor_title` | TEXT | NE | Stručno zvanje ili funkcija |
| `organizer_name` | TEXT | NE | Organizator obuke |
| `status` | TEXT | DA | Status sesije |
| `notes` | TEXT | NE | Napomena |
| `created_at` | TIMESTAMPTZ | DA | Datum kreiranja |
| `updated_at` | TIMESTAMPTZ | DA | Datum izmene |

---

## 10.3. Poslovna pravila

### TS-06

Sesija pripada tačno jednom poslodavcu.

### TS-07

Sesija koristi tačno jednu verziju programa.

### TS-08

Planirani završetak ne može biti pre planiranog početka.

### TS-09

Stvarni završetak ne može biti pre stvarnog početka.

### TS-10

Sesija sa učesnicima ne sme promeniti poslodavca.

### TS-11

Sesija sa evidentiranim rezultatima ne sme promeniti verziju programa.

### TS-12

Interni broj sesije, kada je unet, mora biti jedinstven.

### TS-13

Završena sesija mora imati evidentiran stvarni datum početka i završetka.

### TS-14

Otkazivanje završene sesije nije dozvoljeno bez posebne administrativne procedure.

---

## 10.4. Planirani indeksi

```text
PRIMARY KEY (id)

UNIQUE (session_number), kada je unet

INDEX (employer_id)

INDEX (training_program_version_id)

INDEX (status)

INDEX (scheduled_start)

INDEX (employer_id, status)

INDEX (employer_id, scheduled_start)
```

---

# 11. Training participants

## 11.1. Namena

Tabela:

```text
training_participants
```

predstavlja jednog zaposlenog prijavljenog na jednu sesiju osposobljavanja.

Učesnik je povezan sa konkretnim raspoređivanjem zaposlenog na radno mesto:

```text
employee_job_positions
```

---

## 11.2. Planirana polja

| Polje | Tip | Obavezno | Opis |
|---|---|---:|---|
| `id` | UUID | DA | Primarni ključ |
| `training_session_id` | UUID | DA | Sesija osposobljavanja |
| `employee_job_position_id` | UUID | DA | Zaposleni i konkretno radno mesto |
| `attendance_status` | TEXT | DA | Status prisustva |
| `attendance_confirmed_at` | TIMESTAMPTZ | NE | Datum potvrde prisustva |
| `final_status` | TEXT | DA | Konačan status učesnika |
| `completed_at` | TIMESTAMPTZ | NE | Datum završetka procesa |
| `notes` | TEXT | NE | Napomena |
| `created_at` | TIMESTAMPTZ | DA | Datum kreiranja |
| `updated_at` | TIMESTAMPTZ | DA | Datum izmene |

---

## 11.3. Poslovna pravila

### TPA-01

Isti zaposleni na istom radnom mestu može biti dodat samo jednom u istu sesiju.

### TPA-02

Poslodavac učesnika mora biti isti kao poslodavac sesije.

### TPA-03

Raspoređivanje zaposlenog mora biti aktivno na datum osposobljavanja, osim kada ovlašćeni korisnik evidentira opravdan istorijski unos.

### TPA-04

Status `PASSED` nije dozvoljen ako je učesnik odsutan.

### TPA-05

Ako katalog zahteva test, učesnik ne može dobiti status `PASSED` bez uspešnog rezultata testa.

### TPA-06

Ako katalog zahteva praktičnu proveru, učesnik ne može dobiti status `PASSED` bez uspešne praktične provere.

### TPA-07

Ako je konačan status `PASSED`, polje `completed_at` mora biti popunjeno.

### TPA-08

Završeni učesnik ne briše se fizički.

### TPA-09

Promena radnog mesta učesnika nakon evidentiranih rezultata nije dozvoljena.

---

## 11.4. Planirani indeksi

```text
PRIMARY KEY (id)

UNIQUE (
    training_session_id,
    employee_job_position_id
)

INDEX (training_session_id)

INDEX (employee_job_position_id)

INDEX (attendance_status)

INDEX (final_status)

INDEX (training_session_id, final_status)
```

---

# 12. Kontrola pripadnosti istom poslodavcu

Sistem mora proveriti da:

```text
training_session.employer_id
```

odgovara poslodavcu konkretnog raspoređivanja zaposlenog.

Veza se proverava kroz:

```text
training_participants
    → employee_job_positions
    → employer_job_positions
    → employers
```

Ako poslodavci nisu isti, unos učesnika nije dozvoljen.

Ovo pravilo mora biti zaštićeno trigger funkcijom u bazi, a ne samo korisničkim interfejsom.

---

# 13. Pravilo nepromenljivosti završene sesije

Kada sesija dobije status:

```text
COMPLETED
```

nije dozvoljeno menjati podatke koji menjaju istorijsko značenje obuke:

- poslodavca,
- verziju programa,
- stvarni datum održavanja,
- učesnike koji su završili proces,
- rezultate testa,
- rezultate praktične provere.

Administrativne ispravke moraju biti evidentirane uz razlog izmene i korisnika koji je izmenu izvršio.

Detaljna revizijska evidencija biće uvedena u budućoj audit tabeli.