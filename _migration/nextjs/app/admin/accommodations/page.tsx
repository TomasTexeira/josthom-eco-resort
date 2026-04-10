import { cookies } from "next/headers";
import AccommodationsManager from "./AccommodationsManager";

export const dynamic = "force-dynamic";

export default async function AdminAccommodationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access")?.value || "";
  return <AccommodationsManager token={token} />;
}
