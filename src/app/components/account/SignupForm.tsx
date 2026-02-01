"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"

export default function SignupForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || "Impossible de créer l'utilisateur")
      } else {
        toast.success("Utilisateur créé — vous pouvez vous connecter")
        setName("")
        setEmail("")
        setPassword("")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur réseau lors de la création de l'utilisateur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        required
        placeholder="Nom"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-3 py-2 rounded-md border"
        aria-label="Nom"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-3 py-2 rounded-md border"
        aria-label="Email"
      />
      <input
        required
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-3 py-2 rounded-md border"
        aria-label="Mot de passe"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer un compte"}
      </button>
    </form>
  )
}
