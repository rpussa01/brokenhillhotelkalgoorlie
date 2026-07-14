import type { Order as PrismaOrder, OrderLine as PrismaOrderLine } from "@prisma/client";
import type { Order } from "./types";

type OrderWithLines = PrismaOrder & { lines: PrismaOrderLine[] };

export function serializeOrder(order: OrderWithLines): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? undefined,
    pickupTime: order.pickupTime.toISOString(),
    notes: order.notes ?? undefined,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    stripeSessionId: order.stripeSessionId ?? undefined,
    status: order.status,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    lines: order.lines.map(line => ({
      itemId: line.itemId,
      name: line.name,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      notes: line.notes ?? undefined
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}
