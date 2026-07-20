import { prisma } from "./prisma";

export const defaultSettings = {
  id: "main",
  venueName: "Broken Hill Hotel",
  phone: "(08) 9093 0306",
  address: "21 Forrest Street, South Boulder WA 6432",
  isOrderingOpen: true,
  pickupMinutes: 30,
};

export async function getSettings() {
  return prisma.settings.upsert({
    where: {
      id: "main",
    },
    update: {},
    create: defaultSettings,
  });
}

const categorySelect = {
  id: true,
  name: true,
  active: true,
  displayOrder: true,
} as const;

const menuItemSelect = {
  id: true,
  name: true,
  description: true,
  priceCents: true,
  imageUrl: true,
  categoryId: true,

  featured: true,
  chefFavourite: true,
  popular: true,
  dietary: true,

  available: true,
  dineInOnly: true,
  takeaway: true,
  displayOrder: true,
} as const;

/**
 * Full public menu.
 *
 * Includes all available menu items, including dine-in-only dishes.
 */
export async function getPublicMenu() {
  const [settings, categories] = await Promise.all([
    getSettings(),

    prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: categorySelect,
    }),
  ]);

  const categoryIds = categories.map((category) => category.id);

  const items =
    categoryIds.length === 0
      ? []
      : await prisma.menuItem.findMany({
          where: {
            available: true,
            categoryId: {
              in: categoryIds,
            },
          },
          orderBy: [
            {
              category: {
                displayOrder: "asc",
              },
            },
            {
              displayOrder: "asc",
            },
            {
              name: "asc",
            },
          ],
          select: menuItemSelect,
        });

  return {
    settings,
    categories: categories.map((category) => ({
      ...category,
      description: null,
    })),
    items,
  };
}

/**
 * Online ordering menu.
 *
 * Only includes items that are available for takeaway.
 */

 
 export async function getOnlineOrderingMenu() {
  const [settings, categories] = await Promise.all([
    getSettings(),

    prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        active: true,
        displayOrder: true,
      },
    }),
  ]);

  const categoryIds = categories.map((category) => category.id);

  const items =
    categoryIds.length === 0
      ? []
      : await prisma.menuItem.findMany({
          where: {
            available: true,
            takeaway: true,
            categoryId: {
              in: categoryIds,
            },
          },
          orderBy: [
            {
              displayOrder: "asc",
            },
            {
              name: "asc",
            },
          ],
          select: {
            id: true,
            name: true,
            description: true,
            priceCents: true,
            imageUrl: true,
            categoryId: true,
            featured: true,
            chefFavourite: true,
            popular: true,
            dietary: true,
            available: true,
            dineInOnly: true,
            takeaway: true,
            displayOrder: true,
          },
        });

  console.log("ONLINE ORDERING CATEGORIES:", categories.length);
  console.log("ONLINE ORDERING ITEMS:", items.length);

  return {
    settings,
    categories: categories.map((category) => ({
      ...category,
      description: null,
    })),
    items,
  };
}
export async function getSpecials() {
  return prisma.special.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}