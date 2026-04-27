declare module "next-pwa" {
  import type { NextConfig } from "next";

  type RuntimeCachingRule = {
    urlPattern: RegExp;
    handler: "NetworkOnly" | "NetworkFirst" | "CacheFirst" | "StaleWhileRevalidate";
    method?: string;
    options?: Record<string, unknown>;
  };

  type PwaOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    runtimeCaching?: RuntimeCachingRule[];
  };

  export default function withPWA(options: PwaOptions): (config: NextConfig) => NextConfig;
}
