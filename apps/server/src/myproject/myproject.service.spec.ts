import { Test, TestingModule } from "@nestjs/testing";
import { MyprojectService } from "./myproject.service";

describe("MyprojectService", () => {
  let service: MyprojectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyprojectService],
    }).compile();

    service = module.get<MyprojectService>(MyprojectService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
