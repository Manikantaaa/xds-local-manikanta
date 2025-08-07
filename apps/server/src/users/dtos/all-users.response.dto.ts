import { Company, Roles } from "../type";

export class AllUsersResponseDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  linkedInUrl: string;
  companies?: Company[];
  userRoles: Roles[];
  constructor(partial: Partial<AllUsersResponseDto>) {
    Object.assign(this, partial);
  }
}
