"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodForm } from "@/lib/zod-resolver";
import { useResetPassword } from "@/hooks/use-auth";
import { Logo } from "@/components/shared";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

const ResetForm = () => {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  const onSubmit = handleSubmit((values) => {
    reset.mutate(
      { token, password: values.password },
      {
        onSuccess: () => {
          toast.success("Password reset. Please log in.");
          router.replace("/");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  });

  if (!token) {
    return (
      <>
        <p className="font-medium">Invalid reset link</p>
        <p className="text-muted-foreground text-center text-sm">
          This password reset link is missing or malformed. Request a new one to continue.
        </p>
        <Link className="link before:bg-foreground text-sm" href="/forgot-password">
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="font-medium">Choose a new password</p>
      <form className="w-full space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-brand text-xs">{errors.password.message}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            {...register("confirm")}
          />
          {errors.confirm && <p className="text-brand text-xs">{errors.confirm.message}</p>}
        </div>
        <Button className="w-full" type="submit" disabled={reset.isPending}>
          {reset.isPending ? "Resetting…" : "Reset password"}
        </Button>
      </form>
      <Link className="link before:bg-foreground text-sm" href="/">
        Back to login
      </Link>
    </>
  );
};

const Page = () => (
  <div className="flex w-100 flex-col items-center gap-y-8 rounded-xs border bg-white p-6 dark:bg-transparent">
    <Logo />
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  </div>
);

export default Page;
