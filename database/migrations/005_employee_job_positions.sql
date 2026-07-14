/*
------------------------------------------------------------
INPRO BZR
Migracija: 004_employee_job_positions.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Povezivanje zaposlenih sa radnim mestima.

Tabela:
- employee_job_positions

Zavisnosti:
- employees
- job_positions
- public.set_updated_at()

------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.employee_job_positions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,
    job_position_id UUID NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE,

    primary_position BOOLEAN NOT NULL DEFAULT FALSE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ejp_employee
        FOREIGN KEY (employee_id)
        REFERENCES public.employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ejp_job_position
        FOREIGN KEY (job_position_id)
        REFERENCES public.job_positions(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_ejp_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        )
);

CREATE INDEX idx_ejp_employee
ON public.employee_job_positions(employee_id);

CREATE INDEX idx_ejp_job_position
ON public.employee_job_positions(job_position_id);

CREATE INDEX idx_ejp_active
ON public.employee_job_positions(active);

CREATE INDEX idx_ejp_primary
ON public.employee_job_positions(primary_position);

CREATE INDEX idx_ejp_employee_active
ON public.employee_job_positions(employee_id, active);

CREATE TRIGGER trg_employee_job_positions_updated_at
BEFORE UPDATE
ON public.employee_job_positions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.employee_job_positions IS
'Povezuje zaposlene sa radnim mestima i čuva istoriju raspoređivanja.';

COMMENT ON COLUMN public.employee_job_positions.primary_position IS
'Označava osnovno radno mesto zaposlenog.';

COMMENT ON COLUMN public.employee_job_positions.start_date IS
'Datum od kada zaposleni obavlja radno mesto.';

COMMENT ON COLUMN public.employee_job_positions.end_date IS
'Datum završetka raspoređivanja.';

COMMENT ON COLUMN public.employee_job_positions.active IS
'Označava da li je raspoređivanje trenutno aktivno.';

COMMIT;