import { LeadsPageClient } from "./leads-page-client";
import { getPipelineLeads } from "@/services/lead.service";

export default async function LeadsPage() {
  const leads = await getPipelineLeads();

  return <LeadsPageClient leads={leads} />;
}
