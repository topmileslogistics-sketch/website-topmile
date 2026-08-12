-- Top Miles Logistics — create the application tables.
-- Safe to run more than once.

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM
    ('NEW', 'REVIEWING', 'CONTACTED', 'HIRED', 'NOT_A_FIT', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Application" (
    "id" TEXT NOT NULL,
    "submissionToken" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "cdlNumber" TEXT NOT NULL,
    "cdlState" TEXT NOT NULL,
    "cdlExpiration" DATE NOT NULL,
    "endorsements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "monthsCdlExperience" INTEGER NOT NULL,
    "monthsOtrExperience" INTEGER NOT NULL,
    "freightExperience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAtLeast21" BOOLEAN NOT NULL,
    "legallyAuthorized" BOOLEAN NOT NULL,
    "hasValidMedicalCard" BOOLEAN NOT NULL,
    "medicalCardExpiration" DATE,
    "canPassDrugScreen" BOOLEAN NOT NULL,
    "inSapProgram" BOOLEAN NOT NULL DEFAULT false,
    "sapStep" TEXT,
    "canStayOut3To4Weeks" BOOLEAN NOT NULL,
    "needsTransportAssistance" BOOLEAN NOT NULL DEFAULT false,
    "understands1099" BOOLEAN NOT NULL,
    "hasAccidents" BOOLEAN NOT NULL DEFAULT false,
    "accidents" JSONB NOT NULL DEFAULT '[]',
    "hasViolations" BOOLEAN NOT NULL DEFAULT false,
    "violations" JSONB NOT NULL DEFAULT '[]',
    "licenseEverSuspended" BOOLEAN NOT NULL DEFAULT false,
    "licenseEverDenied" BOOLEAN NOT NULL DEFAULT false,
    "recordExplanation" TEXT,
    "addressHistory" JSONB NOT NULL DEFAULT '[]',
    "employmentHistory" JSONB NOT NULL DEFAULT '[]',
    "hasEmploymentGaps" BOOLEAN NOT NULL DEFAULT false,
    "employmentGapExplanation" TEXT,
    "certifiesAccurate" BOOLEAN NOT NULL,
    "consentsToBackgroundCheck" BOOLEAN NOT NULL,
    "consentsToFmcsaQuery" BOOLEAN NOT NULL,
    "signature" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "referralSource" TEXT,
    "notes" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Application_submissionToken_key" ON "Application"("submissionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_emailNormalized_key" ON "Application"("emailNormalized");
CREATE INDEX IF NOT EXISTS "Application_status_createdAt_idx" ON "Application"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Application_createdAt_idx" ON "Application"("createdAt");
CREATE INDEX IF NOT EXISTS "Application_phoneNormalized_idx" ON "Application"("phoneNormalized");
CREATE INDEX IF NOT EXISTS "Application_lastName_idx" ON "Application"("lastName");
CREATE INDEX IF NOT EXISTS "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- Tell Prisma this migration is already applied, so future deploys don't try
-- to create these tables a second time and fail the build.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '7ce5ac8c3d8a53c99f4c8db7eaf98dfe06176b582dc9a6a18f94e16b800453c9',
   now(), '20260810164337_init', now(), 1)
ON CONFLICT ("id") DO NOTHING;
