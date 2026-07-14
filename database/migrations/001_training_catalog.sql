/*
------------------------------------------------------------
INPRO BZR
Migracija: 001_training_catalog.sql
Verzija: 1.0.0
Datum: 14.07.2026.
Autor: Slobodan Maksimović / ChatGPT

Opis:
Kreiranje centralnog kataloga osposobljavanja zaposlenih.

Tabela:
- training_catalog

Sadrži:
- CREATE TABLE
- PRIMARY KEY
- UNIQUE ograničenja
- CHECK ograničenja
- indekse
- komentare
- trigger za updated_at

------------------------------------------------------------
*/
BEGIN;

-- ============================================================
-- TABELA: training_catalog
-- Centralni katalog svih vrsta osposobljavanja.
-- ============================================================

CREATE TABLE public.training_catalog (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category_code TEXT NOT NULL DEFAULT 'BZR',

    description TEXT,
    legal_basis TEXT,

    requires_theory BOOLEAN NOT NULL DEFAULT TRUE,
    requires_practical_training BOOLEAN NOT NULL DEFAULT FALSE,
    requires_test BOOLEAN NOT NULL DEFAULT TRUE,
    requires_practical_check BOOLEAN NOT NULL DEFAULT FALSE,

    renewal_required BOOLEAN NOT NULL DEFAULT FALSE,
    default_validity_months INTEGER,

    certificate_required BOOLEAN NOT NULL DEFAULT FALSE,
    official_record_required BOOLEAN NOT NULL DEFAULT TRUE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_training_catalog
        PRIMARY KEY (id),

    CONSTRAINT uq_training_catalog_code
        UNIQUE (code),

    CONSTRAINT uq_training_catalog_name
        UNIQUE (name),

    CONSTRAINT chk_training_catalog_code_not_empty
        CHECK (BTRIM(code) <> ''),

    CONSTRAINT chk_training_catalog_name_not_empty
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_training_catalog_category_code
        CHECK (
            category_code IN (
                'BZR',
                'ZOP',
                'PRVA_POMOC',
                'LOTO',
                'RAD_NA_VISINI',
                'RAD_POD_NAPONOM',
                'RADNE_MASINE',
                'HEMIKALIJE',
                'POSEBNO'
            )
        ),

    CONSTRAINT chk_training_catalog_validity_months
        CHECK (
            default_validity_months IS NULL
            OR default_validity_months > 0
        ),

    CONSTRAINT chk_training_catalog_sort_order
        CHECK (sort_order >= 0),

    CONSTRAINT chk_training_catalog_training_elements
        CHECK (
            requires_theory = TRUE
            OR requires_practical_training = TRUE
            OR requires_test = TRUE
            OR requires_practical_check = TRUE
        )
);

-- ============================================================
-- INDEKSI
-- UNIQUE ograničenja već automatski kreiraju jedinstvene indekse
-- za code i name.
-- ============================================================

CREATE INDEX idx_training_catalog_category_code
    ON public.training_catalog (category_code);

CREATE INDEX idx_training_catalog_active
    ON public.training_catalog (active);

CREATE INDEX idx_training_catalog_active_sort_order
    ON public.training_catalog (active, sort_order);

-- ============================================================
-- FUNKCIJA ZA AUTOMATSKO AŽURIRANJE POLJA updated_at
-- Funkcija je univerzalna i koristiće se i za buduće tabele.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER ZA updated_at
-- ============================================================

CREATE TRIGGER trg_training_catalog_set_updated_at
BEFORE UPDATE ON public.training_catalog
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- KOMENTARI TABELE I KOLONA
-- ============================================================

COMMENT ON TABLE public.training_catalog IS
'Centralni šifarnik svih vrsta osposobljavanja koje se vode u informacionom sistemu INPRO BZR.';

COMMENT ON COLUMN public.training_catalog.id IS
'Jedinstveni identifikator stavke kataloga.';

COMMENT ON COLUMN public.training_catalog.code IS
'Jedinstvena šifra osposobljavanja.';

COMMENT ON COLUMN public.training_catalog.name IS
'Jedinstveni naziv osposobljavanja.';

COMMENT ON COLUMN public.training_catalog.category_code IS
'Šifra kategorije kojoj osposobljavanje pripada.';

COMMENT ON COLUMN public.training_catalog.description IS
'Detaljan opis vrste osposobljavanja.';

COMMENT ON COLUMN public.training_catalog.legal_basis IS
'Zakon, pravilnik, član ili drugi pravni osnov osposobljavanja.';

COMMENT ON COLUMN public.training_catalog.requires_theory IS
'Označava da li osposobljavanje sadrži obavezan teorijski deo.';

COMMENT ON COLUMN public.training_catalog.requires_practical_training IS
'Označava da li je obavezna praktična obuka.';

COMMENT ON COLUMN public.training_catalog.requires_test IS
'Označava da li je obavezna provera znanja testom.';

COMMENT ON COLUMN public.training_catalog.requires_practical_check IS
'Označava da li je obavezna praktična provera osposobljenosti.';

COMMENT ON COLUMN public.training_catalog.renewal_required IS
'Označava da li se osposobljavanje periodično obnavlja.';

COMMENT ON COLUMN public.training_catalog.default_validity_months IS
'Podrazumevani period važenja osposobljavanja izražen u mesecima. NULL označava da nema unapred definisanog automatskog roka.';

COMMENT ON COLUMN public.training_catalog.certificate_required IS
'Označava da li se nakon osposobljavanja izdaje potvrda ili sertifikat.';

COMMENT ON COLUMN public.training_catalog.official_record_required IS
'Označava da li se osposobljavanje evidentira u propisanoj službenoj evidenciji.';

COMMENT ON COLUMN public.training_catalog.active IS
'Označava da li se stavka kataloga trenutno koristi za nova osposobljavanja.';

COMMENT ON COLUMN public.training_catalog.sort_order IS
'Redosled prikaza stavke u korisničkom interfejsu.';

COMMENT ON COLUMN public.training_catalog.created_at IS
'Datum i vreme kreiranja zapisa.';

COMMENT ON COLUMN public.training_catalog.updated_at IS
'Datum i vreme poslednje izmene zapisa. Automatski se ažurira triggerom.';

COMMIT;