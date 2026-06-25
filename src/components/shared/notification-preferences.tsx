"use client";

import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { getApiErrorMessage } from "@/lib/client";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import type { NotificationPreferences } from "@/types";

const ROWS: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  { key: "email_mentions", label: "Mentions", hint: "When someone @mentions you" },
  { key: "email_comments", label: "Comments", hint: "New comments on issues you watch" },
  { key: "email_assignments", label: "Assignments", hint: "When an issue is assigned to you" },
];

export const NotificationPreferencesCard = () => {
  const prefs = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const toggle = (key: keyof NotificationPreferences, value: boolean) =>
    update.mutate(
      { [key]: value },
      { onError: (error) => toast.error(getApiErrorMessage(error)) },
    );

  return (
    <div className="space-y-3 rounded-xs border p-4">
      <div>
        <h2 className="text-sm font-medium">Email notifications</h2>
        <p className="text-muted-foreground text-xs">
          In-app notifications are always on. Choose what also emails you.
        </p>
      </div>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">{row.label}</p>
              <p className="text-muted-foreground text-xs">{row.hint}</p>
            </div>
            <Switch
              checked={prefs.data?.[row.key] ?? true}
              disabled={prefs.isLoading || update.isPending}
              onCheckedChange={(checked) => toggle(row.key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
