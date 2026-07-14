/*
------------------------------------------------------------
INPRO BZR
Migracija: 009_documents.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje centralne biblioteke dokumenata sistema INPRO BZR.

Tabela:
- documents

Zavisnosti:
- public.document_types
- public.set_updated_at()

Namena:
Jedinstvena evidencija svih dokumenata koji se koriste u
različitim modulima sistema.

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- FOREIGN KEY
- UNIQUE i CHECK ograničenja
- indekse
- komentare
- trigger za updated_at
------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    document_type_id UUID NOT NULL,

    code TEXT,
    title TEXT NOT NULL,

    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,

    mime_type TEXT,
    file_size BIGINT,
    file_hash TEXT,

    version_label TEXT,
    language_code TEXT NOT NULL DEFAULT 'sr',

    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_documents
        PRIMARY KEY (id),

    CONSTRAINT fk_documents_document_type
        FOREIGN KEY (document_type_id)
        REFERENCES public.document_types (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_documents_code_not_empty
        CHECK (
            code IS NULL
            OR BTRIM(code) <> ''
        ),

    CONSTRAINT chk_documents_title_not_empty
        CHECK (BTRIM(title) <> ''),

    CONSTRAINT chk_documents_file_name_not_empty
        CHECK (BTRIM(file_name) <> ''),

    CONSTRAINT chk_documents_storage_path_not_empty
        CHECK (BTRIM(storage_path) <> ''),

    CONSTRAINT chk_documents_mime_type_not_empty
        CHECK (
            mime_type IS NULL
            OR BTRIM(mime_type) <> ''
        ),

    CONSTRAINT chk_documents_file_size
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        ),

    CONSTRAINT chk_documents_file_hash_not_empty
        CHECK (
            file_hash IS NULL
            OR BTRIM(file_hash) <> ''
        ),

    CONSTRAINT chk_documents_version_label_not_empty
        CHECK (
            version_label IS NULL
            OR BTRIM(version_label) <> ''
        ),

    CONSTRAINT chk_documents_language_code_not_empty
        CHECK (BTRIM(language_code) <> ''),

    CONSTRAINT chk_documents_notes_not_empty
        CHECK (
            notes IS NULL
            OR BTRIM(notes) <> ''
        )
);

-- Lokacija fajla u Storage sistemu mora biti jedinstvena.

CREATE UNIQUE INDEX ux_documents_storage_path
    ON public.documents (storage_path);

-- Šifra dokumenta je jedinstvena kada je uneta.

CREATE UNIQUE INDEX ux_documents_code_normalized
    ON public.documents (LOWER(BTRIM(code)))
    WHERE code IS NOT NULL;

-- Hash fajla se indeksira radi prepoznavanja duplikata.

CREATE INDEX idx_documents_file_hash
    ON public.documents (file_hash)
    WHERE file_hash IS NOT NULL;

CREATE INDEX idx_documents_document_type_id
    ON public.documents (document_type_id);

CREATE INDEX idx_documents_active
    ON public.documents (active);

CREATE INDEX idx_documents_type_active
    ON public.documents (
        document_type_id,
        active
    );

CREATE INDEX idx_documents_title
    ON public.documents (title);

CREATE INDEX idx_documents_language_code
    ON public.documents (language_code);

CREATE INDEX idx_documents_created_at
    ON public.documents (created_at);

CREATE TRIGGER trg_documents_set_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.documents IS
'Centralna biblioteka dokumenata koje zajednički koriste različiti moduli sistema INPRO BZR.';

COMMENT ON COLUMN public.documents.id IS
'Jedinstveni identifikator dokumenta.';

COMMENT ON COLUMN public.documents.document_type_id IS
'Vrsta dokumenta iz centralnog šifarnika document_types.';

COMMENT ON COLUMN public.documents.code IS
'Interna šifra dokumenta. Kada je uneta, jedinstvena je bez obzira na velika i mala slova.';

COMMENT ON COLUMN public.documents.title IS
'Naziv dokumenta koji se prikazuje korisniku.';

COMMENT ON COLUMN public.documents.file_name IS
'Originalni ili sistemski naziv fajla.';

COMMENT ON COLUMN public.documents.storage_path IS
'Jedinstvena putanja fajla u Storage sistemu.';

COMMENT ON COLUMN public.documents.mime_type IS
'MIME tip fajla, na primer application/pdf ili image/jpeg.';

COMMENT ON COLUMN public.documents.file_size IS
'Veličina fajla izražena u bajtovima.';

COMMENT ON COLUMN public.documents.file_hash IS
'Kriptografski hash sadržaja fajla radi provere integriteta i prepoznavanja duplikata.';

COMMENT ON COLUMN public.documents.version_label IS
'Korisnička oznaka verzije dokumenta.';

COMMENT ON COLUMN public.documents.language_code IS
'Šifra jezika dokumenta. Podrazumevana vrednost je sr.';

COMMENT ON COLUMN public.documents.active IS
'Označava da li je dokument trenutno dostupan za nova povezivanja i korišćenje.';

COMMENT ON COLUMN public.documents.notes IS
'Dodatne napomene o dokumentu.';

COMMENT ON COLUMN public.documents.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.documents.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;