import { Test, TestingModule } from '@nestjs/testing';
import { SparkPlusController } from './spark-plus.controller';
import { SparkPlusService } from './spark-plus.service';

describe('SparkPlusController', () => {
  let controller: SparkPlusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SparkPlusController],
      providers: [SparkPlusService],
    }).compile();

    controller = module.get<SparkPlusController>(SparkPlusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
