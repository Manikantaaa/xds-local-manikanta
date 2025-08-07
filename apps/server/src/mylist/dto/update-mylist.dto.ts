import { PartialType } from "@nestjs/swagger";
import { CreateMylistDto } from "./create-mylist.dto";

export class UpdateMylistDto extends PartialType(CreateMylistDto) {}
