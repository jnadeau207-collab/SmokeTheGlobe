-- AlterTable
ALTER TABLE "StateLicense" ADD COLUMN     "city" TEXT,
ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "regionCode" TEXT;
