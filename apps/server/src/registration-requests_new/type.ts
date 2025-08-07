import { APPROVAL_STATUS } from "@prisma/client";

export type ConfirmRequest = {
  id: number;
  approvalStatus: APPROVAL_STATUS;
  completeSetupToken?: string | null;
};
