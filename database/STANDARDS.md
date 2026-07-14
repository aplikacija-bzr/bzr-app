# INPRO BZR

# RAZVOJNI STANDARDI

Verzija: 1.0.0  
Datum: 14.07.2026.  
Status: Aktivan  
Autor: Slobodan Maksimović / ChatGPT

---

# 1. Namena dokumenta

Ovaj dokument definiše obavezne razvojne standarde za kompletan informacioni sistem INPRO BZR.

Standardi se primenjuju na:

- SQL migracije,
- bazu podataka,
- API,
- frontend,
- dokumentaciju,
- automatizaciju,
- izveštaje,
- buduće module.

Svi novi moduli moraju biti usklađeni sa ovim dokumentom.

---

# 2. Osnovni principi razvoja

## SR-01

Dokumentacija se izrađuje pre implementacije.

Redosled razvoja je:

```text
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
```

---

## SR-02

Ne prave se tabele direktno u Supabase-u.

Svaka promena baze mora postojati kao SQL migracija.

---

## SR-03

Migracija koja je primenjena u produkcionoj bazi ne menja se.

Sve izmene se izvode novom migracijom.

---

## SR-04

Svaka tabela mora imati jasno definisanu:

- namenu,
- poslovna pravila,
- veze,
- indekse,
- automatizaciju,
- buduća proširenja,
- napomene.

---

## SR-05

Istorijski podaci se ne brišu fizički.

Koristi se:

```text
active = false
```

ili datum završetka važenja.

---

## SR-06

Sve poslovne provere koje utiču na integritet podataka moraju biti zaštićene u bazi.

Korisnički interfejs predstavlja dodatnu kontrolu, ali nije jedina zaštita.

---

# 3. Standard imenovanja

## 3.1. Dokumentacija

Nazivi dokumenata pišu se velikim slovima.

Primer:

```text
DATABASE_ARCHITECTURE.md

TRAINING_MODULE_ARCHITECTURE.md

TRAINING_PROCESS_ARCHITECTURE.md

PROJECT_RULES.md

CHANGELOG.md

STANDARDS.md
```

---

## 3.2. SQL migracije

Naziv migracije:

```text
NNN_naziv.sql
```

Primer:

```text
001_training_catalog.sql

014_training_question_options.sql
```

Broj migracije se nikada ne menja nakon primene.

---

## 3.3. Tabele

Nazivi tabela:

- mala slova,
- množina,
- snake_case.

Primer:

```text
employees

training_program_versions

question_types

documents
```

---

## 3.4. Kolone

Nazivi kolona:

- mala slova,
- snake_case.

Primer:

```text
training_program_id

created_at

updated_at

sort_order
```

---

## 3.5. Primarni ključevi

Primarni ključ se uvek naziva:

```text
id
```

Tip:

```text
UUID
```

Podrazumevana vrednost:

```sql
gen_random_uuid()
```

---

## 3.6. Strani ključevi

Naziv:

```text
naziv_tabele_id
```

Primer:

```text
employee_id

document_id

training_test_id
```

---

# 4. Standardna polja

Većina tabela treba da koristi sledeća standardna polja:

| Polje | Tip | Obavezno |
|---|---|---:|
| id | UUID | DA |
| active | BOOLEAN | DA |
| notes | TEXT | NE |
| created_at | TIMESTAMPTZ | DA |
| updated_at | TIMESTAMPTZ | DA |

Po potrebi:

| Polje | Tip |
|---|---|
| code | TEXT |
| name | TEXT |
| description | TEXT |
| sort_order | INTEGER |
| valid_from | DATE |
| valid_until | DATE |

Standardna polja koriste se kada imaju poslovni smisao.

Ne uvode se mehanički u svaku tabelu.

---

# 5. Standard za CHECK ograničenja

Sva tekstualna polja koja ne smeju biti prazna koriste:

```sql
CHECK (BTRIM(name) <> '')
```

Opciona tekstualna polja koriste:

```sql
CHECK (
    description IS NULL
    OR BTRIM(description) <> ''
)
```

Negativne vrednosti sprečavaju se:

```sql
CHECK (
    value >= 0
)
```

Datumi koriste:

```sql
CHECK (
    valid_until IS NULL
    OR valid_until >= valid_from
)
```

---

# 6. Standard za indekse

Svaka tabela mora imati:

- PRIMARY KEY,
- indekse za strane ključeve,
- indekse za često pretraživana polja.

