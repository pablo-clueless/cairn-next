"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { QueryProvider } from "./query-provider";

interface AppContextProps {
  isCollapsed: boolean;
  isNotificationEnabled: boolean;
  onCollapsedChange: () => void;
  onNotificationEnabledChange: () => void;
}

const defaultContextProps: AppContextProps = {
  isCollapsed: false,
  isNotificationEnabled: false,
  onCollapsedChange: () => {},
  onNotificationEnabledChange: () => {},
};

const AppContext = createContext<AppContextProps>({ ...defaultContextProps });

export const AppProvider = ({ children }: React.PropsWithChildren & {}) => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
