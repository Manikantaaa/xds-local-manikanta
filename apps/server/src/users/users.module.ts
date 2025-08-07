import { Logger, Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { UsersOperation } from "./users.operation";
import { StripeService } from "src/services/stripe/stripe.service";
import { FirebaseService } from "src/services/firebase/firebase.service";
import { BackupPersonalContactsModule } from "./backup-personal-contacts/backup-personal-contacts.module";
import { MailerModule } from "src/mailer/mailer.module";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersOperation,
    StripeService,
    FirebaseService,
    Logger,
    GoogleCloudStorageService,
  ],
  exports: [UsersService, UsersOperation, UsersRepository],
  imports: [PrismaModule, BackupPersonalContactsModule, MailerModule,],
})
export class UsersModule {}
