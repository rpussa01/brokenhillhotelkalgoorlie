import OrderingApp from "@/components/OrderingApp";
import { getPublicMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const { categories, items, settings } = await getPublicMenu();
  return <OrderingApp categories={categories} items={items} settings={settings} />;
}
