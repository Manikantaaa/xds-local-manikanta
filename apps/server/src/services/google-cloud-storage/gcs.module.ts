import { Module } from "@nestjs/common";
import { GoogleCloudStorageService } from "./gcs.service";

@Module({
  providers: [GoogleCloudStorageService],
  exports: [GoogleCloudStorageService],
})
export class GoogleCloudStorageModule {}
