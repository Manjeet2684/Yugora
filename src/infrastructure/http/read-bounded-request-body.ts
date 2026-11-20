// Copyright (c) 2026 Manjeet2684. All rights reserved.

/**
 * Reads an incoming request body with a strict byte ceiling.
 * The stream is cancelled immediately when the limit is exceeded; callers
 * must not buffer an unbounded request before deciding to reject it.
 */
export type BoundedRequestBodyResult =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly reason: "too-large" | "unreadable" };

export async function readBoundedRequestBody(
  request: Request,
  maxBytes: number,
): Promise<BoundedRequestBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer.");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\\d+$/u.test(declaredLength)) {
      return { ok: false, reason: "unreadable" };
    }
    if (Number(declaredLength) > maxBytes) {
      return { ok: false, reason: "too-large" };
    }
  }

  if (!request.body) {
    return { ok: true, bytes: new Uint8Array() };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      totalBytes += chunk.value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too-large" };
      }
      chunks.push(chunk.value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}
