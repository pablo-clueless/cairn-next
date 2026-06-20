"use client";

import { useParams, useRouter } from "next/navigation";
import { Check, LogOut, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useLogout } from "@/hooks/use-auth";
import { useOrgs } from "@/hooks/use-orgs";
import { getInitials } from "@/lib/string";
import { useUserStore } from "@/store";
import { cn } from "@/lib/utils";

const itemClass =
  "hover:bg-muted flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm";

/** Avatar dropdown: profile, org switcher, admin console, and sign-out. */
export function UserMenu() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const user = useUserStore((s) => s.user);
  const signout = useUserStore((s) => s.signout);
  const logout = useLogout();
  const orgs = useOrgs();

  const onSignOut = () => logout.mutate({}, { onSettled: () => signout({ redirectTo: "/" }) });

  return (
    <Popover>
      <PopoverTrigger
        aria-label="User menu"
        className="focus-visible:ring-brand rounded-full outline-none focus-visible:ring-2"
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-[10px]">{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0">
        <div className="px-1 pb-2">
          <p className="truncate font-medium">{user?.name}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </div>
        <div className="border-t pt-2">
          <button type="button" className={itemClass} onClick={() => router.push("/profile")}>
            <UserRound className="size-3.5" /> Profile
          </button>
          {slug && (
            <button
              type="button"
              className={itemClass}
              onClick={() => router.push(`/org/${slug}/settings`)}
            >
              <Settings className="size-3.5" /> Organization settings
            </button>
          )}
          {user?.is_platform_admin && (
            <button type="button" className={itemClass} onClick={() => router.push("/dashboard")}>
              <ShieldCheck className="size-3.5" /> Admin console
            </button>
          )}
        </div>
        {/* Platform admins operate the platform and cannot belong to an org. */}
        {!user?.is_platform_admin && (
          <div className="mt-2 border-t pt-2">
            <p className="text-muted-foreground px-1 pb-1 text-xs">Switch organization</p>
            <div className="flex max-h-48 flex-col overflow-y-auto">
              {orgs.data?.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => router.push(`/org/${o.slug}/for-you`)}
                  className={cn(
                    "hover:bg-muted flex items-center justify-between rounded-xs px-2 py-1.5 text-left text-sm",
                    o.slug === slug && "bg-muted",
                  )}
                >
                  <span className="truncate">{o.name}</span>
                  {o.slug === slug && <Check className="size-3.5 shrink-0" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={itemClass}
              onClick={() => router.push("/dashboard/new")}
            >
              <Plus className="size-3.5" /> New organization
            </button>
          </div>
        )}
        <div className="mt-2 border-t pt-2">
          <button
            type="button"
            className={itemClass}
            onClick={onSignOut}
            disabled={logout.isPending}
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
