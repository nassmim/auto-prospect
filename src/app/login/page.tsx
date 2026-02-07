import { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Connexion | Auto-Prospect',
  description: 'Connectez-vous à votre compte Auto-Prospect',
}

export default function LoginPage() {
  return <LoginForm />
}
