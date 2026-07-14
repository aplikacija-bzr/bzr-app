/*
------------------------------------------------------------
INPRO BZR
Migracija: 003_job_positions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje globalnog šifarnika radnih mesta.

Tabela:
- job_positions

Zavisnosti:
- public.set_updated_at() iz migracije 001

Napomena:
Tabela ne sadrži employer_id, opis procene rizika, opasnosti,
štetnosti, mere zaštite niti periodiku lekarskih pregleda.

Ti podaci pripadaju konkretnom radnom mestu kod konkretnog
poslodavca i biće uređeni posebnom tabelom.

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- UNIQUE ograničenja
- CHECK ograničenja
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

-- ============================================================
-- TABELA: job_positions
-- Globalni šifarnik standardizovanih naziva radnih mesta.
-- ============================================================

CREATE TABLE public.job_positions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_job_positions
        PRIMARY KEY (id),

    CONSTRAINT uq_job_positions_code
        UNIQUE (code),

    CONSTRAINT chk_job_positions_code_not_empty
        CHECK (BTRIM(code) <> ''),

    CONSTRAINT chk_job_positions_name_not_empty
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_job_positions_sort_order
        CHECK (sort_order >= 0)
);

-- ============================================================
-- JEDINSTVENOST NAZIVA
--
-- Naziv je jedinstven bez obzira na velika i mala slova.
-- Na primer, nije dozvoljeno istovremeno postojanje:
-- "Elektromonter" i "ELEKTROMONTER".
-- ============================================================

CREATE UNIQUE INDEX ux_job_positions_name_normalized
    ON public.job_positions (LOWER(BTRIM(name)));

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_job_positions_active
    ON public.job_positions (active);

CREATE INDEX idx_job_positions_active_sort_order
    ON public.job_positions (active, sort_order);

CREATE INDEX idx_job_positions_name
    ON public.job_positions (name);

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
-- ============================================================

CREATE TRIGGER trg_job_positions_set_updated_at
BEFORE UPDATE ON public.job_positions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.job_positions IS
'Globalni šifarnik standardizovanih naziva radnih mesta koje koriste svi poslodavci i moduli sistema INPRO BZR.';

COMMENT ON COLUMN public.job_positions.id IS
'Jedinstveni identifikator radnog mesta u globalnom šifarniku.';

COMMENT ON COLUMN public.job_positions.code IS
'Jedinstvena interna šifra radnog mesta.';

COMMENT ON COLUMN public.job_positions.name IS
'Standardizovani naziv radnog mesta. Naziv je jedinstven bez obzira na velika i mala slova.';

COMMENT ON COLUMN public.job_positions.description IS
'Opšti opis radnog mesta koji nije vezan za konkretnog poslodavca ili akt o proceni rizika.';

COMMENT ON COLUMN public.job_positions.active IS
'Označava da li se radno mesto trenutno može koristiti za nova raspoređivanja. Neaktivna radna mesta ostaju sačuvana u istorijskim evidencijama.';

COMMENT ON COLUMN public.job_positions.sort_order IS
'Redosled prikaza radnog mesta u korisničkom interfejsu.';

COMMENT ON COLUMN public.job_positions.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.job_positions.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;