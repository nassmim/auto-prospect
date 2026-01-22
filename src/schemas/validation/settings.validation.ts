import { z } from "zod";

// Team invitation schema
export const teamInvitationSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide")
    .min(1, "L'email est requis"),
  role: z.enum(["admin", "user"], {
    required_error: "Le rôle est requis",
  }),
});

export type TeamInvitationFormData = z.infer<typeof teamInvitationSchema>;

// Organization settings schema (for future use)
export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de l'organisation est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
});

export type OrganizationSettingsFormData = z.infer<
  typeof organizationSettingsSchema
>;
