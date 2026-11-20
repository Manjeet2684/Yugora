// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { CurrentUserPort } from "../../modules/discovery/application/ports/current-user.port.js";
import { asUserId } from "../../modules/discovery/domain/values/identifiers.js";
import { ensureApplicationUser, getAuthenticatedUser } from "./neon-auth-context.js";

export class NeonAuthCurrentUserAdapter implements CurrentUserPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly request: Request,
  ) {}

  async getCurrentUserId() {
    const user = await getAuthenticatedUser(this.request);
    if (!user) {
      const error = new Error("Sign in with your email before using YUGORA.");
      error.name = "AuthenticationRequiredError";
      throw error;
    }
    await ensureApplicationUser(this.prisma, user);
    return asUserId(user.id);
  }
}
