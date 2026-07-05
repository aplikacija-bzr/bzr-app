# INPRO BZR
# PRAVILA RAZVOJA PROJEKTA

Verzija dokumenta: 1.0

Datum: 05.07.2026.

---

# CILJ

Cilj ovog dokumenta je da obezbedi:

- stabilan razvoj aplikacije,
- jednostavno održavanje,
- sigurnost podataka,
- mogućnost brzog oporavka,
- jedinstven način razvoja svih budućih modula.

---

# OSNOVNO PRAVILO

Aplikacija se razvija isključivo kroz stabilne verzije.

Nijedna funkcionalnost nije završena dok ne prođe kompletan proces razvoja i testiranja.

---

# RAZVOJNI CIKLUS

Svaki modul prolazi sledeće faze:

## 1. Planiranje

Definisati:

- cilj modula
- funkcionalnosti
- izgled ekrana
- tok podataka
- bazu podataka
- API-je

Bez plana se ne piše kod.

---

## 2. Razvoj

Kod se piše postepeno.

Posle svake značajnije izmene:

- sačuvati fajlove
- proveriti TypeScript
- proveriti lint greške

---

## 3. Lokalno testiranje

Obavezno proveriti:

```
npm run dev --webpack
```

zatim

```
npm run build
```

Build mora proći bez grešaka.

Warning nije kritičan ukoliko je poznat.

---

## 4. Funkcionalni test

Proveriti:

✔ dugmad

✔ forme

✔ Supabase

✔ API

✔ PDF

✔ upload

✔ email

✔ sve scenarije rada

---

## 5. Test na Vercelu

Posle Git Push-a proveriti:

- Deployment uspešan

- Otvaranje aplikacije

- Rad svih novih funkcionalnosti

---

## 6. Praktičan test

Modul koristiti sa stvarnim podacima.

Primer:

- stvarni poslodavac

- stvarna kontrola

- stvarni PDF

- stvarni email

Tek tada se modul smatra završenim.

---

## 7. Git

Obavezno:

git status

git add

git commit

Commit poruka mora jasno opisivati izmene.

Primer:

"Novi mesečni BZR PDF"

"Novi modul lekarskih pregleda"

---

## 8. GitHub

Poslati izmene:

git push origin main

Proveriti da li je GitHub ažuriran.

---

## 9. Git Tag

Svaka stabilna verzija dobija Git Tag.

Primer:

v1.0.0

v1.1.0

v2.0.0

Bez Git Tag-a verzija nije završena.

---

## 10. Zaključavanje

Posle Git Tag-a:

Modul se smatra završenim.

Ne vrše se nove izmene u tom modulu osim:

- ispravke grešaka

- bezbednoske izmene

Sve nove funkcionalnosti razvijaju se u sledećoj verziji.

---

# PRAVILA KODIRANJA

Koristiti TypeScript.

Ne duplirati kod.

Pisati čitljiva imena funkcija.

Koristiti postojeće komponente kada god je moguće.

Jedna komponenta treba da ima jednu odgovornost.

---

# STRUKTURA PROJEKTA

app/

API

Komponente

Dashboard

Autentifikacija

lib/

Zajedničke funkcije

utils/

Pomoćne funkcije

public/

Slike

Manifest

Ikonice

README.md

PROJECT_RULES.md

OPORAVAK_PROJEKTA.md

---

# BAZA PODATAKA

Sve izmene baze:

prvo isplanirati

zatim testirati

nikada ne menjati produkcionu bazu bez provere.

---

# PDF

Svaki novi PDF mora imati:

jedinstven dizajn

čitljiv raspored

mogućnost štampe

mogućnost slanja emailom

---

# EMAIL

Email mora sadržati:

jasan naslov

kratko objašnjenje

PDF u prilogu

---

# BACKUP

Stabilna verzija mora postojati na tri mesta:

GitHub

Git Tag

Lokalni ZIP

---

# DOKUMENTACIJA

Svaka veća funkcionalnost mora biti dokumentovana.

Obavezni dokumenti:

README.md

PROJECT_RULES.md

OPORAVAK_PROJEKTA.md

CHANGELOG.md

---

# VERZIONISANJE

Koristi se Semantic Versioning.

v1.0.0

Prva stabilna verzija.

v1.1.0

Nova funkcionalnost.

v1.1.1

Ispravke grešaka.

v2.0.0

Velike promene.

---

# PRAVILO RAZVOJA

Ne razvijati dve velike funkcionalnosti istovremeno.

Jedan modul.

Test.

Zaključavanje.

Tek onda sledeći modul.

---

# FILOZOFIJA PROJEKTA

INPRO BZR nije samo aplikacija.

To je profesionalni informacioni sistem za:

- bezbednost i zdravlje na radu,
- lekarske preglede,
- obuke zaposlenih,
- putne naloge,
- procenu rizika,
- sudska veštačenja,
- upravljanje dokumentacijom.

Razvoj sistema mora biti postepen, kontrolisan i potpuno proverljiv.

Kvalitet i stabilnost imaju prednost u odnosu na brzinu razvoja.