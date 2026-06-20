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
import { zodForm } from "@/lib/zod-resolver";
import { useLogin } from "@/hooks/use-auth";
import { Logo } from "@/components/shared";
import { useUserStore } from "@/store";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

const Page = () => {
  const router = useRouter();
  const signin = useUserStore((s) => s.signin);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: async (user) => {
        await signin(user);
        toast.success(`Welcome back, ${user.name}`);
        if (user.is_platform_admin) {
          router.replace("/dashboard");
        } else {
          router.replace(`/org/${user.default_org_slug}/for-you`);
        }
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  });

  return (
    <div className="flex w-100 flex-col items-center gap-y-8 rounded-xs border bg-white p-6 dark:bg-transparent">
      <Logo />
      <p className="font-medium">Login to continue</p>
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
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-brand text-xs">{errors.password.message}</p>}
        </div>
        <Button className="w-full" type="submit" disabled={login.isPending}>
          {login.isPending ? "Logging in…" : "Login"}
        </Button>
      </form>
      <SsoButtons isPending={login.isPending} />
      <div className="flex items-center gap-x-4">
        <Link className="link before:bg-foreground text-sm" href="/forgot-password">
          Forgot Password
        </Link>
        <span className="size-1 rounded-full bg-gray-300" />
        <Link className="link before:bg-foreground text-sm" href="/create-account">
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default Page;
