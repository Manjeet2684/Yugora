// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { getDiscoveryHttpHandlers } from "../../src/infrastructure/http/discovery-route-singleton.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(request: Request): Promise<Response> {
  return getDiscoveryHttpHandlers(request).getMatches();
}
