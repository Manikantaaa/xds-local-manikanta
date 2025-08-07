import { Test, TestingModule } from '@nestjs/testing';
import { MySparkNamesService } from './my-spark-names.service';

describe('MySparkNamesService', () => {
  let service: MySparkNamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MySparkNamesService],
    }).compile();

    service = module.get<MySparkNamesService>(MySparkNamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
