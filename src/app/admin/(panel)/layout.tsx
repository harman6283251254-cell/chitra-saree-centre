import { requireAdminPage } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { sb } = await requireAdminPage();
  const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("order_status", "pending");
  return (
    <>
      <AdminNav pendingOrders={count ?? 0} />
      <div className="lg:pl-60"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</div></div>
    </>
  );
}
