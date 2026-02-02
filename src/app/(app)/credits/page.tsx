import { CreditsView } from "@/components/credits/credits-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getAccountCredits } from "@/services/credit.service";

export const metadata = getSEOTags({
  title: "Credits",
  description: "Gérez vos crédits de contact pour SMS, WhatsApp et appels",
  canonical: pages.credits,
});

export default async function CreditsPage() {
  const creditData = await getAccountCredits();
  return <CreditsView data={creditData} />;
}
