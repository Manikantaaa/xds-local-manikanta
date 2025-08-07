import { forwardRef, Module } from "@nestjs/common";
import { ServiceprovidersService } from "./serviceproviders.service";
import { ServiceprovidersController } from "./serviceproviders.controller";
import { ServiceProvidersRepository } from "./serviceproviders.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { CompaniesModule } from "src/companies/companies.module";
import { CompaniesService } from "src/companies/companies.service";

@Module({
  controllers: [ServiceprovidersController],
  providers: [
    ServiceprovidersService,
    ServiceProvidersRepository,
    GoogleCloudStorageService,
  ],
  exports: [
    ServiceprovidersService,
    ServiceProvidersRepository,
    GoogleCloudStorageService,
  ],
  imports: [PrismaModule, forwardRef(() => CompaniesModule)],
})
export class ServiceprovidersModule {}
