import { forwardRef, Logger, Module } from "@nestjs/common";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { CompaniesRepository } from "./companies.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { GoogleCloudStorageModule } from "src/services/google-cloud-storage/gcs.module";
import { AssetsModule } from "src/assets/assets.module";
import { CompaniesOperation } from "./companies.operation";
import { MailerModule } from "src/mailer/mailer.module";
import { UsersModule } from "src/users/users.module";
import { ServiceprovidersModule } from "src/serviceproviders/serviceproviders.module";

@Module({
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompaniesRepository,
    Logger,
    CompaniesOperation,
  ],
  exports: [CompaniesService, CompaniesRepository, CompaniesModule],
  imports: [
    PrismaModule,
    GoogleCloudStorageModule,
    AssetsModule,
    MailerModule,
    UsersModule,
    forwardRef(() => ServiceprovidersModule),
  ],
})
export class CompaniesModule {}
