/*
------------------------------------------------------------
INPRO BZR
Migracija: 011_training_tests.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje testova znanja za verzije programa osposobljavanja.

Tabela:
- training_tests

Zavisnosti:
- public.training_program_versions
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.training_tests (

    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_program_version_id UUID NOT NULL,

    code TEXT,
    name TEXT NOT NULL,

    description TEXT,

    passing_score_percent NUMERIC(5,2),

    time_limit_minutes INTEGER,

    randomize_questions BOOLEAN NOT NULL DEFAULT FALSE,

    show_result_immediately BOOLEAN NOT NULL DEFAULT TRUE,

    max_attempts INTEGER,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_tests
        PRIMARY KEY (id),

    CONSTRAINT fk_training_tests_program_version
        FOREIGN KEY (training_program_version_id)
        REFERENCES public.training_program_versions(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_training_tests_name
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_training_tests_code
        CHECK (
            code IS NULL
            OR BTRIM(code) <> ''
        ),

    CONSTRAINT chk_training_tests_score
        CHECK (
            passing_score_percent IS NULL
            OR (
                passing_score_percent >= 0
                AND passing_score_percent <= 100
            )
        ),

    CONSTRAINT chk_training_tests_time
        CHECK (
            time_limit_minutes IS NULL
            OR time_limit_minutes > 0
        ),

    CONSTRAINT chk_training_tests_attempts
        CHECK (
            max_attempts IS NULL
            OR max_attempts > 0
        ),

    CONSTRAINT chk_training_tests_sort
        CHECK (sort_order >= 0)
);

-- ============================================================
-- JEDINSTVENOST
-- ============================================================

CREATE UNIQUE INDEX ux_training_tests_program_name
ON public.training_tests (
    training_program_version_id,
    LOWER(BTRIM(name))
);

CREATE UNIQUE INDEX ux_training_tests_program_code
ON public.training_tests (
    training_program_version_id,
    LOWER(BTRIM(code))
)
WHERE code IS NOT NULL;

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_tests_program
ON public.training_tests(training_program_version_id);

CREATE INDEX idx_training_tests_active
ON public.training_tests(active);

CREATE INDEX idx_training_tests_program_active
ON public.training_tests(
    training_program_version_id,
    active
);

CREATE INDEX idx_training_tests_program_sort
ON public.training_tests(
    training_program_version_id,
    sort_order
);

-- ============================================================
-- TRIGGER
-- ============================================================

CREATE TRIGGER trg_training_tests_updated_at
BEFORE UPDATE
ON public.training_tests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_tests IS
'Testovi znanja koji pripadaju određenoj verziji programa osposobljavanja.';

COMMENT ON COLUMN public.training_tests.training_program_version_id IS
'Verzija programa kojoj test pripada.';

COMMENT ON COLUMN public.training_tests.name IS
'Naziv testa.';

COMMENT ON COLUMN public.training_tests.passing_score_percent IS
'Minimalni procenat tačnih odgovora potreban za uspešno polaganje.';

COMMENT ON COLUMN public.training_tests.time_limit_minutes IS
'Vremensko ograničenje za rešavanje testa u minutima.';

COMMENT ON COLUMN public.training_tests.randomize_questions IS
'Označava da li se pitanja prikazuju nasumičnim redosledom.';

COMMENT ON COLUMN public.training_tests.show_result_immediately IS
'Označava da li se rezultat prikazuje odmah po završetku testa.';

COMMENT ON COLUMN public.training_tests.max_attempts IS
'Maksimalan broj dozvoljenih pokušaja polaganja testa.';

COMMENT ON COLUMN public.training_tests.active IS
'Označava da li je test trenutno aktivan.';

COMMENT ON COLUMN public.training_tests.created_at IS
'Datum kreiranja zapisa.';

COMMENT ON COLUMN public.training_tests.updated_at IS
'Datum poslednje izmene zapisa.';

COMMIT;