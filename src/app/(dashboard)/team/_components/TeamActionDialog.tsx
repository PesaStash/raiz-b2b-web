"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TeamButton,
  TeamDialog,
  TeamError,
  TeamIcon,
  confirmIcon,
  teamConfirm,
} from "@/components/team/TeamUI";
import {
  resendInvitation,
  revokeInvitation,
  updateMember,
} from "@/services/team";
import { personName } from "@/lib/team";
import { readApiError } from "@/lib/apiError";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { TeamMember, TeamInvitation } from "@/types/team";
export type TeamAction =
  | {
      kind: "admin" | "developer" | "deactivate" | "reactivate";
      member: TeamMember;
    }
  | { kind: "resend" | "revoke"; invitation: TeamInvitation };
export default function TeamActionDialog({
  action,
  close,
  onDone,
}: {
  action: TeamAction;
  close: () => void;
  onDone?: () => void;
}) {
  const client = useQueryClient();
  const { canManageTeam } = usePermissions();
  const [key] = useState(() => crypto.randomUUID());
  const member = "member" in action ? action.member : null;
  const name = member
    ? personName(member)
    : "invitation" in action
      ? personName(action.invitation)
      : "";
  const copy = {
    admin: {
      title: `Change ${name} to Admin?`,
      body: "They will be able to perform transactions and manage business settings. They will not be able to manage team members.",
      button: "Change to Admin",
    },
    developer: {
      title: `Change ${name} to Developer?`,
      body: "They will no longer be able to perform transactions or change business settings. This takes effect immediately.",
      button: "Change to Developer",
    },
    deactivate: {
      title: `Deactivate ${name}'s access?`,
      body: "They will be signed out when the app next checks their session and will not be able to access this business. Their history will be preserved.",
      button: "Deactivate access",
    },
    reactivate: {
      title: `Reactivate ${name}'s access?`,
      body: "They can sign in again using their existing email and password.",
      button: "Reactivate access",
    },
    resend: {
      title: `Send a new invitation to ${"invitation" in action ? action.invitation.email : ""}?`,
      body: "Their previous link will stop working. The new link will be valid for 24 hours.",
      button: "Send new invitation",
    },
    revoke: {
      title: "Revoke this invitation?",
      body: `${name} will no longer be able to use the invitation link. You can invite them again later.`,
      button: "Revoke invitation",
    },
  }[action.kind];
  const mutation = useMutation({
    mutationFn: async () => {
      if (!canManageTeam || member?.role === "owner")
        throw new Error("Only the owner can change other team members.");
      if ("invitation" in action)
        return action.kind === "resend"
          ? resendInvitation(action.invitation.id, key)
          : revokeInvitation(action.invitation.id);
      return updateMember(
        action.member.id,
        action.kind === "admin" || action.kind === "developer"
          ? { role: action.kind }
          : { active: action.kind === "reactivate" },
      );
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["team"] });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team access updated");
      close();
      onDone?.();
    },
  });
  if (!canManageTeam) return null;
  const danger = action.kind === "deactivate" || action.kind === "revoke";
  return (
    <TeamDialog title={copy.title} close={close} pending={mutation.isPending}>
      <div className={teamConfirm}>
        <div className={confirmIcon(danger)}>
          <TeamIcon name={action.kind} />
        </div>
        <h2 className="font-bold text-lg md:text-xl leading-[1.35]">
          {copy.title}
        </h2>
        <p className="text-[13px] leading-normal">{copy.body}</p>
        {mutation.isError && (
          <TeamError>
            {readApiError(mutation.error).message ??
              "We couldn't update access. Please try again."}
          </TeamError>
        )}
        <div className="grid gap-4 w-full">
          <TeamButton
            tone={danger ? "danger" : "primary"}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {copy.button}
          </TeamButton>
          <TeamButton
            tone="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </TeamButton>
        </div>
      </div>
    </TeamDialog>
  );
}
