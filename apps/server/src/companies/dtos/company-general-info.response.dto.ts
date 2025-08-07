import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

export class CompanyGeneralInfoResponseDto {
  @ApiProperty()
  readonly id?: number;

  @ApiProperty()
  readonly name?: string;

  @ApiProperty()
  readonly website?: string;

  @ApiProperty()
  readonly shortDescription?: string | null;

  @ApiProperty()
  readonly about?: string | null;

  @ApiProperty()
  readonly logoUrl?: string;

  @ApiProperty()
  readonly bannerUrl?: string;

  @ApiProperty()
  readonly previewLogoUrl?: string;

  @ApiProperty()
  readonly previewBannerUrl?: string;
  @ApiProperty()
  readonly companySize?: number;

  @Exclude()
  logoAssetId?: number | null;

  @Exclude()
  bannerAssetId?: number | null;

  constructor(partial: Partial<CompanyGeneralInfoResponseDto>) {
    Object.assign(this, partial);
  }
}
