import type { CurrentUserPort } from "../ports/current-user.port.js";
import type { ProfileRepositoryPort } from "../ports/profile-repository.port.js";
import { toPublicProfileDto, type PublicProfileDto } from "../dto/discovery-dto.js";

export class GetFeedUseCase {
  constructor(
    private readonly currentUser: CurrentUserPort,
    private readonly profiles: ProfileRepositoryPort,
  ) {}

  async execute(): Promise<readonly PublicProfileDto[]> {
    const viewerUserId = await this.currentUser.getCurrentUserId();
    const profiles = await this.profiles.listEligibleForViewer(viewerUserId);
    return profiles.map(toPublicProfileDto);
  }
}
