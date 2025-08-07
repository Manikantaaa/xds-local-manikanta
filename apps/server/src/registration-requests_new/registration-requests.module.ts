import { Module } from "@nestjs/common";
import { RegistrationRequestController } from "./registration-requests.controller";
import { RegistrationRequestsService } from "./registration-requests.service";
import { RegistrationRequestsRepository } from "./registration-request.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { MailerModule } from "src/mailer/mailer.module";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "src/users/users.module";
import { CompaniesModule } from "src/companies/companies.module";

@Module({
  imports: [
    PrismaModule,
    MailerModule,
    ConfigModule,
    UsersModule,
    CompaniesModule,
  ],
  controllers: [RegistrationRequestController],
  providers: [RegistrationRequestsService, RegistrationRequestsRepository],
  exports: [RegistrationRequestsRepository],
})
export class RegistrationRequestModule {}
