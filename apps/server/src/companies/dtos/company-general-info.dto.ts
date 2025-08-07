import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CompanyGeneralInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly website: string;

  @ApiProperty()
  // @IsNotEmpty()
  readonly shortDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly logoUrl: string;

  @ApiProperty()
  @IsOptional()
  readonly bannerUrl: string;

  @ApiProperty()
  @IsOptional()
  readonly companySize: number;
}
