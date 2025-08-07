import { PartialType } from "@nestjs/swagger";
import { CreateMyprojectDto } from "./create-myproject.dto";

export class UpdateMyprojectDto extends PartialType(CreateMyprojectDto) {}
