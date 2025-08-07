import { ASSET_TYPE, Companies, WORK_MODEL_TYPE } from "@prisma/client";

export type UpdatedGeneralInfoPayload = {
  userId: number;
  isPaidUser: boolean;
  company: Companies;
  updatedGeneralInfo: UpdatedCompanyGeneralInfo;
};

export type UpdatedCompanyGeneralInfo = {
  readonly name: string;
  readonly website: string;
  readonly shortDescription: string;
  readonly logoUrl: string;
  readonly bannerUrl?: string;
  readonly companySize: number;
  readonly deletedLogo?: string;
  readonly deletedBanner?: string;
  readonly uniqueFormId?: string;
};

export type UpdatedGeneralInfoText = {
  companyId: number;
  name: string;
  website: string;
  shortDescription: string;
  companySize: number;
  oldName: string;
  oldSlug?: string | null;
};

export type CompanyAddresses = {
  company_id: number;
  location_name: string;
  address1: string;
  address2: string;
  state: string;
  city: string;
  zipcode: string;
  countryId: number;
};

export type CompanyPlatforms = {
  companyId: number;
  platformId: number;
  isActive: boolean;
  isDelete: boolean;
};

export type CertificateAndDiligence = {
  companyId: number;
  foundingYear: Date;
  founderName: string;
  foundingDescription: string;
  workModel: WORK_MODEL_TYPE;
  certifications: string;
  Security: string;
  tools: string;
};

export type Project = {
  id: number;
  name: string;
  projectCDate: Date;
  platforms: number[];
  description: string;
  fileUrls: {
    thumbnail: string, type: ASSET_TYPE; fileUrl: string
  }[];
  testimonial: {
    name: string;
    title: string;
    companyname: string;
    message: string;
  }
};

export type Contacts = {
  profilePic: string;
  companyId: number;
  countryId: number;
  name: string;
  email: string;
  title: string;
  linkedInUrl: string;
  calendarLink?: string;
};

export type GameEngines = {
  companyId: number;
  gameEngineName: string;
  isChecked: boolean;
  isDelete: boolean;
};
