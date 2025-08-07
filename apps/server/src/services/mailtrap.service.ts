import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Nodemailer from "nodemailer";
import { TemplateType, getHtml } from "../mailer/templates";
import { Options } from "nodemailer/lib/mailer";

@Injectable()
export class MailtrapService {
  private readonly mailtrap;
  constructor(private readonly configService: ConfigService) {
    this.mailtrap = Nodemailer.createTransport({
      host: configService.get("XDS_MAILTRAP_HOST"),
      port: configService.get("XDS_MAILTRAP_PORT"),
      auth: {
        user: configService.get("XDS_MAILTRAP_AUTH_USER"),
        pass: configService.get("XDS_MAILTRAP_AUTH_PASS"),
      },
    });
  }

  send(mailDataRequired: Options, template: TemplateType) {
    const options: Options = {
      ...mailDataRequired,
      from: {
        address: "no-reply@xds-spark.com",
        name: "XDS Spark",
      },
      html: getHtml(template),
      replyTo: 'no-replyto@xds-spark.com',
    };

    return this.mailtrap.sendMail(options);
  }
}
