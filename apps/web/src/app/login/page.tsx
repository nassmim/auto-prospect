import { LoginForm } from './login-form'
import { getSEOTags } from '@/lib/seo'
import { pages } from '@/config/routes'

export const metadata = getSEOTags({
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Auto-Prospect',
  canonical: pages.login,
  noIndex: false,
})

export default function LoginPage() {
  return <LoginForm />
}
