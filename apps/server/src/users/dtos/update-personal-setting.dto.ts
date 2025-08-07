import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class UpdatePersonalSettingDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty()
  readonly companyname: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly linkedInUrl: string;

  @ApiProperty()
  @IsOptional()
  readonly backupFirstName: string;

  @ApiProperty()
  @IsOptional()
  readonly backupLastName: string;

  @ApiProperty()
  @IsOptional()
  // @IsEmail()
  readonly backupEmail: string;

}
