import { USER_TYPE } from "./user.type";

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyWebUrl: string;
  linkedInUrl: string;
  role: "buyer" | "service_provider";
  userType?: USER_TYPE;
  token?: string;
}
