# INPRO BZR
# PRIRUČNIK ZA OPORAVAK PROJEKTA

Verzija dokumenta: 1.0
Datum: 05.07.2026.

---

# SVRHA

Ovaj dokument opisuje postupke za bezbedan oporavak projekta INPRO BZR u slučaju:

- greške u razvoju,
- neispravnog Git commit-a,
- neuspešnog deploy-a,
- kvara računara,
- prelaska na novi računar.

Osnovno pravilo projekta:

NIKADA ne raditi nasumične izmene nad stabilnom verzijom.

Svaka stabilna verzija mora imati:

✔ Git Commit
✔ GitHub
✔ Git Tag
✔ Testiranu Vercel verziju

---

# STABILNE VERZIJE

## v1.0.0

Datum:
05.07.2026.

Status:

STABILNA VERZIJA

Sadrži:

- Dnevne BZR kontrole
- Mesečne BZR izveštaje
- Generisanje PDF-a
- Fotografije
- Slanje email-a
- GitHub
- Vercel

---

# PROVERA TRENUTNOG STANJA

Provera statusa projekta

```bash
git status
```

ili

```bash
git status --porcelain
```

Ako nema ispisa:

Projekat je čist.

---

# PRIKAZ SVIH STABILNIH VERZIJA

```bash
git tag
```

Primer:

```
v1.0.0
v1.1.0
v2.0.0
```

---

# PREGLED STARE VERZIJE

Otvara staru verziju bez menjanja glavne grane.

```bash
git checkout v1.0.0
```

NAPOMENA

Nalazite se u "detached HEAD" režimu.

Ovo koristiti samo za pregled ili testiranje.

---

# NASTAVAK RAZVOJA IZ STABILNE VERZIJE

Ako želimo da nastavimo razvoj od stabilne verzije:

```bash
git checkout -b razvoj-v1.0.0 v1.0.0
```

ili

```bash
git checkout -b oporavak-v1.0.0 v1.0.0
```

---

# POVRATAK NA GLAVNU GRANU

```bash
git checkout main
```

---

# POTPUNI POVRATAK PROJEKTA

KORISTITI SAMO U KRAJNJOJ NUŽDI

```bash
git checkout main
git reset --hard v1.0.0
git push --force
```

Ova komanda briše sve izmene nastale posle verzije v1.0.0.

Koristiti samo kada nema drugog rešenja.

---

# PRAVLJENJE NOVE STABILNE VERZIJE

1.

```bash
git status
```

Proveriti da nema izmena.

2.

```bash
git add .
```

3.

```bash
git commit -m "Opis izmene"
```

4.

```bash
git push origin main
```

5.

```bash
git tag -a v1.1.0 -m "Opis verzije"
```

6.

```bash
git push origin v1.1.0
```

Tek nakon uspešnog Git Tag-a verzija se smatra stabilnom.

---

# POSTUPAK RAZVOJA MODULA

Svaki novi modul prolazi sledeće faze:

1. Plan razvoja

2. Pisanje koda

3. Lokalno testiranje

4. npm run build

5. Test na localhost-u

6. Test na Vercelu

7. Praktičan test

8. Git Commit

9. GitHub Push

10. Git Tag

11. Zaključavanje verzije

Tek tada prelazi se na sledeći modul.

---

# LOKALNI BACKUP

Preporučuje se čuvanje ZIP kopije projekta.

Primer:

D:\INPRO_BZR_BACKUP

Struktura:

INPRO_BZR_BACKUP

v1.0.0

v1.1.0

v2.0.0

Svaka stabilna verzija treba da postoji:

✔ GitHub

✔ Git Tag

✔ Lokalni ZIP Backup

---

# VRAĆANJE NA NOVI RAČUNAR

1.

Instalirati:

Node.js

Git

VS Code

2.

Klonirati projekat

```bash
git clone https://github.com/aplikacija-bzr/bzr-app.git
```

3.

Instalirati pakete

```bash
npm install
```

4.

Pokrenuti

```bash
npm run dev --webpack
```

ili

```bash
npm run build
```

---

# PRAVILA RAZVOJA

Ne menjati stabilnu verziju.

Svaki modul mora biti potpuno završen pre početka sledećeg.

Svaka verzija mora imati Git Tag.

Ne razvijati direktno na produkciji.

Sve izmene prvo testirati lokalno.

Tek nakon uspešnog testa raditi GitHub i Vercel.

---

# ZAKLJUČAK

Stabilna verzija predstavlja sigurnu tačku na koju se projekat uvek može vratiti.

Na ovaj način razvoj INPRO BZR aplikacije ostaje bezbedan, organizovan i potpuno kontrolisan.