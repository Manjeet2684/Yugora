// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { CurrentUserPort } from "../../modules/discovery/application/ports/current-user.port.js";
import { asUserId } from "../../modules/discovery/domain/values/identifiers.js";

/** Single-user assignment adapter; the browser never chooses the actor ID. */
export class EnvironmentCurrentUserAdapter implements CurrentUserPort {
  private readonly userId = asUserId(process.env.DEMO_USER_ID?.trim() || "demo-user");

  async getCurrentUserId() {
    return this.userId;
  }
}
