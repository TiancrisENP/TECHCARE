export type Role = "ADMIN" | "VENDEDOR" | "TECNICO" | "CLIENTE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  phone?: string;
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  minPrice?: number | null;
  stock: number;
  imageUrl?: string | null;
  active: boolean;
  recommendedPrice?: number;
  effectivePrice?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  price: number;
  salePrice?: number | null;
  minPrice?: number | null;
  cost?: number;
  supplier?: string | null;
  stock: number;
  minStock: number;
  imageUrl?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  recommendedPrice?: number;
  effectivePrice?: number;
  floorPrice?: number;
  warrantyMonths?: number;
  active: boolean;
}

export type ServiceStatus =
  | "RECIBIDO"
  | "DIAGNOSTICO"
  | "COTIZACION"
  | "ESPERANDO_APROBACION"
  | "EN_REPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export interface ServiceOrder {
  id: string;
  trackingCode: string;
  deviceName: string;
  serialNumber?: string;
  problem: string;
  diagnosis?: string;
  quotedAmount?: number;
  status: ServiceStatus;
  receivedAt: string;
  customer?: User;
  technician?: User;
}

export type WarrantyStatus = "PENDIENTE" | "EN_REVISION" | "APROBADA" | "RECHAZADA" | "SOLUCIONADA";

export interface Warranty {
  id: string;
  productId: string;
  problem: string;
  status: WarrantyStatus;
  purchaseDate: string;
  product?: Product;
  customer?: User;
}

export type OrderStatus = "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  serialNumber?: string;
  product?: Product;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "MOCK";
  createdAt: string;
  customer?: User;
  seller?: User;
  technician?: User;
  items: OrderItem[];
}

export type SocialNetwork = "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "TELEGRAM" | "OTRO";

export interface SocialLink {
  id: string;
  network: SocialNetwork;
  label: string;
  url: string;
  iconUrl?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export interface SalesByMonth {
  month: string;
  total: number;
}

export interface TopProduct {
  product: string;
  quantity: number;
}
