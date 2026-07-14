export type OrderStatus =
  | "PENDING_PAYMENT"
  | "RECEIVED"
  | "ACCEPTED"
  | "COOKING"
  | "READY"
  | "COLLECTED"
  | "CANCELLED";

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  active: boolean;
  soldOut: boolean;
  dietary: string[];
  sortOrder: number;
};

export type OrderLine = {
  itemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupTime: string;
  notes?: string;
  paymentMethod: "ONLINE" | "PICKUP";
  paymentStatus: "PENDING" | "PAID" | "PAY_AT_PICKUP" | "REFUNDED";
  stripeSessionId?: string;
  status: OrderStatus;
  subtotalCents: number;
  totalCents: number;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  venueName: string;
  phone: string;
  address: string;
  isOrderingOpen: boolean;
  pickupMinutes: number;
};

export type Database = {
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
  orders: Order[];
};
