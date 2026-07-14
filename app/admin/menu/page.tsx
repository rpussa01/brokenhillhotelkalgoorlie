import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/AdminShell";
import MenuManager from "@/components/MenuManager";
export const dynamic = "force-dynamic";
export default async function MenuPage() {
  if (!(await isAdmin())) redirect("/admin");
  const [categories, items] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.menuItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  return <AdminShell title="Menu manager"><MenuManager initialCategories={categories} initialItems={items} /></AdminShell>;
}
