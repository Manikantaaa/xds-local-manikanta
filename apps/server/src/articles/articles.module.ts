import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleRepository } from './articles.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleCloudStorageModule } from 'src/services/google-cloud-storage/gcs.module';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleRepository],
  exports: [ArticleRepository,ArticlesService],
  imports:[PrismaModule, GoogleCloudStorageModule]
})
export class ArticlesModule {}
