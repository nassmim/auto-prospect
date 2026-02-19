import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getPipelineLeads } from "@/services/lead.service";
import { LeadsPageClient } from "./leads-page-client";

export const metadata = getSEOTags({
  title: "Leads",
  description: "Consulte et gère tous tes leads de prospection automobile",
  canonical: pages.leads.list,
});

export default async function LeadsPage() {
  const leads = await getPipelineLeads();

  return <LeadsPageClient leads={leads} />;
}
