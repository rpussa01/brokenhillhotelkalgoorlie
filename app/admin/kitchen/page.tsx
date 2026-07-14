import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";
import KitchenDisplay from "@/components/KitchenDisplay";
export const dynamic = "force-dynamic";
export default async function KitchenPage() {
  if (!(await isAdmin())) redirect("/admin");
  const orders = await prisma.order.findMany({ include: { lines: true }, orderBy: { createdAt: "asc" } });
  return <KitchenDisplay initial={orders.map(serializeOrder)} />;
}
