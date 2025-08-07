import { ROLE_CODE, USER_TYPE, Users } from "@prisma/client";

export type UserRequest = Omit<
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
  | "status"
  | "isPaidUser"
  | "stripeSubscriptionId"
  | "isAddedFromCsv"
  | "trialDuration"
  | "checkedTerms"
  | "isLoggedOnce"
  | "firstLoggedDate"
  | "passwordNeedToChange"
  | "isSparkUser"
> & {
  role: ROLE_CODE;
  companyName: string;
  companyWebUrl: string;
};

export type UpdateUserProps = {
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  linkedInUrl: string | undefined;
};

export type Company = {
  id: number;
  name: string | undefined;
  website: string | undefined;
  shortDescription: string | undefined;
  companySize: number | undefined;
  about: string | undefined;
  logoAssetId: number | undefined;
  bannerAssetId: number | undefined;
};

export type Roles = {
  id: number;
  roleCode: string | undefined;
};

export type advertisements = {
  companyName :    string;
  adImagePath :    string;
  mobileAdImagePath: string;
  logoImagePath?: string;
  adURL       :    string;
  adURLStaticPage?  :    string | null;
  adPage      :    string;
  startDate   :    Date;
  endDate     :    Date;
  isArchieve  :    boolean;
  clicksReceived : number;
};
export type advertisement = {
  companyName :    string;
  adImagePath :    string;
  mobileAdImagePath: string;
  logoImagePath?: string;
  adURL       :    string;
  adURLStaticPage?  :    string;
  adPage      :    string;
  startDate   :    string;
  endDate     :    string;
  isArchieve  :    boolean;
  clicksReceived : number;
};

export type faqData = 
{
  type: string,
   qsnData: 
   {
    id: number,
    question: string,
    answer: string,
    isArchieve: boolean,
    orderById?: number,
  }
};

export type UpdatePersonalSettingsProps = UpdateUserProps;

export type FollowNotification = {
  notificationById: number;
  notificationToId: number;
  notificationDescription: string | null; // Allow null if it's nullable
  notifyingCompany: {
    name: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      assets:{
        url: string;
      }[]
    };
  };
  notifiedCompany: {
    name: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export type AdminNotifications = {
  notificationDescription :    string;
  isDisplay              :    boolean;
  isDelete                :    boolean;
  startDate?               :    string;
  endDate?                 :    string;
};
