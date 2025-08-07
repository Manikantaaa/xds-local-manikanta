import { Logger, Module } from "@nestjs/common";
import { BackupPersonalContactsService } from "./backup-personal-contacts.service";
import { BackupPersonalContactsRepository } from "./backup-personal-contacts.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { BackupPersonalContactsController } from "./backup-personal-contacts.controller";

@Module({
  imports: [PrismaModule],
  controllers: [BackupPersonalContactsController],
  providers: [
    BackupPersonalContactsService,
    BackupPersonalContactsRepository,
    Logger,
  ],
  exports: [BackupPersonalContactsService, BackupPersonalContactsRepository],
})
export class BackupPersonalContactsModule {}
