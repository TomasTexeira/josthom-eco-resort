import { cookies } from "next/headers";
import BalanceDashboard from "./BalanceDashboard";

export const dynamic = "force-dynamic";

export default async function AdminBalancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access")?.value || "";
  return <BalanceDashboard token={token} />;
}
