import { cookies } from "next/headers";
import ContentManager from "./ContentManager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access")?.value || "";
  return <ContentManager token={token} />;
}
