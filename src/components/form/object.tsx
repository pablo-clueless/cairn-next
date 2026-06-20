"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useFormState, useWatch } from "react-hook-form";

import { colSpanClass, fieldReactsToValues, getFieldError, resolveDisabled } from "@/lib/form";
import { StandardFieldInput } from "./standard";
import type { ObjectFormField } from "@/types/form";

interface ObjectFieldRendererProps<T extends FieldValues> {
  name: string;
  field: ObjectFormField;
  form: UseFormReturn<T>;
  formDisabled: boolean;
  parentGridCols?: number;
}

export const ObjectFieldRenderer = <T extends FieldValues>({
  name,
  field,
  form,
  formDisabled,
  parentGridCols = 12,
}: ObjectFieldRendererProps<T>) => {
  const active =
    typeof field.disabled === "function" || Object.values(field.fields).some(fieldReactsToValues);
  const values = (useWatch({ control: form.control, disabled: !active }) ?? {}) as FieldValues;
  const { errors } = useFormState({ control: form.control, name: name as Path<T> });
  const disabled = resolveDisabled(field.disabled, formDisabled, values);
  const gridCols = field.gridCols ?? parentGridCols;
  const error = getFieldError(errors, name);

  return (
    <div className={`${colSpanClass(field.colSpan)} flex flex-col gap-y-3`}>
      {(field.label || field.description) && (
        <div className="flex flex-col gap-y-0.5">
          {field.label && (
            <span className="text-foreground text-sm font-medium">{field.label}</span>
          )}
          {field.description && (
            <span className="text-muted-foreground text-xs">{field.description}</span>
          )}
        </div>
      )}

      <div
        className="border-border rounded-xs border p-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gap: "1rem",
        }}
      >
        {Object.entries(field.fields).map(([subKey, subField]) => (
          <div
            key={subKey}
            style={{
              gridColumn: `span ${subField.colSpan ?? gridCols} / span ${subField.colSpan ?? gridCols}`,
            }}
          >
            <StandardFieldInput
              name={`${name}.${subKey}`}
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

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};
