# INPRO BZR

# ARHITEKTURA MODULA OSPOSOBLJAVANJA

Verzija: 1.0  
Datum: 14.07.2026.  
Status: U izradi  
Autor: Slobodan Maksimović / ChatGPT

---

# 1. Namena dokumenta

Dokument `TRAINING_MODULE_ARCHITECTURE.md` predstavlja detaljnu tehničku i poslovnu specifikaciju modula za osposobljavanje zaposlenih za bezbedan i zdrav rad i druga stručna osposobljavanja.

Dokument definiše:

- strukturu modula,
- odgovornosti tabela,
- veze između tabela,
- tok sprovođenja osposobljavanja,
- pravila verzionisanja programa,
- teorijsku proveru znanja,
- praktičnu proveru osposobljenosti,
- evidenciju osposobljavanja zaposlenih,
- generisanje Obrasca 6,
- izdavanje potvrda i sertifikata,
- automatsko praćenje rokova,
- redosled SQL migracija.

Ovaj dokument predstavlja osnovu za izradu SQL migracija, API ruta i korisničkog interfejsa modula.

---

# 2. Cilj modula

Cilj modula je vođenje kompletne evidencije osposobljavanja zaposlenih, od definisanja vrste i programa osposobljavanja do formiranja zakonske evidencije i praćenja narednog roka.

Modul mora omogućiti:

- definisanje vrsta osposobljavanja,
- definisanje programa i njihovih verzija,
- povezivanje programa sa radnim mestima,
- pripremu dokumentacije i materijala,
- formiranje testova znanja,
- sprovođenje teorijske obuke,
- sprovođenje praktične obuke,
- teorijsku proveru znanja,
- praktičnu proveru osposobljenosti,
- evidentiranje prisustva,
- evidentiranje rezultata,
- generisanje Obrasca 6,
- izdavanje potvrda i sertifikata,
- praćenje periodičnih rokova,
- dnevne email podsetnike,
- čuvanje kompletne istorije osposobljavanja.

---

# 3. Osnovni principi

## 3.1. Podaci se unose samo jednom

Modul koristi postojeće zajedničke tabele:

```text
employers
employees
job_positions
employer_job_positions
employee_job_positions
---

# 7. Tabela training_programs

## 7.1. Namena

Tabela:

```text
training_programs