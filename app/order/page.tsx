import OrderingApp from "@/components/OrderingApp";
import {
  getOnlineOrderingMenu,
  getSpecials,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [{ categories, items, settings }, specials] =
    await Promise.all([
      getOnlineOrderingMenu(),
      getSpecials(),
    ]);

  return (
    <OrderingApp
      categories={categories}
      items={items}
      settings={settings}
      specials={specials.map((special) => ({
        id: special.id,
        title: special.title,
        description: special.description,
        price:
          special.price === null
            ? null
            : Number(special.price),
        day: special.day,
        badge: special.badge,
        imageUrl: special.imageUrl,
      }))}
    />
  );
}