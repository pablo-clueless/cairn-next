"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { QueryProvider } from "./query-provider";
import { useOrg } from "@/hooks/use-orgs";
import { Organization } from "@/types";
import { useUserStore } from "@/store";

interface AppContextProps {
  isCollapsed: boolean;
  isNotificationEnabled: boolean;
  onCollapsedChange: () => void;
  onNotificationEnabledChange: () => void;
  organization: Organization | undefined;
}

const defaultContextProps: AppContextProps = {
  isCollapsed: false,
  isNotificationEnabled: false,
  onCollapsedChange: () => {},
  onNotificationEnabledChange: () => {},
  organization: undefined,
};

const AppContext = createContext<AppContextProps>({ ...defaultContextProps });

export const AppProvider = ({ children }: React.PropsWithChildren & {}) => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUserStore();

  const { data: organization } = useOrg(user?.default_org_slug || "");

  const onCollapsedChange = () => {
    setIsCollapsed((prev) => !prev);
  };

  const onNotificationEnabledChange = () => {
    setIsNotificationEnabled((prev) => !prev);
  };

  const requestPermission = useCallback(async () => {
    if (!("Noitification" in window)) {
      console.warn("Notifications not supported");
      return;
    }
    if (Notification.permission === "granted") {
      console.log("Notification permission granted");
      return;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      console.log({ permission });
      // setIsNotificationEnabled(true)
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return (
    <QueryProvider>
      <AppContext.Provider
        value={{
          isCollapsed,
          isNotificationEnabled,
          onCollapsedChange,
          onNotificationEnabledChange,
          organization,
        }}
      >
        {children}
      </AppContext.Provider>
    </QueryProvider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
