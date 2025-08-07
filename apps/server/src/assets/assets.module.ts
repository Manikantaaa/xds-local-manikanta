import { Logger, Module } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { AssetsRepository } from "./assets.repository";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  providers: [AssetsService, AssetsRepository, Logger],
  exports: [AssetsService, AssetsRepository],
  imports: [PrismaModule],
})
export class AssetsModule {}
