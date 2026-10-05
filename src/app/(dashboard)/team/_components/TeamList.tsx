"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { LiaTimesSolid } from "react-icons/lia";
import DateRange from "../../transactions/_components/DateRange";
import { useTeam } from "@/lib/hooks/useTeam";
import {
  TeamButton,
  TeamDialog,
  TeamError,
  TeamIcon,
  StatusBadge,
  teamAvatar,
  teamPage,
} from "@/components/team/TeamUI";
import { isInvitationExpired, personName } from "@/lib/team";
import TeamActionDialog, { TeamAction } from "./TeamActionDialog";
import InviteMemberForm from "./InviteMemberForm";
import {
  dateLabel,
  InvitationCard,
  InvitationTiming,
  MemberAvatar,
  MemberCard,
} from "./TeamCards";
import type { TeamMember, TeamInvitation } from "@/types/team";

const panel =
  "mt-[22px] md:mt-10 md:bg-raiz-gray-50 md:rounded-[20px] md:p-8 md:max-[1200px]:px-3.5 md:max-[1200px]:py-5";
const panelHeader =
  "flex flex-wrap items-center justify-between gap-4 mb-4 md:mb-6";
const panelTitle =
  "flex items-center gap-2 font-bold text-[10px] uppercase tracking-[1px] text-[#8f829e] md:text-lg md:leading-[1.2] md:normal-case md:tracking-normal md:text-[#101828]";
const countBadge =
  "text-[10px] font-bold md:px-2 md:py-[3px] md:rounded-full md:bg-[#f6f1fc] md:text-primary2";
const empty = "flex flex-col items-center text-center gap-5";
const emptyTitle = "text-sm font-semibold tracking-[-0.28px]";
const emptyBody = "max-w-[368px] text-[13px] leading-[17px] tracking-[-0.26px]";
const table =
  "w-full border-collapse font-brSonoma text-sm leading-5 text-raiz-gray-700";
const th =
  "bg-[#f8f7fa] border-b border-[#eaecf0] font-monzo text-[13px] font-normal leading-normal text-left px-6 py-3 first:rounded-tl-lg last:rounded-tr-lg max-[1200px]:px-3";
const td =
  "px-6 py-4 h-[72px] border-b border-[#eaecf0] align-middle max-[1200px]:px-3";
const tbody = "[&>tr:last-child>td]:border-b-0";
const menuItem =
  "block w-full p-2.5 text-left rounded-lg text-[13px] hover:bg-[#f8f7fa]";
const filterButton =
  "border border-raiz-gray-200 bg-white px-3.5 py-2.5 rounded-lg flex items-center gap-1 text-sm font-bold text-raiz-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)]";
const filterLabel = "grid gap-1.5 text-xs";
const filterInput = "p-2 bg-white border border-raiz-gray-200 rounded-lg";

