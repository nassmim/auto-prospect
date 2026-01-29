import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Le numéro est requis")
    .refine(
      (val) => isValidPhoneNumber(val.startsWith("+") ? val : `+${val}`),
      { message: "Numéro invalide" }
    ),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
