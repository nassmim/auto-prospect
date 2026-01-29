"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getWhatsAppPhoneNumber,
  updateWhatsAppPhoneNumber,
  initiateWhatsAppConnection,
  isWhatsAppConnected,
} from "@/actions/whatsapp.actions";

type User = {
  id: string;
  email?: string;
};

export default function WhatsAppTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // WhatsApp state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savedPhoneNumber, setSavedPhoneNumber] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const supabase = createClient();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (user) {
        const phone = await getWhatsAppPhoneNumber(user.id);
        setSavedPhoneNumber(phone);
        setPhoneNumber(phone || "");

        const isConnected = await isWhatsAppConnected(user.id);
        setConnected(isConnected);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setAuthLoading(false);
  };

  // Signup handler
  const handleSignup = async () => {
    setAuthLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Vérifiez votre email pour confirmer l'inscription");
    }
    setAuthLoading(false);
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedPhoneNumber(null);
    setConnected(false);
    setQrCode(null);
  };

  // Save phone number
  const handleSavePhone = async () => {
    if (!user) return;
    setWhatsappLoading(true);
    setError(null);

    const result = await updateWhatsAppPhoneNumber(user.id, phoneNumber);

    if (result.success) {
      setSavedPhoneNumber(result.formattedNumber!);
      setPhoneNumber(result.formattedNumber!);
      setConnected(false);
      setQrCode(null);
    } else {
      setError(result.error || "Erreur lors de la sauvegarde");
    }
    setWhatsappLoading(false);
  };

  // Connect WhatsApp
  const handleConnectWhatsApp = async () => {
    if (!user) return;
    setWhatsappLoading(true);
    setError(null);
    setQrCode(null);

    const result = await initiateWhatsAppConnection(user.id);

    if (result.success) {
      if (result.qrCode) {
        setQrCode(result.qrCode);
      } else {
        setConnected(true);
      }
    } else {
      setError(result.error || "Erreur de connexion WhatsApp");
    }
    setWhatsappLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Configuration WhatsApp
        </h1>
      </div>

      <div className="mx-auto max-w-lg p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!user ? (
          /* Login Card */
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Connexion
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 rounded-lg bg-gray-900 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {authLoading ? "..." : "Se connecter"}
                </button>
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={authLoading}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  S&apos;inscrire
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* WhatsApp Configuration */
          <div className="space-y-4">
            {/* User Header */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{user.email}</span>
              <button onClick={handleLogout} className="hover:text-gray-900">
                Déconnexion
              </button>
            </div>

            {/* Step 1: Phone Number */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    savedPhoneNumber
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-900 text-white"
                  }`}
                >
                  {savedPhoneNumber ? "✓" : "1"}
                </div>
                <h3 className="font-semibold text-gray-900">
                  Numéro WhatsApp
                </h3>
              </div>

              <div className="flex gap-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={whatsappLoading || !phoneNumber}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {savedPhoneNumber ? "Modifier" : "Enregistrer"}
                </button>
              </div>

              {savedPhoneNumber && (
                <p className="mt-3 text-sm text-green-600">
                  ✓ Numéro enregistré : {savedPhoneNumber}
                </p>
              )}
            </div>

            {/* Step 2: Connect WhatsApp */}
            <div
              className={`rounded-xl border bg-white p-5 ${
                savedPhoneNumber
                  ? "border-gray-200"
                  : "border-gray-100 opacity-50"
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    connected
                      ? "bg-green-100 text-green-700"
                      : savedPhoneNumber
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {connected ? "✓" : "2"}
                </div>
                <h3 className="font-semibold text-gray-900">
                  Connexion WhatsApp
                </h3>
              </div>

              {connected ? (
                /* Connected State */
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-700">
                    WhatsApp connecté
                  </span>
                </div>
              ) : savedPhoneNumber ? (
                /* QR Code Flow */
                <>
                  {qrCode ? (
                    <div className="text-center">
                      <p className="mb-4 text-sm text-gray-600">
                        Scannez ce code avec WhatsApp sur votre téléphone
                      </p>
                      <div className="inline-block rounded-xl border-2 border-green-500 p-3">
                        <img
                          src={qrCode}
                          alt="QR Code WhatsApp"
                          className="h-52 w-52"
                        />
                      </div>
                      <p className="mt-4 text-xs text-gray-400">
                        WhatsApp → Paramètres → Appareils connectés → Connecter
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectWhatsApp}
                      disabled={whatsappLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {whatsappLoading ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Génération du QR code...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Connecter WhatsApp
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Enregistrez d&apos;abord votre numéro WhatsApp
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
