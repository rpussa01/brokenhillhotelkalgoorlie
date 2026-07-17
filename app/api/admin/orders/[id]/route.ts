import { NextResponse } from "next/server";
import { Resend } from "resend";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "RECEIVED",
  "ACCEPTED",
  "COOKING",
  "READY",
  "COLLECTED",
  "CANCELLED",
] as const;

type ValidOrderStatus =
  (typeof VALID_ORDER_STATUSES)[number];

type PatchOrderBody = {
  status?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  pickupTime?: string;
  notes?: string | null;
};

type ReadyEmailOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string | null;
  pickupTime: Date;
  totalCents: number;
  notes: string | null;
  lines: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    notes: string | null;
  }>;
};

function isValidOrderStatus(
  value: string,
): value is ValidOrderStatus {
  return VALID_ORDER_STATUSES.includes(
    value as ValidOrderStatus,
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

function formatPerthDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSiteUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (!configuredUrl) {
    return "https://brokenhillhotelkalgoorlie.vercel.app";
  }

  return configuredUrl.replace(/\/+$/, "");
}

function buildOrderItemsHtml(
  order: ReadyEmailOrder,
): string {
  return order.lines
    .map((line) => {
      const lineTotal =
        line.unitPriceCents * line.quantity;

      const itemNotes = line.notes
        ? `
          <div
            style="
              margin-top: 5px;
              color: #746d62;
              font-size: 13px;
              line-height: 1.45;
            "
          >
            ${escapeHtml(line.notes)}
          </div>
        `
        : "";

      return `
        <tr>
          <td
            style="
              padding: 15px 0;
              border-bottom: 1px solid #e8e1d5;
              vertical-align: top;
            "
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tr>
                <td
                  style="
                    width: 36px;
                    vertical-align: top;
                    color: #b68b3a;
                    font-size: 15px;
                    font-weight: 800;
                  "
                >
                  ${line.quantity}×
                </td>

                <td
                  style="
                    vertical-align: top;
                    color: #22211f;
                    font-size: 15px;
                    font-weight: 700;
                    line-height: 1.45;
                  "
                >
                  ${escapeHtml(line.name)}
                  ${itemNotes}
                </td>

                <td
                  align="right"
                  style="
                    width: 92px;
                    vertical-align: top;
                    color: #22211f;
                    font-size: 15px;
                    font-weight: 700;
                    white-space: nowrap;
                  "
                >
                  ${formatMoney(lineTotal)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildReadyEmailHtml(
  order: ReadyEmailOrder,
): string {
  const pickupTime = formatPerthDateTime(
    order.pickupTime,
  );

  const orderUrl =
    `${getSiteUrl()}/order-success` +
    `?id=${encodeURIComponent(order.id)}`;

  const orderNote = order.notes
    ? `
      <div
        style="
          margin: 22px 0 0;
          padding: 16px 18px;
          background: #f4efe6;
          border-left: 4px solid #b68b3a;
          border-radius: 0 8px 8px 0;
        "
      >
        <div
          style="
            margin-bottom: 6px;
            color: #756b5a;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
          "
        >
          Order note
        </div>

        <div
          style="
            color: #37332d;
            font-size: 14px;
            line-height: 1.6;
          "
        >
          ${escapeHtml(order.notes)}
        </div>
      </div>
    `
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>
          Order #${order.orderNumber} is ready
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #eee9df;
          color: #22211f;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        "
      >
        <div
          style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
          "
        >
          Your Broken Hill Hotel order is ready for collection.
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background: #eee9df;"
        >
          <tr>
            <td
              align="center"
              style="padding: 28px 14px;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width: 100%;
                  max-width: 620px;
                  overflow: hidden;
                  background: #ffffff;
                  border: 1px solid #ddd3c1;
                  border-radius: 18px;
                  box-shadow:
                    0 16px 40px
                    rgba(39, 34, 25, 0.12);
                "
              >
                <tr>
                  <td
                    style="
                      height: 6px;
                      background: #b68b3a;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding: 32px 30px 28px;
                      background: #14231d;
                    "
                  >
                    <div
                      style="
                        margin-bottom: 8px;
                        color: #d7b66f;
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 2.1px;
                        text-transform: uppercase;
                      "
                    >
                      Broken Hill Hotel
                    </div>

                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-family:
                          Georgia,
                          'Times New Roman',
                          serif;
                        font-size: 34px;
                        font-weight: 700;
                        line-height: 1.15;
                      "
                    >
                      Your order is ready
                    </h1>

                    <p
                      style="
                        margin: 12px 0 0;
                        color: #dce4df;
                        font-size: 15px;
                        line-height: 1.6;
                      "
                    >
                      Freshly prepared and ready for collection.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px 30px 12px;">
                    <p
                      style="
                        margin: 0 0 12px;
                        color: #22211f;
                        font-size: 17px;
                        line-height: 1.6;
                      "
                    >
                      Hi
                      <strong>
                        ${escapeHtml(order.customerName)}
                      </strong>,
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #5f5a52;
                        font-size: 15px;
                        line-height: 1.7;
                      "
                    >
                      Great news — your order has been prepared
                      and is now ready to collect from
                      Broken Hill Hotel.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 18px 30px;">
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        background: #f7f3eb;
                        border: 1px solid #e1d7c5;
                        border-radius: 14px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 22px;
                            border-bottom:
                              1px solid #e1d7c5;
                          "
                        >
                          <div
                            style="
                              color: #817867;
                              font-size: 11px;
                              font-weight: 800;
                              letter-spacing: 1.4px;
                              text-transform: uppercase;
                            "
                          >
                            Order number
                          </div>

                          <div
                            style="
                              margin-top: 7px;
                              color: #14231d;
                              font-family:
                                Georgia,
                                'Times New Roman',
                                serif;
                              font-size: 31px;
                              font-weight: 700;
                            "
                          >
                            #${order.orderNumber}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 22px;">
                          <div
                            style="
                              color: #817867;
                              font-size: 11px;
                              font-weight: 800;
                              letter-spacing: 1.4px;
                              text-transform: uppercase;
                            "
                          >
                            Collection time
                          </div>

                          <div
                            style="
                              margin-top: 7px;
                              color: #22211f;
                              font-size: 17px;
                              font-weight: 800;
                              line-height: 1.45;
                            "
                          >
                            ${pickupTime}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 4px 30px 8px;">
                    <div
                      style="
                        margin-bottom: 8px;
                        color: #817867;
                        font-size: 11px;
                        font-weight: 800;
                        letter-spacing: 1.4px;
                        text-transform: uppercase;
                      "
                    >
                      Your order
                    </div>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      ${buildOrderItemsHtml(order)}
                    </table>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          style="
                            padding: 18px 0 0;
                            color: #22211f;
                            font-size: 16px;
                            font-weight: 800;
                          "
                        >
                          Total
                        </td>

                        <td
                          align="right"
                          style="
                            padding: 18px 0 0;
                            color: #14231d;
                            font-size: 21px;
                            font-weight: 800;
                          "
                        >
                          ${formatMoney(order.totalCents)}
                        </td>
                      </tr>
                    </table>

                    ${orderNote}
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="padding: 28px 30px 34px;"
                  >
                    <a
                      href="${orderUrl}"
                      style="
                        display: inline-block;
                        padding: 15px 28px;
                        background: #b68b3a;
                        border-radius: 8px;
                        color: #ffffff;
                        font-size: 14px;
                        font-weight: 800;
                        letter-spacing: 0.3px;
                        text-decoration: none;
                      "
                    >
                      View order details
                    </a>

                    <p
                      style="
                        margin: 20px 0 0;
                        color: #6f695f;
                        font-size: 13px;
                        line-height: 1.65;
                      "
                    >
                      Please have your order number ready
                      when collecting.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding: 25px 30px;
                      background: #14231d;
                    "
                  >
                    <div
                      style="
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 800;
                      "
                    >
                      Broken Hill Hotel
                    </div>

                    <div
                      style="
                        margin-top: 7px;
                        color: #c6d0ca;
                        font-size: 13px;
                        line-height: 1.7;
                      "
                    >
                      21 Forrest Street, South Boulder WA 6432
                      <br />
                      (08) 9093 0306
                    </div>

                    <div
                      style="
                        margin-top: 14px;
                        color: #d7b66f;
                        font-family:
                          Georgia,
                          'Times New Roman',
                          serif;
                        font-size: 14px;
                        font-style: italic;
                      "
                    >
                      Good food. Great company. Local hospitality.
                    </div>
                  </td>
                </tr>
              </table>

              <p
                style="
                  max-width: 580px;
                  margin: 18px auto 0;
                  color: #8a8378;
                  font-size: 11px;
                  line-height: 1.6;
                  text-align: center;
                "
              >
                This message was sent because an order was
                placed using this email address.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildReadyEmailText(
  order: ReadyEmailOrder,
): string {
  const items = order.lines
    .map((line) => {
      const total =
        line.unitPriceCents * line.quantity;

      const note = line.notes
        ? ` — ${line.notes}`
        : "";

      return `${line.quantity}× ${line.name} — ${formatMoney(total)}${note}`;
    })
    .join("\n");

  return [
    `Hi ${order.customerName},`,
    "",
    `Your Broken Hill Hotel order #${order.orderNumber} is ready for collection.`,
    "",
    `Collection time: ${formatPerthDateTime(order.pickupTime)}`,
    "",
    "Your order:",
    items,
    "",
    `Total: ${formatMoney(order.totalCents)}`,
    "",
    order.notes
      ? `Order note: ${order.notes}`
      : "",
    "",
    "Please collect your order from:",
    "Broken Hill Hotel",
    "21 Forrest Street, South Boulder WA 6432",
    "(08) 9093 0306",
    "",
    "Thank you for your order.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendOrderReadyEmail(
  order: ReadyEmailOrder,
): Promise<void> {
  if (!order.customerEmail) {
    console.log(
      `Order #${order.orderNumber} has no customer email. Ready notification skipped.`,
    );

    return;
  }

  const resendApiKey =
    process.env.RESEND_API_KEY?.trim();

  if (!resendApiKey) {
    console.error(
      "RESEND_API_KEY is not configured. Ready email was not sent.",
    );

    return;
  }

  const fromAddress =
    process.env.ORDER_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Broken Hill Hotel <onboarding@resend.dev>";

  const resend = new Resend(resendApiKey);

  const result = await resend.emails.send({
    from: fromAddress,
    to: [order.customerEmail],
    subject: `Order #${order.orderNumber} is ready for collection`,
    html: buildReadyEmailHtml(order),
    text: buildReadyEmailText(order),
    replyTo:
      process.env.ORDER_REPLY_TO_EMAIL?.trim() ||
      undefined,
    tags: [
      {
        name: "email_type",
        value: "order_ready",
      },
      {
        name: "order_number",
        value: String(order.orderNumber),
      },
    ],
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log(
    `Ready email sent for order #${order.orderNumber} to ${order.customerEmail}.`,
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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

  const { id } = await context.params;

  let body: PatchOrderBody;

  try {
    body = (await request.json()) as PatchOrderBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    body.status !== undefined &&
    !isValidOrderStatus(body.status)
  ) {
    return NextResponse.json(
      {
        error: "Invalid order status.",
      },
      {
        status: 400,
      },
    );
  }

  let parsedPickupTime: Date | undefined;

  if (body.pickupTime) {
    parsedPickupTime = new Date(body.pickupTime);

    if (
      Number.isNaN(parsedPickupTime.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid pickup time.",
        },
        {
          status: 400,
        },
      );
    }
  }

  try {
    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id,
        },
        select: {
          status: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    const order = await prisma.order.update({
      where: {
        id,
      },

      data: {
        ...(body.status
          ? {
              status: body.status as never,
            }
          : {}),

        ...(body.customerName !== undefined
          ? {
              customerName:
                body.customerName.trim() || "Guest",
            }
          : {}),

        ...(body.customerPhone !== undefined
          ? {
              customerPhone:
                body.customerPhone.trim() ||
                "Not provided",
            }
          : {}),

        ...(body.customerEmail !== undefined
          ? {
              customerEmail:
                body.customerEmail?.trim() || null,
            }
          : {}),

        ...(parsedPickupTime
          ? {
              pickupTime: parsedPickupTime,
            }
          : {}),

        ...(body.notes !== undefined
          ? {
              notes:
                body.notes?.trim() || null,
            }
          : {}),
      },

      include: {
        lines: true,
      },
    });

    const becameReady =
      existingOrder.status !== "READY" &&
      order.status === "READY";

    if (becameReady) {
      try {
        await sendOrderReadyEmail(order);
      } catch (emailError) {
        console.error(
          `Order #${order.orderNumber} was marked ready, but the customer email could not be sent:`,
          emailError,
        );
      }
    }

    return NextResponse.json({
      ...order,
      readyEmailTriggered: becameReady,
    });
  } catch (error) {
    console.error("PATCH order failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update order.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
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

  const { id } = await context.params;

  console.log("Deleting order:", id);

  try {
    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          orderNumber: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

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
      deletedOrderNumber:
        existingOrder.orderNumber,
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
      {
        status: 500,
      },
    );
  }
}