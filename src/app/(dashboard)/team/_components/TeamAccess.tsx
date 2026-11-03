"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { TeamError, teamSurface } from "@/components/team/TeamUI";
export default function TeamAccess({ children }: { children: ReactNode }) {
  const { error, refetch } = useUser();
  const { ready, canManageTeam } = usePermissions();
  if (!ready)
    return (
      <div className={`${teamSurface} py-10`}>
        {error ? (
          <TeamError retry={() => void refetch()}>
            We couldn&apos;t check your access.
          </TeamError>
        ) : (
          <p role="status">Checking your access…</p>
        )}
      </div>
    );
  if (!canManageTeam)
    return (
      <section className={`${teamSurface} py-12`}>
        <h1 className="text-xl font-bold">
          Team access is managed by the owner
        </h1>
        <p className="mt-3 text-sm">
          Contact your business owner to invite someone or change a role.
        </p>
        <Link href="/" className="mt-6 inline-block underline">
          Back to dashboard
        </Link>
      </section>
    );
  return children;
}
