import { Module } from '@nestjs/common';
import { CompanyAdminService } from './company-admin.service';
import { CompanyAdminController } from './company-admin.controller';
import { CompaniesAdminRepository } from './company-admin.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  controllers: [CompanyAdminController],
  providers: [CompanyAdminService, CompaniesAdminRepository],
  exports: [CompaniesAdminRepository],
  imports:[PrismaModule, MailerModule]
})
export class CompanyAdminModule {}
