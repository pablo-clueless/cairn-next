import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import type { ApiErrorBody } from "@/types";
import { useUserStore } from "@/store";

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const inflight = new Map<string, Promise<unknown>>();

function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;
  const promise = factory().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/**
 * Axios instance for the church-ms API. Auth rides on httpOnly cookies set by
 * the API (`access_token` on `/`, `refresh_token` scoped to `/v1/auth`), so no
 * Authorization header is attached client-side.
 */
export const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let refreshing: Promise<void> | null = null;

const refreshSession = () => {
  refreshing ??= client
    .post("/v1/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

client.interceptors.response.use(undefined, async (error: AxiosError<ApiErrorBody>) => {
  const config = error.config as RetriableRequest | undefined;
  const isAuthEndpoint = config?.url?.includes("/v1/auth/") ?? false;
  if (error.response?.status !== 401 || !config || config._retry || isAuthEndpoint) throw error;

  config._retry = true;
  try {
    await refreshSession();
  } catch {
    useUserStore.getState().signout();
    throw error;
  }
  return client(config);
});

/**
 * Extracts the human-readable message from an API error response.
 *
 * @param error - The unknown error thrown by an `http`/`client` call.
 * @param fallback - Message used when the error carries no API envelope.
 * @returns The API `message` field, or the fallback.
 *
 * @example
 * try { await login.mutateAsync(values); } catch (e) { toast.error(getApiErrorMessage(e)); }
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) =>
  axios.isAxiosError<ApiErrorBody>(error) ? (error.response?.data?.message ?? fallback) : fallback;

export const http = {
  get: <T>(url: string, params?: object) => client.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, data?: unknown) =>
    dedupe(`POST:${url}:${JSON.stringify(data ?? "")}`, () =>
      client.post<T>(url, data).then((r) => r.data),
    ),
  put: <T>(url: string, data?: unknown) =>
    dedupe(`PUT:${url}:${JSON.stringify(data ?? "")}`, () =>
      client.put<T>(url, data).then((r) => r.data),
    ),
  patch: <T>(url: string, data?: unknown) =>
    dedupe(`PATCH:${url}:${JSON.stringify(data ?? "")}`, () =>
      client.patch<T>(url, data).then((r) => r.data),
    ),
  delete: <T>(url: string, params?: object) =>
    client.delete<T>(url, { params }).then((r) => r.data),
};
