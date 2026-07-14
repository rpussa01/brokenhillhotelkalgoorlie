import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminLogin from "@/components/AdminLogin";

export default async function AdminPage() {
  if (await isAdmin()) redirect("/admin/orders");
  return <AdminLogin />;
}
