import type { UserId } from "../../domain/values/identifiers.js";

/** Server-side identity boundary. Browser-supplied user IDs are not accepted. */
export interface CurrentUserPort {
  getCurrentUserId(): Promise<UserId>;
}
