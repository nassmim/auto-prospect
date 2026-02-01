import Link from "next/link"
import SignupForm from "../components/account/SignupForm"
import LoginForm from "../components/account/LoginForm"
import PhoneSmsRequest from "../components/account/PhoneSmsRequest"
import Image from "next/image"

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-4">Auth playground</h1>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">S'inscrire</h2>
              <SignupForm />
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">Se connecter</h2>
              <LoginForm />
            </div>



            <div>
              <h2 className="text-lg font-medium mb-2">Configuration SMS</h2>
              <PhoneSmsRequest />
            </div>
          </div>

          <div className="mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:underline">Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
