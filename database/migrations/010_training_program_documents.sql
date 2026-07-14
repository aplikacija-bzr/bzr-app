/*
------------------------------------------------------------
INPRO BZR
Migracija: 010_training_program_documents.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Povezivanje verzija programa osposobljavanja sa dokumentima
iz centralne biblioteke.

Tabela:
- training_program_documents

Zavisnosti:
- public.training_program_versions
- public.documents
- public.set_updated_at()

Namena:
Jedna verzija programa može koristiti više dokumenata.
Jedan dokument može biti povezan sa više verzija programa.

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY ograničenja
- UNIQUE ograničenje
- CHECK ograničenja
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.training_program_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    training_program_version_id UUID NOT NULL,
    document_id UUID NOT NULL,

    purpose TEXT,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_program_documents
        PRIMARY KEY (id),

    CONSTRAINT fk_training_program_documents_program_version
        FOREIGN KEY (training_program_version_id)
        REFERENCES public.training_program_versions (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_training_program_documents_document
        FOREIGN KEY (document_id)
        REFERENCES public.documents (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_training_program_documents
        UNIQUE (
            training_program_version_id,
            document_id
        ),

    CONSTRAINT chk_training_program_documents_purpose_not_empty
        CHECK (
            purpose IS NULL
            OR BTRIM(purpose) <> ''
        ),

    CONSTRAINT chk_training_program_documents_sort_order
        CHECK (sort_order >= 0),

    CONSTRAINT chk_training_program_documents_notes_not_empty
        CHECK (
            notes IS NULL
            OR BTRIM(notes) <> ''
        )
);

-- ============================================================
-- INDEKSI
-- ============================================================

CREATE INDEX idx_training_program_documents_program_version
    ON public.training_program_documents (
        training_program_version_id
    );

CREATE INDEX idx_training_program_documents_document
    ON public.training_program_documents (
        document_id
    );

CREATE INDEX idx_training_program_documents_version_active
    ON public.training_program_documents (
        training_program_version_id,
        active
    );

CREATE INDEX idx_training_program_documents_version_sort
    ON public.training_program_documents (
        training_program_version_id,
        sort_order
    );

CREATE INDEX idx_training_program_documents_required
    ON public.training_program_documents (
        training_program_version_id,
        required
    )
    WHERE active = TRUE;

-- ============================================================
-- TRIGGER ZA AUTOMATSKO AŽURIRANJE updated_at
-- ============================================================

CREATE TRIGGER trg_training_program_documents_set_updated_at
BEFORE UPDATE ON public.training_program_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI
-- ============================================================

COMMENT ON TABLE public.training_program_documents IS
'Povezna tabela između verzija programa osposobljavanja i dokumenata iz centralne biblioteke sistema INPRO BZR.';

COMMENT ON COLUMN public.training_program_documents.id IS
'Jedinstveni identifikator veze programa i dokumenta.';

COMMENT ON COLUMN public.training_program_documents.training_program_version_id IS
'Verzija programa osposobljavanja kojoj dokument pripada.';

COMMENT ON COLUMN public.training_program_documents.document_id IS
'Dokument iz centralne biblioteke koji se koristi u verziji programa.';

COMMENT ON COLUMN public.training_program_documents.purpose IS
'Namena dokumenta u programu, na primer prezentacija, uputstvo, propis, radni materijal ili dodatak.';

COMMENT ON COLUMN public.training_program_documents.required IS
'Označava da li je dokument obavezan deo konkretne verzije programa.';

COMMENT ON COLUMN public.training_program_documents.sort_order IS
'Redosled prikaza ili korišćenja dokumenta u programu.';

COMMENT ON COLUMN public.training_program_documents.active IS
'Označava da li je veza dokumenta i verzije programa trenutno aktivna.';

COMMENT ON COLUMN public.training_program_documents.notes IS
'Dodatne napomene o korišćenju dokumenta u programu.';

COMMENT ON COLUMN public.training_program_documents.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.training_program_documents.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;