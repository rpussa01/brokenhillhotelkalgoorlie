import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  let body: {
    status?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string | null;
    pickupTime?: string;
    notes?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON." },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.status
          ? { status: body.status as never }
          : {}),
        ...(body.customerName !== undefined
          ? { customerName: body.customerName.trim() }
          : {}),
        ...(body.customerPhone !== undefined
          ? { customerPhone: body.customerPhone.trim() }
          : {}),
        ...(body.customerEmail !== undefined
          ? {
              customerEmail:
                body.customerEmail?.trim() || null,
            }
          : {}),
        ...(body.pickupTime
          ? { pickupTime: new Date(body.pickupTime) }
          : {}),
        ...(body.notes !== undefined
          ? { notes: body.notes?.trim() || null }
          : {}),
      },
      include: {
        lines: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH order failed:", error);

    return NextResponse.json(
      { error: "Could not update order." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  console.log("Deleting order:", id);

  try {
    await prisma.$transaction([
      prisma.orderLine.deleteMany({
        where: {
          orderId: id,
        },
      }),

      prisma.order.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deletedOrderId: id,
    });
  } catch (error) {
    console.error("DELETE order failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete order.",
      },
      { status: 500 },
    );
  }
}