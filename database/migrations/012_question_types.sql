/*
------------------------------------------------------------
INPRO BZR
Migracija: 012_question_types.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Centralni šifarnik tipova pitanja.

Tabela:
- question_types

Zavisnosti:
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.question_types (

    id UUID NOT NULL DEFAULT gen_random_uuid(),

    code TEXT NOT NULL,
    name TEXT NOT NULL,

    description TEXT,

    requires_options BOOLEAN NOT NULL DEFAULT TRUE,

    allows_multiple_answers BOOLEAN NOT NULL DEFAULT FALSE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_question_types
        PRIMARY KEY (id),

    CONSTRAINT uq_question_types_code
        UNIQUE (code),

    CONSTRAINT chk_question_types_code
        CHECK (BTRIM(code) <> ''),

    CONSTRAINT chk_question_types_name
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_question_types_sort
        CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX ux_question_types_name
ON public.question_types(
    LOWER(BTRIM(name))
);

CREATE INDEX idx_question_types_active
ON public.question_types(active);

CREATE INDEX idx_question_types_sort
ON public.question_types(
    active,
    sort_order
);

CREATE TRIGGER trg_question_types_updated_at
BEFORE UPDATE
ON public.question_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.question_types IS
'Centralni šifarnik tipova pitanja.';

COMMENT ON COLUMN public.question_types.requires_options IS
'Da li tip pitanja koristi ponuđene odgovore.';

COMMENT ON COLUMN public.question_types.allows_multiple_answers IS
'Da li tip pitanja dozvoljava više tačnih odgovora.';

COMMIT;