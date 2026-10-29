"use client";
import { useId, type ComponentProps, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";
import SelectField from "@/components/ui/SelectField";
import { groupFieldErrors } from "@/lib/usd-kyb/corrections";
import {
  getPath,
  options,
  display,
  label,
  record,
  type KybOption,
} from "@/lib/usd-kyb/model";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
export const surface =
  "font-monzo text-kyb-ink [&_:is(button,a,input,select,textarea):focus-visible]:outline [&_:is(button,a,input,select,textarea):focus-visible]:outline-2 [&_:is(button,a,input,select,textarea):focus-visible]:outline-offset-2 [&_:is(button,a,input,select,textarea):focus-visible]:outline-primary2";
export function Action(props: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      width={props.width ?? "fit"}
      className={`!rounded-xl !h-11 !px-6 !py-0 !text-[15px] !leading-[22px] font-semibold ${!props.variant || props.variant === "primary" ? "!bg-raiz-usd-primary !text-white disabled:!bg-raiz-gray-200 disabled:!text-raiz-gray-500" : ""} ${props.className ?? ""}`}
    />
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-4 text-[13px] leading-[19px] ${error ? "border-red-200 bg-red-50 text-red-800" : "border-kyb-border bg-kyb-selected text-raiz-gray-700"}`}
    >
      {children}
    </div>
  );
}
export function Badge({
  children,
  good = false,
  tone,
}: {
  children: ReactNode;
  good?: boolean;
  tone?: "warning" | "error";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${good ? "bg-[#E8F7EF] text-[#159C52]" : tone === "warning" ? "bg-[#FFF4DF] text-[#B76A00]" : tone === "error" ? "bg-[#FDEDEE] text-[#D93A3A]" : "bg-kyb-selected text-primary2"}`}
    >
      {children}
    </span>
  );
}
export function Check({
  checked,
  onChange,
  children,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 size-4 shrink-0 accent-primary2"
      />
      <span>{children}</span>
    </label>
  );
}
export function Field({
  editor,
  path,
  title,
  choices,
  strictChoices = false,
  multiline = false,
  type = "text",
  min,
  step,
  helper,
}: {
  editor: KybEditor;
  path: string;
  title: string;
  choices?: KybOption[];
  /** When true, unknown values are not added to the dropdown. */
  strictChoices?: boolean;
  multiline?: boolean;
  type?: string;
  min?: number | string;
  step?: number | string;
  helper?: string;
}) {
  const id = useId();
  const value = getPath(editor.draft, path);
  const text = value == null ? "" : String(value);
  const missing = editor.missing.some(
    (key) => key === path || key === path.split(".").at(-1),
  );
  const correction = groupFieldErrors(editor.fieldErrors ?? []).find(
    (error) => error.field === path || error.field === path.split(".").at(-1),
  );
  const error =
    correction?.message ||
    (missing ? `${title} is required or needs attention.` : undefined);
  if (choices) {
    const list =
      strictChoices || choices.some((o) => o.value === text) || !text
        ? choices
        : [{ value: text, label: label(text) }, ...choices];
    return (
      <div data-kyb-requirement={path}>
        <SelectField
          height="48px"
          minHeight="48px"
          bgColor="#F4F4F8"
          labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
          className="!shadow-none"
          instanceId={id}
          label={title}
          placeholder={correction?.placeholder}
          name={path}
          value={list.find((o) => o.value === text) ?? null}
          options={list}
          onChange={(v) => editor.change(path, v ? String(v.value) : "")}
          disabled={!editor.editable || editor.busy}
          status={error ? "error" : undefined}
          helper={error ?? helper}
        />
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  const props = {
    id,
    name: path,
    label: title,
    "aria-label": title,
    "aria-invalid": !!error,
    placeholder: correction?.placeholder,
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      editor.change(path, e.target.value),
    disabled: !editor.editable || editor.busy,
    errorMessage: error,
    labelClass: "!font-monzo !text-sm !font-semibold !text-kyb-ink",
    className: `!rounded-xl !bg-kyb-field !text-kyb-ink !border-transparent ${multiline ? "!min-h-[100px] focus:!border-kyb-outline focus:!bg-white" : "!h-12"}`,
  };
  return (
    <div data-kyb-requirement={path}>
      {multiline ? (
        <TextareaField {...props} />
      ) : (
        <InputField {...props} type={type} min={min} step={step} />
      )}
      {helper && (
        <p className="mt-2 text-xs leading-relaxed text-kyb-muted">{helper}</p>
      )}
    </div>
  );
}
export function ReadRows({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="grid gap-1 py-1.5 text-sm sm:grid-cols-[minmax(100px,1fr)_2fr] sm:gap-5"
        >
          <dt className="text-kyb-muted">{label(key)}</dt>
          <dd className="break-words font-medium">{display(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
export { options };

export function Guidance({ value }: { value: unknown }) {
  if (value == null) return null;
  if (Array.isArray(value))
    return (
      <ul className="list-inside list-disc space-y-2">
        {value.map((item, index) => (
          <li key={index}>
            <Guidance value={item} />
          </li>
        ))}
      </ul>
    );
  if (typeof value === "object")
    return (
      <dl className="space-y-3">
        {Object.entries(record(value)).map(([key, item]) => (
          <div key={key}>
            <dt className="font-semibold">{label(key)}</dt>
            <dd className="mt-1">
              <Guidance value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return <span>{display(value)}</span>;
}

/** A single-choice field using the Figma inset segmented-control treatment. */
export function SegmentedField({
  editor,
  path,
  title,
  helper,
  choices,
}: {
  editor: KybEditor;
  path: string;
  title: string;
  helper: string;
  choices: KybOption[];
}) {
  const id = useId();
  const current = String(getPath(editor.draft, path) ?? "");
  const list =
    current && !choices.some((option) => option.value === current)
      ? [...choices, { value: current, label: label(current) }]
      : choices;
  const missing = editor.missing.some(
    (key) => key === path || key === path.split(".").at(-1),
  );
  const correction = groupFieldErrors(editor.fieldErrors ?? []).find(
    (error) => error.field === path || error.field === path.split(".").at(-1),
  );
  return (
    <fieldset
      data-kyb-requirement={path}
      disabled={!editor.editable || editor.busy}
      aria-describedby={`${id}-helper${missing ? ` ${id}-error` : ""}`}
      aria-invalid={missing}
      className="min-w-0 space-y-3"
    >
      <legend className="text-sm font-semibold leading-5">{title}</legend>
      <p
        id={`${id}-helper`}
        className="!mt-1 text-[13px] leading-[19px] text-kyb-muted"
      >
        {helper}
      </p>
      <div className="flex flex-wrap gap-1 rounded-xl bg-kyb-field p-1">
        {list.map((option) => (
          <label
            key={option.value}
            className="relative min-w-0 flex-[1_0_calc(50%-4px)] cursor-pointer sm:flex-[1_0_calc(33.333%-4px)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={current === option.value}
              onChange={() => editor.change(path, option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-10 items-center justify-center rounded-[9px] px-2 py-2 text-center text-sm leading-5 text-kyb-muted peer-checked:bg-white peer-checked:font-semibold peer-checked:text-primary2 peer-checked:shadow-[0_1px_3px_rgba(0,0,0,0.08)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-primary2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {(missing || correction) && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {correction?.message ?? "Choose a range."}
        </p>
      )}
    </fieldset>
  );
}
