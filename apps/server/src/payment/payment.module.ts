import { Module } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { UsersModule } from "src/users/users.module";
import { StripeService } from "src/services/stripe/stripe.service";
import { PaymentOperation } from "./payment.operation";
import { PaymentService } from "./payment.service";
import { MailerModule } from "src/mailer/mailer.module";

@Module({
  imports: [UsersModule, MailerModule],
  providers: [UsersService, StripeService, PaymentOperation, PaymentService],
  exports: [PaymentOperation],
})
export class PaymentModule {}
