import { Test, TestingModule } from "@nestjs/testing";
import { MyprojectController } from "./myproject.controller";
import { MyprojectService } from "./myproject.service";

describe("MyprojectController", () => {
  let controller: MyprojectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyprojectController],
      providers: [MyprojectService],
    }).compile();

    controller = module.get<MyprojectController>(MyprojectController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
