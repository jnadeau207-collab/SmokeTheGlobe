-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "Lab" ADD COLUMN     "city" TEXT,
ADD COLUMN     "stateCode" TEXT;
