import { ELeadStage } from "@auto-prospect/shared/src/config/lead.config";
import { z } from "zod";

// Lead note validation
export const leadNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu de la note est requis")
    .max(5000, "La note ne peut pas dépasser 5000 caractères"),
});

export type TLeadNoteFormData = z.infer<typeof leadNoteSchema>;

// Lead reminder validation (server-side with coercion)
export const leadReminderSchema = z.object({
  dueAt: z.coerce
    .date()
    .refine((date) => date > new Date(), "La date doit être dans le futur"),
  note: z
    .string()
    .max(1000, "La note ne peut pas dépasser 1000 caractères")
    .optional(),
});

// Lead reminder form data (client-side, no coercion needed)
export const leadReminderFormSchema = z.object({
  dueAt: z
    .date()
    .refine((date) => date > new Date(), "La date doit être dans le futur"),
  note: z
    .string()
    .max(1000, "La note ne peut pas dépasser 1000 caractères")
    .optional(),
});

export type TLeadReminderFormData = z.infer<typeof leadReminderFormSchema>;

// Lead filters validation (for query params)
export const leadFiltersSchema = z.object({
  hunt: z.string().optional(),
  assigned: z.string().optional(),
  q: z.string().max(500, "La recherche ne peut pas dépasser 500 caractères").optional(),
});

export type TLeadFilters = z.infer<typeof leadFiltersSchema>;

// Bulk update leads validation
export const bulkUpdateLeadsSchema = z.object({
  leadIds: z
    .array(z.string().uuid("ID de lead invalide"))
    .min(1, "Au moins un lead doit être sélectionné")
    .max(1000, "Impossible de mettre à jour plus de 1000 leads à la fois"),
  updates: z.object({
    stage: z.nativeEnum(ELeadStage).optional(),
    assignedToId: z.string().uuid("ID d'assignation invalide").nullable().optional(),
  }),
});

export type TBulkUpdateLeads = z.infer<typeof bulkUpdateLeadsSchema>;
