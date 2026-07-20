import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "The order request was not valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    console.error(
      "Order validation failed:",
      JSON.stringify(parsed.error.issues, null, 2),
    );

    console.error(
      "Received order body:",
      JSON.stringify(body, null, 2),
    );

    return NextResponse.json(
      {
        error: "Please check your order details.",
        details:
          process.env.NODE_ENV === "development"
            ? parsed.error.issues
            : undefined,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (
    input.paymentMethod === "ONLINE" &&
    !process.env.STRIPE_SECRET_KEY
  ) {
    return NextResponse.json(
      {
        error:
          "Online payment is not configured. Please choose pay at pickup.",
      },
      { status: 503 },
    );
  }

  const pickupTime = new Date(input.pickupTime);

  if (Number.isNaN(pickupTime.getTime())) {
    return NextResponse.json(
      {
        error: "Please select a valid pickup time.",
      },
      { status: 400 },
    );
  }

  if (pickupTime.getTime() <= Date.now()) {
    return NextResponse.json(
      {
        error: "Pickup time must be in the future.",
      },
      { status: 400 },
    );
  }

  try {
    /*
     * Do these reads outside the interactive transaction.
     * This prevents the transaction from remaining open while
     * PostgreSQL loads menu items and specials.
     */
    const settings = await prisma.settings.upsert({
      where: {
        id: "main",
      },
      update: {},
      create: {
        id: "main",
        venueName: "Broken Hill Hotel",
        phone: "(08) 9093 0306",
        address: "21 Forrest Street, South Boulder WA 6432",
        isOrderingOpen: true,
        pickupMinutes: 30,
      },
    });

    if (!settings.isOrderingOpen) {
      return NextResponse.json(
        {
          error: "Online ordering is currently closed.",
        },
        { status: 503 },
      );
    }

    const itemIds = input.lines
      .map((line) => line.itemId)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.trim().length > 0,
      );

    const specialIds = input.lines
      .map((line) => line.specialId)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.trim().length > 0,
      );

    const [menuItems, specials] = await Promise.all([
      itemIds.length > 0
        ? prisma.menuItem.findMany({
            where: {
              id: {
                in: itemIds,
              },
              available: true,
            },
          })
        : Promise.resolve([]),

      specialIds.length > 0
        ? prisma.special.findMany({
            where: {
              id: {
                in: specialIds,
              },
              active: true,
              price: {
                not: null,
              },
            },
          })
        : Promise.resolve([]),
    ]);

    if (menuItems.length !== new Set(itemIds).size) {
      return NextResponse.json(
        {
          error:
            "One of your selected menu items is no longer available.",
        },
        { status: 409 },
      );
    }

    if (specials.length !== new Set(specialIds).size) {
      return NextResponse.json(
        {
          error:
            "One of your selected specials is no longer available.",
        },
        { status: 409 },
      );
    }

    const orderLines = input.lines.map((line) => {
      if (line.itemId) {
        const item = menuItems.find(
          (candidate) => candidate.id === line.itemId,
        );

        if (!item) {
          throw new Error(
            "A selected menu item is unavailable.",
          );
        }

        return {
          itemId: item.id,
          specialId: null,
          name: item.name,
          quantity: line.quantity,
          unitPriceCents: item.priceCents,
          notes: line.notes?.trim() || null,
        };
      }

      if (line.specialId) {
        const special = specials.find(
          (candidate) => candidate.id === line.specialId,
        );

        if (!special || special.price === null) {
          throw new Error(
            "A selected special is unavailable.",
          );
        }

        return {
          itemId: null,
          specialId: special.id,
          name: special.title,
          quantity: line.quantity,
          unitPriceCents: Math.round(
            Number(special.price) * 100,
          ),
          notes: line.notes?.trim() || null,
        };
      }

      throw new Error(
        "An order line is missing an item or special.",
      );
    });

    const totalCents = orderLines.reduce(
      (sum, line) =>
        sum + line.unitPriceCents * line.quantity,
      0,
    );

    if (totalCents <= 0) {
      return NextResponse.json(
        {
          error: "The order total must be greater than zero.",
        },
        { status: 400 },
      );
    }

    /*
     * Keep the interactive transaction short.
     * Only the counter and order creation belong here.
     */
    const order = await prisma.$transaction(
      async (tx) => {
        const counter = await tx.counter.upsert({
          where: {
            id: "orders",
          },
          create: {
            id: "orders",
            value: 101,
          },
          update: {
            value: {
              increment: 1,
            },
          },
        });

        return tx.order.create({
          data: {
            orderNumber: counter.value,

            customerName: input.customerName.trim(),
            customerPhone: input.customerPhone.trim(),
            customerEmail:
              input.customerEmail?.trim() || null,

            pickupTime,
            notes: input.notes?.trim() || null,

            paymentMethod: input.paymentMethod,

            paymentStatus:
              input.paymentMethod === "ONLINE"
                ? "PENDING"
                : "PAY_AT_PICKUP",

            status:
              input.paymentMethod === "ONLINE"
                ? "PENDING_PAYMENT"
                : "RECEIVED",

            subtotalCents: totalCents,
            totalCents,

            lines: {
              create: orderLines,
            },
          },

          include: {
            lines: true,
          },
        });
      },
      {
        maxWait: 10_000,
        timeout: 15_000,
      },
    );

    if (input.paymentMethod === "PICKUP") {
      return NextResponse.json(
        {
          orderId: order.id,
          checkoutUrl: null,
        },
        { status: 201 },
      );
    }

    /*
     * Stripe remains outside the Prisma transaction.
     * Never put Stripe, fetch(), email sending, or another
     * network request inside prisma.$transaction().
     */
    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY!,
    );

    const baseUrl = getBaseUrl(request);

    try {
      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",

          success_url:
            `${baseUrl}/order-success` +
            `?id=${encodeURIComponent(order.id)}` +
            `&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${baseUrl}/order` +
            `?cancelled=1` +
            `&orderId=${encodeURIComponent(order.id)}`,

          customer_email:
            order.customerEmail || undefined,

          phone_number_collection: {
            enabled: true,
          },

          metadata: {
            orderId: order.id,
            orderNumber: String(order.orderNumber),
          },

          line_items: order.lines.map((line) => ({
            quantity: line.quantity,

            price_data: {
              currency: "aud",
              unit_amount: line.unitPriceCents,

              product_data: {
                name: line.name,
              },
            },
          })),
        });

      if (!session.url) {
        throw new Error(
          "Stripe did not return a checkout URL.",
        );
      }

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          stripeSessionId: session.id,
        },
      });

      return NextResponse.json(
        {
          orderId: order.id,
          checkoutUrl: session.url,
        },
        { status: 201 },
      );
    } catch (stripeError) {
      console.error(
        "Stripe Checkout creation failed:",
        stripeError,
      );

      try {
        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus: "FAILED",
            status: "PAYMENT_FAILED",
          },
        });
      } catch (updateError) {
        console.error(
          "Could not mark payment as failed:",
          updateError,
        );
      }

      return NextResponse.json(
        {
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Could not open Stripe Checkout.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("POST /api/orders failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create order.",
      },
      { status: 500 },
    );
  }
}