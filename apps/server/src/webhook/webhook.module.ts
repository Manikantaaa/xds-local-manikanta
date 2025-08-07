import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller";
import { StripeModule } from "src/services/stripe/stripe.module";
import { StripeService } from "src/services/stripe/stripe.service";
import { PaymentModule } from "src/payment/payment.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [StripeModule, PaymentModule, UsersModule],
  providers: [StripeService],
  controllers: [WebhookController],
})
export class WebhookModule {}
