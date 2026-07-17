import type {
  Order as PrismaOrder,
  OrderLine as PrismaOrderLine,
} from "@prisma/client";

import type {
  Order,
  OrderLine,
} from "@/lib/types";

type PrismaOrderWithLines = PrismaOrder & {
  lines: PrismaOrderLine[];
};

export function serializeOrderLine(
  line: PrismaOrderLine,
): OrderLine {
  return {
    id: line.id,
    orderId: line.orderId,
    itemId: line.itemId,
    specialId: line.specialId,
    name: line.name,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    notes: line.notes,
  };
}

export function serializeOrder(
  order: PrismaOrderWithLines,
): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,

    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,

    pickupTime: order.pickupTime.toISOString(),
    notes: order.notes,

    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    stripeSessionId: order.stripeSessionId,

    status: order.status,

    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,

    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),

    lines: order.lines.map(serializeOrderLine),
  };
}