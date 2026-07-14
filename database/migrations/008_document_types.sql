/*
------------------------------------------------------------
INPRO BZR
Migracija: 008_document_types.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje centralnog šifarnika vrsta dokumenata.

Tabela:
- document_types

Zavisnosti:
- public.set_updated_at()

Namena:
Standardizacija vrsta dokumenata koji se koriste u svim
modulima informacionog sistema INPRO BZR.

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
-- TABELA: document_types
--
-- Centralni šifarnik vrsta dokumenata.
-- Sprečava unos različitih naziva za istu vrstu dokumenta.
-- ============================================================

CREATE TABLE public.document_types (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_document_types
        PRIMARY KEY (id),

    CONSTRAINT uq_document_types_code
        UNIQUE (code),

    CONSTRAINT chk_document_types_code_not_empty
        CHECK (BTRIM(code) <> ''),

    CONSTRAINT chk_document_types_name_not_empty
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_document_types_description_not_empty
        CHECK (
            description IS NULL
            OR BTRIM(description) <> ''
        ),

    CONSTRAINT chk_document_types_sort_order
        CHECK (sort_order >= 0)
);

-- ============================================================
-- JEDINSTVENOST NAZIVA
--
-- Naziv vrste dokumenta mora biti jedinstven bez obzira
-- na velika i mala slova i spoljne razmake.
-- ============================================================

CREATE UNIQUE INDEX ux_document_types_name_normalized
    ON public.document_types (
        LOWER(BTRIM(name))
    );

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_document_types_active
    ON public.document_types (active);

CREATE INDEX idx_document_types_active_sort_order
    ON public.document_types (
        active,
        sort_order
    );

CREATE INDEX idx_document_types_name
    ON public.document_types (name);

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
-- ============================================================

CREATE TRIGGER trg_document_types_set_updated_at
BEFORE UPDATE ON public.document_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.document_types IS
'Centralni šifarnik standardizovanih vrsta dokumenata koje koriste svi moduli sistema INPRO BZR.';

COMMENT ON COLUMN public.document_types.id IS
'Jedinstveni identifikator vrste dokumenta.';

COMMENT ON COLUMN public.document_types.code IS
'Jedinstvena interna šifra vrste dokumenta, na primer PRAVILNIK, UPUTSTVO ili OBRAZAC.';

COMMENT ON COLUMN public.document_types.name IS
'Naziv vrste dokumenta koji se prikazuje korisniku.';

COMMENT ON COLUMN public.document_types.description IS
'Detaljniji opis namene vrste dokumenta.';

COMMENT ON COLUMN public.document_types.active IS
'Označava da li se vrsta dokumenta trenutno može koristiti pri unosu novih dokumenata.';

COMMENT ON COLUMN public.document_types.sort_order IS
'Redosled prikaza vrste dokumenta u korisničkom interfejsu.';

COMMENT ON COLUMN public.document_types.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.document_types.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;