# Istorija verzija

| Verzija | Datum | Autor | Opis |
|---------|--------|-------|------|
| 1.0 | 11.07.2026 | Slobodan Maksimović / ChatGPT | Početna arhitektura modula OBUKA ZA BEZBEDAN I ZDRAV RAD |

| Celina             | Status          | Napomena          |
| ------------------ | --------------- | ----------------- |
| Arhitektura        | 🟢 Projektovano | Dokument u izradi |
| Baza podataka      | ⏳ Nije započeto |                   |
| Supabase migracije | ⏳ Nije započeto |                   |
| UI                 | ⏳ Nije započeto |                   |
| Testovi            | ⏳ Nije započeto |                   |
| Obrazac 6          | ⏳ Nije započeto |                   |
| Završno testiranje | ⏳ Nije započeto |                   |


# INPRO BZR

# Modul: OBUKA ZA BEZBEDAN I ZDRAV RAD

## Arhitektura baze podataka i modula

Verzija: 1.0  
Datum: 11.07.2026

---

# Cilj modula

Napraviti profesionalni modul za vođenje kompletne zakonske evidencije o osposobljavanju zaposlenih za bezbedan i zdrav rad i pravilno korišćenje lične zaštitne opreme (LZO), sa automatskim generisanjem Obrasca 6.

---

# Osnovni principi razvoja

- Koristi se postojeća tabela `employers`.
- Ne pravi se nova baza poslodavaca.
- Zaposleni i radna mesta predstavljaju zajedničku bazu koju će koristiti i budući modul Lekarski pregledi.
- Sve evidencije moraju imati kompletnu istoriju promena.
- Obrazac 6 generiše se automatski iz baze.
- Projekat se razvija po pravilima definisanim u `PROJECT_RULES.md`.

---

# Zajedničke tabele

- employers (postojeća tabela)
- employees
- job_positions
- employee_job_positions

---
# Arhitektura modula

Modul se sastoji od sledećih celina:

1. Poslodavci
2. Zaposleni
3. Radna mesta
4. Raspoređivanje zaposlenih na radna mesta
5. Programi obuke
6. Dokumentacija za obuku
7. Testovi i pitanja
8. Sprovođenje obuke
9. Evidencija osposobljavanja
10. Praktična provera
11. Obuka za pravilno korišćenje LZO
12. Automatsko generisanje Obrasca 6
13. Istorija dokumenata
14. Podsetnici za periodične obuke
15. Izveštaji i pretraga

---

# Tok podataka

employers
↓
employees
↓
employee_job_positions
↓
job_positions
↓
training_programs
↓
training_sessions
↓
training_participants
↓
test_attempts
↓
form_6_records

---

# Osnovni princip

Podaci se unose samo jednom.

Svi ostali moduli koriste iste podatke.

To znači da će:

- modul Obuke,
- modul Lekarskih pregleda,
- budući modul Evidencije povreda,
- budući modul LZO,

koristiti zajedničku bazu zaposlenih i radnih mesta.

Na taj način izbegava se dupliranje podataka i održava jedinstvena evidencija u celoj aplikaciji.
# Tabela: employees

## Namena

Tabela `employees` predstavlja centralnu evidenciju zaposlenih i zajednička je za više modula sistema:

- Obuka za bezbedan i zdrav rad
- Lekarski pregledi
- Lična zaštitna oprema (budući modul)
- Evidencija povreda na radu (budući modul)

Jedan zaposleni pripada jednom poslodavcu, ali tokom radnog odnosa može biti raspoređen na više radnih mesta.

Podaci o zaposlenom unose se samo jednom i koriste se u svim modulima.

## Polja

| Polje | Tip | Obavezno | Opis |
|--------|-----|----------|------|
| id | UUID | DA | Primarni ključ |
| employer_id | UUID | DA | Veza sa tabelom employers |
| first_name | TEXT | DA | Ime |
| last_name | TEXT | DA | Prezime |
| jmbg | TEXT | NE | JMBG |
| employee_number | TEXT | NE | Interni broj zaposlenog |
| date_of_birth | DATE | NE | Datum rođenja |
| place_of_birth | TEXT | NE | Mesto rođenja |
| qualification | TEXT | NE | Stručna sprema |
| occupation | TEXT | NE | Zanimanje |
| employment_start | DATE | NE | Datum zasnivanja radnog odnosa |
| employment_end | DATE | NE | Datum prestanka radnog odnosa |
| email | TEXT | NE | Email |
| phone | TEXT | NE | Telefon |
| active | BOOLEAN | DA | Aktivan / neaktivan |
| notes | TEXT | NE | Napomena |
| created_at | TIMESTAMP | DA | Datum kreiranja |
| updated_at | TIMESTAMP | DA | Datum izmene |

## Pravila

- Zaposleni se nikada fizički ne briše.
- Po prestanku radnog odnosa postavlja se `active = false`.
- Istorija svih obuka, lekarskih pregleda i drugih evidencija ostaje sačuvana.
- Jedan zaposleni može imati više radnih mesta preko tabele `employee_job_positions`.