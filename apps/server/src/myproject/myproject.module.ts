import { Module } from "@nestjs/common";
import { MyprojectService } from "./myproject.service";
import { MyprojectController } from "./myproject.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { MyProjectRepository } from "./myproject.repository";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { MylistService } from "src/mylist/mylist.service";
import { MylistModule } from "src/mylist/mylist.module";

@Module({
  imports: [PrismaModule, MylistModule],
  controllers: [MyprojectController],
  providers: [MyprojectService, MyProjectRepository, GoogleCloudStorageService, MylistService],
  exports: [MyprojectService, MyProjectRepository],
})
export class MyprojectModule {}
