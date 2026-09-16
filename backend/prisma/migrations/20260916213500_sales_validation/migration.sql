-- AlterTable
ALTER TABLE "products" ADD COLUMN "minPrice" DECIMAL(12,2),
ADD COLUMN "supplier" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "minPrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "sellerId" TEXT,
ADD COLUMN "technicianId" TEXT;

UPDATE "orders"
SET "sellerId" = COALESCE(
  (SELECT id FROM "users" WHERE role = 'ADMIN' AND active = true ORDER BY "createdAt" ASC LIMIT 1),
  (SELECT id FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "sellerId" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "sellerId" SET NOT NULL;

ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH';

ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
