"use client";

import { useState, useTransition } from "react";
import {
  updateOrganizationName,
  updateOrganizationSettings,
  inviteTeamMember,
  removeTeamMember,
  cancelInvitation,
} from "@/actions/organization.actions";
import type { OrganizationSettings } from "@/schema/organization.schema";

type TeamTabProps = {
  organization: {
    id: string;
    name: string;
    ownerId: string;
    settings: OrganizationSettings | null;
    createdAt: Date;
  };
  userRole: "owner" | "admin" | "user";
  initialMembers: any[];
  initialInvitations: any[];
};

/**
 * Team Management Tab
 * Manages organization name, team settings, members, and invitations
 */
export function TeamTab({
  organization,
  userRole,
  initialMembers,
  initialInvitations,
}: TeamTabProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Organization name
  const [orgName, setOrgName] = useState(organization.name);

  // Team settings
  const [allowReassignment, setAllowReassignment] = useState(
    organization.settings?.allowReassignment ?? true,
  );
  const [restrictVisibility, setRestrictVisibility] = useState(
    organization.settings?.restrictVisibility ?? false,
  );

  // Invitation form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");

  // Local state for members and invitations
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);

  const canEdit = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const handleSaveOrgName = () => {
    if (!isOwner) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateOrganizationName(orgName);
        setSuccess("Nom de l'organisation mis à jour");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  };

  const handleSaveSettings = () => {
    if (!canEdit) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateOrganizationSettings({
          allowReassignment,
          restrictVisibility,
        });
        setSuccess("Paramètres mis à jour");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  };

  const handleInvite = () => {
    if (!canEdit) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await inviteTeamMember(inviteEmail, inviteRole);
        setInvitations([
          ...invitations,
          {
            id: result.token,
            email: inviteEmail,
            role: inviteRole,
            createdAt: new Date(),
          },
        ]);
        setInviteEmail("");
        setSuccess("Invitation envoyée");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
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
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (!canEdit) return;

    setError(null);

    startTransition(async () => {
      try {
        await cancelInvitation(invitationId);
        setInvitations(invitations.filter((i) => i.id !== invitationId));
        setSuccess("Invitation annulée");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Organization Name */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Organisation</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Informations générales de votre organisation
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <label
            htmlFor="org-name"
            className="block text-sm font-medium text-zinc-300"
          >
            Nom de l&apos;organisation
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isOwner || isPending}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            />
            {isOwner && (
              <button
                onClick={handleSaveOrgName}
                disabled={isPending || orgName === organization.name}
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
                        {member.account?.firstName} {member.account?.lastName}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {member.account?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        member.role === "owner"
                          ? "bg-amber-500/10 text-amber-500"
                          : member.role === "admin"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {member.role === "owner"
                        ? "Propriétaire"
                        : member.role === "admin"
                          ? "Admin"
                          : "Utilisateur"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {canEdit && member.role !== "owner" && (
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
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="email@exemple.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                disabled={isPending}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={isPending || !inviteEmail}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                Inviter
              </button>
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-2">
                Invitations en attente
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-zinc-300">
                        {invitation.email}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {invitation.role === "admin" ? "Admin" : "Utilisateur"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isPending}
                      className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
