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