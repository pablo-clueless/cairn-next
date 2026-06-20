"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TabPanel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/client";
import { useMe } from "@/hooks/use-auth";
import { useSettings, useUpdateSettings } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Account", value: "account" },
  { label: "Billing", value: "billing" },
  { label: "Security", value: "security" },
  { label: "Integrations", value: "integrations" },
];

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="text-sm">{value ?? "—"}</p>
  </div>
);

const Page = () => {
  const [currentTab, setCurrentTab] = useState(TABS[0].value);
  const updateSettings = useUpdateSettings();
  const settings = useSettings();
  const me = useMe();

  const [trialDays, setTrialDays] = useState(14);
  useEffect(() => {
    if (settings.data) setTrialDays(settings.data.default_trial_days);
  }, [settings.data]);

  const onSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      { default_trial_days: trialDays },
      {
        onSuccess: () => toast.success("Default trial updated"),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium">Settings</p>
        <p className="text-muted-foreground text-sm">Platform-wide configuration</p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b" role="tablist">
        {TABS.map((tab) => {
          const active = tab.value === currentTab;
          return (
            <button
              aria-selected={active}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-brand text-brand font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
              key={tab.value}
              onClick={() => setCurrentTab(tab.value)}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <TabPanel selected={currentTab} value="account">
        <div className="w-full space-y-4 rounded-xs border p-4">
          <Field label="Name" value={me.data?.name} />
          <Field label="Email" value={me.data?.email} />
          <Field label="Role" value={me.data?.is_platform_admin ? "Platform admin" : "Member"} />
        </div>
      </TabPanel>
      <TabPanel selected={currentTab} value="billing">
        <form onSubmit={onSaveBilling} className="w-full space-y-4 rounded-xs border p-4">
          <div className="space-y-1">
            <label htmlFor="trial" className="text-sm font-medium">
              Default free-trial days
            </label>
            <p className="text-muted-foreground text-xs">
              Applied to new organizations when billing is enabled.
            </p>
            <Input
              id="trial"
              type="number"
              min={0}
              className="w-40"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </TabPanel>
      <TabPanel selected={currentTab} value="security">
        <div className="text-muted-foreground rounded-xs border border-dashed p-8 text-center text-sm">
          Security settings are coming soon.
        </div>
      </TabPanel>
      <TabPanel selected={currentTab} value="integrations">
        <div className="text-muted-foreground rounded-xs border border-dashed p-8 text-center text-sm">
          Integrations are coming soon.
        </div>
      </TabPanel>
    </div>
  );
};

export default Page;
