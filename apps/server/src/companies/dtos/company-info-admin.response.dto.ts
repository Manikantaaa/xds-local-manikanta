import { UserResponseDto } from "src/users/dtos/users.response.dto";

export class CompanyInformationForAdmin {
  readonly id: number;
  readonly name: string;
  readonly website: string;
  readonly user: UserResponseDto;
  constructor(partial: Partial<CompanyInformationForAdmin>) {
    Object.assign(this, partial);
  }
}
