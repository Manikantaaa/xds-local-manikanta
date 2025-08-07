import { Roles } from "src/users/type";

export class TopReportsDto {
  id: number;
  pageViewedCount?: number;
  pageVisitedCount?: number;
  companyId: number;
  status?: number;
  company: {
    name: string;
    website?: string;
    user: {
      firstName?: string;
      lastName?: string;
      userRoles?: Roles[];
    };
  };
}
