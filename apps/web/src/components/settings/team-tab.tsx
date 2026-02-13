"use client";

import { updateAccountSettings } from "@/actions/account.actions";
import { addTeamMember, removeTeamMember } from "@/actions/team.actions";
import type { TAccount } from "@/schema/account.schema";
import type { TTeamMembersWithAccount } from "@/types/team.types";
import {
  organizationNameSchema,
  teamInvitationSchema,
  type TOrganizationNameFormData,
  type TTeamInvitationFormData,
} from "@/validation-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

type TeamTabProps = {
  account: TAccount;
  userRole: "owner" | "admin" | "user";
  initialMembers: TTeamMembersWithAccount;
};

/**
 * Team Management Tab
 * Manages account name, team settings, and members
 */
export function TeamTab({ account, userRole, initialMembers }: TeamTabProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Organization name form
  const orgNameForm = useForm<TOrganizationNameFormData>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: {
      name: account.name || "",
    },
  });

  const {
    register: registerOrgName,
    handleSubmit: handleSubmitOrgName,
    formState: { errors: orgNameErrors, isSubmitting: isSubmittingOrgName },
  } = orgNameForm;

  // Team invitation form
  const inviteForm = useForm<TTeamInvitationFormData>({
    resolver: zodResolver(teamInvitationSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors, isSubmitting: isSubmittingInvite },
  } = inviteForm;

  // Team settings (non-form state)
  const [allowReassignment, setAllowReassignment] = useState(
    account.settings?.allowReassignment ?? true,
  );
  const [restrictVisibility, setRestrictVisibility] = useState(
    account.settings?.restrictVisibility ?? false,
  );

  // Local state for members
  const [members, setMembers] = useState(initialMembers);

  const canEdit = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const onSubmitOrgName = (data: TOrganizationNameFormData) => {
    if (!isOwner) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        setSuccess("Nom de l'organisation mis à jour");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      }
    });
  };

  const handleSaveSettings = () => {
    if (!canEdit) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateAccountSettings({
          allowReassignment,
          restrictVisibility,
        });
        setSuccess("Paramètres mis à jour");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      }
    });
  };

  const onSubmitInvite = (data: TTeamInvitationFormData) => {
    if (!canEdit) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await addTeamMember(data.email);
        resetInvite();
        setSuccess("Invitation envoyée");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!canEdit) return;

    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;

    setError(null);

    startTransition(async () => {
      try {
        await removeTeamMember(memberId);
        setMembers(members.filter((m) => m.id !== memberId));
        setSuccess("Membre retiré");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* account Name */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Organisation</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Informations générales de votre organisation
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <form onSubmit={handleSubmitOrgName(onSubmitOrgName)}>
            <label
              htmlFor="org-name"
              className="block text-sm font-medium text-zinc-300"
            >
              Nom de l&apos;organisation
            </label>
            <div className="mt-2 flex gap-3">
              <div className="flex-1">
                <input
                  id="org-name"
                  type="text"
                  {...registerOrgName("name")}
                  disabled={!isOwner || isPending}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                />
                {orgNameErrors.name && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {orgNameErrors.name.message}
                  </p>
                )}
              </div>
              {isOwner && (
                <button
                  type="submit"
                  disabled={isPending || isSubmittingOrgName}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              )}
            </div>
            {!isOwner && (
              <p className="mt-2 text-xs text-zinc-500">
                Seul le propriétaire peut modifier le nom de l&apos;organisation
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Team Settings */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Paramètres d&apos;équipe
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configurez les permissions et la visibilité
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-100">
                  Autoriser la réassignation
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Les membres peuvent réassigner des leads à d&apos;autres
                  membres
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={allowReassignment}
                  onChange={(e) => setAllowReassignment(e.target.checked)}
                  disabled={!canEdit || isPending}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:bg-zinc-950 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2 peer-focus:ring-offset-zinc-950 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-100">
                  Restreindre la visibilité
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Les membres ne voient que leurs propres leads
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={restrictVisibility}
                  onChange={(e) => setRestrictVisibility(e.target.checked)}
                  disabled={!canEdit || isPending}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:bg-zinc-950 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2 peer-focus:ring-offset-zinc-950 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSaveSettings}
              disabled={isPending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Membres de l&apos;équipe
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gérez les membres et leurs rôles
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {member.account?.name || member.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {member.account?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300">
                      Membre
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isPending}
                        className="text-sm text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member */}
      {canEdit && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Inviter un membre
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Envoyez une invitation par email
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <form
              onSubmit={handleSubmitInvite(onSubmitInvite)}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="email@exemple.com"
                    {...registerInvite("email")}
                    disabled={isPending}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                  />
                  {inviteErrors.email && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {inviteErrors.email.message}
                    </p>
                  )}
                </div>
                <select
                  {...registerInvite("role")}
                  disabled={isPending}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isPending || isSubmittingInvite}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  Inviter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {(success || error) && (
        <div className="mt-4">
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
