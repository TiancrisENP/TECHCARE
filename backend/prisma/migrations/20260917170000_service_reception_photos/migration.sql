-- AlterTable
ALTER TABLE "services" ADD COLUMN "brand" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "accessories" TEXT,
ADD COLUMN "physicalCondition" TEXT,
ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "service_photos" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "service_photos" ADD CONSTRAINT "service_photos_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
