// Copyright (c) 2026 Manjeet2684. All rights reserved.
// YUGORA HTTP boundary. Transport concerns stay outside the domain/application core.
import {
  InvalidSwipeCommandError,
  MatchInvariantViolationError,
  MatchedProfileNotFoundError,
  ProfileNotFoundError,
  SwipeConflictError,
} from "../application/errors/application-errors.js";
import type { PublicProfileDto, MatchDto } from "../application/dto/discovery-dto.js";
import type { SwipeResult } from "../application/dto/swipe-result.js";
import type { RecordSwipeCommand } from "../application/use-cases/record-swipe.use-case.js";
import { asProfileId } from "../domain/values/identifiers.js";
import type { SwipeDirection } from "../domain/entities/swipe-decision.js";
import type {
  ApiErrorResponse,
  FeedResponse,
  MatchesResponse,
  SwipeResponse,
} from "../../../shared/contracts/discovery-api.js";

const MAX_SWIPE_BODY_BYTES = 4_096;
const PRIVATE_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export interface DiscoveryHttpApplication {
  readonly getFeed: {
    execute(): Promise<readonly PublicProfileDto[]>;
  };
  readonly recordSwipe: {
    execute(command: RecordSwipeCommand): Promise<SwipeResult>;
  };
  readonly getMatches: {
    execute(): Promise<readonly MatchDto[]>;
  };
}

interface SwipeRequestBody {
  readonly profileId: string;
  readonly direction: SwipeDirection;
}

type BodyReadResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly response: Response };

function jsonResponse<T>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: PRIVATE_HEADERS,
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  retryable = false,
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, retryable },
  };
  return jsonResponse(body, status);
}

function hasInfrastructureUnavailableCode(error: unknown): boolean {
  const unavailableCodes = new Set([
    "P1001", // database server unreachable
    "P1002", // database server timed out
    "P1008", // operation timed out
    "P1017", // server closed connection
    "P2024", // connection pool timeout
    "SQLITE_BUSY",
    "SQLITE_CANTOPEN",
    "SQLITE_IOERR",
  ]);

  let candidate: unknown = error;
  for (let depth = 0; depth < 4 && candidate && typeof candidate === "object"; depth += 1) {
    const current = candidate as { readonly name?: unknown; readonly code?: unknown; readonly cause?: unknown };
    if (current.name === "PrismaClientInitializationError" || current.name === "PrismaClientRustPanicError") {
      return true;
    }
    if (typeof current.code === "string" && unavailableCodes.has(current.code)) {
      return true;
    }
    candidate = current.cause;
  }
  return false;
}

function mapApplicationError(error: unknown): Response {
  if (error instanceof InvalidSwipeCommandError) {
    return errorResponse(400, error.code, error.message);
  }
  if (error instanceof ProfileNotFoundError) {
    return errorResponse(404, error.code, error.message);
  }
  if (error instanceof SwipeConflictError) {
    return errorResponse(409, error.code, error.message);
  }
  if (hasInfrastructureUnavailableCode(error)) {
    return errorResponse(
      503,
      "SERVICE_UNAVAILABLE",
      "YUGORA is temporarily unable to complete this request. Please try again.",
      true,
    );
  }

  // Invariant violations and all unexpected errors are server faults. Never return
  // ORM messages, SQL, filesystem paths, stack traces, or configuration values.
  if (error instanceof MatchInvariantViolationError || error instanceof MatchedProfileNotFoundError) {
    return errorResponse(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
  }
  return errorResponse(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
}

async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return {
      ok: false,
      response: errorResponse(415, "UNSUPPORTED_MEDIA_TYPE", "Send the swipe request as application/json."),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return {
        ok: false,
        response: errorResponse(400, "INVALID_CONTENT_LENGTH", "The request content length is invalid."),
      };
    }
    if (Number(contentLength) > MAX_SWIPE_BODY_BYTES) {
      return {
        ok: false,
        response: errorResponse(413, "PAYLOAD_TOO_LARGE", "The swipe request is too large."),
      };
    }
  }

  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      totalBytes += chunk.value.byteLength;
      if (totalBytes > MAX_SWIPE_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return {
          ok: false,
          response: errorResponse(413, "PAYLOAD_TOO_LARGE", "The swipe request is too large."),
        };
      }
      chunks.push(chunk.value);
    }
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "INVALID_BODY", "The request body could not be read."),
    };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "INVALID_BODY_ENCODING", "The request body must contain valid UTF-8 JSON."),
    };
  }
}

function parseSwipeBody(text: string): SwipeRequestBody | Response {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return errorResponse(400, "INVALID_JSON", "The request body must contain valid JSON.");
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return errorResponse(400, "INVALID_REQUEST", "The swipe request must be a JSON object.");
  }

  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.some((key) => key !== "profileId" && key !== "direction")) {
    return errorResponse(400, "INVALID_REQUEST", "Only profileId and direction are accepted. The acting user is resolved by the server.");
  }
  if (typeof body.profileId !== "string") {
    return errorResponse(400, "INVALID_REQUEST", "profileId must be a string.");
  }

  const profileId = body.profileId.trim();
  if (
    profileId.length === 0 ||
    profileId.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(profileId)
  ) {
    return errorResponse(400, "INVALID_REQUEST", "profileId must contain between 1 and 128 valid characters.");
  }
  if (body.direction !== "LIKE" && body.direction !== "PASS") {
    return errorResponse(400, "INVALID_REQUEST", "direction must be exactly LIKE or PASS.");
  }

  return { profileId, direction: body.direction };
}

export function createDiscoveryHttpHandlers(application: DiscoveryHttpApplication) {
  return {
    async getFeed(): Promise<Response> {
      try {
        const profiles = await application.getFeed.execute();
        const body: FeedResponse = { profiles };
        return jsonResponse(body);
      } catch (error) {
        return mapApplicationError(error);
      }
    },

    async postSwipe(request: Request): Promise<Response> {
      const readResult = await readBoundedBody(request);
      if (!readResult.ok) return readResult.response;

      const parsed = parseSwipeBody(readResult.text);
      if (parsed instanceof Response) return parsed;

      try {
        const result = await application.recordSwipe.execute({
          profileId: asProfileId(parsed.profileId),
          direction: parsed.direction,
        });
        const body: SwipeResponse = result;
        return jsonResponse(body);
      } catch (error) {
        return mapApplicationError(error);
      }
    },

    async getMatches(): Promise<Response> {
      try {
        const matches = await application.getMatches.execute();
        const body: MatchesResponse = { matches };
        return jsonResponse(body);
      } catch (error) {
        return mapApplicationError(error);
      }
    },
  };
}
