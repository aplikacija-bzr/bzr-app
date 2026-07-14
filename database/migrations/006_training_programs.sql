/*
------------------------------------------------------------
INPRO BZR
Migracija: 006_training_programs.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje osnovnih programa osposobljavanja.

Tabela:
- training_programs

Zavisnosti:
- public.training_catalog
- public.set_updated_at()

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY
- UNIQUE ograničenja
- CHECK ograničenja
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

-- ============================================================
-- TABELA: training_programs
--
-- Predstavlja stabilni identitet programa osposobljavanja.
-- Promenljivi sadržaj programa čuva se u tabeli
-- training_program_versions.
-- ============================================================

CREATE TABLE public.training_programs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_catalog_id UUID NOT NULL,

    code TEXT NOT NULL,
    name TEXT NOT NULL,

    description TEXT,
    objective TEXT,
    legal_basis TEXT,
    author_name TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_programs
        PRIMARY KEY (id),

    CONSTRAINT fk_training_programs_training_catalog
        FOREIGN KEY (training_catalog_id)
        REFERENCES public.training_catalog (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_training_programs_code
        UNIQUE (code),

    CONSTRAINT chk_training_programs_code_not_empty
        CHECK (BTRIM(code) <> ''),

    CONSTRAINT chk_training_programs_name_not_empty
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_training_programs_sort_order
        CHECK (sort_order >= 0),

    CONSTRAINT chk_training_programs_description_not_empty
        CHECK (
            description IS NULL
            OR BTRIM(description) <> ''
        ),

    CONSTRAINT chk_training_programs_objective_not_empty
        CHECK (
            objective IS NULL
            OR BTRIM(objective) <> ''
        ),

    CONSTRAINT chk_training_programs_legal_basis_not_empty
        CHECK (
            legal_basis IS NULL
            OR BTRIM(legal_basis) <> ''
        ),

    CONSTRAINT chk_training_programs_author_name_not_empty
        CHECK (
            author_name IS NULL
            OR BTRIM(author_name) <> ''
        ),

    CONSTRAINT chk_training_programs_notes_not_empty
        CHECK (
            notes IS NULL
            OR BTRIM(notes) <> ''
        )
);

-- ============================================================
-- JEDINSTVENOST NAZIVA
--
-- Naziv programa mora biti jedinstven bez obzira na velika
-- i mala slova i razmake na početku ili kraju.
-- ============================================================

CREATE UNIQUE INDEX ux_training_programs_name_normalized
    ON public.training_programs (
        LOWER(BTRIM(name))
    );

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_programs_training_catalog_id
    ON public.training_programs (training_catalog_id);

CREATE INDEX idx_training_programs_active
    ON public.training_programs (active);

CREATE INDEX idx_training_programs_active_sort_order
    ON public.training_programs (active, sort_order);

CREATE INDEX idx_training_programs_catalog_active
    ON public.training_programs (
        training_catalog_id,
        active
    );

CREATE INDEX idx_training_programs_name
    ON public.training_programs (name);

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
-- ============================================================

CREATE TRIGGER trg_training_programs_set_updated_at
BEFORE UPDATE ON public.training_programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_programs IS
'Osnovni poslovni programi osposobljavanja. Tabela predstavlja stabilni identitet programa, dok se konkretan sadržaj i verzije čuvaju u tabeli training_program_versions.';

COMMENT ON COLUMN public.training_programs.id IS
'Jedinstveni identifikator programa osposobljavanja.';

COMMENT ON COLUMN public.training_programs.training_catalog_id IS
'Vrsta osposobljavanja kojoj program pripada. Veza sa tabelom training_catalog.';

COMMENT ON COLUMN public.training_programs.code IS
'Jedinstvena interna šifra programa osposobljavanja.';

COMMENT ON COLUMN public.training_programs.name IS
'Naziv programa osposobljavanja. Jedinstven je bez obzira na velika i mala slova.';

COMMENT ON COLUMN public.training_programs.description IS
'Opšti opis programa koji se ne menja između njegovih verzija.';

COMMENT ON COLUMN public.training_programs.objective IS
'Opšti cilj programa osposobljavanja.';

COMMENT ON COLUMN public.training_programs.legal_basis IS
'Zakon, pravilnik, član, interni akt ili drugi pravni osnov programa.';

COMMENT ON COLUMN public.training_programs.author_name IS
'Autor, izrađivač ili nosilac izrade programa.';

COMMENT ON COLUMN public.training_programs.active IS
'Označava da li se program trenutno može koristiti za kreiranje novih verzija i osposobljavanja.';

COMMENT ON COLUMN public.training_programs.sort_order IS
'Redosled prikaza programa u korisničkom interfejsu.';

COMMENT ON COLUMN public.training_programs.notes IS
'Dodatne napomene o programu osposobljavanja.';

COMMENT ON COLUMN public.training_programs.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.training_programs.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;