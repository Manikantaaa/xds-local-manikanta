import { Test, TestingModule } from '@nestjs/testing';
import { MySparkNamesController } from './my-spark-names.controller';
import { MySparkNamesService } from './my-spark-names.service';

describe('MySparkNamesController', () => {
  let controller: MySparkNamesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MySparkNamesController],
      providers: [MySparkNamesService],
    }).compile();

    controller = module.get<MySparkNamesController>(MySparkNamesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
