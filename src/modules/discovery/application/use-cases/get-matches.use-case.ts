import type { CurrentUserPort } from "../ports/current-user.port.js";
import type { MatchRepositoryPort } from "../ports/match-repository.port.js";
import type { ProfileRepositoryPort } from "../ports/profile-repository.port.js";
import { otherParticipant } from "../../domain/entities/match.js";
import { MatchedProfileNotFoundError } from "../errors/application-errors.js";
import { toMatchDto, type MatchDto } from "../dto/discovery-dto.js";

export class GetMatchesUseCase {
  constructor(
    private readonly currentUser: CurrentUserPort,
    private readonly matches: MatchRepositoryPort,
    private readonly profiles: ProfileRepositoryPort,
  ) {}

  async execute(): Promise<readonly MatchDto[]> {
    const currentUserId = await this.currentUser.getCurrentUserId();
    const matches = await this.matches.listForUser(currentUserId);

    return Promise.all(matches.map(async (match) => {
      const counterpartId = otherParticipant(match, currentUserId);
      const profile = await this.profiles.findByOwnerUserId(counterpartId);
      if (!profile) throw new MatchedProfileNotFoundError();
      return toMatchDto(match, currentUserId, profile);
    }));
  }
}
