"use client";

import { useApiMutation, useApiQuery } from "@/lib/query";
import type { HttpResponse, User } from "@/types";

/** Unwraps the API success envelope's `data` field. */
const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

/** Unwraps the authenticated user from an auth response (`data.user`). */
const authUser = (raw: unknown) => (raw as HttpResponse<{ user: User }>).data.user;

export interface LoginVars {
  email: string;
  password: string;
}

export interface SignupVars {
  name: string;
  email: string;
  password: string;
}

/** Current user, revalidated against `GET /v1/me`. Cookies are the source of truth. */
export const useMe = (enabled = true) =>
  useApiQuery<User>({ url: "/v1/me", enabled, transform: data<User> });

export const useLogin = () =>
  useApiMutation<User, LoginVars>({
    method: "POST",
    url: "/v1/auth/login",
    transform: authUser,
  });

export const useSignup = () =>
  useApiMutation<User, SignupVars>({
    method: "POST",
    url: "/v1/auth/signup",
    transform: authUser,
  });

export const useLogout = () =>
  useApiMutation<unknown, object>({ method: "POST", url: "/v1/auth/logout" });
