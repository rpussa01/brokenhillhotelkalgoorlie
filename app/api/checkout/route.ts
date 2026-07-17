import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CheckoutItem = {
  menuItemId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items: CheckoutItem[];
      customerName?: string;
      customerEmail?: string;
      tableNumber?: string;
    };

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    /*
     * Always load prices from your database.
     * Never trust totals or prices submitted by the browser.
     */
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: body.items.map((item) => item.menuItemId),
        },
        active: true,
      },
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      body.items.map((cartItem) => {
        const menuItem = menuItems.find(
          (item) => item.id === cartItem.menuItemId
        );

        if (!menuItem) {
          throw new Error("A selected menu item is unavailable.");
        }

        return {
          quantity: Math.max(1, Math.min(cartItem.quantity, 20)),
          price_data: {
            currency: "aud",
            unit_amount: Math.round(Number(menuItem.price) * 100),
            product_data: {
              name: menuItem.name,
              description: menuItem.description || undefined,
            },
          },
        };
      });

    const totalCents = lineItems.reduce((total, item) => {
      const priceData = item.price_data;
      const unitAmount = priceData?.unit_amount ?? 0;
      return total + unitAmount * Number(item.quantity ?? 1);
    }, 0);

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName?.trim() || "Guest",
        customerEmail: body.customerEmail?.trim() || null,
        tableNumber: body.tableNumber?.trim() || null,
        total: totalCents / 100,
        paymentStatus: "PENDING",
        orderStatus: "AWAITING_PAYMENT",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: body.customerEmail || undefined,

      metadata: {
        orderId: order.id,
      },

      success_url:
        `${process.env.NEXT_PUBLIC_SITE_URL}/order/success` +
        `?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=cancelled`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout creation error:", error);

    return NextResponse.json(
      { error: "Unable to start payment." },
      { status: 500 }
    );
  }
}