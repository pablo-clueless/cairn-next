import type { FieldErrors, FieldValues } from "react-hook-form";
import type {
  ArrayFormField,
  ColSpan,
  CustomFormField,
  FormField,
  FormSection,
  ObjectArrayFormField,
  ObjectFormField,
  PrimitiveArrayFormField,
  StandardFormField,
} from "@/types/form";

export const isCustomField = <T extends FieldValues>(
  field: FormField<T>,
): field is CustomFormField<T> => "custom" in field && field.custom === true;

export const isStandardField = <T extends FieldValues>(
  field: FormField<T>,
): field is StandardFormField =>
  !("custom" in field) && !("kind" in field && field.kind !== "standard") && "type" in field;

export const isObjectField = <T extends FieldValues>(
  field: FormField<T>,
): field is ObjectFormField => "kind" in field && field.kind === "object";

export const isArrayField = <T extends FieldValues>(field: FormField<T>): field is ArrayFormField =>
  "kind" in field && field.kind === "array";

export const isPrimitiveArrayField = <T extends FieldValues>(
  field: FormField<T>,
): field is PrimitiveArrayFormField => isArrayField(field) && "item" in field;

export const isObjectArrayField = <T extends FieldValues>(
  field: FormField<T>,
): field is ObjectArrayFormField => isArrayField(field) && "itemFields" in field;

export const colSpanClass = (span: ColSpan = 12): string =>
  ({
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  })[span];

export const normaliseSections = <T extends FieldValues>(
  fields: Record<string, FormField<T>>,
  sections?: FormSection[],
): FormSection[] => {
  if (sections && sections.length > 0) return sections;
  return [{ fields: Object.keys(fields) }];
};

export const resolveDisabled = (
  fieldDisabled?: boolean | ((values: FieldValues) => boolean),
  formDisabled?: boolean,
  values?: FieldValues,
): boolean => {
  const field = typeof fieldDisabled === "function" ? fieldDisabled(values ?? {}) : fieldDisabled;
  return !!(field || formDisabled);
};

/**
 * Resolve a field error from RHF's nested error tree by dotted path.
 * Handles array indices, e.g. `getFieldError(errors, "contacts.0.email")`
 * walks `errors.contacts[0].email.message`.
 */
export const getFieldError = (
  errors: FieldErrors,
  name: string,
): string | undefined => {
  const node = name.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return acc;
    return (acc as Record<string, unknown>)[key];
  }, errors);
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
};

/**
 * The empty value a freshly-appended array item (or reset field) should start
 * with, based on its input type — so checkboxes start `false`, numbers `undefined`,
 * multi-selects `[]`, etc. instead of everything being `""`.
 */
export const emptyValueForField = (field: StandardFormField): unknown => {
  switch (field.type) {
    case "checkbox":
    case "toggle":
      return false;
    case "number":
    case "amount":
      return undefined;
    case "select":
      return field.multiple ? [] : "";
    case "date":
      return field.dateMode === "range" ? { from: undefined, to: undefined } : undefined;
    default:
      return "";
  }
};

/** Build an empty item object for an object-array, respecting each sub-field's type. */
export const emptyItemForObjectArray = (
  field: ObjectArrayFormField,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(field.itemFields).map(([key, sub]) => [key, emptyValueForField(sub)]),
  );

/**
 * Whether a field's config depends on the live form values — i.e. it has a
 * function `disabled` or function `options`. Fields that don't can opt out of
 * watching all values, so they won't re-render when unrelated fields change.
 */
export const fieldReactsToValues = (field: StandardFormField): boolean =>
  typeof field.disabled === "function" || typeof field.options === "function";
