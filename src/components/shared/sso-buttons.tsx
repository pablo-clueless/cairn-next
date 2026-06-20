"use client";

import { GoogleIcon, MicrosoftIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Props {
  isPending?: boolean;
}

/**
 * SSO entry points. These are full-page navigations (not XHR) to the backend's
 * OAuth start endpoints, which redirect to Google/Microsoft and back to
 * `/dashboard` after setting the auth cookies.
 */
export function SsoButtons({ isPending }: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-y-3">
      <div className="text-muted-foreground flex w-full items-center gap-x-3 text-xs">
        <span className="bg-muted-foreground/20 h-px flex-1" />
        Or continue with
        <span className="bg-muted-foreground/20 h-px flex-1" />
      </div>
      <Button asChild disabled={isPending} variant="outline" className="w-full">
        <a href={`${API}/v1/auth/oauth/microsoft`}>
          <MicrosoftIcon /> Microsoft
        </a>
      </Button>
      <Button asChild disabled={isPending} variant="outline" className="w-full">
        <a href={`${API}/v1/auth/oauth/google`}>
          <GoogleIcon /> Google
        </a>
      </Button>
    </div>
  );
}