UNIQUE indeks koristi se kada poslovno pravilo zahteva jedinstvenost.

Parcijalni indeksi koriste se kada povećavaju performanse.

Primer:

```sql
WHERE active = TRUE
```
---

# 7. Standard za strane ključeve

Svi strani ključevi moraju imati jasno definisana pravila.

Podrazumevano:

```sql
ON UPDATE CASCADE
ON DELETE RESTRICT
```

`ON DELETE CASCADE` koristi se samo kada je poslovno opravdano i mora biti posebno obrazloženo u dokumentaciji.

---

# 8. Standard za trigere

Svaka tabela koja sadrži kolonu:

```text
updated_at
```

mora koristiti zajedničku funkciju:

```sql
public.set_updated_at()
```

Trigger se naziva:

```text
trg_<naziv_tabele>_set_updated_at
```

Primer:

```text
trg_training_tests_set_updated_at
```

Ne kreiraju se posebne funkcije za svaku tabelu kada postoji zajednička implementacija.

---

# 9. Standard za komentare

Svaka tabela mora imati:

- komentar tabele,
- komentar svake kolone koja ima poslovni značaj.

Komentari se pišu na srpskom jeziku.

Komentari treba da objašnjavaju poslovnu namenu podatka, a ne SQL tip.

Primer:

Ispravno:

```text
Datum završetka raspoređivanja zaposlenog.
```

Neispravno:

```text
DATE polje.
```

---

# 10. Standard za šifarnike

Sve vrednosti koje predstavljaju izbor iz liste treba, kada je opravdano, izdvojiti u centralne šifarnike.

Primeri:

```text
training_catalog
document_types
question_types
```

Planirani šifarnici:

```text
hazard_types
risk_levels
medical_examination_types
ppe_types
permit_types
injury_types
```

Na taj način:

- sprečava se dupliranje vrednosti,
- omogućavaju se prevodi,
- pojednostavljuju se izveštaji,
- održava se integritet podataka.

---

# 11. Standard za istorijske podatke

Istorijski podaci se ne brišu.

Koriste se sledeći modeli:

- `active = false`
- `valid_until`
- nova verzija zapisa
- audit evidencija

Brisanje je dozvoljeno samo za podatke koji nisu korišćeni u poslovnim procesima i nisu deo zakonske evidencije.

---

# 12. Standard za verzionisanje

Sadržaj koji može da se menja kroz vreme verzioniše se.

Primeri:

```text
training_program_versions
risk_assessment_versions
document_versions
```

Ne menja se sadržaj koji je već korišćen u završenom poslovnom procesu.

Nova verzija dobija novi zapis.

---

# 13. Standard za dokumentaciju

Svaki novi modul mora imati najmanje:

- arhitekturu baze,
- arhitekturu procesa,
- poslovna pravila,
- plan SQL migracija.

Pre implementacije mora biti jasno definisano:

- šta sistem radi,
- kako radi,
- koje podatke čuva,
- koje veze koristi,
- koje poslovne provere sprovodi.

---

# 14. Standard za Git

Svaka logička celina predstavlja poseban commit.

Poruke commit-a pišu se na engleskom jeziku.

Primeri:

```text
feat(database): add training tests table

docs(training): define training process

fix(database): correct foreign key constraint
```

Pre svakog commit-a obavezno izvršiti:

```bash
git diff --check
```

Radno stablo mora biti čisto pre početka nove funkcionalne celine.

---

# 15. Standard za razvoj

Kod razvoja svakog modula primenjuje se sledeći redosled:

```text
Analiza poslovnog procesa
        ↓
Arhitektura
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
        ↓
Dokumentovanje izmena
```

Nijedan korak se ne preskače.

---

# 16. Principi projekta

Projektovanje informacionog sistema INPRO BZR zasniva se na sledećim principima:

- jednostavna arhitektura,
- jasna poslovna pravila,
- bez dupliranja podataka,
- centralni šifarnici,
- istorijska sledljivost,
- verzionisanje promenljivih sadržaja,
- standardizovane SQL migracije,
- zajedničke funkcije i triggeri,
- visok kvalitet dokumentacije,
- profesionalna Git istorija.

---

# 17. Završna napomena

Ovaj dokument predstavlja osnovni razvojni standard projekta INPRO BZR.

Svaki novi modul mora biti usklađen sa pravilima definisanim u ovom dokumentu.

Izmene standarda moguće su samo nakon arhitektonske revizije projekta i evidentiraju se u dokumentu `CHANGELOG.md`.