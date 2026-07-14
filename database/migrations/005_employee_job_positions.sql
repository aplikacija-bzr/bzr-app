/*
------------------------------------------------------------
INPRO BZR
Migracija: 005_employee_job_positions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Raspoređivanje zaposlenih na konkretna radna mesta kod poslodavca.

Tabela:
- employee_job_positions

Zavisnosti:
- public.employees
- public.employer_job_positions
- public.set_updated_at()

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY ograničenja
- CHECK ograničenja
- parcijalne UNIQUE indekse
- kontrolu istog poslodavca
- kontrolu jednog aktivnog osnovnog radnog mesta
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.employee_job_positions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,
    employer_job_position_id UUID NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE,

    primary_position BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_employee_job_positions
        PRIMARY KEY (id),

    CONSTRAINT fk_employee_job_positions_employee
        FOREIGN KEY (employee_id)
        REFERENCES public.employees (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_employee_job_positions_employer_job_position
        FOREIGN KEY (employer_job_position_id)
        REFERENCES public.employer_job_positions (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_employee_job_positions_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        ),

    CONSTRAINT chk_employee_job_positions_inactive_end_date
        CHECK (
            active = TRUE
            OR end_date IS NOT NULL
        )
);

CREATE UNIQUE INDEX ux_employee_job_positions_active_assignment
    ON public.employee_job_positions (
        employee_id,
        employer_job_position_id
    )
    WHERE active = TRUE;

CREATE UNIQUE INDEX ux_employee_job_positions_active_primary
    ON public.employee_job_positions (employee_id)
    WHERE active = TRUE
      AND primary_position = TRUE;

CREATE INDEX idx_employee_job_positions_employee_id
    ON public.employee_job_positions (employee_id);

CREATE INDEX idx_employee_job_positions_employer_job_position_id
    ON public.employee_job_positions (employer_job_position_id);

CREATE INDEX idx_employee_job_positions_employee_active
    ON public.employee_job_positions (employee_id, active);

CREATE INDEX idx_employee_job_positions_active
    ON public.employee_job_positions (active);

CREATE INDEX idx_employee_job_positions_end_date
    ON public.employee_job_positions (end_date)
    WHERE end_date IS NOT NULL;

-- ============================================================
-- KONTROLA ISTOG POSLODAVCA
--
-- Zaposleni i konkretno radno mesto moraju pripadati istom
-- poslodavcu.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_employee_job_position_employer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    employee_employer_id UUID;
    position_employer_id UUID;
BEGIN
    SELECT employer_id
    INTO employee_employer_id
    FROM public.employees
    WHERE id = NEW.employee_id;

    SELECT employer_id
    INTO position_employer_id
    FROM public.employer_job_positions
    WHERE id = NEW.employer_job_position_id;

    IF employee_employer_id IS NULL THEN
        RAISE EXCEPTION
            'Zaposleni sa ID % ne postoji ili nema poslodavca.',
            NEW.employee_id;
    END IF;

    IF position_employer_id IS NULL THEN
        RAISE EXCEPTION
            'Radno mesto kod poslodavca sa ID % ne postoji.',
            NEW.employer_job_position_id;
    END IF;

    IF employee_employer_id <> position_employer_id THEN
        RAISE EXCEPTION
            'Zaposleni i konkretno radno mesto moraju pripadati istom poslodavcu.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employee_job_positions_validate_employer
BEFORE INSERT OR UPDATE OF employee_id, employer_job_position_id
ON public.employee_job_positions
FOR EACH ROW
EXECUTE FUNCTION public.validate_employee_job_position_employer();

CREATE TRIGGER trg_employee_job_positions_set_updated_at
BEFORE UPDATE ON public.employee_job_positions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.employee_job_positions IS
'Istorijska evidencija raspoređivanja zaposlenih na konkretna radna mesta kod poslodavca.';

COMMENT ON COLUMN public.employee_job_positions.id IS
'Jedinstveni identifikator raspoređivanja zaposlenog.';

COMMENT ON COLUMN public.employee_job_positions.employee_id IS
'Zaposleni koji je raspoređen na konkretno radno mesto.';

COMMENT ON COLUMN public.employee_job_positions.employer_job_position_id IS
'Konkretno radno mesto kod poslodavca na koje je zaposleni raspoređen.';

COMMENT ON COLUMN public.employee_job_positions.start_date IS
'Datum početka raspoređivanja zaposlenog na konkretno radno mesto.';

COMMENT ON COLUMN public.employee_job_positions.end_date IS
'Datum završetka raspoređivanja. Obavezan je kada raspoređivanje više nije aktivno.';

COMMENT ON COLUMN public.employee_job_positions.primary_position IS
'Označava osnovno radno mesto zaposlenog. Zaposleni može imati najviše jedno aktivno osnovno radno mesto.';

COMMENT ON COLUMN public.employee_job_positions.active IS
'Označava da li je raspoređivanje trenutno aktivno.';

COMMENT ON COLUMN public.employee_job_positions.notes IS
'Dodatne napomene o raspoređivanju zaposlenog.';

COMMENT ON COLUMN public.employee_job_positions.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.employee_job_positions.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;