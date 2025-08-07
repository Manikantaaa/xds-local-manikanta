import { Module } from "@nestjs/common";
import { OpportunitiesService } from "./opportunities.service";
import { OpportunitiesController } from "./opportunities.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { OpportunitiesRepository } from "./opportunities.repository";
import { MailerService } from "src/mailer/mailer.service";
import { Logger } from "@nestjs/common";
import { MailtrapService } from "src/services/mailtrap.service";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
@Module({
  imports: [PrismaModule],
  controllers: [OpportunitiesController],
  providers: [
    OpportunitiesService,
    OpportunitiesRepository,
    MailerService,
    Logger,
    MailtrapService,
    GoogleCloudStorageService,
  ],
})
export class OpportunitiesModule {}
