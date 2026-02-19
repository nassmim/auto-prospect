import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { LoginForm } from "./login-form";

export const metadata = getSEOTags({
  title: "Connexion",
  description: "Connecte-toi à ton compte Auto-Prospect",
  canonical: pages.login,
  noIndex: false,
});

export default function LoginPage() {
  return <LoginForm />;
}
