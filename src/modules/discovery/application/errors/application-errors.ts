// Copyright (c) 2026 Manjeet2684. All rights reserved.
export abstract class ApplicationError extends Error {
  protected constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProfileNotFoundError extends ApplicationError {
  constructor() {
    super("This profile is unavailable.", "PROFILE_NOT_FOUND");
  }
}

export class SwipeConflictError extends ApplicationError {
  constructor() {
    super(
      "A different decision has already been recorded for this profile.",
      "SWIPE_CONFLICT",
    );
  }
}

export class InvalidSwipeCommandError extends ApplicationError {
  constructor(message = "The swipe request is invalid.") {
    super(message, "INVALID_SWIPE");
  }
}

export class MatchedProfileNotFoundError extends ApplicationError {
  constructor() {
    super("A matched participant profile could not be resolved.", "MATCH_PROFILE_INVARIANT_BROKEN");
  }
}

/** Raised when persistence is asked to store a match without two persisted LIKE decisions. */
export class MatchInvariantViolationError extends ApplicationError {
  constructor() {
    super(
      "A match can only be persisted after both participants have recorded a LIKE.",
      "MATCH_INVARIANT_VIOLATION",
    );
  }
}
