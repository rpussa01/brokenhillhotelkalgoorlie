import MenuManager from "@/components/MenuManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [categories, items, specials] = await Promise.all([
    prisma.category.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),

    prisma.menuItem.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),

    prisma.special.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    }),
  ]);

  return (
    <main className="admin-content">
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">BROKIE OPS</div>
          <h1>Menu manager</h1>
        </div>

        <a className="button" href="/admin/menu">
          Refresh
        </a>
      </div>

      <MenuManager
        initialCategories={categories}
        initialItems={items}
        initialSpecials={specials.map((special) => ({
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
          active: special.active,
          sortOrder: special.sortOrder,
        }))}
      />
    </main>
  );
}
