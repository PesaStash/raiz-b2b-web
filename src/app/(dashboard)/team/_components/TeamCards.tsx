"use client";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  RoleBadge,
  StatusBadge,
  TeamIcon,
  teamAvatar,
} from "@/components/team/TeamUI";
import { isInvitationExpired, personName } from "@/lib/team";
import type { TeamMember, TeamInvitation } from "@/types/team";
import type { TeamAction } from "./TeamActionDialog";
const card = "border bg-white rounded-2xl p-4 text-xs";
export function dateLabel(value?: string) {
  return value ? format(new Date(value), "d MMM yyyy") : "—";
}
export function InvitationTiming({
  invitation,
  stacked = false,
}: {
  invitation: TeamInvitation;
  stacked?: boolean;
}) {
  const expired = isInvitationExpired(invitation);
  const when = `${format(new Date(invitation.expires_at), "MMM d, yyyy 'at' h:mm a")} · ${formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}`;
  if (stacked)
    return (
      <div>
        <p className="font-monzo text-sm leading-normal text-raiz-gray-950">
          Sent{" "}
          {invitation.sent_at
            ? format(new Date(invitation.sent_at), "MMM d, yyyy")
            : "—"}
        </p>
        <p className="font-monzo text-[11px] leading-[1.3] text-raiz-gray-600">
          Expires {when}
        </p>
      </div>
    );
  return (
    <div className="text-[11px] leading-relaxed">
      <span className={expired ? "text-red-600" : "text-raiz-gray-600"}>
        {expired ? "Expired" : "Expires"} {when}
      </span>
    </div>
  );
}
export function MemberAvatar({ member }: { member: TeamMember }) {
  return (
    <span className={teamAvatar} aria-hidden>
      {member.selfie_image ? (
        <img
          src={member.selfie_image}
          alt=""
          className="size-10 object-cover rounded-full"
        />
      ) : (
        <>
          <span className="md:hidden">
            {member.first_name[0]}
            {member.last_name[0]}
          </span>
          <span className="hidden md:block">
            <TeamIcon name="person" />
          </span>
        </>
      )}
    </span>
  );
}
export function MemberCard({
  member,
  detail = false,
}: {
  member: TeamMember;
  detail?: boolean;
}) {
  return (
    <article className={`${card} border-raiz-gray-200`}>
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold break-words">
            {personName(member)}
          </h3>
          <p className="text-[10px] text-raiz-gray-600 break-all mt-0.5">
            {member.email}
          </p>
        </div>
        {member.role === "owner" ? (
          <span title="The owner cannot be changed">
            <TeamIcon name="lock-mobile" />
          </span>
        ) : (
          !detail && (
            <Link
              className="p-1"
              href={`/team/members/${encodeURIComponent(member.id)}`}
              aria-label={`Manage ${personName(member)}`}
            >
              <TeamIcon name="more" />
            </Link>
          )
        )}
      </div>
      <div className="flex justify-between items-center mt-4">
        <span className="flex items-center gap-2 text-[11px] text-raiz-gray-500">
          Role <RoleBadge role={member.role} />
        </span>
        <StatusBadge status={member.active ? "Active" : "Deactivated"} />
      </div>
    </article>
  );
}
export function InvitationCard({
  invitation,
  onAction,
  detail = false,
}: {
  invitation: TeamInvitation;
  onAction: (action: TeamAction) => void;
  detail?: boolean;
}) {
  const expired = isInvitationExpired(invitation);
  return (
    <article
      className={`${card} ${expired ? "border-[#df1000]" : "border-raiz-gray-200"}`}
    >
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold">
            {detail ? (
              personName(invitation)
            ) : (
              <Link
                href={`/team/invitations/${encodeURIComponent(invitation.id)}`}
              >
                {personName(invitation)}
              </Link>
            )}
          </h3>
          <p className="text-[10px] text-raiz-gray-600 break-all mt-1">
            {invitation.email}
          </p>
        </div>
        <span>
          <StatusBadge status={expired ? "Expired" : "Pending"} />
        </span>
      </div>
      <div className="flex justify-between text-[11px] my-3 gap-2">
        <strong className="capitalize">{invitation.role}</strong>
        <span className="text-raiz-gray-600">
          Sent {dateLabel(invitation.sent_at)}
        </span>
      </div>
      <InvitationTiming invitation={invitation} />
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onAction({ kind: "resend", invitation })}
          className={`flex-1 h-10 rounded-full font-bold border ${expired ? "bg-[#3c2875] text-white border-[#3c2875]" : "border-[#d0c5de]"}`}
        >
          Resend
        </button>
        <button
          className="flex-1 text-primary font-bold"
          onClick={() => onAction({ kind: "revoke", invitation })}
        >
          Revoke
        </button>
      </div>
    </article>
  );
}
