"use client";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ComponentProps,
} from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";

const focusRing =
  "[&_:is(button,a,input,select):focus-visible]:outline [&_:is(button,a,input,select):focus-visible]:outline-2 [&_:is(button,a,input,select):focus-visible]:outline-offset-[3px] [&_:is(button,a,input,select):focus-visible]:outline-raiz-gray-600";
export const teamSurface = `font-monzo text-raiz-gray-950 ${focusRing}`;
export const teamPage = `${teamSurface} px-1 pb-[90px] md:px-0 md:pt-7 md:pb-6`;
export const teamAvatar =
  "size-10 rounded-full bg-background border border-black/[0.08] text-primary2 inline-flex items-center justify-center shrink-0 overflow-hidden";
export const teamBadge =
  "inline-flex items-center gap-[5px] whitespace-nowrap text-[11px] px-2 py-1 rounded-full leading-[1.2] font-semibold";
export const ownerBadge = `${teamBadge} bg-[#f6f1fc] text-primary2`;
export const teamConfirm =
  "flex flex-col gap-5 text-left items-stretch md:text-center md:items-center";
export const confirmIcon = (danger: boolean) =>
  `self-center rounded-full size-14 flex items-center justify-center ${danger ? "bg-[#fef3f2]" : "bg-[#f6f1fc]"}`;
export const scopeSwitch =
  "appearance-none relative w-[38px] h-[22px] shrink-0 rounded-full bg-[#cfc8d8] cursor-pointer transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:transition-transform checked:bg-primary2 checked:after:translate-x-4 disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<string, number> = {
  invite: 40,
  info: 20,
  radio: 20,
  developer: 22,
  admin: 22,
  deactivate: 22,
  reactivate: 22,
  revoke: 22,
  resend: 22,
  success: 56,
  "signed-out": 24,
  expired: 26,
  unavailable: 26,
  used: 26,
  name: 40,
  "lock-field": 16,
  back: 22,
  "user-plus": 16,
  "lock-mobile": 17,
  add: 20,
  more: 24,
  calendar: 20,
  filter: 20,
  person: 28,
  lock: 24,
  "members-empty": 32,
  key: 24,
  restriction: 18,
  "scope-lock": 16,
  alert: 18,
};
export function TeamIcon({ name, size }: { name: string; size?: number }) {
  const resolved = size ?? sizes[name] ?? 20;
  return (
    <Image
      src={`/images/team/${name}.svg`}
      alt=""
      width={resolved}
      height={resolved}
      className="shrink-0"
      style={{ width: resolved, height: resolved, objectFit: "contain" }}
    />
  );
}
const buttonTones = {
  primary: "!bg-raiz-usd-primary !text-white max-md:!bg-primary2",
  brand: "!bg-primary2 !text-white",
  secondary:
    "!bg-raiz-gray-200 !text-raiz-gray-950 max-md:!bg-white max-md:border max-md:border-[#d0c5de]",
  danger: "!bg-[#df1000] !text-white",
};
export function TeamButton({
  className = "",
  tone = "primary",
  ...props
}: ComponentProps<typeof Button> & { tone?: keyof typeof buttonTones }) {
  return (
    <Button
      {...props}
      className={`gap-2 min-h-[40px] font-brSonoma !text-sm font-medium disabled:opacity-[.55] disabled:cursor-not-allowed ${buttonTones[tone]} ${className}`}
    />
  );
}
export function TeamField({
  label,
  errorMessage,
  ...props
}: ComponentProps<typeof InputField>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold mb-[7px]">
        {label}
      </label>
      <InputField
        {...props}
        id={id}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        className={`!rounded-[10px] !h-[46px] !text-[13px] ${props.readOnly ? "!bg-[#f8f7fa] pr-10" : "!bg-white"}`}
        status={errorMessage ? "error" : undefined}
      />
      {errorMessage && (
        <p id={`${id}-error`} className="text-[#d92d20] text-xs mt-[7px]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
export function TeamDialog({
  children,
  title,
  close,
  pending = false,
  drawer = false,
}: {
  children: ReactNode;
  title: string;
  close: () => void;
  pending?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const layout = drawer
    ? "fixed inset-y-0 right-0 left-auto m-0 w-[460px] max-w-[100vw] h-dvh max-h-dvh rounded-none p-[30px]"
    : "w-[375px] max-w-[calc(100vw-32px)] max-h-[calc(100dvh-32px)] rounded-[20px] md:rounded-[36px] px-5 py-8";
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`${teamSurface} ${layout} border-0 overflow-auto bg-raiz-gray-50 backdrop:bg-black/40`}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) close();
      }}
      onClick={(event) => {
        if (!pending && event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            close();
        }
      }}
    >
      {children}
    </dialog>
  );
}
export function TeamError({
  children,
  retry,
}: {
  children: ReactNode;
  retry?: () => void;
}) {
  return (
    <div
      className="bg-[#fef3f2] flex items-center gap-2.5 rounded-[10px] p-[14px]"
      role="alert"
    >
      <TeamIcon name="alert" />
      <span className="min-w-0 flex-1 text-xs leading-[1.4] text-raiz-gray-950 [&_strong]:block [&_strong]:font-bold [&_strong]:text-[#b42318] [&_strong]:leading-normal">
        {children}
      </span>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="shrink-0 text-xs font-bold text-[#b42318]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`${role === "owner" ? ownerBadge : `${teamBadge} bg-[#eeeaf2] text-raiz-gray-600`} capitalize`}
    >
      <span aria-hidden>•</span>
      {role}
    </span>
  );
}
const statusDots = {
  Active: "bg-[#41DC0D]",
  Deactivated: "bg-raiz-error",
  Pending: "bg-[#DC860D]",
  Expired: "bg-raiz-error",
};
export function StatusBadge({ status }: { status: keyof typeof statusDots }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-raiz-gray-200 bg-white px-1.5 py-0.5 font-brSonoma text-xs font-medium leading-[18px] text-raiz-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <span
        aria-hidden
        className={`size-2 rounded-full ${statusDots[status]}`}
      />
      {status}
    </span>
  );
}
