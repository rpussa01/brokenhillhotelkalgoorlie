import { prisma } from "./prisma";

export const defaultSettings = {
  id: "main",
  venueName: "Broken Hill Hotel",
  phone: "(08) 9093 0306",
  address: "21 Forrest Street, South Boulder WA 6432",
  isOrderingOpen: true,
  pickupMinutes: 30
};

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: "main" },
    update: {},
    create: defaultSettings
  });
}

export async function getPublicMenu() {
  const [settings, categories, items] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.menuItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  return { settings, categories, items };
}
