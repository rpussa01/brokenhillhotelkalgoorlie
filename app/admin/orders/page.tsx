import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";
import AdminShell from "@/components/AdminShell";
import OrderBoard from "@/components/OrderBoard";
export const dynamic = "force-dynamic";
export default async function OrdersPage() {
  if (!(await isAdmin())) redirect("/admin");
  const orders = await prisma.order.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } });
  return <AdminShell title="Order board"><OrderBoard initial={orders.map(serializeOrder)} /></AdminShell>;
}
