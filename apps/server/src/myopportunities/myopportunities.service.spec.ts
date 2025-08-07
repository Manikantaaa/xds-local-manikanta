import { Test, TestingModule } from "@nestjs/testing";
import { MyopportunitiesService } from "./myopportunities.service";

describe("MyopportunitiesService", () => {
  let service: MyopportunitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyopportunitiesService],
    }).compile();

    service = module.get<MyopportunitiesService>(MyopportunitiesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
