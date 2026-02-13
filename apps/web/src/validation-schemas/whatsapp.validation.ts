import z from "zod";

export const whatsappPhoneNumberSchema = z.object({
  phoneNumber: z.string().min(1, "Le numéro de téléphone est requis"),
});

export type TWhatsAppPhoneNumberSchema = z.infer<
  typeof whatsappPhoneNumberSchema
>;

export const sendWhatsAppTextMessageSchema = z.object({
  recipientPhone: z.string().min(1, "Le numéro du destinataire est requis"),
  senderPhone: z.string().min(1, "Le numéro de l'expéditeur est requis"),
  adTitle: z.string().min(1, "Le titre de l'annonce est requis"),
  message: z.string().min(1, "Le message est requis"),
});

export type TSendWhatsAppTextMessageSchema = z.infer<
  typeof sendWhatsAppTextMessageSchema
>;
