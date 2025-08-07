import { PartialType } from "@nestjs/swagger";
import { CreateServiceproviderDto } from "./create-serviceprovider.dto";

export class UpdateServiceproviderDto extends PartialType(
  CreateServiceproviderDto,
) {}
