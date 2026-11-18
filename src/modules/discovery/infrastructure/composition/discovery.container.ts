// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type {
  CurrentUserPort,
  MatchRepositoryPort,
  ProfileRepositoryPort,
  UnitOfWorkPort,
} from "../../application/ports/index.js";
import { GetFeedUseCase } from "../../application/use-cases/get-feed.use-case.js";
import { GetMatchesUseCase } from "../../application/use-cases/get-matches.use-case.js";
import { RecordSwipeUseCase } from "../../application/use-cases/record-swipe.use-case.js";

export interface DiscoveryDependencies {
  readonly currentUser: CurrentUserPort;
  readonly profiles: ProfileRepositoryPort;
  readonly matches: MatchRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
  readonly createId: () => string;
  readonly now?: () => Date;
}

/**
 * Composition root: concrete adapters are supplied from the outside.
 * This module imports no framework, ORM, database or HTTP implementation.
 */
export function createDiscoveryApplication(dependencies: DiscoveryDependencies) {
  return {
    getFeed: new GetFeedUseCase(dependencies.currentUser, dependencies.profiles),
    recordSwipe: new RecordSwipeUseCase(
      dependencies.currentUser,
      dependencies.unitOfWork,
      dependencies.createId,
      dependencies.now,
    ),
    getMatches: new GetMatchesUseCase(
      dependencies.currentUser,
      dependencies.matches,
      dependencies.profiles,
    ),
  };
}
