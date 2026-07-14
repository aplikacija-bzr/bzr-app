/*
------------------------------------------------------------
INPRO BZR
Migracija: 013_training_questions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Pitanja koja pripadaju testovima osposobljavanja.

Tabela:
- training_questions

Zavisnosti:
- public.training_tests
- public.question_types
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.training_questions (

    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_test_id UUID NOT NULL,

    question_type_id UUID NOT NULL,

    question_text TEXT NOT NULL,

    explanation TEXT,

    points NUMERIC(8,2) NOT NULL DEFAULT 1,

    required BOOLEAN NOT NULL DEFAULT TRUE,

    randomizable BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_questions
        PRIMARY KEY (id),

    CONSTRAINT fk_training_questions_test
        FOREIGN KEY (training_test_id)
        REFERENCES public.training_tests(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_training_questions_type
        FOREIGN KEY (question_type_id)
        REFERENCES public.question_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_training_questions_text
        CHECK (BTRIM(question_text) <> ''),

    CONSTRAINT chk_training_questions_points
        CHECK (points > 0),

    CONSTRAINT chk_training_questions_sort
        CHECK (sort_order >= 0)
);

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_questions_test
ON public.training_questions(training_test_id);

CREATE INDEX idx_training_questions_type
ON public.training_questions(question_type_id);

CREATE INDEX idx_training_questions_active
ON public.training_questions(active);

CREATE INDEX idx_training_questions_test_sort
ON public.training_questions(
    training_test_id,
    sort_order
);

CREATE INDEX idx_training_questions_test_active
ON public.training_questions(
    training_test_id,
    active
);

-- ============================================================
-- TRIGGER
-- ============================================================

CREATE TRIGGER trg_training_questions_updated_at
BEFORE UPDATE
ON public.training_questions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_questions IS
'Pitanja koja pripadaju testovima osposobljavanja.';

COMMENT ON COLUMN public.training_questions.training_test_id IS
'Test kome pitanje pripada.';

COMMENT ON COLUMN public.training_questions.question_type_id IS
'Tip pitanja iz centralnog šifarnika question_types.';

COMMENT ON COLUMN public.training_questions.question_text IS
'Tekst pitanja.';

COMMENT ON COLUMN public.training_questions.explanation IS
'Objašnjenje koje se može prikazati nakon završetka testa.';

COMMENT ON COLUMN public.training_questions.points IS
'Broj bodova koje pitanje nosi.';

COMMENT ON COLUMN public.training_questions.required IS
'Označava da li je pitanje obavezno.';

COMMENT ON COLUMN public.training_questions.randomizable IS
'Označava da li pitanje može biti uključeno u nasumičan izbor.';

COMMENT ON COLUMN public.training_questions.sort_order IS
'Redosled prikaza pitanja.';

COMMENT ON COLUMN public.training_questions.active IS
'Označava da li je pitanje aktivno.';

COMMENT ON COLUMN public.training_questions.created_at IS
'Datum kreiranja zapisa.';

COMMENT ON COLUMN public.training_questions.updated_at IS
'Datum poslednje izmene zapisa.';

COMMIT;