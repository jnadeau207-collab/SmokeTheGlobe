-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('DISPENSARY', 'CULTIVATION', 'MANUFACTURING', 'LAB_FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'DISPENSARY',
    "brandId" INTEGER,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "stateLicenseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchLocation" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateLicense" (
    "id" SERIAL NOT NULL,
    "stateCode" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "sourceSystem" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "stateLicenseId" INTEGER,
    "accreditation" TEXT,
    "reliabilityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "batchCode" TEXT NOT NULL,
    "productName" TEXT,
    "productSku" TEXT,
    "primaryCategory" TEXT,
    "subCategory" TEXT,
    "brandId" INTEGER,
    "harvestDate" TIMESTAMP(3),
    "productionDate" TIMESTAMP(3),
    "packageDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "labId" INTEGER,
    "coaIdentifier" TEXT,
    "sampleId" TEXT,
    "sampleType" TEXT,
    "testedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3),
    "thcPercent" DOUBLE PRECISION,
    "thcaPercent" DOUBLE PRECISION,
    "cbdPercent" DOUBLE PRECISION,
    "cbdaPercent" DOUBLE PRECISION,
    "totalCannabinoidsPercent" DOUBLE PRECISION,
    "totalTerpenesPercent" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "pesticidesPass" BOOLEAN,
    "solventsPass" BOOLEAN,
    "heavyMetalsPass" BOOLEAN,
    "microbialsPass" BOOLEAN,
    "moisturePercent" DOUBLE PRECISION,
    "waterActivity" DOUBLE PRECISION,
    "analyteSummary" JSONB,
    "rawJson" JSONB,
    "sourcePdfUrl" TEXT,
    "uploadedDocumentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" SERIAL NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "extractedText" TEXT,
    "labName" TEXT,
    "batchCode" TEXT,
    "uploader" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "labResultId" INTEGER,
    "status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER,
    "jurisdiction" TEXT NOT NULL,
    "recallNumber" TEXT,
    "recallType" TEXT,
    "reason" TEXT,
    "status" "RecallStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchReviewAggregate" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchReviewAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchRatingSource" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "ratingAvg" DOUBLE PRECISION NOT NULL,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchRatingSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BatchLocation_batchId_locationId_key" ON "BatchLocation"("batchId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LabResult_uploadedDocumentId_key" ON "LabResult"("uploadedDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedDocument_sha256_key" ON "UploadedDocument"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "BatchReviewAggregate_batchId_key" ON "BatchReviewAggregate"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchRatingSource_batchId_source_key" ON "BatchRatingSource"("batchId", "source");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_stateLicenseId_fkey" FOREIGN KEY ("stateLicenseId") REFERENCES "StateLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchLocation" ADD CONSTRAINT "BatchLocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchLocation" ADD CONSTRAINT "BatchLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lab" ADD CONSTRAINT "Lab_stateLicenseId_fkey" FOREIGN KEY ("stateLicenseId") REFERENCES "StateLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_uploadedDocumentId_fkey" FOREIGN KEY ("uploadedDocumentId") REFERENCES "UploadedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_labResultId_fkey" FOREIGN KEY ("labResultId") REFERENCES "LabResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchReviewAggregate" ADD CONSTRAINT "BatchReviewAggregate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchRatingSource" ADD CONSTRAINT "BatchRatingSource_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
