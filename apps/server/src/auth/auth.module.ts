import { Logger, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "src/users/users.module";
import { MailerModule } from "src/mailer/mailer.module";
import { RegistrationRequestModule } from "src/registration-requests/registration-requests.module";
import { RegistrationRequestsRepository } from "src/registration-requests/registration-request.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { CompaniesModule } from "src/companies/companies.module";

@Module({
  imports: [
    PassportModule,
    UsersModule,
    MailerModule,
    RegistrationRequestModule,
    PrismaModule,
    CompaniesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RegistrationRequestsRepository, Logger],
  exports: [AuthService],
})
export class AuthModule {}
