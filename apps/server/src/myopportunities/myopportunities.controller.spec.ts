import { Test, TestingModule } from "@nestjs/testing";
import { MyopportunitiesController } from "./myopportunities.controller";
import { MyopportunitiesService } from "./myopportunities.service";

describe("MyopportunitiesController", () => {
  let controller: MyopportunitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyopportunitiesController],
      providers: [MyopportunitiesService],
    }).compile();

    controller = module.get<MyopportunitiesController>(
      MyopportunitiesController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
