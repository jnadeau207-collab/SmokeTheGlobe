-- AlterTable
ALTER TABLE "StateLicense" ADD COLUMN     "transparency_score" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CoaDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "labName" TEXT,
    "batchRef" TEXT,
    "licenseRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rawText" TEXT NOT NULL,
    "parsedSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoaDocument_pkey" PRIMARY KEY ("id")
);
