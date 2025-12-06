-- AlterTable
ALTER TABLE "CoaDocument" ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "storageKey" TEXT,
ALTER COLUMN "rawText" DROP NOT NULL;
