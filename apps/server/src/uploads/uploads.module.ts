import { Logger, Module } from "@nestjs/common";
import { UploadsService } from "./uploads.service";
import { UploadsController } from "./uploads.controller";
import { CompaniesModule } from "src/companies/companies.module";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { AssetsModule } from "src/assets/assets.module";
import { PrismaModule } from "src/prisma/prisma.module";
@Module({
  imports: [CompaniesModule, AssetsModule,PrismaModule],
  controllers: [UploadsController],
  providers: [UploadsService, Logger, GoogleCloudStorageService],
  exports: [UploadsService],
})
export class UploadsModule {}
