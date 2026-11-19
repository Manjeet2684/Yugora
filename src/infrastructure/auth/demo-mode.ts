// Copyright (c) 2026 Manjeet2684. All rights reserved.

/**
 * Assignment guest access is opt-in and never active in a Production runtime.
 * Vercel Preview may enable it per branch; local development may opt in for tests.
 */
export function isPublicDemoMode(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const enabled = env.YUGORA_PUBLIC_DEMO_MODE?.trim().toLocaleLowerCase("en-US") === "true";
  const isProductionRuntime = env.NODE_ENV === "production";
  return enabled && (!isProductionRuntime || env.VERCEL_ENV === "preview");
}
