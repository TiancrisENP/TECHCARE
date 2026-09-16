import { Prisma } from "@prisma/client";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { where: { active: true }, orderBy: { name: "asc" as const } },
} satisfies Prisma.ProductInclude;

export { productInclude };

function money(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null;
  return Number(value);
}

export function recommendedPrice(price: number, salePrice: number | null) {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

export function floorPrice(minPrice: number | null, cost: number | null) {
  if (minPrice != null && minPrice > 0) return minPrice;
  if (cost != null && cost > 0) return cost;
  return 0;
}

export function serializeProduct(product: {
  price: Prisma.Decimal | number;
  salePrice?: Prisma.Decimal | number | null;
  minPrice?: Prisma.Decimal | number | null;
  cost: Prisma.Decimal | number;
  supplier?: string | null;
  stock: number;
  minStock?: number;
  images?: { url: string; sortOrder: number; id: string }[];
  variants?: {
    id: string;
    name: string;
    sku: string;
    price: Prisma.Decimal | number;
    salePrice?: Prisma.Decimal | number | null;
    minPrice?: Prisma.Decimal | number | null;
    stock: number;
    imageUrl?: string | null;
    active: boolean;
  }[];
  [key: string]: unknown;
}) {
  const price = Number(product.price);
  const salePrice = money(product.salePrice);
  const minPrice = money(product.minPrice);
  const cost = Number(product.cost);
  const variants = (product.variants ?? []).map((v) => {
    const vPrice = Number(v.price);
    const vSale = money(v.salePrice);
    const vMin = money(v.minPrice) ?? minPrice;
    return {
      ...v,
      price: vPrice,
      salePrice: vSale,
      minPrice: vMin,
      recommendedPrice: recommendedPrice(vPrice, vSale),
      effectivePrice: recommendedPrice(vPrice, vSale),
    };
  });
  const stock =
    variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : product.stock;

  return {
    ...product,
    price,
    salePrice,
    minPrice,
    cost,
    supplier: product.supplier ?? null,
    stock,
    minStock: Number(product.minStock ?? 2),
    recommendedPrice: recommendedPrice(price, salePrice),
    effectivePrice: recommendedPrice(price, salePrice),
    floorPrice: floorPrice(minPrice, cost),
    images: product.images ?? [],
    variants,
  };
}
