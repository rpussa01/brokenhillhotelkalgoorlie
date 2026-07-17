export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "RECEIVED"
  | "ACCEPTED"
  | "COOKING"
  | "READY"
  | "COLLECTED"
  | "CANCELLED";

export type PaymentMethod =
  | "ONLINE"
  | "PICKUP";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "PAY_AT_PICKUP"
  | "REFUNDED";

export type OrderLine = {
  id: string;
  orderId: string;
  itemId: string | null;
  specialId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  notes: string | null;
};

export type Order = {
  id: string;
  orderNumber: number;

  customerName: string;
  customerPhone: string;
  customerEmail: string | null;

  pickupTime: string;
  notes: string | null;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripeSessionId: string | null;

  status: OrderStatus;

  subtotalCents: number;
  totalCents: number;

  createdAt: string;
  updatedAt: string;

  lines: OrderLine[];
};
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
  description: string | null;
  imageUrl: string | null;

  priceCents: number;

  dietary: string[];

  active: boolean;
  soldOut: boolean;

  sortOrder: number;
};
export type Settings = {
  id: string;
  venueName: string;
  phone: string;
  address: string;
  isOrderingOpen: boolean;
  pickupMinutes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};