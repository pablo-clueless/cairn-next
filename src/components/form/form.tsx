"use client";

import type { FieldValues, Resolver, DefaultValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type React from "react";

import { FormFieldRenderer } from "./field";
import type { FormConfig } from "@/types";

/**
 * Headless form builder powered by react-hook-form and zod validation.
 * Render-prop based: call `field("name")` to render any configured field, and
 * lay them out however you like.
 *
 * @example
 * ```tsx
 * import { z } from "zod";
 * import { Form } from "@/components/form/form";
 *
 * const schema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(2),
 *   role: z.enum(["admin", "user"]),
 * });
 *
 * const fields = {
 *   email: { label: "Email", type: "email", placeholder: "you@example.com" },
 *   name: { label: "Full Name", type: "text", placeholder: "John Doe" },
 *   role: {
 *     label: "Role",
 *     type: "select",
 *     options: [
 *       { label: "Admin", value: "admin" },
 *       { label: "User", value: "user" },
 *     ],
 *   },
 * } satisfies Record<string, StandardFormField>;
 *
 * function MyPage() {
 *   return (
 *     <Form
 *       schema={schema}
 *       defaultValues={{ email: "", name: "", role: "user" }}
 *       fields={fields}
 *       onSubmit={async (values, form) => {
 *         await createUser(values); // `values` is typed as the schema output
 *         form.reset();
 *       }}
 *     >
 *       {({ field, isSubmitting }) => (
 *         <div className="space-y-4">
 *           <div className="grid grid-cols-2 gap-4">
 *             {field("name")}
 *             {field("email")}
 *             {field("role")}
 *           </div>
 *           <Button type="submit" disabled={isSubmitting}>
 *             Submit
 *           </Button>
 *         </div>
 *       )}
 *     </Form>
 *   );
 * }
 * ```
 */
export const Form = <T extends FieldValues>({
  children,
  defaultValues,
  fields,
  onSubmit,
  gridCols = 12,
  mode = "onBlur",
  schema,
}: Omit<FormConfig<T>, "sections" | "title" | "description" | "submitLabel" | "schema"> & {
  /** Zod schema used for validation. Required — drives the resolver. */
  schema: NonNullable<FormConfig<T>["schema"]>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  children: (renderProps: {
    field: (name: Path<T>) => React.ReactNode;
    isSubmitting: boolean;
    form: ReturnType<typeof useForm<T>>;
  }) => React.ReactNode;
}) => {
  const form = useForm<T>({
    // zodResolver's generics can't be inferred through the generic `Form<T>`
    // boundary, so the schema/resolver shapes are asserted here. Validation is
    // still enforced at runtime by the zod schema.
    resolver: zodResolver(
      schema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<T>,
    defaultValues: defaultValues as unknown as DefaultValues<T>,
    mode,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const field = (name: Path<T>) => {
    const parts = (name as string).split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fieldDef: any = fields;
    for (const part of parts) {
      if (!fieldDef) return null;
      fieldDef = fieldDef.fields ? fieldDef.fields[part] : fieldDef[part];
    }
    if (!fieldDef) return null;
    return (
      <FormFieldRenderer
        name={String(name)}
        field={fieldDef}
        form={form}
        formDisabled={isSubmitting}
        parentGridCols={gridCols}
      />
    );
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(values as unknown as T, form as unknown as ReturnType<typeof useForm<T>>);
  });

  return (
    <form className="w-full" onSubmit={submit} noValidate>
      {children({ field, isSubmitting, form })}
    </form>
  );
};
