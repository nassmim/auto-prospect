import { z } from "zod";

const phoneRegex = /^\d{10,15}$/;

export const connectWhatsappSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Renseigne ton numéro de téléphone")
    .regex(phoneRegex, "Ton numéro n'est pas valide, vérifie le format"),
});

export type ConnectWhatsappInput = z.infer<typeof connectWhatsappSchema>;
