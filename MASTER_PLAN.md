# INPRO BZR

# MASTER PLAN

Verzija: 1.0.0

Datum: 14.07.2026.

Status: Aktivan

Autor: Slobodan Maksimović / ChatGPT

---

Ovaj dokument predstavlja glavni razvojni plan informacionog sistema INPRO BZR.

Služi za:

- planiranje razvoja,
- praćenje statusa modula,
- definisanje prioriteta,
- evidenciju završenih faza razvoja,
- planiranje narednih verzija sistema.
# INPRO BZR

# MASTER PLAN

Verzija: 1.0.0

Datum: 14.07.2026.

Status: AKTIVAN

Autor: Slobodan Maksimović / ChatGPT

---

# 1. Namena dokumenta

MASTER PLAN predstavlja glavni razvojni dokument informacionog sistema INPRO BZR.

Njegova svrha je da definiše:

- dugoročan razvoj projekta,
- razvojne faze,
- prioritete,
- status svake funkcionalne celine,
- plan narednih verzija,
- redosled implementacije.

Ovaj dokument predstavlja polaznu tačku za svaki novi razvojni ciklus.

---

# 2. Vizija sistema

INPRO BZR razvija se kao jedinstvena poslovna platforma za upravljanje bezbednošću i zdravljem na radu.

Sistem objedinjuje sve ključne procese:

- procenu rizika,
- osposobljavanje zaposlenih,
- lekarske preglede,
- ličnu zaštitnu opremu,
- dozvole za rad,
- evidenciju povreda,
- dnevne kontrole,
- mesečne izveštaje,
- dokumentaciju,
- zakonske obrasce,
- automatska obaveštenja,
- analitiku i izveštavanje.

Cilj projekta nije razvoj pojedinačnih aplikacija, već jedinstvenog informacionog sistema u kome svi moduli koriste zajedničku bazu podataka i zajednička poslovna pravila.

---

# 3. Trenutno stanje projekta

Status razvoja:

🟢 Aktivan razvoj

Git:

🟢 Sinhronizovan

GitHub:

🟢 Sinhronizovan

Supabase:

🟡 Projektovanje baze u toku

Verzija projekta:

v1.0.0

---

# 4. Osnovna razvojna pravila

Redosled razvoja:

Dokumentacija

↓

SQL migracije

↓

Git

↓

Supabase

↓

API

↓

Frontend

↓

Testiranje

Svaka funkcionalna celina završava se tek kada su završeni svi navedeni koraci.

---

# 5. Završene faze

## FAZA 1

Status:

🟢 Završena

Naziv:

Osnova informacionog sistema

Obuhvata:

- razvojne standarde,
- arhitekturu baze,
- arhitekturu modula,
- arhitekturu procesa,
- SQL migracije 001–014,
- profesionalnu Git strukturu,
- organizaciju projekta.

---

## FAZA 2

Status:

🟡 U toku

Naziv:

Modul Osposobljavanje zaposlenih

Trenutni status:

Projektovanje procesa osposobljavanja.

Sledeći korak:

SQL migracije procesa:

015–023
---

# 6. Plan razvoja

## FAZA 2 – Modul Osposobljavanje

Status:

🟡 U toku

Planirane aktivnosti:

- Proces osposobljavanja
- SQL migracije 015–023
- API
- Korisnički interfejs
- Obrazac 6
- PDF potvrde
- Automatski podsetnici
- Email obaveštenja
- Dashboard

---

## FAZA 3 – Procena rizika

Status:

⚪ Planirano

Planirane aktivnosti:

- Akt o proceni rizika
- Radna mesta
- Opasnosti
- Štetnosti
- Mere
- Rizici
- Revizije akta
- PDF generator

---

## FAZA 4 – Lekarski pregledi

Status:

⚪ Planirano

Planirane aktivnosti:

- Evidencija pregleda
- Uputi
- Obrazac 1
- Obrazac 2
- Rokovi
- Automatski podsetnici

---

## FAZA 5 – Lična zaštitna oprema

Status:

⚪ Planirano

Planirane aktivnosti:

- Katalog LZO
- Zaduženja
- Povraćaj
- Rokovi zamene
- Elektronski karton zaposlenog

---

## FAZA 6 – Dozvole za rad

Status:

⚪ Planirano

Planirane aktivnosti:

- Dozvole za rad
- LOTO
- Rad na visini
- Rad u skučenom prostoru
- Isključenja
- Kontrolne liste

---

## FAZA 7 – Povrede na radu

Status:

⚪ Planirano

Planirane aktivnosti:

- Evidencija povreda
- Analiza uzroka
- Statistika
- Izveštaji
- PDF obrasci

---

## FAZA 8 – Dnevne kontrole

Status:

🟢 Završeno

Napomena:

Modul je u produkcionoj upotrebi.

---

## FAZA 9 – Mesečni izveštaji

Status:

🟢 Završeno

Napomena:

Automatsko generisanje i slanje e-mailom implementirano.

---

## FAZA 10 – Dashboard i analitika

Status:

🟡 Delimično završeno

Planirane aktivnosti:

- KPI
- Statistika
- Grafici
- Pregled rokova
- Aktivnosti po poslodavcu

---

# 7. Dugoročni razvoj

Planirani budući moduli:

- Mobilna aplikacija
- Offline režim rada
- Elektronski potpis
- OCR dokumenata
- AI analiza povreda
- AI analiza rizika
- Integracija sa eUpravom
- Integracija sa kadrovskim sistemima
- API za klijente

---

# 8. Razvojni prioriteti

Prioritet razvoja određuje se sledećim redosledom:

1. Jezgro baze
2. Poslovni procesi
3. API
4. Korisnički interfejs
5. Automatizacija
6. Izveštaji
7. Optimizacija

---

# 9. Dokumentacija projekta

Ključni dokumenti projekta:

- MASTER_PLAN.md
- CHANGELOG.md
- PROJECT_RULES.md
- DATABASE_ARCHITECTURE.md
- TRAINING_MODULE_ARCHITECTURE.md
- TRAINING_PROCESS_ARCHITECTURE.md
- STANDARDS.md

---

# 10. Završna napomena

MASTER PLAN predstavlja glavni dokument za upravljanje razvojem informacionog sistema INPRO BZR.

Na početku svakog novog razvojnog ciklusa proverava se stanje u ovom dokumentu, ažurira status faza i definišu naredni prioriteti.

Sve značajne izmene projekta evidentiraju se u dokumentu CHANGELOG.md, dok MASTER PLAN predstavlja pregled trenutnog stanja i planiranog razvoja.