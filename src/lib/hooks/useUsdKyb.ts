"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { kybApi } from "@/services/usdKyb";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { readApiError } from "@/lib/apiError";
import { sessionGeneration } from "@/lib/session";
import {
  editableStatus,
  mergeDraft,
  normalizeDraft,
  setPath,
  personPatch,
} from "@/lib/usd-kyb/model";
import {
  canResendPersonInvitation,
  personDetailsErrors,
} from "@/lib/usd-kyb/personDetails";
import {
  cleanDraft,
  cleanPerson,
  errorsForPerson,
  changedFields,
  currentFieldErrors,
  valueAt,
  replaceAt,
  rebasePersonInput,
} from "@/lib/usd-kyb/corrections";
import { SaveQueue } from "@/lib/usd-kyb/saveQueue";
import type {
  KybBundle,
  KybDraft,
  KybPerson,
  KybFieldError,
} from "@/types/usdKyb";

export function useUsdKyb() {
  const access = usePermissions();
  const router = useRouter();
  const tenant = access.user?.business_account?.entity_id;
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["usd-kyb", tenant],
    queryFn: kybApi.get,
    enabled: access.ready && !!tenant,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const [bundle, setBundle] = useState<KybBundle>();
  const [draft, setDraft] = useState<KybDraft>({});
  const [people, setPeople] = useState<KybPerson[]>([]);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const retryAt = useRef(0);
  const [dirtyTick, setDirtyTick] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<KybFieldError[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const ref = useRef({
    bundle: undefined as KybBundle | undefined,
    draft: {} as KybDraft,
    people: [] as KybPerson[],
    peopleBase: [] as KybPerson[],
    pending: {} as KybDraft,
    peopleDirty: false,
    personInputs: new Map<string, KybPerson>(),
    savedPersonInputs: new Map<string, KybPerson>(),
    dirtyPeople: new Set<string>(),
    peopleRevision: 0,
    fieldErrors: [] as KybFieldError[],
    blocked: false,
  });
  const queue = useRef(new SaveQueue());
  const commandPending = useRef(false);
  const saving = useRef(false);
  const alive = useRef(true);
  const generation = useRef(sessionGeneration());
  const writable = useRef(false);
  writable.current =
    access.canWriteBusiness && !!bundle && editableStatus(bundle.case.status);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const currentSession = useCallback(
    () => alive.current && generation.current === sessionGeneration(),
    [],
  );
  const adopt = useCallback(
    (next: KybBundle, reset = false) => {
      if (!currentSession()) return;
      const state = ref.current;
      state.bundle = next;
      if (reset) {
        state.pending = {};
        state.peopleDirty = false;
        state.dirtyPeople.clear();
        state.personInputs.clear();
        state.savedPersonInputs.clear();
      }
      state.draft = mergeDraft(
        mergeDraft(
          cleanDraft(
            normalizeDraft(next.case.draft_payload ?? next.draft_payload ?? {}),
            next.validation.field_errors ?? [],
          ),
          cleanDraft(
            normalizeDraft(next.prefilled_draft ?? {}),
            next.validation.field_errors ?? [],
          ),
        ),
        state.pending,
      );
      if (!state.peopleDirty) {
        state.people = next.associated_persons.map((person, index) =>
          cleanPerson(
            person,
            errorsForPerson(next.validation.field_errors ?? [], person, index),
          ),
        );
        state.peopleBase = state.people;
      }
      setBundle(next);
      setDraft(state.draft);
      setPeople(state.people);
      setMissing(next.validation.missing_requirements);
      state.fieldErrors = currentFieldErrors(
        next.validation.field_errors ?? [],
        next.associated_persons,
      );
      setFieldErrors(state.fieldErrors);
      qc.setQueryData(["usd-kyb", tenant], next);
    },
    [currentSession, qc, tenant],
  );
  useEffect(() => {
    if (query.data && !ref.current.bundle) adopt(query.data);
  }, [query.data, adopt]);
  const fail = useCallback(
    async (failure: unknown) => {
      if (!currentSession()) return;
      const api = readApiError(failure);
      if (api.status === 429) {
        const response = failure as {
          headers?: Record<string, string>;
          response?: { headers?: Record<string, string> };
        };
        const header = (response.response?.headers ?? response.headers)?.[
          "retry-after"
        ];
        const seconds =
          header && Number.isFinite(Number(header))
            ? Number(header)
            : header
              ? Math.ceil((Date.parse(header) - Date.now()) / 1000)
              : 60;
        const wait = Number.isFinite(seconds) ? Math.max(1, seconds) : 60;
        retryAt.current = Date.now() + wait * 1000;
        setCooldown(wait);
      }
      const message =
        api.message || "Unable to save your changes. Please try again.";
      setError(message);
      toast.error(message, { id: "onboarding-error" });
      setSaveState("Not saved");
      const body = failure as {
        data?: { detail?: { missing?: string[] } };
        response?: { data?: { detail?: { missing?: string[] } } };
      };
      const keys = (body.response?.data ?? body.data)?.detail?.missing;
      if (Array.isArray(keys)) setMissing(keys);
      const responseBody =
        (
          failure as {
            response?: {
              data?: { message?: { field_errors?: KybFieldError[] } };
            };
            data?: { message?: { field_errors?: KybFieldError[] } };
          }
        ).response?.data ??
        (failure as { data?: { message?: { field_errors?: KybFieldError[] } } })
          .data;
      if (Array.isArray(responseBody?.message?.field_errors)) {
        const errors = currentFieldErrors(
          responseBody.message.field_errors,
          ref.current.people,
        );
        ref.current.fieldErrors = errors;
        setFieldErrors(errors);
        setMissing((current) => [
          ...new Set([...current, ...errors.map((error) => error.field)]),
        ]);
      }
      if (api.status === 409) {
        ref.current.blocked = true;
        setConflict(true);
        // Keep dirty edits in memory; never blindly retry a stale write.
        try {
          const fresh = await kybApi.get();
          if (currentSession()) {
            ref.current.bundle = fresh;
            setBundle(fresh);
          }
        } catch {
          /* User can explicitly retry refresh. */
        }
      }
      if (api.status === 403) {
        ref.current.blocked = true;
        await qc.invalidateQueries({ queryKey: ["user"] });
      }
    },
    [currentSession, qc],
  );
  const save = useCallback(async () => {
    const state = ref.current;
    if (
      !writable.current ||
      !currentSession() ||
      state.blocked ||
      Date.now() < retryAt.current
    )
      throw new Error("Editing is unavailable. Refresh the case to continue.");
    if (
      !state.bundle ||
      (!Object.keys(state.pending).length && !state.peopleDirty)
    )
      return;
    const patch = state.pending;
    const sentPeople = state.peopleDirty;
    const sentKeys = new Set(state.dirtyPeople);
    const inputs = [...sentKeys].map((key) => state.personInputs.get(key)!);
    const personWrites = inputs.map((input) => ({
      ...changedFields(
        personPatch(input),
        state.savedPersonInputs.has(input.person_key)
          ? personPatch(state.savedPersonInputs.get(input.person_key)!)
          : state.peopleBase.find(
                (person) => person.person_key === input.person_key,
              )
            ? personPatch(
                state.peopleBase.find(
                  (person) => person.person_key === input.person_key,
                )!,
              )
            : undefined,
      ),
      person_key: input.person_key,
    }));
    const revision = state.peopleRevision;
    state.pending = {};
    state.peopleDirty = false;
    state.dirtyPeople.clear();
    saving.current = true;
    setSaveState("Saving…");
    try {
      if (
        sentPeople &&
        inputs.some((person) =>
          state.bundle!.associated_persons.some(
            (saved) => saved.person_key === person.person_key,
          ),
        )
      ) {
        const fresh = await kybApi.get();
        for (const input of inputs) {
          const saved = fresh.associated_persons.find(
            (person) => person.person_key === input.person_key,
          );
          if (
            !saved &&
            state.bundle.associated_persons.some(
              (person) => person.person_key === input.person_key,
            )
          )
            throw {
              response: {
                status: 409,
                data: {
                  message:
                    "A person you edited has been removed. Refresh the case before continuing.",
                },
              },
            };
        }
        if (fresh.case.payload_version !== state.bundle.case.payload_version)
          throw {
            response: {
              status: 409,
              data: {
                message:
                  "The case has changed. Refresh before updating person details.",
              },
            },
          };
      }
      const result = await kybApi.patch({
        expected_version: state.bundle.case.payload_version,
        draft_payload: patch,
        ...(sentPeople ? { associated_persons: personWrites } : {}),
      });
      if (!currentSession()) return;
      for (const input of inputs)
        state.savedPersonInputs.set(input.person_key, input);
      const mergedPeople =
        revision === state.peopleRevision
          ? result.associated_persons.map((person, index) =>
              cleanPerson(
                person,
                errorsForPerson(
                  result.validation.field_errors ?? [],
                  person,
                  index,
                ),
              ),
            )
          : state.people;
      state.people = mergedPeople;
      state.peopleBase = result.associated_persons.map((person, index) =>
        cleanPerson(
          person,
          errorsForPerson(result.validation.field_errors ?? [], person, index),
        ),
      );
      state.bundle = {
        ...state.bundle,
        case: result.case,
        payload_version: result.case.payload_version,
        associated_persons: result.associated_persons,
        validation: result.validation,
      };
      state.draft = mergeDraft(
        mergeDraft(
          cleanDraft(
            normalizeDraft(result.case.draft_payload ?? {}),
            result.validation.field_errors ?? [],
          ),
          cleanDraft(
            normalizeDraft(state.bundle.prefilled_draft ?? {}),
            result.validation.field_errors ?? [],
          ),
        ),
        state.pending,
      );
      setDraft(state.draft);
      setBundle(state.bundle);
      setPeople(mergedPeople);
      setMissing(result.validation.missing_requirements);
      state.fieldErrors = currentFieldErrors(
        result.validation.field_errors ?? [],
        result.associated_persons,
      );
      setFieldErrors(state.fieldErrors);
      setSaveState(
        Object.keys(state.pending).length || state.peopleDirty
          ? "Unsaved changes"
          : "Saved",
      );
      setError("");
    } catch (failure) {
      state.pending = mergeDraft(patch, state.pending);
      state.peopleDirty ||= sentPeople;
      for (const key of sentKeys) state.dirtyPeople.add(key);
      await fail(failure);
      throw failure;
    } finally {
      saving.current = false;
    }
  }, [currentSession, fail]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(
      () => setCooldown((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const flush = useCallback(
    () =>
      queue.current.run(async () => {
        while (
          Object.keys(ref.current.pending).length ||
          ref.current.peopleDirty
        )
          await save();
      }),
    [save],
  );
  useEffect(() => {
    if (!dirtyTick || conflict || busy) return;
    const timer = setTimeout(() => {
      void flush().catch(() => undefined);
    }, 750);
    return () => clearTimeout(timer);
  }, [dirtyTick, conflict, busy, flush]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (
        Object.keys(ref.current.pending).length ||
        ref.current.peopleDirty ||
        saving.current ||
        commandPending.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  useEffect(() => {
    const leave = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
      )
        return;
      if (
        !Object.keys(ref.current.pending).length &&
        !ref.current.peopleDirty &&
        !saving.current &&
        !commandPending.current
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void flush()
        .then(() => router.push(url.pathname + url.search + url.hash))
        .catch(() => undefined);
    };
    document.addEventListener("click", leave, true);
    return () => document.removeEventListener("click", leave, true);
  }, [flush, router]);
  const change = (path: string, value: unknown) => {
    if (!writable.current || ref.current.blocked) return;
    ref.current.draft = setPath(ref.current.draft, path, value);
    ref.current.pending = setPath(ref.current.pending, path, value);
    setDraft(ref.current.draft);
    setSaveState("Unsaved changes");
    setDirtyTick((n) => n + 1);
  };
  const canEditPerson = (person: KybPerson) =>
    !!person.person_key && writable.current && !ref.current.blocked;
  const personInput = (person: KybPerson) => {
    let input = {
      ...person,
      ...ref.current.personInputs.get(person.person_key),
    };
    for (const error of errorsForPerson(
      fieldErrors,
      person,
      people.findIndex((p) => p.person_key === person.person_key),
    )) {
      if (valueAt(person, error.field) === "")
        input = replaceAt(input, error.field, "") as KybPerson;
    }
    return input;
  };
  const personDetailsSaved = (person: KybPerson) => {
    const saved = ref.current.savedPersonInputs.get(person.person_key);
    const input = ref.current.personInputs.get(person.person_key);
    const current =
      ref.current.people.find((p) => p.person_key === person.person_key) ??
      person;
    const corrections = errorsForPerson(
      ref.current.fieldErrors,
      current,
      ref.current.people.findIndex((p) => p.person_key === person.person_key),
    );
    return (
      corrections.length === 0 &&
      !!saved &&
      !!input &&
      !ref.current.dirtyPeople.has(person.person_key) &&
      Object.keys(personDetailsErrors(saved)).length === 0 &&
      JSON.stringify(personPatch(saved)) === JSON.stringify(personPatch(input))
    );
  };
  const changePeople = (next: KybPerson[]) => {
    if (!writable.current || ref.current.blocked) return;
    const changed = next.filter((person) => {
      const previous = ref.current.people.find(
        (p) => p.person_key === person.person_key,
      );
      return (
        !previous ||
        (!ref.current.savedPersonInputs.has(person.person_key) &&
          Object.keys(personDetailsErrors(person)).length === 0) ||
        JSON.stringify(personPatch(previous)) !==
          JSON.stringify(personPatch(person))
      );
    });
    if (changed.some((person) => !canEditPerson(person))) {
      setError(
        "These saved person details cannot be safely edited. Contact support to update them.",
      );
      return;
    }
    for (const person of changed) {
      ref.current.personInputs.set(person.person_key, {
        ...ref.current.personInputs.get(person.person_key),
        ...person,
      });
      ref.current.dirtyPeople.add(person.person_key);
    }
    if (!changed.length) return;
    ref.current.people = next;
    ref.current.peopleDirty = true;
    ref.current.peopleRevision += 1;
    setPeople(next);
    setSaveState("Unsaved changes");
    setDirtyTick((n) => n + 1);
  };
  const command = async <T,>(
    action: (current: KybBundle) => Promise<T>,
    refresh = true,
  ): Promise<T | undefined> => {
    if (
      commandPending.current ||
      !writable.current ||
      ref.current.blocked ||
      Date.now() < retryAt.current
    )
      return;
    commandPending.current = true;
    setBusy(true);
    setError("");
    try {
      return await queue.current.run(async () => {
        while (
          Object.keys(ref.current.pending).length ||
          ref.current.peopleDirty
        )
          await save();
        if (!currentSession() || ref.current.blocked || !ref.current.bundle)
          return;
        const result = await action(ref.current.bundle);
        if (refresh) adopt(await kybApi.get());
        return result;
      });
    } catch (failure) {
      await fail(failure);
      return undefined;
    } finally {
      commandPending.current = false;
      if (currentSession()) setBusy(false);
    }
  };
  const removePerson = async (person: KybPerson) =>
    command(async (current) => {
      const saved = current.associated_persons.find(
        (p) => p.person_key === person.person_key,
      );
      if (
        !saved?.can_remove ||
        !["not_started", "collecting"].includes(current.case.status) ||
        current.case.submitted_for_review_at ||
        current.case.bridge_customer_id
      )
        throw new Error("This person cannot be removed from this case.");
      const id =
        saved.associated_person_id ??
        saved.business_usd_kyb_associated_person_id;
      if (!id)
        throw new Error("Refresh the case to load this person’s saved ID.");
      const result = await kybApi.removePerson(
        id,
        current.case.payload_version,
      );
      const removed = new Set(result.removed_document_ids ?? []);
      ref.current.personInputs.delete(person.person_key);
      ref.current.savedPersonInputs.delete(person.person_key);
      ref.current.dirtyPeople.delete(person.person_key);
      adopt({
        ...current,
        ...result,
        payload_version: result.case.payload_version,
        documents:
          current.documents?.filter(
            (document) => !removed.has(document.business_usd_kyb_document_id),
          ) ?? [],
      });
      toast.success("Person removed from this application.");
      return result;
    });
  const invitePerson = async (person: KybPerson, action: "send" | "resend") =>
    command(async (current) => {
      const saved = current.associated_persons.find(
        (p) => p.person_key === person.person_key,
      );
      if (!saved)
        throw new Error("Save this person’s details before inviting them.");
      if (
        action === "resend"
          ? saved.invitation_status !== "sent"
          : !personDetailsSaved(saved)
      )
        throw new Error(
          "Complete and save this person’s details before sending an invite link.",
        );
      const id =
        saved.associated_person_id ??
        saved.business_usd_kyb_associated_person_id;
      if (!id)
        throw new Error(
          "This person could not be saved. Refresh and try again.",
        );
      return kybApi.invitation(id, action);
    });
  const canResendPerson = (person: KybPerson) =>
    access.canWriteBusiness &&
    !ref.current.blocked &&
    canResendPersonInvitation(person, ref.current.bundle?.case.status ?? "");
  const resendPerson = async (person: KybPerson) => {
    if (
      commandPending.current ||
      !currentSession() ||
      !canResendPerson(person) ||
      Date.now() < retryAt.current
    )
      return;
    commandPending.current = true;
    setBusy(true);
    setError("");
    try {
      return await queue.current.run(async () => {
        // Flush only while editable. A submitted case must never receive a draft PATCH here.
        while (
          Object.keys(ref.current.pending).length ||
          ref.current.peopleDirty
        )
          await save();
        const current = await kybApi.get();
        if (!currentSession()) return;
        const saved = current.associated_persons.find(
          (p) => p.person_key === person.person_key,
        );
        if (!saved || !canResendPersonInvitation(saved, current.case.status))
          throw new Error(
            "This person no longer has an invitation that can be resent. Refresh the verification status.",
          );
        const id =
          saved.associated_person_id ??
          saved.business_usd_kyb_associated_person_id;
        const result = await kybApi.invitation(id!, "resend");
        if (!currentSession()) return;
        toast.success(
          "Verification link resent. The previous link is no longer valid.",
        );
        adopt(await kybApi.get());
        return result;
      });
    } catch (failure) {
      await fail(failure);
    } finally {
      commandPending.current = false;
      if (currentSession()) setBusy(false);
    }
  };
  const reload = async (keepEdits: boolean) => {
    if (commandPending.current) return;
    commandPending.current = true;
    setBusy(true);
    try {
      return await queue.current.run(async () => {
        const next = await kybApi.get();
        if (keepEdits && !editableStatus(next.case.status))
          throw new Error(
            "This case is locked. Load the saved case to continue.",
          );
        if (keepEdits && ref.current.peopleDirty) {
          const state = ref.current;
          const refreshed = next.associated_persons.map((person, index) =>
            cleanPerson(
              person,
              errorsForPerson(
                next.validation.field_errors ?? [],
                person,
                index,
              ),
            ),
          );
          const writes = new Map<string, KybPerson>();
          for (const key of state.dirtyPeople) {
            const input = state.personInputs.get(key)!;
            const before =
              state.savedPersonInputs.get(key) ??
              state.peopleBase.find((person) => person.person_key === key);
            const fresh = refreshed.find((person) => person.person_key === key);
            const rebased = rebasePersonInput(
              personPatch(input),
              before ? personPatch(before) : undefined,
              fresh ? personPatch(fresh) : undefined,
            );
            if (fresh)
              state.savedPersonInputs.set(key, rebased.baseline as KybPerson);
            writes.set(key, {
              ...fresh,
              ...rebased.input,
              person_key: key,
            } as KybPerson);
          }
          for (const [key, input] of writes) state.personInputs.set(key, input);
          state.people = refreshed.map(
            (person) => writes.get(person.person_key) ?? person,
          );
          for (const [key, input] of writes)
            if (!refreshed.some((person) => person.person_key === key))
              state.people.push(input);
          state.peopleBase = refreshed;
        }
        adopt(next, !keepEdits);
        ref.current.blocked = false;
        setConflict(false);
        setError("");
        setSaveState(keepEdits ? "Unsaved changes" : "Saved");
        if (keepEdits) setDirtyTick((n) => n + 1);
        return next;
      });
    } catch (failure) {
      await fail(failure);
    } finally {
      commandPending.current = false;
      if (currentSession()) setBusy(false);
    }
  };
  return {
    bundle,
    draft,
    people,
    missing,
    fieldErrors,
    personErrors: (person: KybPerson) => {
      const current =
        ref.current.people.find((p) => p.person_key === person.person_key) ??
        person;
      return errorsForPerson(
        ref.current.fieldErrors,
        current,
        ref.current.people.findIndex((p) => p.person_key === person.person_key),
      );
    },
    saveState,
    error,
    conflict,
    busy: busy || cooldown > 0,
    cooldown,
    query,
    access,
    editable: writable.current && !conflict,
    change,
    changePeople,
    canEditPerson,
    personInput,
    personDetailsSaved,
    invitePerson,
    removePerson,
    canResendPerson,
    resendPerson,
    command,
    reload,
    flush,
    setMissing,
  };
}
export type KybEditor = ReturnType<typeof useUsdKyb>;
