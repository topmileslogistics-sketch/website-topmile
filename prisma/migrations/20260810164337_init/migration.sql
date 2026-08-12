-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'REVIEWING', 'CONTACTED', 'HIRED', 'NOT_A_FIT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Application" (
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

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_submissionToken_key" ON "Application"("submissionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Application_emailNormalized_key" ON "Application"("emailNormalized");

-- CreateIndex
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "Application_phoneNormalized_idx" ON "Application"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Application_lastName_idx" ON "Application"("lastName");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");
