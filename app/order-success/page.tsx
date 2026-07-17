import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{
    id?: string;
    session_id?: string;
  }>;
};

function getPaymentDetails(
  paymentMethod: "ONLINE" | "PICKUP",
  paymentStatus: string,
) {
  if (paymentMethod === "PICKUP") {
    return {
      label: "Pay at pickup",
      message: "Please pay when you collect your order.",
      className: "pickup",
    };
  }

  switch (paymentStatus) {
    case "PAID":
      return {
        label: "Paid online",
        message: "Your online payment has been confirmed.",
        className: "paid",
      };

    case "FAILED":
      return {
        label: "Payment failed",
        message:
          "Your payment could not be confirmed. Please contact the venue.",
        className: "failed",
      };

    case "REFUNDED":
      return {
        label: "Payment refunded",
        message: "This payment has been refunded.",
        className: "refunded",
      };

    default:
      return {
        label: "Online payment processing",
        message:
          "Your payment was submitted and is being confirmed.",
        className: "pending",
      };
  }
}

export default async function Success({
  searchParams,
}: SuccessPageProps) {
  const { id } = await searchParams;

  const order = id
    ? await prisma.order.findUnique({
        where: {
          id,
        },
        include: {
          lines: true,
        },
      })
    : null;

  if (!order) {
    return (
      <main className="success-page">
        <section className="success-card">
          <div className="success-icon warning">!</div>

          <p className="success-eyebrow">
            ORDER NOT FOUND
          </p>

          <h1>We could not load your order.</h1>

          <p className="success-description">
            The order reference may be missing or
            invalid. Please return to the menu or contact
            the Broken Hill Hotel.
          </p>

          <div className="success-actions">
            <Link className="primary-button" href="/order">
              Return to menu
            </Link>

            <a
              className="secondary-button"
              href="tel:+61890930306"
            >
              Call the hotel
            </a>
          </div>
        </section>
      </main>
    );
  }

  const payment = getPaymentDetails(
    order.paymentMethod,
    order.paymentStatus,
  );

  const pickupTime = order.pickupTime.toLocaleString(
    "en-AU",
    {
      timeZone: "Australia/Perth",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );

  return (
    <main className="success-page">
      <section className="success-card">
        <div className="success-icon">✓</div>

        <p className="success-eyebrow">
          ORDER CONFIRMED
        </p>

        <p className="success-number">
          Order #{order.orderNumber}
        </p>

        <h1>
          Thanks, {order.customerName}.
        </h1>

        <p className="success-description">
          Your order has been received by the Broken Hill
          Hotel.
        </p>

        <div className="order-summary">
          <div className="summary-row">
            <span>Pickup time</span>
            <strong>{pickupTime}</strong>
          </div>

          <div className="summary-row">
            <span>Payment</span>

            <div className="payment-summary">
              <strong
                className={`payment-badge ${payment.className}`}
              >
                {payment.label}
              </strong>

              <small>{payment.message}</small>
            </div>
          </div>

          <div className="summary-row">
            <span>Order total</span>
            <strong>
              A$
              {(order.totalCents / 100).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="ordered-items">
          <h2>Your order</h2>

          {order.lines.map((line) => (
            <div
              className="ordered-item"
              key={line.id}
            >
              <div>
                <strong>{line.name}</strong>

                {line.notes && (
                  <small>{line.notes}</small>
                )}
              </div>

              <span>
                {line.quantity} × A$
                {(line.unitPriceCents / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="collection-note">
          <strong>Collection address</strong>
          <span>
            21 Forrest Street, South Boulder WA 6432
          </span>
        </div>

        <div className="success-actions">
          <Link className="primary-button" href="/order">
            Return to menu
          </Link>

          <a
            className="secondary-button"
            href="tel:+61890930306"
          >
            Call the hotel
          </a>
        </div>
      </section>
    </main>
  );
}