import { forwardRef, Logger, Module } from '@nestjs/common';
import { SparkPlusService } from './spark-plus.service';
import { SparkPlusController } from './spark-plus.controller';
import { SparkPlusRepository } from './spark-plus.repository';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { RegistrationRequestModule } from 'src/registration-requests/registration-requests.module';
import { RegistrationRequestsService } from 'src/registration-requests/registration-requests.service';
import { CompaniesModule } from 'src/companies/companies.module';
import { PasswordsModule } from 'src/auth/passwords/passwords.module';

@Module({
   imports: [
      UsersModule,
       MailerModule,
       PrismaModule,
       RegistrationRequestModule,
       CompaniesModule,
       forwardRef(() => PasswordsModule),
    ],
  controllers: [SparkPlusController],
  providers: [SparkPlusService,SparkPlusRepository,Logger,RegistrationRequestsService]
})
export class SparkPlusModule {}
