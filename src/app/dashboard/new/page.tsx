"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/client";
import { zodForm } from "@/lib/zod-resolver";
import { useMe } from "@/hooks/use-auth";
import { useCreateOrg } from "@/hooks/use-orgs";

const schema = z.object({ name: z.string().min(1, "Organization name is required") });
type Values = z.infer<typeof schema>;

const Page = () => {
  const router = useRouter();
  const me = useMe();
  const createOrg = useCreateOrg();

  // Platform admins cannot belong to an organization.
  useEffect(() => {
    if (me.data?.is_platform_admin) router.replace("/dashboard");
  }, [me.data, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  if (me.data?.is_platform_admin) return null;

  const onSubmit = handleSubmit((values) => {
    createOrg.mutate(values, {
      onSuccess: (org) => {
        toast.success(`Created ${org.name}`);
        router.replace(`/org/${org.slug}/for-you`);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  });

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="font-heading text-xl font-semibold">Create an organization</h1>
        <p className="text-muted-foreground text-sm">
          You&apos;ll be the owner. Invite colleagues once it&apos;s created.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Organization name
          </label>
          <Input
            id="name"
            placeholder="Acme Inc"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-brand text-xs">{errors.name.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={createOrg.isPending}>
          {createOrg.isPending ? "Creating…" : "Create organization"}
        </Button>
      </form>
    </div>
  );
};

export default Page;
