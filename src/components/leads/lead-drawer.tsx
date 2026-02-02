"use client";

import {
  addLeadNote,
  addLeadReminder,
  assignLead,
  deleteLeadReminder,
  getDefaultWhatsAppTemplate,
  getLeadDetails,
  getteamMembers,
  logWhatsAppMessage,
  updateLeadStage,
} from "@/actions/lead.actions";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { leadStages, type LeadStage } from "@/schema/lead.schema";
import {
  extractLeadVariables,
  generateWhatsAppLink,
  renderTemplate,
} from "@/services/message.service";
import {
  leadNoteSchema,
  leadReminderSchema,
  type LeadNoteFormData,
  type LeadReminderFormData,
} from "@/validation-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

type LeadDrawerProps = {
  leadId: string | null;
  onClose: () => void;
};

type LeadDetails = Awaited<ReturnType<typeof getLeadDetails>>;
type OrgMember = Awaited<ReturnType<typeof getteamMembers>>[number];

const STAGE_LABELS: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relance",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

const STAGE_COLORS: Record<LeadStage, string> = {
  nouveau: "#3b82f6", // blue
  contacte: "#8b5cf6", // purple
  relance: "#f59e0b", // amber
  negociation: "#10b981", // green
  gagne: "#22c55e", // bright green
  perdu: "#ef4444", // red
};

