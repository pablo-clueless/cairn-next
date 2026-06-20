import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * react-hook-form resolver for Zod 4 schemas via the Standard Schema spec.
 *
 * `@hookform/resolvers` v5 `zodResolver` pins its types to an older Zod 4 minor
 * and rejects current (4.4+) schemas; the Standard Schema resolver is
 * version-agnostic since Zod 4 implements the `~standard` interface.
 */
export function zodForm<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return standardSchemaResolver(schema as never) as Resolver<T>;
}
