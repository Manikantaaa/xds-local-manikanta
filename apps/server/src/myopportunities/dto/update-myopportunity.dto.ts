import { PartialType } from "@nestjs/swagger";
import { CreateMyopportunityDto } from "./create-myopportunity.dto";

export class UpdateMyopportunityDto extends PartialType(
  CreateMyopportunityDto,
) {}