export function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [, startTransition] = useTransition();

  // Notes form
  const noteForm = useForm<LeadNoteFormData>({
    resolver: zodResolver(leadNoteSchema),
    defaultValues: {
      content: "",
    },
  });

  // Reminders form
  const reminderForm = useForm<LeadReminderFormData>({
    resolver: zodResolver(leadReminderSchema),
    defaultValues: {
      dueAt: new Date(),
      note: "",
    },
  });

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const [data, members] = await Promise.all([
          getLeadDetails(leadId),
          getteamMembers(leadId),
        ]);
        setLead(data);
        setOrgMembers(members);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setIsLoading(false);
      }
    });
  }, [leadId]);

  const handleStageChange = async (newStage: string | null) => {
    if (!lead || !newStage) return;

    const previousStage = lead.stage;
    // Optimistic update
    setLead({ ...lead, stage: newStage });

    try {
      await updateLeadStage(lead.id, newStage as LeadStage);
    } catch (err) {
      // Revert on error
      setLead({ ...lead, stage: previousStage });
      console.error("Failed to update stage:", err);
    }
  };

  const handleAssignmentChange = async (userId: string | null) => {
    if (!lead) return;

    const previousAssignee = lead.assignedTo;
    // Optimistic update
    const newAssignee = userId ? orgMembers.find((m) => m.id === userId) : null;
    setLead({
      ...lead,
      assignedTo: newAssignee
        ? { id: newAssignee.id, name: newAssignee.name }
        : null,
    });

    try {
      await assignLead(lead.id, userId);
    } catch (err) {
      // Revert on error
      setLead({ ...lead, assignedTo: previousAssignee });
      console.error("Failed to update assignment:", err);
    }
  };

  const handleWhatsAppClick = async () => {
    if (!lead || !lead.ad.phoneNumber || isSendingWhatsApp) return;

    setIsSendingWhatsApp(true);

    try {
      // Get default WhatsApp template
      const template = await getDefaultWhatsAppTemplate(lead.id);

      // Extract variables from lead data
      const variables = extractLeadVariables(lead);

      // Render template or use default message
      const defaultMessage = `Bonjour, je suis intéressé par votre annonce "${lead.ad.title}".`;
      const renderedMessage = template
        ? renderTemplate(template.content || defaultMessage, variables)
        : defaultMessage;

      // Generate WhatsApp link
      const whatsappUrl = generateWhatsAppLink(
        lead.ad.phoneNumber,
        renderedMessage,
      );

      // Log the message attempt
      await logWhatsAppMessage(lead.id, renderedMessage, template?.id);

      // Open WhatsApp in new tab
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
      alert("Erreur lors de l'envoi du message WhatsApp");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleAddNote = async (data: LeadNoteFormData) => {
    if (!lead) return;

    try {
      await addLeadNote(lead.id, data.content);

      // Reload lead details to get updated notes
      const updatedLead = await getLeadDetails(lead.id);
      setLead(updatedLead);

      // Reset form
      noteForm.reset();
    } catch (err) {
      noteForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to add note",
      });
    }
  };

  const handleAddReminder = async (data: LeadReminderFormData) => {
    if (!lead) return;

    try {
      await addLeadReminder(lead.id, data.dueAt, data.note);

      // Reload lead details to get updated reminders
      const updatedLead = await getLeadDetails(lead.id);
      setLead(updatedLead);

      // Reset form
      reminderForm.reset();
    } catch (err) {
      reminderForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to add reminder",
      });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!lead) return;

    try {
      await deleteLeadReminder(reminderId);

      // Optimistic update - remove from UI
      setLead({
        ...lead,
        reminders: lead.reminders.filter((r) => r.id !== reminderId),
      });
    } catch (err) {
      console.error("Failed to delete reminder:", err);
      // Reload on error
      const updatedLead = await getLeadDetails(lead.id);
      setLead(updatedLead);
    }
  };

  if (!leadId) return null;

  // Parse pictures array from ad
  // Note: The pictures might be stored in a different field. For now, using just the main picture.
  const images = lead?.ad.picture ? [lead.ad.picture] : [];

  const hasImages = images.length > 0;

  return (
    <>
      {/* Backdrop with sophisticated fade */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          leadId ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-2xl transform bg-zinc-950 shadow-2xl transition-transform duration-500 ease-out ${
          leadId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header bar with close button */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/95 px-6 py-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-zinc-100">
            Détails du lead
          </h2>
          <button
            onClick={onClose}
            className="group rounded-lg p-2 transition-colors hover:bg-zinc-900"
            aria-label="Fermer"
          >
            <svg
              className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Scrollable content */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-500" />
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center px-6">
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {lead && !isLoading && (
            <div className="space-y-6 p-6">
              {/* Image Gallery */}
              {hasImages && (
                <section className="space-y-3">
                  {/* Main Image */}
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900">
                    <Image
                      src={images[selectedImageIndex]}
                      alt={lead.ad.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />

                    {/* Image counter overlay */}
                    <div className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                            idx === selectedImageIndex
                              ? "border-amber-500 ring-2 ring-amber-500/20"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Title and Basic Info */}
              <section className="space-y-3">
                <h3 className="text-xl font-semibold leading-tight text-zinc-100">
                  {lead.ad.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">
                      {lead.ad.price?.toLocaleString("fr-FR")} €
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {lead.ad.location.name} ({lead.ad.location.zipcode})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Publié{" "}
                      {formatDistance(
                        new Date(lead.ad.lastPublicationDate),
                        new Date(),
                        { addSuffix: true, locale: fr },
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* Stage and Assignment Selectors */}
              <section className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Statut"
                  value={lead.stage}
                  onChange={handleStageChange}
                  options={leadStages.map((stage) => ({
                    value: stage,
                    label: STAGE_LABELS[stage],
                    color: STAGE_COLORS[stage],
                  }))}
                  placeholder="Sélectionner un statut"
                />

                <Dropdown
                  label="Assigné à"
                  value={lead.assignedTo?.id || null}
                  onChange={handleAssignmentChange}
                  options={orgMembers.map((member) => ({
                    value: member.id,
                    label: member.name,
                  }))}
                  placeholder="Non assigné"
                  allowNull
                  nullLabel="Non assigné"
                />
              </section>

              {/* Quick Actions */}
              <section className="grid grid-cols-2 gap-3">
                {/* WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  disabled={!lead.ad.phoneNumber || isSendingWhatsApp}
                  className={`group flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition-all ${
                    !lead.ad.phoneNumber
                      ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600"
                      : "border-green-900/50 bg-green-950/30 text-green-400 hover:border-green-800 hover:bg-green-900/40"
                  }`}
                  title={
                    !lead.ad.phoneNumber
                      ? "Numéro de téléphone non disponible"
                      : ""
                  }
                >
                  {isSendingWhatsApp ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  )}
                  <span>WhatsApp</span>
                </button>

                {/* SMS Button (Placeholder) */}
                <button
                  type="button"
                  disabled
                  className="group flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-600 transition-all"
                  title="Nécessite des crédits SMS"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span>SMS</span>
                </button>

                {/* Voice Button (Placeholder) */}
                <button
                  type="button"
                  disabled
                  className="group flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-600 transition-all"
                  title="Nécessite des crédits Voice"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>Voice</span>
                </button>

                {/* Platform Link Button */}
                {lead.ad.url && (
                  <a
                    href={lead.ad.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3 font-medium text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>Voir l&apos;annonce</span>
                  </a>
                )}
              </section>

              {/* Vehicle Specs Grid */}
              {(lead.ad.brand ||
                lead.ad.fuel ||
                lead.ad.gearBox ||
                lead.ad.modelYear) && (
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    Caractéristiques
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {lead.ad.brand && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Marque</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.brand.name}
                        </div>
                      </div>
                    )}
                    {lead.ad.model && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Modèle</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.model}
                        </div>
                      </div>
                    )}
                    {lead.ad.modelYear && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Année</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.modelYear}
                        </div>
                      </div>
                    )}
                    {lead.ad.mileage && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Kilométrage</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.mileage.toLocaleString("fr-FR")} km
                        </div>
                      </div>
                    )}
                    {lead.ad.fuel && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Carburant</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.fuel.name}
                        </div>
                      </div>
                    )}
                    {lead.ad.gearBox && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Boîte</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.gearBox.name}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Seller Info */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Vendeur
                </h4>
                <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-200">
                        {lead.ad.ownerName}
                      </div>
                      {lead.ad.phoneNumber && (
                        <div className="mt-1 text-sm text-zinc-400">
                          {lead.ad.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        lead.ad.acceptSalesmen
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {lead.ad.acceptSalesmen ? "Pro" : "Particulier"}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes Section */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Notes
                </h4>

                {/* Add Note Form */}
                <Form {...noteForm}>
                  <form
                    onSubmit={noteForm.handleSubmit(handleAddNote)}
                    className="space-y-2"
                  >
                    <FormField
                      control={noteForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <textarea
                              {...field}
                              placeholder="Ajouter une note..."
                              rows={3}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {noteForm.formState.errors.root && (
                      <p className="text-xs text-red-400">
                        {noteForm.formState.errors.root.message}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={noteForm.formState.isSubmitting}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {noteForm.formState.isSubmitting
                        ? "Enregistrement..."
                        : "Sauvegarder"}
                    </button>
                  </form>
                </Form>

                {/* Notes List */}
                {lead.notes && lead.notes.length > 0 && (
                  <div className="space-y-2">
                    {lead.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3"
                      >
                        <p className="text-sm text-zinc-300">{note.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                          <span>{note.createdBy.name}</span>
                          <span>•</span>
                          <span>
                            {formatDistance(
                              new Date(note.createdAt),
                              new Date(),
                              { addSuffix: true, locale: fr },
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Reminders Section */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Rappels
                </h4>

                {/* Add Reminder Form */}
                <Form {...reminderForm}>
                  <form
                    onSubmit={reminderForm.handleSubmit(handleAddReminder)}
                    className="space-y-2"
                  >
                    <FormField
                      control={reminderForm.control}
                      name="dueAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-400">
                            Date et heure
                          </FormLabel>
                          <FormControl>
                            <input
                              type="datetime-local"
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(new Date(e.target.value))
                              }
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={reminderForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-400">
                            Note (optionnel)
                          </FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              placeholder="Note pour le rappel..."
                              rows={2}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {reminderForm.formState.errors.root && (
                      <p className="text-xs text-red-400">
                        {reminderForm.formState.errors.root.message}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={reminderForm.formState.isSubmitting}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reminderForm.formState.isSubmitting
                        ? "Ajout..."
                        : "Ajouter"}
                    </button>
                  </form>
                </Form>

                {/* Reminders List */}
                {lead.reminders && lead.reminders.length > 0 && (
                  <div className="space-y-2">
                    {lead.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-start justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                            <svg
                              className="h-4 w-4 text-amber-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {format(
                                new Date(reminder.dueAt),
                                "dd MMM yyyy, HH:mm",
                                { locale: fr },
                              )}
                            </span>
                          </div>
                          {reminder.note && (
                            <p className="mt-1 text-sm text-zinc-400">
                              {reminder.note}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDistance(
                              new Date(reminder.dueAt),
                              new Date(),
                              { addSuffix: true, locale: fr },
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="ml-2 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                          aria-label="Supprimer le rappel"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* View Full Details Button */}
              <a
                href={`/leads/${lead.id}`}
                className="block w-full rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-center font-medium text-amber-400 transition-all hover:border-amber-800 hover:bg-amber-900/40"
              >
                Voir détails complets
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
