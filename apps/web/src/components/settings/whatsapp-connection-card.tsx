"use client";

import {
  initiateWhatsAppConnection,
  updateWhatsAppPhoneNumber,
} from "@/actions/whatsapp.actions";
import {
  whatsappPhoneNumberSchema,
  type TWhatsAppPhoneNumberSchema,
} from "@/validation-schemas";
import { getErrorMessage } from "@/utils/error-messages.utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

type WhatsAppConnectionCardProps = {
  accountId: string;
  initialPhoneNumber: string | null;
  initialIsConnected: boolean;
  initialIsDisconnected: boolean;
};

/**
 * WhatsApp Connection Card
 * Handles phone number registration and WhatsApp connection via QR code
 */
export function WhatsAppConnectionCard({
  accountId,
  initialPhoneNumber,
  initialIsConnected,
  initialIsDisconnected,
}: WhatsAppConnectionCardProps) {
  const [error, setError] = useState<string | null>(null);

  // Phone number state
  const [savedPhoneNumber, setSavedPhoneNumber] = useState<string | null>(
    initialPhoneNumber,
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TWhatsAppPhoneNumberSchema>({
    resolver: zodResolver(whatsappPhoneNumberSchema),
    defaultValues: {
      phoneNumber: initialPhoneNumber || "",
    },
  });

  // WhatsApp connection state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(initialIsConnected);
  const [isDisconnected, setIsDisconnected] = useState(initialIsDisconnected);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Save phone number
  const onSubmitPhone = async (data: TWhatsAppPhoneNumberSchema) => {
    setError(null);

    const result = await updateWhatsAppPhoneNumber(
      accountId,
      data.phoneNumber,
    );

    if (result.success) {
      setSavedPhoneNumber(result.formattedNumber!);
      setValue("phoneNumber", result.formattedNumber!);
      setConnected(false);
      setIsDisconnected(false);
      setQrCode(null);
    } else {
      setError(
        result.errorCode
          ? getErrorMessage(result.errorCode)
          : "Erreur lors de la sauvegarde",
      );
    }
  };

  // Connect WhatsApp
  const handleConnectWhatsApp = async () => {
    setConnectionLoading(true);
    setError(null);
    setQrCode(null);

    const result = await initiateWhatsAppConnection(accountId);

    if (result.success) {
      if (result.qrCode) {
        setQrCode(result.qrCode);
      } else {
        setConnected(true);
        setIsDisconnected(false);
      }
    } else {
      setError(
        result.errorCode
          ? getErrorMessage(result.errorCode)
          : "Erreur de connexion WhatsApp",
      );
    }
    setConnectionLoading(false);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
            <svg
              className="h-6 w-6 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100">WhatsApp</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Intégration directe WhatsApp
            </p>
            <div className="mt-2 flex items-center gap-2">
              {connected ? (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
                  Connecté
                </span>
              ) : savedPhoneNumber ? (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  Numéro enregistré
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-zinc-600" />
                  Non configuré
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disconnection Warning Banner */}
      {isDisconnected && savedPhoneNumber && !connected && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-400">
                WhatsApp déconnecté
              </h4>
              <p className="mt-1 text-xs text-amber-300/90">
                Votre session WhatsApp a été déconnectée. Vous devez vous
                reconnecter pour continuer à envoyer des messages. Cliquez sur
                le bouton ci-dessous pour générer un nouveau QR code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Phone Number */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              savedPhoneNumber
                ? "bg-green-500/20 text-green-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {savedPhoneNumber ? "✓" : "1"}
          </div>
          <h4 className="text-sm font-medium text-zinc-200">Numéro WhatsApp</h4>
        </div>

        <div className="ml-10 space-y-3">
          <form onSubmit={handleSubmit(onSubmitPhone)} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="tel"
                  {...register("phoneNumber")}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {errors.phoneNumber && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                {isSubmitting
                  ? "..."
                  : savedPhoneNumber
                    ? "Modifier"
                    : "Enregistrer"}
              </button>
            </div>
          </form>

          {savedPhoneNumber && (
            <p className="text-xs text-green-400">
              ✓ Numéro enregistré : {savedPhoneNumber}
            </p>
          )}
        </div>
      </div>

      {/* Step 2: Connect WhatsApp */}
      <div
        className={`mb-6 ${!savedPhoneNumber ? "opacity-40" : ""}`}
        aria-disabled={!savedPhoneNumber}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              connected
                ? "bg-green-500/20 text-green-400"
                : savedPhoneNumber
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-600"
            }`}
          >
            {connected ? "✓" : "2"}
          </div>
          <h4 className="text-sm font-medium text-zinc-200">
            Connexion WhatsApp
          </h4>
        </div>

        <div className="ml-10">
          {connected ? (
            /* Connected State */
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-400">
                WhatsApp connecté
              </span>
            </div>
          ) : savedPhoneNumber ? (
            /* QR Code Flow */
            <>
              {qrCode ? (
                <div className="text-center">
                  <p className="mb-4 text-xs text-zinc-400">
                    Scannez ce code avec WhatsApp sur votre téléphone
                  </p>
                  <div className="inline-block rounded-lg border-2 border-green-500 p-3">
                    <Image
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      width={200}
                      height={200}
                      className="h-48 w-48"
                    />
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    WhatsApp → Paramètres → Appareils connectés → Connecter
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleConnectWhatsApp}
                  disabled={connectionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {connectionLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                        className="h-4 w-4"
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
            <p className="text-xs text-zinc-500">
              Enregistrez d&apos;abord votre numéro WhatsApp
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-zinc-800/50 p-4">
        <p className="text-xs text-zinc-400">
          <strong className="text-zinc-300">Configuration:</strong> Enregistrez
          votre numéro WhatsApp, puis connectez-vous en scannant le QR code avec
          votre téléphone. La connexion reste active pour l&apos;envoi de
          messages automatiques.
        </p>
      </div>
    </div>
  );
}
