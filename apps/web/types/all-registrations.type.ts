import { APPROVAL_STATUS, Users } from "./user.type";

export interface AllRegistrations {
  id: number;
  submissionDate: Date;
  approvalStatus: APPROVAL_STATUS;
  approvalDate: Date | null;
  comment: string | null;
  isArchieve: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  user: Users;
}
