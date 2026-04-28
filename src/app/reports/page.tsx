import { redirect } from "next/navigation";

export default function ReportsPage() {
	redirect("/sales?tab=reports");
}
