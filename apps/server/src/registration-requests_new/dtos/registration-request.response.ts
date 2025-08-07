import { $Enums } from "@prisma/client";
import { Exclude } from "class-transformer";
import { AllUsersResponseDto } from "src/users/dtos/all-users.response.dto";

export class RegistrationRequestsResponse {
  id: number;
  submissionDate: Date;
  approvalStatus: $Enums.APPROVAL_STATUS;
  approvalDate: Date | null;
  comment: string | null;
  isArchieve: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date | null;
  user: AllUsersResponseDto;

  @Exclude()
  completeSetupToken: string | null;
}
