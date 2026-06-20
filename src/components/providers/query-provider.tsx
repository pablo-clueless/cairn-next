"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

import { makeQueryClient } from "@/lib/query";

/**
 * Provides a per-app TanStack Query client. Created lazily in state so the
 * client survives re-renders without being shared across SSR requests.
 */
export const QueryProvider = ({ children }: React.PropsWithChildren) => {
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
