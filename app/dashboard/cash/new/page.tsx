import { redirect } from "next/navigation";

export default function CashNewPage() {
  redirect("/dashboard/peti-cash/new?mode=CREDIT");
}
