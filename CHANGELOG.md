# INPRO BZR

# CHANGELOG

Sve značajne izmene na projektu evidentiraju se u ovom dokumentu.

Format verzionisanja:

- MAJOR.MINOR.PATCH

Primer:

v1.0.0

v1.1.0

v1.1.1

v2.0.0

---

# v1.0.0

Datum:

05.07.2026.

Status:

🟢 STABILNA VERZIJA

Git Tag:

v1.0.0

---

## Dodato

### Dnevne BZR kontrole

- Kreiranje nove kontrole
- Ček lista
- Komentari
- Fotografije
- PDF dnevne kontrole
- Arhiva kontrola

---

### Mesečni BZR izveštaji

- Automatsko grupisanje dnevnih kontrola
- Novi PDF mesečnog izveštaja
- Pregled svih kontrola
- Prikaz nedostataka
- Fotografije u izveštaju
- Mesečna statistika
- Ocena primene mera BZR

---

### PDF

- React PDF
- Novi dizajn
- Jedinstven izgled
- Prikaz fotografija
- Zaključak izveštaja

---

### Email

- Slanje mesečnog izveštaja
- PDF u prilogu
- SMTP podrška
- Istorija slanja

---

### Supabase

- Povezivanje sa bazom
- Čuvanje kontrola
- Čuvanje fotografija
- Preuzimanje podataka za izveštaje

---

### Deploy

- GitHub
- Vercel
- Next.js 16
- TypeScript
- React PDF

---

### Dokumentacija

Dodati dokumenti:

README.md

PROJECT_RULES.md

OPORAVAK_PROJEKTA.md

CHANGELOG.md

---

## Testiranje

Lokalni test

✔ npm run dev --webpack

✔ npm run build

---

Produkcioni test

✔ GitHub

✔ Vercel

✔ PDF

✔ Email

✔ Praktičan rad

---

## Poznati warning-i

themeColor metadata warning (Next.js 16)

Ne utiče na rad aplikacije.

---

## Status

Verzija zaključana.

Dalji razvoj nastavlja se od verzije:

v1.1.0

---

# Sledeće planirane funkcionalnosti (v1.1.0)

- Poboljšanje izgleda PDF-a
- Unicode fontovi (č ć ž š đ)
- Broj strane u PDF-u
- Broj mesečnog izveštaja
- Digitalni potpis savetnika
- Zaglavlje i podnožje PDF-a
- Optimizacija slanja email-a
- Doterivanje korisničkog interfejsa

---

# Napomena

Svaka stabilna verzija mora imati:

✔ Git Commit

✔ GitHub

✔ Git Tag

✔ Test na Vercelu

✔ Praktičan test

Tek tada se verzija smatra završenom.

# v1.2.0

Datum:

14.07.2026.

Status:

🟡 U RAZVOJU

---

## Dodato

### Arhitektura

- Refaktorisane dashboard stranice
- Dashboard koristi server Supabase klijent
- Service Role uklonjen iz dashboard stranica

---

### Baza podataka

- Uvedena struktura foldera /database
- migrations
- seed
- views
- functions
- triggers

---

### Dokumentacija

Dodati dokumenti:

- OBUKA_BZR_ARHITEKTURA_BAZE.md

---

Projektovana tabela:

- training_catalog

Projektovana automatizacija:

- dnevni email podsetnici
- matrica osposobljenosti
- automatsko praćenje rokova

---

## Sledeći razvoj

- SQL migracija 001_training_catalog.sql
- Programi osposobljavanja
- Testovi
- Evidencija osposobljavanja# v1.2.0

Datum:

14.07.2026.

Status:

🟡 U RAZVOJU

---

## Dodato

### Arhitektura

- Refaktorisane dashboard stranice
- Dashboard koristi server Supabase klijent
- Service Role uklonjen iz dashboard stranica

---

### Baza podataka

- Uvedena struktura foldera /database
- migrations
- seed
- views
- functions
- triggers

---

### Dokumentacija

Dodati dokumenti:

- OBUKA_BZR_ARHITEKTURA_BAZE.md

---

Projektovana tabela:

- training_catalog

Projektovana automatizacija:

- dnevni email podsetnici
- matrica osposobljenosti
- automatsko praćenje rokova

---

## Sledeći razvoj

- SQL migracija 001_training_catalog.sql
- Programi osposobljavanja
- Testovi
- Evidencija osposobljavanja