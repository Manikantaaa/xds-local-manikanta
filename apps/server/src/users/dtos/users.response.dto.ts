import { $Enums, PASSWORD_STATUS, Users as UsersPrisma } from "@prisma/client";
import { Exclude } from "class-transformer";

export class UserResponseDto implements UsersPrisma {
  slug?: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  linkedInUrl: string;
  companyId?: number;
  isDelete: boolean;
  isArchieve: boolean;
  isFlagged: boolean;
  status: number;
  adminApprovedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isPaidUser: boolean;
  isAddedFromCsv: boolean;
  accessExpirationDate: Date | null;
  stripeSubscriptionId: string | null;
  userType: $Enums.USER_TYPE;
  checkedTerms: boolean;
  isLoggedOnce: boolean;
  firstLoggedDate: Date | null;
  lastLoginDate: Date | null;
  trialDuration: $Enums.TRIAL_PERIOD;
  enable2Fa?: boolean;
  passwordNeedToChange: PASSWORD_STATUS;
  twoFactorDetails?: {
    isActive?: boolean | null,
    otp?: string | null,
    otpCreatedAt?: Date | null
  } | null;

  @Exclude()
  approvalStatus: $Enums.APPROVAL_STATUS;
  
  @Exclude()
  stripeCustomerId: string | null;
  
  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
  isThirdParty: boolean;
  companyUsersLimit: number;
  isSparkUser:boolean
}
