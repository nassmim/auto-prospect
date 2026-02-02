import { redirect } from "next/navigation";
import { pages } from "@/config/routes";

export default function PipelinePage() {
  redirect(pages.leads.list);
}
