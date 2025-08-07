import { ApiProperty } from "@nestjs/swagger";
import { ROLE_CODE, USER_TYPE } from "@prisma/client";
import { IsEmail, IsIn, IsNotEmpty, IsString, IsDate } from "class-validator";

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly companyName: string;

  @ApiProperty()
  @IsString()
  readonly companyWebUrl: string;

  @ApiProperty()
  @IsString()
  readonly linkedInUrl: string;

  @ApiProperty({ enum: [ROLE_CODE.buyer, ROLE_CODE.service_provider] })
  @IsIn([ROLE_CODE.buyer, ROLE_CODE.service_provider])
  readonly role: ROLE_CODE;

  @ApiProperty()
  @IsString()
  readonly userType: 'init' | 'free';

  @ApiProperty()
  readonly adminApprovedAt: Date;

  @ApiProperty()
  readonly checkedTerms: Date;

  @ApiProperty()
  readonly isThirdParty: boolean;

  @ApiProperty()
  readonly token: string;

  @ApiProperty()
  readonly companyUsersLimit: number;

  @ApiProperty()
  readonly lastLoginDate: Date | null;

}
