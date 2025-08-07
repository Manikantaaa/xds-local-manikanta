import { ApiProperty } from "@nestjs/swagger";
import { $Enums, PASSWORD_STATUS, ROLE_CODE, Roles, Users as UsersPrisma } from "@prisma/client";
import { Exclude } from "class-transformer";

export class RoleDto implements Roles {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  roleCode: string;

  @Exclude()
  name: string;
  @Exclude()
  code: ROLE_CODE;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }
}

export class VerifyTokenResponseDto implements UsersPrisma {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  linkedInUrl: string;

  @ApiProperty()
  companyId?: number;

  @ApiProperty({ type: [RoleDto] })
  userRoles: RoleDto[];

  @ApiProperty()
  isFlagged: boolean;

  @ApiProperty()
  isArchieve: boolean;

  @ApiProperty()
  isDelete: boolean;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isPaidUser: boolean;
  
  @ApiProperty()
  isAddedFromCsv: boolean;

  @ApiProperty()
  userType: $Enums.USER_TYPE;

  @ApiProperty()
  checkedTerms: boolean;

  @ApiProperty()
  isLoggedOnce: boolean;

  @ApiProperty()
  firstLoggedDate: Date | null;

  @ApiProperty()
  lastLoginDate: Date | null;

  @ApiProperty()
  trialDuration: $Enums.TRIAL_PERIOD;

  @ApiProperty()
  adminApprovedAt: Date;

  @Exclude()
  approvalStatus: $Enums.APPROVAL_STATUS;
  @Exclude()
  accessExpirationDate: Date | null;
  @Exclude()
  stripeCustomerId: string | null;
  @Exclude()
  stripeSubscriptionId: string | null;

  constructor(partial: Partial<VerifyTokenResponseDto>) {
    Object.assign(this, partial);
  }
  isThirdParty: boolean;
  passwordNeedToChange: PASSWORD_STATUS;
  companyUsersLimit: number;
  isSparkUser: boolean;
}
