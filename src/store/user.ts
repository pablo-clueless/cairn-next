import { createPersistMiddleware } from "./middleware";
import type { Maybe, User } from "@/types";

interface SignoutOptions {
  redirectTo?: string;
  soft?: boolean;
}

interface UserStore {
  hydrate: () => void;
  isHydrated: boolean;
  user: Maybe<User>;
  member: Maybe<User>;
  signin: (user: User) => Promise<void>;
  signout: (options?: SignoutOptions) => void;
}

/**
 * Persisted auth store. Holds the signed-in user for instant paint; the
 * httpOnly cookies remain the source of truth and `useMe` revalidates against
 * `GET /v1/me` on mount. `user` (the account) drives auth/role; `member` is the
 * optional linked directory record used for display. Both are persisted;
 * `isHydrated` flips once rehydration completes so guards can avoid
 * SSR/localStorage mismatches.
 *
 * @example
 * const user = useUserStore((s) => s.user);
 * useUserStore.getState().signout({ soft: true });
 */
export const useUserStore = createPersistMiddleware<UserStore>(
  "user",
  (set) => ({
    user: null,
    member: null,
    isHydrated: false,
    hydrate: () => set({ isHydrated: true }),
    signin: (user) => {
      return new Promise<void>((resolve) => {
        set({ user });
        resolve();
      });
    },
    signout: (options) => {
      set({ user: null, member: null });
      if (options?.soft || typeof window === "undefined") return;
      const redirectTo = options?.redirectTo ?? "/";
      if (window.location.pathname !== redirectTo) window.location.href = redirectTo;
    },
  }),
  {
    partialize: (state) => ({ user: state.user, member: state.member }),
    onRehydrateStorage: () => (state) => state?.hydrate(),
  },
);
