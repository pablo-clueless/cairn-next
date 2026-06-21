"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Controller, useFormState, useWatch } from "react-hook-form";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ColorPicker, DatePicker, MultiSelect, OtpInput, PhoneInput } from "../shared";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { StandardFormField } from "@/types/form";
import { fieldReactsToValues, getFieldError, resolveDisabled } from "@/lib/form";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface StandardFieldInputProps<T extends FieldValues> {
  name: string;
  field: StandardFormField;
  form: UseFormReturn<T>;
  formDisabled: boolean;
  /** When true, wraps with label + error. When false, renders input only (caller wraps). */
  withWrapper?: boolean;
}

const inputClass =
  "w-full rounded-xs border border-input bg-background px-3 py-2 h-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50";

export const StandardFieldInput = <T extends FieldValues>({
  name,
  field,
  form,
  formDisabled,
  withWrapper = true,
}: StandardFieldInputProps<T>) => {
  // Only subscribe to all values when this field's config actually reacts to them.
  const values = (useWatch({
    control: form.control,
    disabled: !fieldReactsToValues(field),
  }) ?? {}) as FieldValues;
  // Scoped error subscription so the field re-renders when its own error changes.
  const { errors } = useFormState({ control: form.control, name: name as Path<T> });
  const disabled = resolveDisabled(field.disabled, formDisabled, values);
  const error = getFieldError(errors, name);
  const {
    type,
    label,
    placeholder,
    readOnly,
    otpLength,
    accept,
    multiple,
    description,
    placeholderTo,
  } = field;
  const options = typeof field.options === "function" ? field.options(values) : field.options;

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <Textarea
                {...f}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                value={f.value ?? ""}
                aria-invalid={!!error}
              />
            )}
          />
        );

      case "tel":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <PhoneInput value={f.value ?? ""} onChange={f.onChange} disabled={disabled} />
            )}
          />
        );

      case "select":
        if (field.multiple) {
          return (
            <Controller
              control={form.control}
              name={name as Path<T>}
              render={({ field: f }) => (
                <MultiSelect
                  value={Array.isArray(f.value) ? f.value : []}
                  onChange={(val) => {
                    f.onChange(val);
                    f.onBlur();
                  }}
                  options={options ?? []}
                  placeholder={placeholder ?? `Select ${label}`}
                  disabled={disabled}
                />
              )}
            />
          );
        }

        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <Select
                value={f.value ?? ""}
                onValueChange={f.onChange}
                onOpenChange={(open) => !open && f.onBlur()}
                disabled={disabled}
              >
                <SelectTrigger className={cn("h-9", inputClass)} aria-invalid={!!error}>
                  <SelectValue placeholder={placeholder ?? `Select ${label}`} />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case "checkbox":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <div className="flex items-center gap-x-2">
                <Checkbox
                  id={name}
                  checked={!!f.value}
                  onCheckedChange={f.onChange}
                  disabled={disabled}
                />
                <label htmlFor={name} className="text-foreground text-sm">
                  {label}
                </label>
              </div>
            )}
          />
        );

      case "amount":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => {
              const hasValue = f.value != null && f.value !== "" && !isNaN(Number(f.value));
              const display = hasValue
                ? new Intl.NumberFormat("en-NG").format(Number(f.value))
                : "";
              return (
                <Input
                  ref={f.ref}
                  name={f.name}
                  type="text"
                  inputMode="numeric"
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly={readOnly}
                  value={display}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    f.onChange(digits === "" ? "" : Number(digits));
                  }}
                  onBlur={f.onBlur}
                />
              );
            }}
          />
        );

      case "radio":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <RadioGroup
                value={f.value}
                onValueChange={f.onChange}
                className="flex flex-col gap-y-2"
              >
                {options?.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-x-2 text-sm">
                    <RadioGroupItem value={opt.value} disabled={disabled || opt.disabled} />
                    <label>{opt.label}</label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case "file":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: { onChange, onBlur, ref } }) => (
              <Input
                ref={ref}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                onBlur={onBlur}
                onChange={(e) => onChange(multiple ? e.target.files : e.target.files?.[0])}
              />
            )}
          />
        );

      case "otp":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <OtpInput
                value={f.value ?? ""}
                onChange={f.onChange}
                length={otpLength ?? 6}
                disabled={disabled}
              />
            )}
          />
        );

      case "date":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) =>
              field.dateMode === "range" ? (
                <DatePicker
                  type="range"
                  value={f.value ?? { from: undefined, to: undefined }}
                  onValueChange={f.onChange}
                  disabled={disabled}
                  placeholderFrom={placeholder}
                  placeholderTo={field.placeholderTo}
                  onBlur={f.onBlur}
                  error={!!error}
                />
              ) : (
                <DatePicker
                  type="single"
                  value={f.value}
                  onValueChange={f.onChange}
                  disabled={disabled}
                  placeholder={placeholder}
                  onBlur={f.onBlur}
                  error={!!error}
                />
              )
            }
          />
        );

      case "color":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <ColorPicker onChange={f.onChange} disabled={f.disabled} value={f.value} />
            )}
          />
        );

      case "toggle":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <div className="flex items-center justify-between gap-x-3">
                <label htmlFor={name} className="text-foreground text-sm font-medium">
                  {label}
                </label>
                <Switch
                  id={name}
                  checked={!!f.value}
                  onCheckedChange={f.onChange}
                  disabled={disabled}
                />
              </div>
            )}
          />
        );

      case "email":
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <Input
                {...f}
                type="email"
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                value={f.value ?? ""}
                aria-invalid={!!error}
              />
            )}
          />
        );

      case "number":
        if (field.numberMode === "range") {
          return (
            <Controller
              control={form.control}
              name={name as Path<T>}
              render={({ field: f }) => {
                const range: [number | "", number | ""] = Array.isArray(f.value)
                  ? [f.value[0] ?? "", f.value[1] ?? ""]
                  : ["", ""];
                return (
                  <div className="flex items-center gap-x-2">
                    <Input
                      type="number"
                      placeholder={placeholder ?? "Min"}
                      disabled={disabled}
                      readOnly={readOnly}
                      value={range[0]}
                      onChange={(e) => f.onChange([e.target.valueAsNumber, range[1]])}
                      onBlur={f.onBlur}
                    />
                    <span className="text-muted-foreground shrink-0 text-sm">—</span>
                    <Input
                      type="number"
                      placeholder={placeholderTo ?? "Max"}
                      disabled={disabled}
                      readOnly={readOnly}
                      value={range[1]}
                      onChange={(e) => f.onChange([range[0], e.target.valueAsNumber])}
                      onBlur={f.onBlur}
                    />
                  </div>
                );
              }}
            />
          );
        }

        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <Input
                {...f}
                type="number"
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                value={f.value ?? ""}
                aria-invalid={!!error}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Pass undefined for empty so z.number().optional() works correctly
                  f.onChange(raw === "" ? undefined : Number(raw));
                }}
              />
            )}
          />
        );

      default:
        return (
          <Controller
            control={form.control}
            name={name as Path<T>}
            render={({ field: f }) => (
              <Input
                {...f}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                value={f.value ?? ""}
                aria-invalid={!!error}
              />
            )}
          />
        );
    }
  };

  if (!withWrapper) return renderInput();

  // checkbox and toggle render their own inline label next to the control.
  const hasInlineLabel = type === "checkbox" || type === "toggle";

  return (
    <div className="flex flex-col gap-y-1.5">
      {!hasInlineLabel && (
        <label htmlFor={name} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      {renderInput()}
      {description && !error && <p className="text-muted-foreground text-xs">{description}</p>}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};
