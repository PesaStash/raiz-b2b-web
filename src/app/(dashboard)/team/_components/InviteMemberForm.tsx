"use client";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TeamButton,
  TeamError,
  TeamField,
  TeamIcon,
} from "@/components/team/TeamUI";
import { inviteSchema, roleDescriptions } from "@/lib/team";
import { readApiError } from "@/lib/apiError";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { inviteMember } from "@/services/team";
import type { InvitePayload } from "@/types/team";
export default function InviteMemberForm({
  close,
  onPending,
}: {
  close: () => void;
  onPending?: (pending: boolean) => void;
}) {
  const [values, setValues] = useState<InvitePayload>({
    first_name: "",
    last_name: "",
    email: "",
    role: "admin",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const client = useQueryClient();
  const { canManageTeam } = usePermissions();
  const mutation = useMutation({
    mutationFn: async (payload: InvitePayload) => {
      if (!canManageTeam)
        throw new Error("Only the business owner can invite team members.");
      const encoded = JSON.stringify(payload);
      if (attempt.current?.payload !== encoded)
        attempt.current = { payload: encoded, key: crypto.randomUUID() };
      return inviteMember(payload, attempt.current!.key);
    },
    onMutate: () => onPending?.(true),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["team"] });
      toast.success("Invitation sent. The link is valid for 24 hours.");
      close();
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["team"] });
    },
    onSettled: () => onPending?.(false),
  });
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (mutation.isPending) return;
    const parsed = inviteSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };
  const apiError = readApiError(mutation.error);
  const duplicate = mutation.isError && apiError.status === 409;
  return (
    <form
      className="min-h-[calc(100dvh-100px)] flex flex-col gap-8 max-md:pb-[100px]"
      onSubmit={submit}
      noValidate
    >
      <div className="hidden md:block">
        <button
          type="button"
          aria-label="Back to Team members"
          disabled={mutation.isPending}
          onClick={close}
        >
          <TeamIcon name="back" />
        </button>
        <div className="flex justify-between gap-4 mt-5">
          <h2 className="text-[23px] font-semibold">Invite team member</h2>
          <TeamIcon name="invite" />
        </div>
        <p className="text-[15px] text-raiz-gray-700 leading-relaxed mt-1">
          They will receive a secure invitation that expires in 24 hours.
        </p>
      </div>
      {mutation.isError && !duplicate && (
        <TeamError retry={mutation.isPending ? undefined : () => submit()}>
          <strong className="block">
            We couldn&apos;t confirm this invitation
          </strong>
          {apiError.message ??
            "Your details are still here. Check your connection and try again."}
        </TeamError>
      )}
      <fieldset disabled={mutation.isPending} className="grid gap-[18px]">
        <div className="grid grid-cols-2 gap-3">
          {(["first_name", "last_name"] as const).map((name) => (
            <TeamField
              key={name}
              label={name === "first_name" ? "First name" : "Last name"}
              name={name}
              autoComplete={
                name === "first_name" ? "given-name" : "family-name"
              }
              value={values[name]}
              onChange={(e) => setValues({ ...values, [name]: e.target.value })}
              errorMessage={errors[name]}
            />
          ))}
        </div>
        <div>
          <TeamField
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => {
              setValues({ ...values, email: e.target.value });
              mutation.reset();
            }}
            errorMessage={
              errors.email ||
              (duplicate
                ? (apiError.message ??
                  "This email is already a member or has a pending invitation.")
                : undefined)
            }
          />
          {duplicate && (
            <button
              type="button"
              className="mt-2 text-xs font-bold text-primary"
              onClick={close}
            >
              Back to Team members to resend the invitation →
            </button>
          )}
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold mb-2">Role</legend>
          {(["admin", "developer"] as const).map((role) => (
            <label
              key={role}
              className="flex items-start gap-3 border border-raiz-gray-200 rounded-[10px] p-3 cursor-pointer bg-white has-[:checked]:bg-[#f6f1fc] has-[:checked]:border-primary2"
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={values.role === role}
                onChange={() => setValues({ ...values, role })}
                className="mt-0.5 size-5 shrink-0 accent-primary2"
              />
              <div>
                <strong className="block text-[13px] mb-1 capitalize">
                  {role}
                </strong>
                <p className="text-raiz-gray-600 text-[11px] leading-[1.45]">
                  {roleDescriptions[role]}
                </p>
              </div>
            </label>
          ))}
        </fieldset>
      </fieldset>
      <div className="grid gap-4 md:mt-auto">
        <div className="flex gap-2 text-xs text-raiz-gray-600 leading-relaxed rounded-xl bg-[#f6f1fc] p-4 md:bg-transparent md:p-0">
          <TeamIcon name="info" />
          <p>
            <strong className="capitalize">{values.role} access.</strong>{" "}
            {roleDescriptions[values.role]}
          </p>
        </div>
        <p className="md:hidden text-center text-[11px] text-raiz-gray-600">
          The invitation link will expire in 24 hours.
        </p>
        <div className="grid gap-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:flex max-md:flex-row-reverse max-md:gap-3 max-md:bg-white max-md:border-t max-md:border-raiz-gray-200 max-md:px-5 max-md:pt-3.5 max-md:pb-[max(20px,env(safe-area-inset-bottom))] max-md:[&>*]:flex-1">
          <TeamButton
            type="submit"
            loading={mutation.isPending}
            disabled={!canManageTeam}
          >
            Send invitation
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
    </form>
  );
}
