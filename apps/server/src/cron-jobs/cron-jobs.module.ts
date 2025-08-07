import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { CronJobsController } from './cron-jobs.controller';
import { UsersModule } from 'src/users/users.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { CronJobsRepository } from './cron-jobs.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    MailerModule,
    PrismaModule
  ],
  controllers: [CronJobsController],
  providers: [CronJobsService, CronJobsRepository]
})
export class CronJobsModule {}
