"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import {
  colSpanClass,
  emptyItemForObjectArray,
  emptyValueForField,
  fieldReactsToValues,
  getFieldError,
  isObjectArrayField,
  isPrimitiveArrayField,
  resolveDisabled,
} from "@/lib/form";
import type { ArrayFormField } from "@/types/form";
import { StandardFieldInput } from "./standard";

interface ArrayFieldRendererProps<T extends FieldValues> {
  name: string;
  field: ArrayFormField;
  form: UseFormReturn<T>;
  formDisabled: boolean;
  parentGridCols?: number;
}

export const ArrayFieldRenderer = <T extends FieldValues>({
  name,
  field,
  form,
  formDisabled,
  parentGridCols = 12,
}: ArrayFieldRendererProps<T>) => {
  const itemDefs = isPrimitiveArrayField(field)
    ? [field.item]
    : isObjectArrayField(field)
      ? Object.values(field.itemFields)
      : [];
  const active = typeof field.disabled === "function" || itemDefs.some(fieldReactsToValues);
  const values = (useWatch({ control: form.control, disabled: !active }) ?? {}) as FieldValues;
  // Scoped to the array; re-renders when any item (e.g. `name.0`) error changes.
  const { errors } = useFormState({ control: form.control, name: name as Path<T> });
  const disabled = resolveDisabled(field.disabled, formDisabled, values);

  const {
    fields: items,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: name as never,
  });

  const atMax = field.maxItems !== undefined && items.length >= field.maxItems;
  const atMin = field.minItems !== undefined && items.length <= field.minItems;

  const handleAdd = () => {
    if (atMax) return;

    if (isPrimitiveArrayField(field)) {
      append(emptyValueForField(field.item) as never);
      return;
    }

    if (isObjectArrayField(field)) {
      append(emptyItemForObjectArray(field) as never);
    }
  };

  const itemGridCols = isObjectArrayField(field) ? (field.itemGridCols ?? parentGridCols) : 12;

  return (
    <div className={`${colSpanClass(field.colSpan)} flex flex-col gap-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-0.5">
          {field.label && (
            <span className="text-foreground text-sm font-medium">{field.label}</span>
          )}
          {field.description && (
            <span className="text-muted-foreground text-xs">{field.description}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || atMax}
          className="border-border text-foreground hover:bg-muted inline-flex items-center gap-x-1.5 rounded-xs border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-600"
        >
          <span>+</span>
          <span>{field.addLabel ?? `Add ${field.label}`}</span>
        </button>
      </div>

      {/* Items */}
      {items.length === 0 && (
        <p className="border-border text-muted-foreground rounded-xs border border-dashed px-4 py-6 text-center text-xs">
          No items yet. Click &quot;{field.addLabel ?? `Add ${field.label}`}&quot; to add one.
        </p>
      )}

      <div className="flex flex-col gap-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="border-border relative rounded-xs border p-3">
            {/* Primitive row — single input + its error */}
            {isPrimitiveArrayField(field) && (
              <div className="pr-7">
                <StandardFieldInput
                  name={`${name}.${index}`}
                  field={{
                    ...field.item,
                    disabled: resolveDisabled(field.item.disabled, disabled, values),
                  }}
                  form={form}
                  formDisabled={formDisabled}
                  withWrapper={false}
                />
                {getFieldError(errors, `${name}.${index}`) && (
                  <p className="text-destructive mt-1.5 text-xs">
                    {getFieldError(errors, `${name}.${index}`)}
                  </p>
                )}
              </div>
            )}

            {/* Object row — each sub-field renders its own label/error via StandardFieldInput */}
            {isObjectArrayField(field) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${itemGridCols}, minmax(0, 1fr))`,
                  gap: "0.75rem",
                }}
              >
                {Object.entries(field.itemFields).map(([subKey, subField]) => (
                  <div
                    key={subKey}
                    style={{
                      gridColumn: `span ${subField.colSpan ?? itemGridCols} / span ${subField.colSpan ?? itemGridCols}`,
                    }}
                  >
                    <StandardFieldInput
                      name={`${name}.${index}.${subKey}`}
                      field={{
                        ...subField,
                        disabled: resolveDisabled(subField.disabled, disabled, values),
                      }}
                      form={form}
                      formDisabled={formDisabled}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={disabled || atMin}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute top-2 right-2 rounded p-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
