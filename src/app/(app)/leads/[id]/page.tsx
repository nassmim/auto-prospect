import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import {
  getLeadActivities,
  getLeadDetails,
  getLeadMessages,
} from "@/services/lead.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const lead = await getLeadDetails(id);
    const vehicleInfo = [lead.ad.brand?.name, lead.ad.model, lead.ad.modelYear]
      .filter(Boolean)
      .join(" ");

    return getSEOTags({
      title: lead.ad.title,
      description: lead.ad.description || `Détails du lead pour ${vehicleInfo}`,
      canonical: `/${pages.leads}/${id}`,
      openGraph: {
        type: "article",
        images: lead.ad.picture ? [lead.ad.picture] : undefined,
      },
    });
  } catch {
    return getSEOTags({
      title: "Lead introuvable",
      description: "Le lead demandé n'existe pas ou n'est plus disponible",
    });
  }
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  let lead;
  let messages;
  let activities;

  try {
    [lead, messages, activities] = await Promise.all([
      getLeadDetails(id),
      getLeadMessages(id),
      getLeadActivities(id),
    ]);
  } catch (error) {
    console.error("Error fetching lead details:", error);
    notFound();
  }

  if (!lead) {
    notFound();
  }

  return (
    <LeadDetailView
      lead={lead}
      messages={messages}
      activities={activities}
      leadId={id}
    />
  );
}
