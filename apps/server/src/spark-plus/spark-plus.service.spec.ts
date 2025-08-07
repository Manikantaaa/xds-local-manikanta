import { Test, TestingModule } from '@nestjs/testing';
import { SparkPlusService } from './spark-plus.service';

describe('SparkPlusService', () => {
  let service: SparkPlusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SparkPlusService],
    }).compile();

    service = module.get<SparkPlusService>(SparkPlusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
