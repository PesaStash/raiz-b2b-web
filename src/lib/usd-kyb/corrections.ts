import type { KybFieldError, KybPerson } from "../../types/usdKyb.ts";
export const correctionPath = (field: string) =>
  field.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
export function valueAt(source: unknown, path: string): unknown {
  return correctionPath(path)
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value != null && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}
export function replaceAt(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [key, ...rest] = correctionPath(path).split(".");
  if (!rest.length) return { ...source, [key]: value };
  const current = source[key];
  const array =
    Array.isArray(current) || (current == null && /^\d+$/.test(rest[0]));
  const child =
    current && typeof current === "object"
      ? (current as Record<string, unknown>)
      : {};
  const next = replaceAt(child, rest.join("."), value);
  return {
    ...source,
    [key]: array
      ? Object.assign(Array.isArray(current) ? [...current] : [], next)
      : next,
  };
}
export function correctionValue(value: unknown, error?: KybFieldError) {
  return error &&
    typeof value === "string" &&
    (value === error.placeholder ||
      value === error.message ||
      /^Invalid .+\(re-enter .+\)$/i.test(value))
    ? ""
    : value;
}
export function cleanDraft(
  source: Record<string, unknown>,
  errors: KybFieldError[],
) {
  let result = source;
  for (const error of errors.filter(
    (e) => !e.field.startsWith("associated_persons"),
  )) {
    const current = valueAt(result, error.field);
    const value = correctionValue(current, error);
    if (value !== current) result = replaceAt(result, error.field, value);
  }
  return result;
}
export function errorsForPerson(
  errors: KybFieldError[],
  person: KybPerson,
  index: number,
) {
  const id =
    person.associated_person_id ?? person.business_usd_kyb_associated_person_id;
  return groupFieldErrors(
    errors
      .filter(
        (error) =>
          error.field.startsWith("associated_persons") &&
          (error.associated_person_id
            ? error.associated_person_id === id
            : correctionPath(error.field).split(".")[1] === String(index)),
      )
      .map((error) => ({
        ...error,
        field: correctionPath(error.field).replace(
          /^associated_persons\.\d+\.?/,
          "",
        ),
      })),
  );
}
export function cleanPerson(person: KybPerson, errors: KybFieldError[]) {
  return cleanDraft(person, errors) as KybPerson;
}
/** Only changed write fields are sent. Omitted nested fields remain owned by the server. */
export function changedFields(
  next: Record<string, unknown>,
  before?: Record<string, unknown>,
): Record<string, unknown> {
  if (!before) return next;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(next)) {
    if (
      value === undefined ||
      JSON.stringify(value) === JSON.stringify(before[key])
    )
      continue;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      before[key] &&
      typeof before[key] === "object" &&
      !Array.isArray(before[key])
    )
      result[key] = changedFields(
        value as Record<string, unknown>,
        before[key] as Record<string, unknown>,
      );
    else result[key] = value;
  }
  return result;
}

/** Provider errors follow person IDs even after deletion/reordering changes the array index. */
export function currentFieldErrors(
  errors: KybFieldError[],
  people: KybPerson[],
) {
  return errors.flatMap((error) => {
    if (
      !error.associated_person_id ||
      !error.field.startsWith("associated_persons")
    )
      return [error];
    const index = people.findIndex(
      (person) =>
        (person.associated_person_id ??
          person.business_usd_kyb_associated_person_id) ===
        error.associated_person_id,
    );
    return index < 0
      ? []
      : [
          {
            ...error,
            field: error.field.replace(
              /^associated_persons(?:\[\d+\]|\.\d+)/,
              `associated_persons[${index}]`,
            ),
          },
        ];
  });
}

export function validationForPeople(
  validation: import("../../types/usdKyb.ts").KybValidation,
  people: KybPerson[],
) {
  const errors = validation.field_errors ?? [];
  const paths = new Map(
    errors.map((error) => [
      error.field,
      currentFieldErrors([error], people)[0]?.field,
    ]),
  );
  return {
    ...validation,
    field_errors: currentFieldErrors(errors, people),
    missing_requirements: [
      ...new Set(
        validation.missing_requirements.flatMap((key) =>
          paths.has(key) ? (paths.get(key) ? [paths.get(key)!] : []) : [key],
        ),
      ),
    ],
  };
}

export function rebasePersonInput(
  input: Record<string, unknown>,
  before: Record<string, unknown> | undefined,
  fresh: Record<string, unknown> | undefined,
) {
  if (before && !fresh)
    throw new Error(
      "A person you edited has been removed. Load the saved case before continuing.",
    );
  const baseline = { ...before, ...fresh };
  const merge = (
    base: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> => {
    const result = { ...base };
    for (const [key, value] of Object.entries(patch))
      result[key] =
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        result[key] &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key])
          ? merge(
              result[key] as Record<string, unknown>,
              value as Record<string, unknown>,
            )
          : value;
    return result;
  };
  return { baseline, input: merge(baseline, changedFields(input, before)) };
}

export function groupFieldErrors(errors: KybFieldError[]) {
  const grouped = new Map<string, KybFieldError>();
  for (const error of errors) {
    const key = `${error.associated_person_id ?? ""}:${correctionPath(error.field)}`;
    const current = grouped.get(key);
    grouped.set(
      key,
      current
        ? {
            ...current,
            message: [...new Set([current.message, error.message])].join("; "),
            placeholder: current.placeholder ?? error.placeholder,
          }
        : error,
    );
  }
  return [...grouped.values()];
}
