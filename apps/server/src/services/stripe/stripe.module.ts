import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { UsersService } from "src/users/users.service";
import { UsersModule } from "src/users/users.module";
import { MailerModule } from "src/mailer/mailer.module";

@Module({
  imports: [UsersModule, MailerModule],
  providers: [StripeService, UsersService],
  exports: [StripeService],
})
export class StripeModule {}
