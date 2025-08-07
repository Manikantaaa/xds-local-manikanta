import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { PrismaModule } from "src/prisma/prisma.module";
import { GoogleCloudStorageModule } from 'src/services/google-cloud-storage/gcs.module';
import { CompaniesModule } from 'src/companies/companies.module';
@Module({
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsRepository,EventsService],
  imports:[PrismaModule, GoogleCloudStorageModule, CompaniesModule ]
})
export class EventsModule {}
