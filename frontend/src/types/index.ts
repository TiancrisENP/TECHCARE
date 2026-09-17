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
  recommendedPrice?: number;
  effectivePrice: number;
  stock: number;
  imageUrl?: string | null;
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
  recommendedPrice?: number;
  effectivePrice?: number;
  floorPrice?: number;
  cost?: number;
  supplier?: string | null;
  stock: number;
  minStock: number;
  imageUrl?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
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

export interface ServicePhoto {
  id?: string;
  imageUrl: string;
}

export interface ServiceOrder {
  id: string;
  trackingCode: string;
  deviceName: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string;
  accessories?: string | null;
  physicalCondition?: string | null;
  notes?: string | null;
  problem: string;
  diagnosis?: string;
  quotedAmount?: number;
  status: ServiceStatus;
  receivedAt: string;
  customer?: User;
  technician?: User;
  photos?: ServicePhoto[];
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
  evidence?: { id: string; imageUrl: string }[];
}

export type OrderStatus = "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  serialNumber?: string | null;
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
  technician?: User | null;
  items: OrderItem[];
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
