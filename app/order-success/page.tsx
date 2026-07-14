import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Success({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const order = id ? await prisma.order.findUnique({ where: { id } }) : null;
  return <main className="success"><div className="success-card">
    <div className="eyebrow">ORDER CONFIRMED</div><div className="success-number">#{order?.orderNumber || "—"}</div>
    <h1>Thanks, {order?.customerName || "mate"}.</h1><p>Your order has been sent to the Broken Hill Hotel kitchen.</p>
    {order && <><p><strong>Pickup:</strong> {order.pickupTime.toLocaleString("en-AU")}</p><p><strong>Payment:</strong> {order.paymentStatus === "PAID" ? "Paid online" : "Pay at pickup"}</p></>}
    <a className="button" href="/order">Return to menu</a>
  </div></main>;
}
