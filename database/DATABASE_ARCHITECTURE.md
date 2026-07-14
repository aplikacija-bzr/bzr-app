# INPRO BZR

# MASTER ARHITEKTURA BAZE PODATAKA

Verzija: 1.0  
Datum: 14.07.2026.  
Status: U izradi  
Autor: Slobodan Maksimović / ChatGPT

---

# 1. Namena dokumenta

Dokument `DATABASE_ARCHITECTURE.md` predstavlja glavni projektantski dokument baze podataka informacionog sistema INPRO BZR.

Dokument definiše:

- osnovne principe arhitekture baze,
- zajedničke podatke koje koristi više modula,
- glavne funkcionalne celine sistema,
- tabele i njihove odgovornosti,
- veze između tabela,
- redosled SQL migracija,
- zavisnosti između migracija,
- pravila čuvanja istorijskih podataka,
- pravila za buduće proširenje sistema.

Nijedna nova tabela ne sme se izrađivati pre nego što bude definisana u odgovarajućoj projektnoj dokumentaciji.

Nijedna tabela ne pravi se ručno u Supabase kontrolnoj tabli.

Svaka promena baze podataka mora biti izrađena kao SQL migracija u folderu:

```text
database/migrations
---

# 6. Funkcionalne celine baze

Baza podataka deli se na funkcionalne celine koje predstavljaju povezane module sistema.

## 6.1. Zajednički podaci

```text
employers
employees
job_positions
employer_job_positions
employee_job_positions
---

# 10. ER pregled osnovne arhitekture

Osnovne veze sistema prikazane su sledećim pojednostavljenim ER modelom:

```text
employers
    │
    ├──< employees
    │
    └──< employer_job_positions >── job_positions
                │
                └──< employee_job_positions >── employees
                ---

# 16. Arhitektura modula osposobljavanja

## 16.1. Osnovni princip

Modul osposobljavanja projektovan je tako da se sadržaj programa, testovi i dokumentacija nikada ne menjaju retroaktivno.

Kada dođe do izmene programa osposobljavanja ili testa, kreira se nova verzija.

Na taj način svako završeno osposobljavanje ostaje povezano sa verzijom programa koja je važila u trenutku sprovođenja obuke.

---

## 16.2. Struktura modula

```text
training_catalog
        │
        └──< training_programs
                    │
                    └──< training_program_versions
                                │
                                ├──< training_program_documents
                                │
                                ├──< training_tests
                                │          │
                                │          └──< training_questions
                                │                     │
                                │                     └──< training_question_options
                                │
                                └──< training_practical_requirements
```

---

## 16.3. Uloge tabela

### training_catalog

Globalni šifarnik vrsta osposobljavanja.

Primer:

- Prethodno osposobljavanje
- Periodično osposobljavanje
- LOTO
- Rad na visini
- Zaštita od požara
- Prva pomoć

---

### training_programs

Predstavlja poslovni program osposobljavanja.

Ne sadrži konkretan sadržaj predavanja.

Sadrži:

- šifru,
- naziv,
- opis,
- vrstu osposobljavanja,
- status.

Primer:

```text
Program:
BZR_PRETHODNO
```

---

### training_program_versions

Predstavlja konkretnu verziju programa.

Primer:

```text
Program:
BZR_PRETHODNO

Verzija:
1.0

Važi od:
01.01.2026.
```

Ovde se definiše kompletan sadržaj obuke.

---

### training_program_documents

Dokumenti koji pripadaju konkretnoj verziji programa.

Primeri:

- prezentacije,
- PDF uputstva,
- pravilnici,
- video materijali,
- radni listovi.

---

### training_tests

Test znanja koji pripada verziji programa.

Jedna verzija programa može imati više testova.

---

### training_questions

Pitanja koja pripadaju konkretnom testu.

---

### training_question_options

Ponudjeni odgovori.

Podržava:

- jedan tačan odgovor,
- više tačnih odgovora.

---

### training_practical_requirements

Opis praktične provere.

Primer:

- pravilno korišćenje LZO,
- pravilno korišćenje merdevina,
- LOTO procedura,
- rad na visini,
- upravljanje mašinom.

---

## 16.4. Tok osposobljavanja

```text
training_catalog
        │
training_program
        │
training_program_version
        │
training_session
        │
training_participant
        │
├── test_attempt
│
├── practical_check
│
└── employee_training
```

---

## 16.5. Poslovna pravila

### TP-01

Program može imati više verzija.

---

### TP-02

Samo jedna verzija programa može biti aktivna u određenom periodu.

---

### TP-03

Program koji je korišćen za osposobljavanje ne sme se menjati.

---

### TP-04

Izmena sadržaja programa vrši se isključivo kreiranjem nove verzije.

---

### TP-05

Svaka verzija programa može imati:

- dokumentaciju,
- testove,
- praktične zahteve.

---

### TP-06

Završeno osposobljavanje mora biti povezano sa tačno jednom verzijom programa.

---

### TP-07

Brisanje verzije koja je korišćena nije dozvoljeno.

Koristi se:

```text
active = false
```

---

### TP-08

Program može biti povezan sa više različitih radnih mesta preko tabele:

```text
employer_job_position_training_requirements
```

Na taj način isto osposobljavanje može biti obavezno za više radnih mesta.

---

## 16.6. Buduća proširenja

Planirana proširenja:

- video obuke,
- elektronsko potpisivanje prisustva,
- QR identifikacija zaposlenih,
- elektronski sertifikati,
- online testiranje,
- automatsko generisanje PDF potvrda,
- automatsko slanje potvrda email-om,
- mobilna aplikacija za instruktore.