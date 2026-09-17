import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@techcare.com" },
    update: { passwordHash: adminPassword, role: "ADMIN", active: true },
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
    update: { passwordHash: tecnicoPassword, role: "TECNICO", active: true },
    create: {
      name: "Cristian",
      email: "cristian@techcare.com",
      passwordHash: tecnicoPassword,
      role: "TECNICO",
    },
  });

  const vendedorPassword = await bcrypt.hash("Vendedor123!", 10);
  await prisma.user.upsert({
    where: { email: "vendedor@techcare.com" },
    update: { passwordHash: vendedorPassword, role: "VENDEDOR", active: true },
    create: {
      name: "Laura Vendedora",
      email: "vendedor@techcare.com",
      passwordHash: vendedorPassword,
      role: "VENDEDOR",
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "Componentes" },
    update: {},
    create: { name: "Componentes" },
  });

  await prisma.product.createMany({
    data: [
      { name: "RTX 5070", sku: "GPU-RTX5070", brand: "NVIDIA", categoryId: category.id, price: 3200000, salePrice: 2990000, minPrice: 2750000, cost: 2600000, supplier: "NVIDIA Distribuidor", stock: 8, minStock: 2 },
      { name: "Ryzen 7 9700X", sku: "CPU-R7-9700X", brand: "AMD", categoryId: category.id, price: 1450000, minPrice: 1180000, cost: 1100000, supplier: "AMD Colombia", stock: 12, minStock: 3 },
      { name: "Kingston Fury 32GB", sku: "RAM-KF-32GB", brand: "Kingston", categoryId: category.id, price: 520000, minPrice: 420000, cost: 400000, supplier: "Kingston", stock: 20, minStock: 5 },
      { name: "SSD NVMe 1TB", sku: "SSD-NVME-1TB", brand: "Western Digital", categoryId: category.id, price: 390000, minPrice: 320000, cost: 300000, supplier: "WD Mayorista", stock: 1, minStock: 4 },
    ],
    skipDuplicates: true,
  });

  const laptop = await prisma.product.upsert({
    where: { sku: "NB-TUF-F15" },
    update: {},
    create: {
      name: "ASUS TUF Gaming F15",
      sku: "NB-TUF-F15",
      brand: "ASUS",
      description: "Portátil gamer. El precio cambia según color y configuración de RAM.",
      categoryId: category.id,
      price: 4200000,
      minPrice: 3600000,
      cost: 3400000,
      supplier: "ASUS Colombia",
      stock: 0,
      minStock: 1,
      variants: {
        create: [
          { name: "Gris / 16GB", sku: "NB-TUF-F15-GRIS-16", price: 4200000, minPrice: 3600000, stock: 4 },
          { name: "Negro / 32GB", sku: "NB-TUF-F15-NEG-32", price: 4680000, salePrice: 4490000, minPrice: 4000000, stock: 2 },
        ],
      },
    },
  });
  console.log("Seed laptop:", laptop.sku);

  console.log("Seed completado. Admin:", admin.email, "/ contraseña: Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
