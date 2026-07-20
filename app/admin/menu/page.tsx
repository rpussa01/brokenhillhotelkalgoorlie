import MenuManager from "@/components/MenuManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [categories, items, specials] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        displayOrder: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.menuItem.findMany({
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        available: true,
        dietary: true,
        displayOrder: true,
        featured: true,
        chefFavourite: true,
        popular: true,
        dineInOnly: true,
        takeaway: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.special.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        day: true,
        badge: true,
        imageUrl: true,
        active: true,
        sortOrder: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
      ],
    }),
  ]);

  return (
    <main className="admin-content">
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">
            BROKIE OPS
          </div>

          <h1>Menu manager</h1>

          <p className="dashboard-head-copy">
            Manage categories, dine-in dishes, takeaway
            availability and weekly specials.
          </p>
        </div>

        <div className="dashboard-head-actions">
          <a
            className="button ghost"
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
          >
            View dine-in menu
          </a>

          <a
            className="button ghost"
            href="/order"
            target="_blank"
            rel="noopener noreferrer"
          >
            View takeaway menu
          </a>

          <a
            className="button"
            href="/admin/menu"
          >
            Refresh
          </a>
        </div>
      </div>

      <MenuManager
        initialCategories={categories}
        initialItems={items.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          imageUrl: item.imageUrl,
          available: item.available,
          dietary: Array.isArray(item.dietary)
            ? item.dietary
            : [],
          displayOrder: item.displayOrder,
          featured: item.featured,
          chefFavourite: item.chefFavourite,
          popular: item.popular,
          dineInOnly: item.dineInOnly,
          takeaway: item.takeaway,
        }))}
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