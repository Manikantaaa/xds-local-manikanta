import { Module } from "@nestjs/common";
import { MyopportunitiesService } from "./myopportunities.service";
import { MyopportunitiesController } from "./myopportunities.controller";
import { MyopportunitiesRepository } from "./myopportunities.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { UsersModule } from "src/users/users.module";
import { MailerModule } from "src/mailer/mailer.module";

@Module({
  imports: [PrismaModule, UsersModule, MailerModule],
  controllers: [MyopportunitiesController],
  providers: [
    MyopportunitiesService,
    MyopportunitiesRepository,
    GoogleCloudStorageService,
  ],
  exports: [MyopportunitiesService, MyopportunitiesRepository],
})
export class MyopportunitiesModule {}
