import { cookies } from "next/headers";
import CalendarView from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access")?.value || "";
  return <CalendarView token={token} />;
}
