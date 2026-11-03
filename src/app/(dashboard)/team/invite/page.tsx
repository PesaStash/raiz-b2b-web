"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeamIcon, teamPage } from "@/components/team/TeamUI";
import InviteMemberForm from "../_components/InviteMemberForm";
export default function InvitePage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const close = () => router.push("/team");
  return (
    <section className={`${teamPage} max-w-lg mx-auto`}>
      <div className="flex md:hidden items-center justify-between gap-2.5 min-h-[68px] py-3">
        <button
          disabled={pending}
          onClick={close}
          className="flex items-center gap-3"
        >
          <TeamIcon name="back" />
          <h1 className="text-lg font-bold leading-[1.35]">
            Invite team member
          </h1>
        </button>
      </div>
      <InviteMemberForm close={close} onPending={setPending} />
    </section>
  );
}
