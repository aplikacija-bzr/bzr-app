/*
------------------------------------------------------------
INPRO BZR
Migracija: 007_training_program_versions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje verzija programa osposobljavanja.

Tabela:
- training_program_versions

Zavisnosti:
- public.training_programs
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

-- ============================================================
-- TABELA: training_program_versions
--
-- Svaki program može imati više verzija.
-- Završena osposobljavanja ostaju trajno vezana za verziju
-- koja je važila u trenutku održavanja obuke.
-- ============================================================

CREATE TABLE public.training_program_versions (

    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_program_id UUID NOT NULL,

    version_number INTEGER NOT NULL,
    version_label TEXT,

    valid_from DATE NOT NULL,
    valid_until DATE,

    theory_duration_minutes INTEGER,
    practical_duration_minutes INTEGER,

    content_summary TEXT,
    learning_outcomes TEXT,

    passing_score_percent NUMERIC(5,2),

    approved_by TEXT,
    approved_at TIMESTAMPTZ,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_program_versions
        PRIMARY KEY (id),

    CONSTRAINT fk_training_program_versions_program
        FOREIGN KEY (training_program_id)
        REFERENCES public.training_programs(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_training_program_versions
        UNIQUE (
            training_program_id,
            version_number
        ),

    CONSTRAINT chk_version_number
        CHECK (version_number > 0),

    CONSTRAINT chk_validity
        CHECK (
            valid_until IS NULL
            OR valid_until >= valid_from
        ),

    CONSTRAINT chk_theory_duration
        CHECK (
            theory_duration_minutes IS NULL
            OR theory_duration_minutes >= 0
        ),

    CONSTRAINT chk_practical_duration
        CHECK (
            practical_duration_minutes IS NULL
            OR practical_duration_minutes >= 0
        ),

    CONSTRAINT chk_passing_score
        CHECK (
            passing_score_percent IS NULL
            OR (
                passing_score_percent >= 0
                AND passing_score_percent <= 100
            )
        )
);

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_program_versions_program
ON public.training_program_versions(training_program_id);

CREATE INDEX idx_training_program_versions_active
ON public.training_program_versions(active);

CREATE INDEX idx_training_program_versions_program_active
ON public.training_program_versions(
    training_program_id,
    active
);

CREATE INDEX idx_training_program_versions_valid_from
ON public.training_program_versions(valid_from);

CREATE INDEX idx_training_program_versions_valid_until
ON public.training_program_versions(valid_until)
WHERE valid_until IS NOT NULL;

-- ============================================================
-- TRIGGER updated_at
-- ============================================================

CREATE TRIGGER trg_training_program_versions_updated_at
BEFORE UPDATE
ON public.training_program_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_program_versions IS
'Verzije programa osposobljavanja. Svaka verzija predstavlja sadržaj programa koji je važio u određenom periodu.';

COMMENT ON COLUMN public.training_program_versions.training_program_id IS
'Program kome verzija pripada.';

COMMENT ON COLUMN public.training_program_versions.version_number IS
'Redni broj verzije programa.';

COMMENT ON COLUMN public.training_program_versions.version_label IS
'Korisnička oznaka verzije (npr. 1.0, 2.1).';

COMMENT ON COLUMN public.training_program_versions.valid_from IS
'Datum početka važenja verzije.';

COMMENT ON COLUMN public.training_program_versions.valid_until IS
'Datum završetka važenja verzije.';

COMMENT ON COLUMN public.training_program_versions.theory_duration_minutes IS
'Planirano trajanje teorijske obuke u minutima.';

COMMENT ON COLUMN public.training_program_versions.practical_duration_minutes IS
'Planirano trajanje praktične obuke u minutima.';

COMMENT ON COLUMN public.training_program_versions.passing_score_percent IS
'Minimalni procenat tačnih odgovora za uspešno polaganje testa.';

COMMENT ON COLUMN public.training_program_versions.active IS
'Da li je verzija trenutno aktivna.';

COMMENT ON COLUMN public.training_program_versions.created_at IS
'Datum kreiranja zapisa.';

COMMENT ON COLUMN public.training_program_versions.updated_at IS
'Datum poslednje izmene zapisa.';

COMMIT;