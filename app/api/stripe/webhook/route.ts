import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not configured.",
    );

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  /*
   * Stripe signature verification requires the raw body.
   * Do not use request.json() here.
   */
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error,
    );

    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error(
            "Checkout Session has no orderId metadata:",
            session.id,
          );

          break;
        }

        /*
         * For an immediately paid card/Link transaction,
         * payment_status should be "paid".
         */
        if (session.payment_status === "paid") {
          await prisma.order.updateMany({
            where: {
              id: orderId,
              paymentStatus: {
                not: "PAID",
              },
            },
            data: {
              stripeSessionId: session.id,
              paymentStatus: "PAID",
              status: "RECEIVED",
            },
          });

          console.log(
            `Order ${orderId} marked as paid.`,
          );
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.updateMany({
            where: {
              id: orderId,
              paymentStatus: {
                not: "PAID",
              },
            },
            data: {
              stripeSessionId: session.id,
              paymentStatus: "PAID",
              status: "RECEIVED",
            },
          });
        }

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.updateMany({
            where: {
              id: orderId,
              paymentStatus: {
                not: "PAID",
              },
            },
            data: {
              paymentStatus: "FAILED",
              status: "PAYMENT_FAILED",
            },
          });
        }

        break;
      }

      case "checkout.session.expired": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.updateMany({
            where: {
              id: orderId,
              paymentStatus: "PENDING",
            },
            data: {
              paymentStatus: "FAILED",
              status: "PAYMENT_FAILED",
            },
          });
        }

        break;
      }

      default:
        console.log(
          `Unhandled Stripe event: ${event.type}`,
        );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      `Stripe webhook processing failed for ${event.type}:`,
      error,
    );

    /*
     * Return 500 so Stripe retries the event.
     */
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}