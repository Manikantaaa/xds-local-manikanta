import { Logger, Module } from "@nestjs/common";
import { MailerController } from "./mailer.controller";
import { MailerService } from "./mailer.service";
import { MailtrapService } from "../services/mailtrap.service";

@Module({
  providers: [MailerService, MailtrapService, Logger],
  exports: [MailerService],
  controllers: [MailerController],
})
export class MailerModule {}
