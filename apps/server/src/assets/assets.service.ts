import { Injectable, Logger } from "@nestjs/common";
import { AssetsRepository } from "./assets.repository";
import { ASSET_TYPE, Assets } from "@prisma/client";

@Injectable()
export class AssetsService {
  constructor(
    private readonly logger: Logger,
    private readonly assetsRepo: AssetsRepository,
  ) {}

  updateUrl(id: number, url: string) {
    return this.assetsRepo.update(id, { url });
  }

  findById(id: number): Promise<Assets | null> {
    return this.assetsRepo.findFirst({ id });
  }

  createImage(userId: number, url: string): Promise<Assets> {
    return this.assetsRepo.create({
      userId,
      url,
      assetType: ASSET_TYPE.image,
    });
  }

  deleteByAssetId(id: number) {
    return this.assetsRepo.delete(id);
  }
}
