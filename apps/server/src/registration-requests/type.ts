import { APPROVAL_STATUS, PASSWORD_STATUS } from "@prisma/client";

export type ConfirmRequest = {
  id: number;
  approvalStatus: APPROVAL_STATUS;
  completeSetupToken?: string | null;
  passwordNeedToChange?: PASSWORD_STATUS;
};
