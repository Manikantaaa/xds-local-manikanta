import { ROLE_CODE, Users } from "@prisma/client";

export type UserRequestSpark = Omit<
  Users,
  | "id"
  | "approvalStatus"
  | "stripeCustomerId"
  | "accessExpirationDate"
  | "isArchieve"
  | "isFlagged"
  | "isDelete"
  | "createdAt"
  | "updatedAt"
  | "isSparkUser"
  | "status"
  | "isPaidUser"
  | "stripeSubscriptionId"
  | "isAddedFromCsv"
  | "trialDuration"
  | "checkedTerms"
  | "isLoggedOnce"
  | "firstLoggedDate"
  | "passwordNeedToChange"
> & {
  role: ROLE_CODE;
  companyName: string;
  companyWebUrl: string;
  buyerId:number
};