"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"

type Props = {
  accountId?: string
}

export default function PhoneSmsRequest({ accountId }: Props) {
  const [loading, setLoading] = useState(false)
  const [resolvedAccountId, setResolvedAccountId] = useState<string | null>(
    accountId ?? null,
  )
  const [loadingUser, setLoadingUser] = useState(!accountId)

  useEffect(() => {
    if (accountId) return

    let mounted = true
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (error) {
          console.error(error)
          toast.error("Erreur lors de la récupération de l’utilisateur")
          return
        }
        setResolvedAccountId(data?.user?.id ?? null)
      } finally {
        if (mounted) setLoadingUser(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        setResolvedAccountId(session?.user?.id ?? null)
        setLoadingUser(false)
      },
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [accountId])

  const handleClick = async () => {
    if (loading) return
    if (!resolvedAccountId) {
      toast.error("Vous devez être connecté(e) pour faire une demande")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/account-sync/phone-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: resolvedAccountId,
        }),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de l’envoi de la demande")
      }

      toast.success("On a bien reçu ta demande")
    } catch (err) {
      toast.error("Impossible d’envoyer la demande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <p className="text-sm text-yellow-300 leading-6">
        Tu veux envoyer des sms directement via ton téléphone ? C’est possible,
        fais-nous simplement la demande et on fera une session durant laquelle
        on configurera ton téléphone.
      </p>

      <button
        onClick={handleClick}
        disabled={loading || loadingUser || !resolvedAccountId}
        className="group inline-flex w-full items-center justify-center gap-3 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:rotate-6"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm12 1a1 1 0 100-2 1 1 0 000 2zm-9 6h6a1 1 0 100-2H5a1 1 0 000 2zm0-3h6a1 1 0 100-2H5a1 1 0 000 2zm10.5-1.5a.5.5 0 01.5.5v5a2 2 0 01-2 2H9a.5.5 0 010-1h5a1 1 0 001-1v-5a.5.5 0 01.5-.5z" />
        </svg>
        {loadingUser
          ? "Chargement..."
          : loading
            ? "Envoi en cours..."
            : "Configurez mon téléphone"}
      </button>
    </div>
  )
}
