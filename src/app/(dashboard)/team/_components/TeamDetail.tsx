"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTeam } from "@/lib/hooks/useTeam";
import { TeamError, TeamIcon, teamPage } from "@/components/team/TeamUI";
import { personName } from "@/lib/team";
import { MemberCard, InvitationCard } from "./TeamCards";
import TeamActionDialog, { TeamAction } from "./TeamActionDialog";
export default function TeamDetail({
  id,
  type,
}: {
  id: string;
  type: "member" | "invitation";
}) {
  const team = useTeam();
  const router = useRouter();
  const [action, setAction] = useState<TeamAction | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  const member = team.data?.members.find((m) => m.id === id);
  const invitation = team.data?.pending_invitations.find((i) => i.id === id);
  const title =
    type === "member" && member ? personName(member) : "Pending invitation";
  return (
    <section className={`${teamPage} max-w-xl mx-auto`}>
      <div className="flex items-center gap-3 py-5">
        <Link href="/team" aria-label="Back to Team members">
          <TeamIcon name="back" />
        </Link>
        <h1 className="text-[23px] font-bold leading-[1.35]">{title}</h1>
      </div>
      {team.isPending ? (
        <p role="status">Loading…</p>
      ) : team.isError ? (
        <TeamError retry={() => void team.refetch()}>
          We couldn&apos;t load this record.
        </TeamError>
      ) : type === "member" && member ? (
        <>
          <MemberCard member={member} detail />
          {member.role !== "owner" && (
            <div className="p-5 bg-white border border-raiz-gray-200 rounded-2xl mt-5 grid gap-4">
              <h2 className="text-[10px] uppercase tracking-widest text-raiz-gray-500">
                Member actions
              </h2>
              <button
                className="flex items-center gap-3 text-sm py-2 border-b pb-5 text-left"
                onClick={() =>
                  setAction({
                    kind: member.role === "admin" ? "developer" : "admin",
                    member,
                  })
                }
              >
                <TeamIcon
                  name={member.role === "admin" ? "developer" : "admin"}
                />
                Change role
              </button>
              <button
                className="flex items-center gap-3 text-sm py-2 text-left"
                onClick={() =>
                  setAction({
                    kind: member.active ? "deactivate" : "reactivate",
                    member,
                  })
                }
              >
                <TeamIcon name={member.active ? "deactivate" : "reactivate"} />
                {member.active ? "Deactivate" : "Reactivate"} access
              </button>
            </div>
          )}
        </>
      ) : type === "invitation" && invitation ? (
        <InvitationCard invitation={invitation} onAction={setAction} detail />
      ) : (
        <p className="py-6">
          This record is no longer available.{" "}
          <Link className="underline" href="/team">
            Back to Team members
          </Link>
        </p>
      )}
      {action && (
        <TeamActionDialog
          action={action}
          close={() => setAction(null)}
          onDone={() => {
            if (action.kind === "revoke") router.push("/team");
          }}
        />
      )}
    </section>
  );
}
