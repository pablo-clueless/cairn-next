export const requiredEnvs = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SOCKET_URL"] as const;

type RequiredEnvs = (typeof requiredEnvs)[number];

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<RequiredEnvs, string> {
      readonly NEXT_PUBLIC_API_URL: string;
      readonly NEXT_PUBLIC_SOCKET_URL: string;
      readonly NODE_ENV: "development" | "production";
    }
  }
}

export {};
