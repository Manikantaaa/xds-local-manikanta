import { Users } from "./user.type";

export interface Company {
  id: number;
  name: string;
  website: string;
  shortDescription: string;
  companySize: number;
  about: string;
  profilePdfPath : string;
  profilePdfName : string;
  logoUrl: string;
  bannerUrl: string;
  previewLogoUrl: string;
  previewBannerUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isArchieve: number;
  status: number;
  user: Users;
}

export type ServiceCapabilities = {
  id: number;
  groupId: number;
  categoryId: number,
  serviceName: string;
  isChecked: boolean;
  showCapabilities: boolean;
  serviceCategories: {name : string},
  capabilities: { id: number; capabilityName: string; isChecked: boolean }[];
};

export type PortfolioProject = {
  name: string;
  projectCDate: Date;
  platforms: number[];
  description: string;
  fileUrls: { type: string; fileUrl: string, thumbmail?: string}[];
  testimonial:{
    name: string;
    title: string;
    companyname: string;
    message: string;
  }
};

export type PortfolioAlbum = {
  name: string;
  albumFiles: {
    signdeUrl: string,
    filename: string,
    indexId: string,
    selectedFile: boolean,
  }
}

export type AdminGroupsType = {id : number,isDefault : boolean,name: string,
  _count:{
      companyadminuser: number
  }}
