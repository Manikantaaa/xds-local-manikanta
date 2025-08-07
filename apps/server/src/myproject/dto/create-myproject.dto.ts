import { IsNotEmpty } from "class-validator";

export class CreateMyprojectDto {
  @IsNotEmpty({ message: "My List Name Requires" })
  name: string;
  description: string;
  @IsNotEmpty({ message: "User Id Requires" })
  userId: number;
  companies?: string[];
}
