import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional } from "class-validator";

export class CreateBackupPersonalContactDto {
  @ApiProperty()
  @IsOptional()
  readonly firstName: string;

  @ApiProperty()
  @IsOptional()
  readonly lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  readonly email: string;
}
