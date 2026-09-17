export function formatCop(value: number) {
  return `$${Number(value).toLocaleString("es-CO")}`;
}

export function displayPrice(product: {
  price: number;
  salePrice?: number | null;
  effectivePrice?: number;
}) {
  const list = Number(product.price);
  const offer = product.salePrice != null ? Number(product.salePrice) : null;
  const effective = product.effectivePrice ?? (offer && offer > 0 && offer < list ? offer : list);
  return { list, offer, effective, onSale: effective < list };
}
