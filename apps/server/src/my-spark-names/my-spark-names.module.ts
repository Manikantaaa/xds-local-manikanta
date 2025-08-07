import { Module } from '@nestjs/common';
import { MySparkNamesService } from './my-spark-names.service';
import { MySparkNamesController } from './my-spark-names.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MysparkRepository } from './my-spark-names.repository';

@Module({
  controllers: [MySparkNamesController],
  providers: [MySparkNamesService,MysparkRepository],
  imports: [PrismaModule],
})
export class MySparkNamesModule {}
