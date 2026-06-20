import type { StateCreator } from "zustand/vanilla";
import { persist, type PersistOptions } from "zustand/middleware";
import { create } from "zustand/react";

import { reportException } from "./report";

/**
 * Creates a localStorage-persisted Zustand store wrapped with error reporting.
 *
 * @param name - Storage key for the persisted state.
 * @param storeCreator - The store's state creator.
 * @param options - Extra persist options (`partialize`, `onRehydrateStorage`, ...).
 * @returns A bound `useStore` hook.
 *
 * @example
 * const useCartStore = createPersistMiddleware<CartStore>("cart", (set) => ({ ... }), {
 *   partialize: (s) => ({ items: s.items }),
 * });
 */
export const createPersistMiddleware = <T>(
  name: string,
  storeCreator: StateCreator<T>,
  options?: Omit<PersistOptions<T, Partial<T>>, "name">,
) =>
  create<T>(
    reportException<T>(
      persist(storeCreator, {
        name: name || "z:root",
        ...options,
      } as PersistOptions<T>) as StateCreator<T>,
    ),
  );
