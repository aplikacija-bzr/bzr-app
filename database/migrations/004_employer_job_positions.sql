/*
------------------------------------------------------------
INPRO BZR
Migracija: 004_employer_job_positions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje evidencije konkretnih radnih mesta kod poslodavaca.

Tabela:
- employer_job_positions

Zavisnosti:
- public.employers
- public.job_positions
- public.set_updated_at() iz migracije 001

Napomena:
Tabela predstavlja radno mesto kod konkretnog poslodavca.

Opis poslova, opasnosti, štetnosti, procenjeni rizici i mere
ne čuvaju se direktno u ovoj tabeli. Ti podaci pripadaju
odgovarajućoj verziji akta o proceni rizika.

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY ograničenja
- CHECK ograničenja
- parcijalni UNIQUE indeks
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

-- ============================================================
-- TABELA: employer_job_positions
--
-- Evidencija konkretnih radnih mesta kod konkretnog poslodavca.
-- Jedno globalno radno mesto može koristiti više poslodavaca.
-- Isti poslodavac može imati više konkretnih radnih mesta
-- zasnovanih na istom globalnom radnom mestu.
-- ============================================================

CREATE TABLE public.employer_job_positions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    employer_id UUID NOT NULL,
    job_position_id UUID NOT NULL,

    internal_code TEXT,
    internal_name TEXT,
    organizational_unit TEXT,

    employees_planned INTEGER,

    increased_risk BOOLEAN NOT NULL DEFAULT FALSE,

    valid_from DATE,
    valid_until DATE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_employer_job_positions
        PRIMARY KEY (id),

    CONSTRAINT fk_employer_job_positions_employer
        FOREIGN KEY (employer_id)
        REFERENCES public.employers (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_employer_job_positions_job_position
        FOREIGN KEY (job_position_id)
        REFERENCES public.job_positions (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_employer_job_positions_internal_code
        CHECK (
            internal_code IS NULL
            OR BTRIM(internal_code) <> ''
        ),

    CONSTRAINT chk_employer_job_positions_internal_name
        CHECK (
            internal_name IS NULL
            OR BTRIM(internal_name) <> ''
        ),

    CONSTRAINT chk_employer_job_positions_organizational_unit
        CHECK (
            organizational_unit IS NULL
            OR BTRIM(organizational_unit) <> ''
        ),

    CONSTRAINT chk_employer_job_positions_employees_planned
        CHECK (
            employees_planned IS NULL
            OR employees_planned >= 0
        ),

    CONSTRAINT chk_employer_job_positions_validity_dates
        CHECK (
            valid_until IS NULL
            OR valid_from IS NULL
            OR valid_until >= valid_from
        )
);

-- ============================================================
-- JEDINSTVENOST INTERNE ŠIFRE
--
-- Ako je interna šifra uneta, ona mora biti jedinstvena
-- kod konkretnog poslodavca.
--
-- Poređenje ne zavisi od velikih i malih slova, a razmaci
-- sa početka i kraja vrednosti se zanemaruju.
-- ============================================================

CREATE UNIQUE INDEX ux_employer_job_positions_employer_internal_code
    ON public.employer_job_positions (
        employer_id,
        LOWER(BTRIM(internal_code))
    )
    WHERE internal_code IS NOT NULL;

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_employer_job_positions_employer_id
    ON public.employer_job_positions (employer_id);

CREATE INDEX idx_employer_job_positions_job_position_id
    ON public.employer_job_positions (job_position_id);

CREATE INDEX idx_employer_job_positions_employer_active
    ON public.employer_job_positions (employer_id, active);

CREATE INDEX idx_employer_job_positions_employer_org_unit
    ON public.employer_job_positions (
        employer_id,
        organizational_unit
    )
    WHERE organizational_unit IS NOT NULL;

CREATE INDEX idx_employer_job_positions_increased_risk
    ON public.employer_job_positions (
        employer_id,
        increased_risk
    )
    WHERE active = TRUE;

CREATE INDEX idx_employer_job_positions_valid_until
    ON public.employer_job_positions (valid_until)
    WHERE valid_until IS NOT NULL;

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
-- ============================================================

CREATE TRIGGER trg_employer_job_positions_set_updated_at
BEFORE UPDATE ON public.employer_job_positions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.employer_job_positions IS
'Evidencija konkretnih radnih mesta kod poslodavaca. Povezuje poslodavca sa globalnim šifarnikom radnih mesta i predstavlja centralnu osnovu za raspoređivanje zaposlenih, procenu rizika, obuke, lekarske preglede i LZO.';

COMMENT ON COLUMN public.employer_job_positions.id IS
'Jedinstveni identifikator konkretnog radnog mesta kod poslodavca.';

COMMENT ON COLUMN public.employer_job_positions.employer_id IS
'Poslodavac kod koga je konkretno radno mesto sistematizovano ili evidentirano.';

COMMENT ON COLUMN public.employer_job_positions.job_position_id IS
'Veza sa standardizovanim nazivom radnog mesta iz globalnog šifarnika job_positions.';

COMMENT ON COLUMN public.employer_job_positions.internal_code IS
'Interna šifra radnog mesta kod poslodavca. Kada je uneta, mora biti jedinstvena kod tog poslodavca.';

COMMENT ON COLUMN public.employer_job_positions.internal_name IS
'Interni naziv radnog mesta koji koristi konkretni poslodavac.';

COMMENT ON COLUMN public.employer_job_positions.organizational_unit IS
'Organizaciona jedinica, pogon, služba, sektor ili druga celina u kojoj se radno mesto nalazi.';

COMMENT ON COLUMN public.employer_job_positions.employees_planned IS
'Planirani ili sistematizovani broj izvršilaca na konkretnom radnom mestu.';

COMMENT ON COLUMN public.employer_job_positions.increased_risk IS
'Trenutni operativni podatak da li je radno mesto utvrđeno kao radno mesto sa povećanim rizikom. Istorijski status čuva se kroz verziju akta o proceni rizika.';

COMMENT ON COLUMN public.employer_job_positions.valid_from IS
'Datum od kada konkretno radno mesto važi ili se koristi kod poslodavca.';

COMMENT ON COLUMN public.employer_job_positions.valid_until IS
'Datum do kada je konkretno radno mesto važilo ili se koristilo kod poslodavca.';

COMMENT ON COLUMN public.employer_job_positions.active IS
'Označava da li se konkretno radno mesto trenutno koristi za nova raspoređivanja i povezane evidencije.';

COMMENT ON COLUMN public.employer_job_positions.notes IS
'Dodatne napomene o konkretnom radnom mestu kod poslodavca.';

COMMENT ON COLUMN public.employer_job_positions.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.employer_job_positions.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;