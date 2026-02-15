import { LeadsPageClient } from "./leads-page-client";
import { getPipelineLeads } from "@/services/lead.service";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";

export const metadata = getSEOTags({
  title: "Leads",
  description: "Consultez et gérez tous vos leads de prospection automobile",
  canonical: pages.leads.list,
});

export default async function LeadsPage() {
  const leads = await getPipelineLeads();

  return <LeadsPageClient leads={leads} />;
}
