import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreatePasswordDto {
  @ApiProperty({ description: "token in approval email" })
  @IsString()
  @IsNotEmpty()
  readonly token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/, {
    message:
      "Please ensure the password meets the requirements - min 6 characters with at least one number, one letter, one special character",
  })
  readonly password: string;
}
