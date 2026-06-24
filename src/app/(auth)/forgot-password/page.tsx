"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodForm } from "@/lib/zod-resolver";
import { useForgotPassword } from "@/hooks/use-auth";
import { Logo } from "@/components/shared";

const schema = z.object({
  email: z.email("Enter a valid email"),
});

type Values = z.infer<typeof schema>;

const Page = () => {
  const forgot = useForgotPassword();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  const onSubmit = handleSubmit((values) => {
    forgot.mutate(values, {
      onSuccess: () => setSent(true),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  });

  return (
    <div className="flex w-100 flex-col items-center gap-y-8 rounded-xs border bg-white p-6 dark:bg-transparent">
      <Logo />
      {sent ? (
        <>
          <p className="font-medium">Check your email</p>
          <p className="text-muted-foreground text-center text-sm">
            If an account exists for that email, we&apos;ve sent a link to reset your password. The
            link expires in 1 hour.
          </p>
          <Link className="link before:bg-foreground text-sm" href="/">
            Back to login
          </Link>
        </>
      ) : (
        <>
          <p className="font-medium">Reset your password</p>
          <p className="text-muted-foreground text-center text-sm">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
          <form className="w-full space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && <p className="text-brand text-xs">{errors.email.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={forgot.isPending}>
              {forgot.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <Link className="link before:bg-foreground text-sm" href="/">
            Back to login
          </Link>
        </>
      )}
    </div>
  );
};

export default Page;
