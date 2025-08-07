import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly idToken: string;
  readonly checkedTerms?: boolean;
  readonly checkedRemember2f?: string;
  readonly storedUserId?: number;
}
