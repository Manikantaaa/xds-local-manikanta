import { Module } from '@nestjs/common';
import { CompanyReportsService } from './company-reports.service';
import { CompanyReportsController } from './company-reports.controller';
import { CompanyReportsRepository } from './company-reports.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  controllers: [CompanyReportsController],
  providers: [CompanyReportsService,CompanyReportsRepository],
  imports:[PrismaModule]
})
export class CompanyReportsModule {}
