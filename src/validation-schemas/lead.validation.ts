import { z } from "zod";

// Lead note validation
export const leadNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu de la note est requis")
    .max(5000, "La note ne peut pas dépasser 5000 caractères"),
});

export type TLeadNoteFormData = z.infer<typeof leadNoteSchema>;

// Lead reminder validation
export const leadReminderSchema = z.object({
  dueAt: z.coerce
    .date()
    .refine((date) => date > new Date(), "La date doit être dans le futur"),
  note: z
    .string()
    .max(1000, "La note ne peut pas dépasser 1000 caractères")
    .optional(),
});

export type TLeadReminderFormData = z.infer<typeof leadReminderSchema>;
