import { Logger, Module, forwardRef } from "@nestjs/common";
import { PasswordsController } from "./passwords.controller";
import { PasswordsService } from "./passwords.service";
import { StripeModule } from "src/services/stripe/stripe.module";
import { StripeService } from "src/services/stripe/stripe.service";
import { UsersService } from "src/users/users.service";
import { UsersModule } from "src/users/users.module";
import { RegistrationRequestsService } from "src/registration-requests/registration-requests.service";
import { RegistrationRequestModule } from "src/registration-requests/registration-requests.module";
import { MailerModule } from "src/mailer/mailer.module";
import { CompaniesService } from "src/companies/companies.service";
import { CompaniesModule } from "src/companies/companies.module";
import { ServiceprovidersModule } from "src/serviceproviders/serviceproviders.module";
import { FirebaseService } from "src/services/firebase/firebase.service";
import { FirebaseModule } from "src/services/firebase/firebase.module";
// import { FirebaseService } from "src/services/firebase/firebase.service";

@Module({
  imports: [
    StripeModule,
    UsersModule,
    forwardRef(() => RegistrationRequestModule), 
    MailerModule,
    CompaniesModule,
    ServiceprovidersModule,
    FirebaseModule
  ],
  controllers: [PasswordsController],
  providers: [
    PasswordsService,
    StripeService,
    UsersService,
    RegistrationRequestsService,
    CompaniesService,
    Logger,
    FirebaseService,
  ],
  exports: [PasswordsService]
})
export class PasswordsModule {}
