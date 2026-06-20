"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";

import { SsoButtons } from "@/components/shared/sso-buttons";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignup } from "@/hooks/use-auth";
import { zodForm } from "@/lib/zod-resolver";
import { Logo } from "@/components/shared";
import { useUserStore } from "@/store";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Values = z.infer<typeof schema>;

const Page = () => {
  const router = useRouter();
  const signin = useUserStore((s) => s.signin);
  const signup = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  const onSubmit = handleSubmit((values) => {
    signup.mutate(values, {
      onSuccess: async (user) => {
        await signin(user);
        toast.success("Account created");
        router.push("/dashboard");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  });

  return (
    <div className="flex w-100 flex-col items-center gap-y-8 rounded-xs border bg-white p-6 dark:bg-transparent">
      <Logo />
      <p className="font-medium">Sign up to continue</p>

      <form className="w-full space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-brand text-xs">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
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

        <Button className="w-full" type="submit" disabled={signup.isPending}>
          {signup.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <SsoButtons />

      <div className="flex items-center gap-x-4">
        <Link className="link before:bg-foreground text-sm" href="/">
          Already have a Cairn account? Log in
        </Link>
      </div>
    </div>
  );
};

export default Page;