type Filters = { role: string; status: string; from: string; to: string };
const blankFilters: Filters = { role: "", status: "", from: "", to: "" };
function matches(record: TeamMember | TeamInvitation, filters: Filters) {
  const status =
    "active" in record
      ? record.active
        ? "Active"
        : "Deactivated"
      : isInvitationExpired(record)
        ? "Expired"
        : "Pending";
  const date = "active" in record ? record.created_at : record.sent_at;
  const time = date ? new Date(date).getTime() : NaN;
  return (
    (!filters.role || record.role === filters.role) &&
    (!filters.status || status === filters.status) &&
    (!filters.from || time >= new Date(filters.from + "T00:00:00").getTime()) &&
    (!filters.to || time <= new Date(filters.to + "T23:59:59.999").getTime())
  );
}
function FiltersPanel({
  value,
  change,
  invitation,
}: {
  value: Filters;
  change: (value: Filters) => void;
  invitation?: boolean;
}) {
  const [showDates, setShowDates] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const datesLabel =
    value.from && value.to
      ? `${format(new Date(`${value.from}T00:00:00`), "dd MMM")} - ${format(new Date(`${value.to}T00:00:00`), "dd MMM")}`
      : "Select dates";
  return (
    <>
      <div className="hidden md:flex gap-3 items-center">
        {/* <div className="relative">
          <button
            type="button"
            className={filterButton}
            aria-expanded={showDates}
            onClick={() => {
              setShowFilters(false);
              setShowDates((open) => !open);
            }}
          >
            <TeamIcon name="calendar" />
            {datesLabel}
          </button>
          {showDates && (
            <DateRange
              onApply={(range) =>
                change({
                  ...value,
                  from: range.startDate
                    ? format(range.startDate, "yyyy-MM-dd")
                    : "",
                  to: range.endDate ? format(range.endDate, "yyyy-MM-dd") : "",
                })
              }
              onClose={() => setShowDates(false)}
            />
          )}
        </div> */}
        {/* {value.from && (
          <button
            type="button"
            aria-label="Clear dates"
            onClick={() => change({ ...value, from: "", to: "" })}
            className="flex items-center justify-center size-10 rounded-lg border border-raiz-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
          >
            <LiaTimesSolid />
          </button>
        )} */}
        {/* <button
          type="button"
          className={filterButton}
          aria-expanded={showFilters}
          onClick={() => {
            setShowDates(false);
            setShowFilters((open) => !open);
          }}
        >
          <TeamIcon name="filter" />
          Apply filter{value.role || value.status ? " •" : ""}
        </button> */}
      </div>
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 w-full p-4 mb-5 bg-[#f8f7fa] rounded-xl">
          <label className={filterLabel}>
            Role
            <select
              className={filterInput}
              value={value.role}
              onChange={(e) => change({ ...value, role: e.target.value })}
            >
              <option value="">All roles</option>
              {!invitation && <option value="owner">Owner</option>}
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </select>
          </label>
          <label className={filterLabel}>
            Status
            <select
              className={filterInput}
              value={value.status}
              onChange={(e) => change({ ...value, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {(invitation
                ? ["Pending", "Expired"]
                : ["Active", "Deactivated"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => change({ ...blankFilters, from: value.from, to: value.to })}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
function RowMenu({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        className="list-none cursor-pointer p-1 rounded-md [&::-webkit-details-marker]:hidden"
      >
        <TeamIcon name="more" />
      </summary>
      <div
        className="absolute top-full right-0 z-20 min-w-[195px] p-1.5 bg-white border border-raiz-gray-200 rounded-xl shadow-[0_8px_32px_#19151e15]"
        onClick={(e) =>
          e.currentTarget.closest("details")?.removeAttribute("open")
        }
      >
        {children}
      </div>
    </details>
  );
}
export default function TeamList() {
  const team = useTeam();
  const router = useRouter();
  const [invite, setInvite] = useState(false);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<TeamAction | null>(null);
  const [memberFilters, setMemberFilters] = useState(blankFilters);
  const [invitationFilters, setInvitationFilters] = useState(blankFilters);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const openInvite = () => {
    if (window.matchMedia("(max-width:767px)").matches)
      router.push("/team/invite");
    else setInvite(true);
  };
  const members = team.data?.members ?? [];
  const invitations = team.data?.pending_invitations ?? [];
  const filteredMembers = members.filter((m) => matches(m, memberFilters));
  const filteredInvitations = invitations.filter((i) =>
    matches(i, invitationFilters),
  );
  const description =
    "Give your team individual access to this business. Each person signs in with their own email and password.";
  return (
    <section className={teamPage}>
      <div className="hidden md:flex items-center justify-between gap-5 mb-10">
        <div>
          <h1 className="text-[23px] font-bold leading-[1.35]">Team members</h1>
          <p className="text-[13px] leading-[1.45] text-raiz-gray-600 mt-1.5 max-w-[500px]">
            {description}
          </p>
        </div>
        <TeamButton width="fit" onClick={openInvite}>
          <TeamIcon name="add" />
          Invite team member
        </TeamButton>
      </div>
      <div className="flex md:hidden items-center justify-between gap-2.5 min-h-[68px] py-3">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Back to dashboard">
            <TeamIcon name="back" />
          </Link>
          <h1 className="text-lg font-bold leading-[1.35]">Team members</h1>
        </div>
        <TeamButton width="fit" onClick={openInvite}>
          <TeamIcon name="user-plus" />
          Invite
        </TeamButton>
      </div>
      <p className="md:hidden text-xs text-raiz-gray-600 leading-relaxed">
        {description}
      </p>
      {team.isError && (
        <TeamError retry={() => void team.refetch()}>
          <strong className="block">We couldn&apos;t load team access</strong>
          Your team data is temporarily unavailable. No changes were made.
        </TeamError>
      )}
      {team.isPending && (
        <div role="status" aria-label="Loading team members">
          {[5, 3].map((count, index) => (
            <div className={`${panel} grid gap-7 animate-pulse`} key={index}>
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="rounded-full size-10 bg-[#eeeaf2]" />
                  <div className="h-3 rounded bg-[#eeeaf2] flex-1 my-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {team.data && (
        <>
          <section className={panel}>
            {members.every((m) => m.role === "owner") ? (
              <div className={empty}>
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-raiz-gray-50">
                  <TeamIcon name="members-empty" />
                </span>
                <div className="flex flex-col items-center gap-3">
                  <h3 className={emptyTitle}>No other team members yet</h3>
                  <p className={emptyBody}>
                    No other team members yet. Invite someone when you are ready
                    to give them their own access.
                  </p>
                </div>
                <TeamButton width="fit" onClick={openInvite}>
                  <TeamIcon name="add" />
                  Invite
                </TeamButton>
              </div>
            ) : (
              <>
                <div className={panelHeader}>
                  <h2 className={panelTitle}>
                    Members <span className={countBadge}>{members.length}</span>
                  </h2>
                  <FiltersPanel
                    value={memberFilters}
                    change={setMemberFilters}
                  />
                </div>
                <div className="hidden md:block">
                  <table className={table}>
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Email address",
                          "Role",
                          "Date",
                          "Status",
                          "",
                        ].map((h, i) => (
                          <th key={i} scope="col" className={th}>
                            {h || <span className="sr-only">Actions</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {filteredMembers.map((member) => (
                        <tr key={member.id}>
                          <td className={td}>
                            <div className="flex items-center gap-3">
                              <MemberAvatar member={member} />
                              <span className="font-brSonoma text-sm font-medium leading-5 text-raiz-gray-950">
                                {personName(member)}
                              </span>
                            </div>
                          </td>
                          <td className={`${td} break-all`}>{member.email}</td>
                          <td className={`${td} capitalize`}>{member.role}</td>
                          <td className={`${td} whitespace-nowrap`}>
                            {dateLabel(member.created_at)}
                          </td>
                          <td className={td}>
                            <StatusBadge
                              status={member.active ? "Active" : "Deactivated"}
                            />
                          </td>
                          <td className={td}>
                            <div className="flex justify-end">
                              {member.role === "owner" ? (
                                <span title="The owner cannot be changed">
                                  <TeamIcon name="lock" />
                                </span>
                              ) : (
                                <RowMenu label={`Manage ${personName(member)}`}>
                                  <button
                                    className={menuItem}
                                    onClick={() =>
                                      setAction({
                                        kind:
                                          member.role === "admin"
                                            ? "developer"
                                            : "admin",
                                        member,
                                      })
                                    }
                                  >
                                    Change to{" "}
                                    {member.role === "admin"
                                      ? "Developer"
                                      : "Admin"}
                                  </button>
                                  <button
                                    className={`${menuItem} ${member.active ? "text-red-600" : ""}`}
                                    onClick={() =>
                                      setAction({
                                        kind: member.active
                                          ? "deactivate"
                                          : "reactivate",
                                        member,
                                      })
                                    }
                                  >
                                    {member.active
                                      ? "Deactivate"
                                      : "Reactivate"}{" "}
                                    access
                                  </button>
                                </RowMenu>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2.5 md:hidden">
                  {filteredMembers.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
                {!filteredMembers.length && (
                  <p className="text-sm py-6 text-center">
                    No members match these filters.
                  </p>
                )}
              </>
            )}
          </section>
          <section
            className={invitations.length ? panel : `${panel} md:!mt-[100px]`}
          >
            {!invitations.length ? (
              <div className={empty}>
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-raiz-gray-50">
                  <TeamIcon name="invite" size={32} />
                </span>
                <div className="flex flex-col items-center gap-3">
                  <h3 className={emptyTitle}>No pending invitations.</h3>
                  <p className="max-w-[282px] text-[13px] leading-[17px] tracking-[-0.26px]">
                    New invitations will appear here until they are accepted.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className={panelHeader}>
                  <h2 className={panelTitle}>
                    Pending invitations{" "}
                    <span className={countBadge}>{invitations.length}</span>
                  </h2>
                  <FiltersPanel
                    value={invitationFilters}
                    change={setInvitationFilters}
                    invitation
                  />
                </div>
                <div className="hidden md:block">
                  <table className={table}>
                    <thead>
                      <tr>
                        {[
                          "Invitee",
                          "Email address",
                          "Role",
                          "Sent and expiry",
                          "Status",
                          "",
                        ].map((h, i) => (
                          <th key={i} scope="col" className={th}>
                            {h || <span className="sr-only">Actions</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {filteredInvitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td className={td}>
                            <div className="flex gap-3 items-center">
                              <span className={teamAvatar}>
                                <TeamIcon name="person" />
                              </span>
                              <span className="font-brSonoma text-sm font-medium leading-5 text-raiz-gray-950">
                                {personName(invitation)}
                              </span>
                            </div>
                          </td>
                          <td className={`${td} break-all`}>
                            {invitation.email}
                          </td>
                          <td className={`${td} capitalize`}>
                            {invitation.role}
                          </td>
                          <td className={td}>
                            <InvitationTiming invitation={invitation} stacked />
                          </td>
                          <td className={td}>
                            <StatusBadge
                              status={
                                isInvitationExpired(invitation)
                                  ? "Expired"
                                  : "Pending"
                              }
                            />
                          </td>
                          <td className={td}>
                            <div className="flex justify-end">
                              <RowMenu
                                label={`Manage invitation for ${personName(invitation)}`}
                              >
                                <button
                                  className={menuItem}
                                  onClick={() =>
                                    setAction({ kind: "resend", invitation })
                                  }
                                >
                                  Resend invitation
                                </button>
                                <button
                                  className={`${menuItem} text-red-600`}
                                  onClick={() =>
                                    setAction({ kind: "revoke", invitation })
                                  }
                                >
                                  Revoke invitation
                                </button>
                              </RowMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2.5 md:hidden">
                  {filteredInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAction={setAction}
                    />
                  ))}
                </div>
                {!filteredInvitations.length && (
                  <p className="text-sm py-6 text-center">
                    No invitations match these filters.
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] bg-[#f8f7fa]">
        <TeamButton onClick={openInvite}>
          <TeamIcon name="user-plus" />
          Invite team member
        </TeamButton>
      </div>
      {invite && (
        <TeamDialog
          title="Invite team member"
          close={() => setInvite(false)}
          pending={pending}
          drawer
        >
          <InviteMemberForm
            close={() => setInvite(false)}
            onPending={setPending}
          />
        </TeamDialog>
      )}
      {action && (
        <TeamActionDialog
          key={`${action.kind}-${"member" in action ? action.member.id : action.invitation.id}`}
          action={action}
          close={() => setAction(null)}
        />
      )}
    </section>
  );
}
