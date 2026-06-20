"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Controller, useFormState, useWatch } from "react-hook-form";

import { StandardFieldInput } from "./standard";
import { ObjectFieldRenderer } from "./object";
import type { CustomFormField, FormField } from "@/types/form";
import { ArrayFieldRenderer } from "./array";
import {
  colSpanClass,
  getFieldError,
  isArrayField,
  isCustomField,
  isObjectField,
  isStandardField,
  resolveDisabled,
} from "@/lib/form";

interface FormFieldRendererProps<T extends FieldValues> {
  name: string;
  field: FormField<T>;
  form: UseFormReturn<T>;
  formDisabled: boolean;
  parentGridCols?: number;
}

export const FormFieldRenderer = <T extends FieldValues>({
  name,
  field,
  form,
  formDisabled,
  parentGridCols = 12,
}: FormFieldRendererProps<T>) => {
  // Only subscribe to value changes when visibility is dynamic; otherwise this
  // wrapper never needs to re-render on other fields' changes.
  const values = (useWatch({
    control: form.control,
    disabled: !field.showIf,
  }) ?? {}) as FieldValues;

  if (field.hidden) return null;
  if (field.showIf && !field.showIf(values)) return null;

  if (isObjectField(field)) {
    return (
      <ObjectFieldRenderer
        name={name}
        field={field}
        form={form}
        formDisabled={formDisabled}
        parentGridCols={parentGridCols}
      />
    );
  }

  if (isArrayField(field)) {
    return (
      <ArrayFieldRenderer
        name={name}
        field={field}
        form={form}
        formDisabled={formDisabled}
        parentGridCols={parentGridCols}
      />
    );
  }

  if (isCustomField(field)) {
    return (
      <CustomFieldRenderer name={name} field={field} form={form} formDisabled={formDisabled} />
    );
  }

  // Standard field — StandardFieldInput renders its own label/description/error wrapper.
  if (isStandardField(field)) {
    return (
      <div className={colSpanClass(field.colSpan)}>
        <StandardFieldInput name={name} field={field} form={form} formDisabled={formDisabled} />
      </div>
    );
  }

  return null;
};

interface CustomFieldRendererProps<T extends FieldValues> {
  name: string;
  field: CustomFormField<T>;
  form: UseFormReturn<T>;
  formDisabled: boolean;
}

const CustomFieldRenderer = <T extends FieldValues>({
  name,
  field,
  form,
  formDisabled,
}: CustomFieldRendererProps<T>) => {
  const values = (useWatch({
    control: form.control,
    disabled: typeof field.disabled !== "function",
  }) ?? {}) as FieldValues;
  const { errors } = useFormState({ control: form.control, name: name as Path<T> });
  const disabled = resolveDisabled(field.disabled, formDisabled, values);
  const error = getFieldError(errors, name);
  const span = colSpanClass(field.colSpan);

  if (field.customMode === "uncontrolled") {
    return (
      <div className={span}>
        {typeof field.render === "function"
          ? (field.render as () => React.ReactNode)()
          : field.render}
      </div>
    );
  }

  return (
    <div className={span}>
      <Controller
        control={form.control}
        name={name as Path<T>}
        render={({ field: rhfField }) => (
          <>
            {(
              field.render as (props: {
                field: typeof rhfField;
                error?: string;
                disabled?: boolean;
              }) => React.ReactNode
            )({ field: rhfField, error, disabled })}
          </>
        )}
      />
    </div>
  );
};
