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

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
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
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "MOCK";
  createdAt: string;
  customer?: User;
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
