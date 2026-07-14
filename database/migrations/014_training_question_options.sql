/*
------------------------------------------------------------
INPRO BZR
Migracija: 014_training_question_options.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Ponuđeni odgovori za pitanja u testovima osposobljavanja.

Tabela:
- training_question_options

Zavisnosti:
- public.training_questions
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.training_question_options (

    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_question_id UUID NOT NULL,

    option_text TEXT NOT NULL,

    is_correct BOOLEAN NOT NULL DEFAULT FALSE,

    points NUMERIC(8,2) NOT NULL DEFAULT 0,

    explanation TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_question_options
        PRIMARY KEY (id),

    CONSTRAINT fk_training_question_options_question
        FOREIGN KEY (training_question_id)
        REFERENCES public.training_questions(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_training_question_options_text
        CHECK (BTRIM(option_text) <> ''),

    CONSTRAINT chk_training_question_options_points
        CHECK (points >= 0),

    CONSTRAINT chk_training_question_options_sort
        CHECK (sort_order >= 0),

    CONSTRAINT chk_training_question_options_explanation
        CHECK (
            explanation IS NULL
            OR BTRIM(explanation) <> ''
        ),

    CONSTRAINT chk_training_question_options_notes
        CHECK (
            notes IS NULL
            OR BTRIM(notes) <> ''
        )
);

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_question_options_question
ON public.training_question_options(training_question_id);

CREATE INDEX idx_training_question_options_active
ON public.training_question_options(active);

CREATE INDEX idx_training_question_options_question_sort
ON public.training_question_options(
    training_question_id,
    sort_order
);

CREATE INDEX idx_training_question_options_question_correct
ON public.training_question_options(
    training_question_id,
    is_correct
);

-- ============================================================
-- TRIGGER
-- ============================================================

CREATE TRIGGER trg_training_question_options_updated_at
BEFORE UPDATE
ON public.training_question_options
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_question_options IS
'Ponuđeni odgovori za pitanja u testovima osposobljavanja.';

COMMENT ON COLUMN public.training_question_options.training_question_id IS
'Pitanje kome odgovor pripada.';

COMMENT ON COLUMN public.training_question_options.option_text IS
'Tekst ponuđenog odgovora.';

COMMENT ON COLUMN public.training_question_options.is_correct IS
'Označava da li je odgovor tačan.';

COMMENT ON COLUMN public.training_question_options.points IS
'Broj bodova koji odgovor nosi. Omogućava parcijalno bodovanje.';

COMMENT ON COLUMN public.training_question_options.explanation IS
'Objašnjenje odgovora koje se može prikazati nakon završetka testa.';

COMMENT ON COLUMN public.training_question_options.sort_order IS
'Redosled prikaza odgovora.';

COMMENT ON COLUMN public.training_question_options.active IS
'Označava da li je odgovor aktivan.';

COMMENT ON COLUMN public.training_question_options.created_at IS
'Datum kreiranja zapisa.';

COMMENT ON COLUMN public.training_question_options.updated_at IS
'Datum poslednje izmene zapisa.';

COMMIT;