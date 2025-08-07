import { ROLE_CODE } from "@prisma/client";

export interface ExcelUsers {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyWebUrl: string;
  linkedInUrl: string;
  role: ROLE_CODE;
  companyDescription: string;
  companySize: number | null;
  services: number[];
}

export interface Announcement {
  announcementTitle: string;
  eventDescription: string;
  announcementUrl: string;
  announcementImageUrl: string;
  postExpiryDate: string
}
