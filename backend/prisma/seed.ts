import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@techcare.com" },
    update: {},
    create: {
      name: "Administrador TECHCARE",
      email: "admin@techcare.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const tecnicoPassword = await bcrypt.hash("Tecnico123!", 10);
  await prisma.user.upsert({
    where: { email: "cristian@techcare.com" },
    update: {},
    create: {
      name: "Cristian",
      email: "cristian@techcare.com",
      passwordHash: tecnicoPassword,
      role: "TECNICO",
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "Componentes" },
    update: {},
    create: { name: "Componentes" },
  });

  await prisma.product.createMany({
    data: [
      { name: "RTX 5070", sku: "GPU-RTX5070", brand: "NVIDIA", categoryId: category.id, price: 3200000, cost: 2600000, stock: 8, minStock: 2 },
      { name: "Ryzen 7 9700X", sku: "CPU-R7-9700X", brand: "AMD", categoryId: category.id, price: 1450000, cost: 1100000, stock: 12, minStock: 3 },
      { name: "Kingston Fury 32GB", sku: "RAM-KF-32GB", brand: "Kingston", categoryId: category.id, price: 520000, cost: 400000, stock: 20, minStock: 5 },
      { name: "SSD NVMe 1TB", sku: "SSD-NVME-1TB", brand: "Western Digital", categoryId: category.id, price: 390000, cost: 300000, stock: 1, minStock: 4 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completado. Admin:", admin.email, "/ contraseña: Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
