"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PhoneInputField } from "./phone-input";
import { connectWhatsappSchema, type ConnectWhatsappInput } from "@/lib/validations/whatsapp";

export function WhatsappPhoneForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnectWhatsappInput>({
    resolver: zodResolver(connectWhatsappSchema),
    defaultValues: { phoneNumber: "" },
  });

  const onSubmit = async (data: ConnectWhatsappInput) => {
    try {
      const response = await fetch("/api/account-sync/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Une erreur est survenue");
        return;
      }

      toast.success("Ton numéro a bien été enregistré");
    } catch {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="phoneNumber"
        control={control}
        render={({ field }) => (
          <PhoneInputField
            label="Numéro WhatsApp"
            value={field.value}
            onChange={field.onChange}
            error={errors.phoneNumber?.message}
          />
        )}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-800 px-6 py-2 text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        {isSubmitting ? "Enregistrement..." : "Sauvegarder"}
      </button>
    </form>
  );
}
