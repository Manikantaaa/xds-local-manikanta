import {
  Logger,
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { MailerModule } from "./mailer/mailer.module";
import config from "./common/config/configuration";
import { AuthModule } from "./auth/auth.module";
import { PasswordsModule } from "./auth/passwords/passwords.module";
import { AuthAndRolesGuard } from "./common/guards/auth-and-roles.guard";
import { WebhookModule } from "./webhook/webhook.module";
import { StripeModule } from "./services/stripe/stripe.module";
import { HealthModule } from "./health/health.module";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { BackupPersonalContactsModule } from "./users/backup-personal-contacts/backup-personal-contacts.module";
import { CompaniesModule } from "./companies/companies.module";
import { UploadsModule } from "./uploads/uploads.module";
import { ServiceprovidersModule } from "./serviceproviders/serviceproviders.module";
import { MylistModule } from "./mylist/mylist.module";
import { MyprojectModule } from "./myproject/myproject.module";
import { OpportunitiesModule } from "./opportunities/opportunities.module";
import { MyopportunitiesModule } from "./myopportunities/myopportunities.module";
import { CronJobsModule } from './cron-jobs/cron-jobs.module';
import { EventsModule } from './events/events.module';
import { ArticlesModule } from './articles/articles.module';
import { CompanyAdminModule } from './company-admin/company-admin.module';
import { CompanyReportsModule } from './company-reports/company-reports.module';
import { MySparkNamesModule } from './my-spark-names/my-spark-names.module';
import { SparkPlusModule } from './spark-plus/spark-plus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    MailerModule,
    PasswordsModule,
    WebhookModule,
    StripeModule,
    HealthModule,
    BackupPersonalContactsModule,
    CompaniesModule,
    UploadsModule,
    ServiceprovidersModule,
    MylistModule,
    MyprojectModule,
    OpportunitiesModule,
    MyopportunitiesModule,
    CronJobsModule,
    EventsModule,
    ArticlesModule,
    CompanyAdminModule,
    CompanyReportsModule,
    MySparkNamesModule,
    SparkPlusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthAndRolesGuard,
    },
    Logger,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
