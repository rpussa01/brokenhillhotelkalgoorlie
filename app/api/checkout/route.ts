import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CheckoutItem = {
  menuItemId: string;
  quantity: number;
};

type CheckoutBody = {
  items?: CheckoutItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupTime?: string;
  notes?: string;
  tableNumber?: string;
};

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
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error: "Stripe is not configured.",
      },
      { status: 503 },
    );
  }

  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      {
        error: "The checkout request was not valid JSON.",
      },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      {
        error: "Your cart is empty.",
      },
      { status: 400 },
    );
  }

  const invalidItem = body.items.some(
    (item) =>
      typeof item.menuItemId !== "string" ||
      item.menuItemId.trim().length === 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1,
  );

  if (invalidItem) {
    return NextResponse.json(
      {
        error: "One or more cart items are invalid.",
      },
      { status: 400 },
    );
  }

  const pickupTime = body.pickupTime
    ? new Date(body.pickupTime)
    : new Date(Date.now() + 30 * 60 * 1000);

  if (Number.isNaN(pickupTime.getTime())) {
    return NextResponse.json(
      {
        error: "Please select a valid pickup time.",
      },
      { status: 400 },
    );
  }

  try {
    /*
     * Load menu prices from the database.
     * Never trust prices submitted by the browser.
     */
    const uniqueMenuItemIds = [
      ...new Set(
        body.items.map((item) => item.menuItemId.trim()),
      ),
    ];

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: uniqueMenuItemIds,
        },
        active: true,
        soldOut: false,
      },
    });

    if (menuItems.length !== uniqueMenuItemIds.length) {
      return NextResponse.json(
        {
          error:
            "One of your selected menu items is no longer available.",
        },
        { status: 409 },
      );
    }

    const orderLines = body.items.map((cartItem) => {
      const menuItem = menuItems.find(
        (item) => item.id === cartItem.menuItemId,
      );

      if (!menuItem) {
        throw new Error(
          "A selected menu item is unavailable.",
        );
      }

      const quantity = Math.max(
        1,
        Math.min(cartItem.quantity, 20),
      );

      return {
        itemId: menuItem.id,
        specialId: null,
        name: menuItem.name,
        quantity,
        unitPriceCents: menuItem.priceCents,
        notes: null,
      };
    });

    const totalCents = orderLines.reduce(
      (total, line) =>
        total + line.unitPriceCents * line.quantity,
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
     * Keep the transaction short.
     * It only increments the order counter and creates the order.
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

        const tableNote = body.tableNumber?.trim()
          ? `Table: ${body.tableNumber.trim()}`
          : null;

        const customerNotes = body.notes?.trim() || null;

        const combinedNotes = [tableNote, customerNotes]
          .filter(
            (value): value is string =>
              typeof value === "string" &&
              value.length > 0,
          )
          .join(" — ");

        return tx.order.create({
          data: {
            orderNumber: counter.value,

            customerName:
              body.customerName?.trim() || "Guest",

            customerPhone:
              body.customerPhone?.trim() ||
              "Not provided",

            customerEmail:
              body.customerEmail?.trim() || null,

            pickupTime,

            notes: combinedNotes || null,

            paymentMethod: "ONLINE",
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT",

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

    /*
     * Stripe stays outside the Prisma transaction.
     */
    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY,
    );

    const baseUrl = getBaseUrl(request);

    try {
      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",

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

          customer_email:
            order.customerEmail || undefined,

          phone_number_collection: {
            enabled: true,
          },

          metadata: {
            orderId: order.id,
            orderNumber: String(order.orderNumber),
          },

          success_url:
            `${baseUrl}/order-success` +
            `?id=${encodeURIComponent(order.id)}` +
            `&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${baseUrl}/order` +
            `?cancelled=1` +
            `&orderId=${encodeURIComponent(order.id)}`,
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
          url: session.url,
        },
        { status: 201 },
      );
    } catch (stripeError) {
      console.error(
        "Stripe Checkout creation failed:",
        stripeError,
      );

      await prisma.order
        .update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus: "FAILED",
            status: "PAYMENT_FAILED",
          },
        })
        .catch((updateError) => {
          console.error(
            "Could not mark order payment as failed:",
            updateError,
          );
        });

      return NextResponse.json(
        {
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Unable to start payment.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Checkout creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start payment.",
      },
      { status: 500 },
    );
  }
}