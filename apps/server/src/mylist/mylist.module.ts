import { Module } from "@nestjs/common";
import { MylistService } from "./mylist.service";
import { MylistController } from "./mylist.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { MylistRepository } from "./mylist.repository";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
@Module({
  controllers: [MylistController],
  providers: [MylistService, MylistRepository, GoogleCloudStorageService],
  exports: [MylistService, MylistRepository],
  imports: [PrismaModule],
})
export class MylistModule {}
