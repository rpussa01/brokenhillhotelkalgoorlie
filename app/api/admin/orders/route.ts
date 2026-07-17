import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        lines: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      orders.map(serializeOrder),
    );
  } catch (error) {
    console.error(
      "Could not load admin orders:",
      error,
    );

    return NextResponse.json(
      {
        error: "Could not load orders.",
      },
      {
        status: 500,
      },
    );
  }
}