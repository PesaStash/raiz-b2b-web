import { FormField } from "@/types/services";

export function collectFieldNames(
  inputFields: FormField[],
  parentName = "",
): string[] {
  return inputFields.flatMap((field) => {
    if (!field.name) return [];
    const fieldName = parentName ? `${parentName}_${field.name}` : field.name;
    if (field.type === "object" && field.fields?.length) {
      return collectFieldNames(field.fields, fieldName);
    }
    return [fieldName];
  });
}

export function stripEmptyRemittanceValues(
  values: Record<string, unknown>,
  allowedKeys: string[],
): Record<string, string> {
  const allowed = new Set(allowedKeys);
  return Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
    if (!allowed.has(key)) return acc;
    if (value === undefined || value === null || value === "") return acc;
    acc[key] = String(value);
    return acc;
  }, {});
}
