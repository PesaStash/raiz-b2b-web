"use client";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { kybApi } from "@/services/usdKyb";
import { fileError, getPath, options, label } from "@/lib/usd-kyb/model";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import type { KybDocument } from "@/types/usdKyb";
import { Notice, Guidance } from "./KybUI";
import { KybIcon } from "./KybGuide";

const slots = [
  {
    title: "Certificate of incorporation",
    helper: "From the CAC",
    purpose: "business_formation",
  },
  {
    title: "Status report (Form CAC 1.1)",
    helper: "Shows directors and shareholders",
    purpose: "directors_registry",
  },
  {
    title: "Memorandum and articles",
    helper: "The MEMART filed with the CAC",
    purpose: "business_formation",
  },
  {
    title: "Proof of business address",
    helper: "Utility bill or bank statement",
    purpose: "proof_of_address",
  },
  {
    title: "Ownership structure chart",
    helper: "Show who owns the business and each owner’s percentage",
    purpose: "ownership_chart",
  },
  {
    title: "Proof of nature of business",
    helper:
      "Evidence of what your business does. Required if you don’t provide a business website.",
    purpose: "proof_of_nature_of_business",
  },
];
export default function DocumentsStage({ editor }: { editor: KybEditor }) {
  const [purpose, setPurpose] = useState("");
  const [person, setPerson] = useState("");
  const [uploading, setUploading] = useState<{
    title: string;
    name: string;
    progress: number;
  }>();
  const [error, setInlineError] = useState("");
  const setError = (message: string) => {
    setInlineError(message);
    if (message) toast.error(message, { id: "onboarding-error" });
  };
  const tenant = editor.access.user?.business_account?.entity_id;
  const purposes = useQuery({
    queryKey: ["usd-kyb-reference", tenant, "purposes"],
    queryFn: kybApi.purposes,
    staleTime: Infinity,
    retry: false,
  });
  const businessType = String(
    getPath(editor.draft, "business_profile.business_type") ?? "",
  );
  const formation = useQuery({
    queryKey: ["usd-kyb-reference", tenant, "formation", businessType],
    queryFn: () => kybApi.formation(businessType),
    enabled: !!businessType,
    staleTime: Infinity,
    retry: false,
  });
  const choices = options(purposes.data);
  const documents = editor.bundle?.documents ?? [];
  // Slot labels are persisted as documented descriptions. Never infer content from a filename.
  const documentFor = (title: string) =>
    documents.find((d) => d.description === title && !d.associated_person_id);
  const remaining = documents.filter(
    (d) =>
      !slots.some(
        (s) =>
          documentFor(s.title)?.business_usd_kyb_document_id ===
          d.business_usd_kyb_document_id,
      ),
  );
  const upload = async (
    file: File | undefined,
    target: string,
    title: string,
    previous?: KybDocument,
  ) => {
    if (!file || !editor.editable || editor.busy || uploading) return;
    const invalid = fileError(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!choices.some((o) => o.value === target)) {
      setError("Choose an available document purpose before uploading.");
      return;
    }
    setError("");
    setUploading({ title, name: file.name, progress: 0 });
    await editor.command(async () => {
      await kybApi.upload(
        file,
        target,
        title === "Additional document" ? person || null : null,
        (progress) => setUploading({ title, name: file.name, progress }),
        title === "Additional document" ? file.name : title,
      );
      // Keep the previous file until its replacement has been registered successfully.
      if (previous)
        await kybApi.removeDocument(previous.business_usd_kyb_document_id);
    });
    setUploading(undefined);
  };
  const input = (target: string, title: string, previous?: KybDocument) => (
    <input
      aria-label={`${previous ? "Replace" : "Upload"} ${title}`}
      type="file"
      accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
      className="sr-only"
      disabled={
        !editor.editable ||
        editor.busy ||
        !!uploading ||
        !choices.some((o) => o.value === target)
      }
      onChange={(e) => {
        void upload(e.target.files?.[0], target, title, previous);
        e.target.value = "";
      }}
    />
  );
  const dropzone = (target: string, title: string) => (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length !== 1) {
          setError("Upload one file at a time.");
          return;
        }
        void upload(e.dataTransfer.files[0], target, title);
      }}
      className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#C7CCDA] bg-kyb-soft px-4 py-4 focus-within:outline focus-within:outline-2 focus-within:outline-primary2 ${!editor.editable || editor.busy || !choices.some((o) => o.value === target) ? "opacity-60" : "cursor-pointer hover:border-primary2"}`}
    >
      <KybIcon name="drop-upload" />
      <span className="text-sm">
        Drag files here or{" "}
        <span className="font-semibold text-primary2">browse</span>
      </span>
      <span className="text-xs text-kyb-muted">
        PDF, JPG, PNG, WebP, HEIC or HEIF · Up to 10 MiB
      </span>
      {input(target, title)}
    </label>
  );
  return (
    <div data-kyb-requirement="documents" className="space-y-6">
      {purposes.isError && (
        <Notice error>
          Couldn’t load document purposes.{" "}
          <button className="underline" onClick={() => void purposes.refetch()}>
            Try again
          </button>
        </Notice>
      )}
      {purposes.isPending && (
        <p role="status" className="text-sm text-kyb-muted">
          Loading document requirements…
        </p>
      )}
      {slots.map((slot) => {
        const doc = documentFor(slot.title);
        const active = uploading?.title === slot.title;
        const available = choices.some((o) => o.value === slot.purpose);
        return (
          <section
            key={slot.title}
            data-kyb-requirement={slot.purpose}
            className="space-y-3 rounded-2xl border border-kyb-border p-[18px]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${doc ? "bg-[#E8F7EF]" : "bg-kyb-selected"}`}
              >
                <KybIcon name={doc ? "check" : "upload"} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold">{slot.title}</h3>
                <p className="mt-1 text-[13px] text-kyb-muted">{slot.helper}</p>
              </div>
            </div>
            {active ? (
              <div role="status" className="rounded-xl bg-kyb-soft p-3">
                <p className="flex justify-between gap-3 text-xs">
                  <span className="truncate font-semibold">
                    {uploading.name}
                  </span>
                  <span>{uploading.progress}%</span>
                </p>
                <progress
                  aria-label="Document upload progress"
                  className="mt-2 h-1 w-full accent-primary2"
                  max={100}
                  value={uploading.progress}
                />
              </div>
            ) : doc ? (
              <div className="flex items-center gap-3 rounded-xl bg-kyb-soft px-3 py-3 text-xs">
                <span
                  className="min-w-0 flex-1 truncate font-semibold"
                  title={doc.file_name ?? ""}
                >
                  {doc.file_name}
                </span>
                <span className="text-kyb-muted">
                  {doc.file_size
                    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                    : ""}
                </span>
                <label className="cursor-pointer font-semibold text-primary2 focus-within:outline">
                  Replace{input(slot.purpose, slot.title, doc)}
                </label>
              </div>
            ) : available ? (
              dropzone(slot.purpose, slot.title)
            ) : (
              <p className="text-xs text-kyb-muted">
                {purposes.isPending
                  ? "Loading…"
                  : "This upload purpose is currently unavailable."}
              </p>
            )}
          </section>
        );
      })}
      {remaining.map((doc) => (
        <section
          key={doc.business_usd_kyb_document_id}
          className="rounded-xl border border-kyb-border p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {doc.file_name || "Company document"}
              </p>
              <p className="mt-1 text-xs text-kyb-muted">
                {doc.purposes.map(label).join(" · ")}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-primary2"
              disabled={!editor.editable || editor.busy}
              onClick={() => {
                if (window.confirm("Remove this document?"))
                  void editor.command(() =>
                    kybApi.removeDocument(doc.business_usd_kyb_document_id),
                  );
              }}
            >
              Remove
            </button>
          </div>
        </section>
      ))}
      <details className="rounded-xl border border-dashed border-[#C7CCDA] bg-kyb-soft p-5">
        <summary className="cursor-pointer text-center text-sm font-semibold text-primary2">
          ＋ Add another document
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-center text-xs text-kyb-muted">
            Anything else that helps, like a board resolution.
          </p>
          <label className="block text-sm">
            Document purpose
            <select
              aria-label="Document purpose"
              className="mt-2 w-full rounded-xl bg-white p-3"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={!editor.editable || editor.busy}
            >
              <option value="">Choose a purpose</option>
              {choices.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Associated person (optional)
            <select
              aria-label="Associated person"
              className="mt-2 w-full rounded-xl bg-white p-3"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              disabled={!editor.editable || editor.busy}
            >
              <option value="">Company document</option>
              {editor.people
                .filter(
                  (p) =>
                    p.associated_person_id ||
                    p.business_usd_kyb_associated_person_id,
                )
                .map((p) => (
                  <option
                    key={p.person_key}
                    value={
                      p.associated_person_id ??
                      p.business_usd_kyb_associated_person_id
                    }
                  >
                    {p.first_name} {p.last_name}
                  </option>
                ))}
            </select>
          </label>
          {dropzone(purpose, "Additional document")}
        </div>
      </details>
      {error && <Notice error>{error}</Notice>}
      {formation.isError ? (
        <Notice error>
          Couldn’t load formation guidance.{" "}
          <button
            className="underline"
            onClick={() => void formation.refetch()}
          >
            Try again
          </button>
        </Notice>
      ) : (
        formation.data != null && (
          <details className="text-sm">
            <summary className="cursor-pointer text-primary2">
              Document guidance for {label(businessType)}
            </summary>
            <div className="mt-3 text-xs leading-relaxed text-kyb-muted">
              <Guidance value={formation.data} />
            </div>
          </details>
        )
      )}
      <p className="text-xs text-kyb-muted">
        {documents.length} documents uploaded
      </p>
    </div>
  );
}
