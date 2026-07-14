/*
------------------------------------------------------------
INPRO BZR
Migracija: 002_employees.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje centralne evidencije zaposlenih.

Tabela:
- employees

Zavisnosti:
- public.employers
- public.set_updated_at() iz migracije 001

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY
- UNIQUE indekse
- CHECK ograničenja
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

-- ============================================================
-- TABELA: employees
-- Centralna evidencija zaposlenih koju koriste moduli:
-- Obuka za BZR, Lekarski pregledi, LZO i Povrede na radu.
-- ============================================================

CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    employer_id UUID NOT NULL,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    jmbg TEXT,
    employee_number TEXT,

    date_of_birth DATE,
    place_of_birth TEXT,

    qualification TEXT,
    occupation TEXT,

    employment_start DATE,
    employment_end DATE,

    email TEXT,
    phone TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_employees
        PRIMARY KEY (id),

    CONSTRAINT fk_employees_employer
        FOREIGN KEY (employer_id)
        REFERENCES public.employers (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_employees_first_name_not_empty
        CHECK (BTRIM(first_name) <> ''),

    CONSTRAINT chk_employees_last_name_not_empty
        CHECK (BTRIM(last_name) <> ''),

    CONSTRAINT chk_employees_jmbg_not_empty
        CHECK (
            jmbg IS NULL
            OR BTRIM(jmbg) <> ''
        ),

    CONSTRAINT chk_employees_employee_number_not_empty
        CHECK (
            employee_number IS NULL
            OR BTRIM(employee_number) <> ''
        ),

    CONSTRAINT chk_employees_employment_dates
        CHECK (
            employment_end IS NULL
            OR employment_start IS NULL
            OR employment_end >= employment_start
        ),

    CONSTRAINT chk_employees_email_not_empty
        CHECK (
            email IS NULL
            OR BTRIM(email) <> ''
        ),

    CONSTRAINT chk_employees_phone_not_empty
        CHECK (
            phone IS NULL
            OR BTRIM(phone) <> ''
        )
);

-- ============================================================
-- JEDINSTVENOST
--
-- JMBG i interni broj zaposlenog moraju biti jedinstveni
-- kod istog poslodavca, ali samo kada su uneti.
-- ============================================================

CREATE UNIQUE INDEX ux_employees_employer_jmbg
    ON public.employees (employer_id, jmbg)
    WHERE jmbg IS NOT NULL;

CREATE UNIQUE INDEX ux_employees_employer_employee_number
    ON public.employees (employer_id, employee_number)
    WHERE employee_number IS NOT NULL;

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_employees_employer_id
    ON public.employees (employer_id);

CREATE INDEX idx_employees_active
    ON public.employees (active);

CREATE INDEX idx_employees_employer_active
    ON public.employees (employer_id, active);

CREATE INDEX idx_employees_last_name_first_name
    ON public.employees (last_name, first_name);

CREATE INDEX idx_employees_employment_end
    ON public.employees (employment_end)
    WHERE employment_end IS NOT NULL;

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
--
-- Koristi univerzalnu funkciju public.set_updated_at()
-- kreiranu migracijom 001_training_catalog.sql.
-- ============================================================

CREATE TRIGGER trg_employees_set_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.employees IS
'Centralna evidencija zaposlenih koju zajednički koriste moduli Obuka za BZR, Lekarski pregledi, LZO i Evidencija povreda na radu.';

COMMENT ON COLUMN public.employees.id IS
'Jedinstveni identifikator zaposlenog.';

COMMENT ON COLUMN public.employees.employer_id IS
'Poslodavac kod koga je zaposleni evidentiran. Veza sa tabelom employers.';

COMMENT ON COLUMN public.employees.first_name IS
'Ime zaposlenog.';

COMMENT ON COLUMN public.employees.last_name IS
'Prezime zaposlenog.';

COMMENT ON COLUMN public.employees.jmbg IS
'Jedinstveni matični broj građana, kada je dostupan.';

COMMENT ON COLUMN public.employees.employee_number IS
'Interni evidencioni broj zaposlenog kod poslodavca.';

COMMENT ON COLUMN public.employees.date_of_birth IS
'Datum rođenja zaposlenog.';

COMMENT ON COLUMN public.employees.place_of_birth IS
'Mesto rođenja zaposlenog.';

COMMENT ON COLUMN public.employees.qualification IS
'Stepen ili naziv stručne spreme zaposlenog.';

COMMENT ON COLUMN public.employees.occupation IS
'Zanimanje zaposlenog.';

COMMENT ON COLUMN public.employees.employment_start IS
'Datum zasnivanja radnog odnosa ili početka angažovanja.';

COMMENT ON COLUMN public.employees.employment_end IS
'Datum prestanka radnog odnosa ili angažovanja.';

COMMENT ON COLUMN public.employees.email IS
'Email adresa zaposlenog.';

COMMENT ON COLUMN public.employees.phone IS
'Broj telefona zaposlenog.';

COMMENT ON COLUMN public.employees.active IS
'Označava da li je zaposleni trenutno aktivan kod poslodavca. Po prestanku rada postavlja se na FALSE, bez fizičkog brisanja zapisa.';

COMMENT ON COLUMN public.employees.notes IS
'Dodatne napomene o zaposlenom.';

COMMENT ON COLUMN public.employees.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.employees.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;