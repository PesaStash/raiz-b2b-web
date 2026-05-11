import {
  FormField,
  IntBeneficiaryCountryRaw,
  IntBeneficiaryMethodFields,
  NormalizedIntBeneficiaryCountryFields,
  NormalizedIntBeneficiaryFormFields,
} from "@/types/services";

const DEFAULT_METHOD = "DEFAULT";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const inferFallbackName = (field: Record<string, unknown>) => {
  if (typeof field.const === "string") {
    return "type";
  }

  if (Array.isArray(field.enum) && field.enum.length > 0) {
    return "type";
  }

  return "";
};

const normalizeFormField = (input: unknown): FormField | null => {
  if (!isObject(input)) {
    return null;
  }

  const rawName = typeof input.name === "string" ? input.name : "";
  const name = rawName || inferFallbackName(input);
  const type = typeof input.type === "string" ? input.type : "string";
  const required = Boolean(input.required);

  if (!name) {
    return null;
  }

  const enumValues = Array.isArray(input.enum)
    ? input.enum.filter((value): value is string => typeof value === "string")
    : undefined;
  const minLength =
    typeof input.min_length === "number"
      ? input.min_length
      : typeof input.minLength === "number"
        ? input.minLength
        : undefined;
  const maxLength =
    typeof input.max_length === "number"
      ? input.max_length
      : typeof input.maxLength === "number"
        ? input.maxLength
        : undefined;
  const nestedFields = Array.isArray(input.fields)
    ? input.fields
        .map((field) => normalizeFormField(field))
        .filter((field): field is FormField => Boolean(field))
    : undefined;

  return {
    name,
    type,
    required,
    enum: enumValues && enumValues.length ? enumValues : undefined,
    min_length: minLength,
    minLength,
    max_length: maxLength,
    maxLength,
    pattern: typeof input.pattern === "string" ? input.pattern : undefined,
    const: typeof input.const === "string" ? input.const : undefined,
    fields: nestedFields && nestedFields.length ? nestedFields : undefined,
    banks: Array.isArray(input.banks)
      ? (input.banks as FormField["banks"])
      : undefined,
  };
};

const isMethodBucket = (entry: unknown): entry is IntBeneficiaryMethodFields => {
  if (!isObject(entry)) {
    return false;
  }

  const keys = Object.keys(entry);
  if (keys.length !== 1) {
    return false;
  }

  const bucket = entry[keys[0]];
  return Array.isArray(bucket);
};

const normalizeMethodFields = (fields: unknown[]): FormField[] =>
  fields
    .map((field) => normalizeFormField(field))
    .filter((field): field is FormField => Boolean(field));

const normalizeCountry = (
  countryFields: IntBeneficiaryCountryRaw,
): NormalizedIntBeneficiaryCountryFields => {
  const methods: IntBeneficiaryMethodFields = {};
  const sharedFields: FormField[] = [];

  countryFields.forEach((entry) => {
    if (isMethodBucket(entry)) {
      const method = Object.keys(entry)[0];
      const methodFields = normalizeMethodFields(entry[method] as unknown[]);
      methods[method] = methodFields;
      return;
    }

    const normalizedField = normalizeFormField(entry);
    if (normalizedField) {
      sharedFields.push(normalizedField);
    }
  });

  if (!Object.keys(methods).length) {
    methods[DEFAULT_METHOD] = sharedFields;
  } else if (sharedFields.length) {
    Object.keys(methods).forEach((method) => {
      methods[method] = [...sharedFields, ...methods[method]];
    });
  }

  const methodKeys = Object.keys(methods);
  const preferredDefaults = ["BANK", "SWIFT", DEFAULT_METHOD];
  const defaultMethod =
    preferredDefaults.find((method) => methods[method]) || methodKeys[0];
  const flatFields = methods[defaultMethod] || [];
  const methodEntries = methodKeys.map((method) => ({ [method]: methods[method] }));

  return {
    methods,
    methodEntries,
    defaultMethod,
    flatFields,
  };
};

export const normalizeRemittanceFormFields = (
  raw: unknown,
): NormalizedIntBeneficiaryFormFields => {
  if (!isObject(raw)) {
    return {};
  }

  const normalized: NormalizedIntBeneficiaryFormFields = {};
  Object.entries(raw).forEach(([countryCode, fields]) => {
    if (!Array.isArray(fields)) {
      return;
    }
    normalized[countryCode] = normalizeCountry(fields as IntBeneficiaryCountryRaw);
  });

  return normalized;
};

export const resolveCountryMethodFields = (
  fieldsData: NormalizedIntBeneficiaryFormFields | undefined,
  countryCode: string,
  method?: string,
) => {
  const countryFields = fieldsData?.[countryCode];
  if (!countryFields) {
    return {
      availableMethods: [] as string[],
      activeMethod: "",
      fields: [] as FormField[],
      methods: {} as IntBeneficiaryMethodFields,
      methodEntries: [] as IntBeneficiaryMethodFields[],
    };
  }

  const availableMethods = Object.keys(countryFields.methods);
  const activeMethod =
    method && countryFields.methods[method] ? method : countryFields.defaultMethod;

  return {
    availableMethods,
    activeMethod,
    fields: countryFields.methods[activeMethod] || [],
    methods: countryFields.methods,
    methodEntries: countryFields.methodEntries,
  };
};
