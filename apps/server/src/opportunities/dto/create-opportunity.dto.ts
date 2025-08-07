import { IsNotEmpty } from "class-validator";

export class CreateOpportunityDto {
  @IsNotEmpty({ message: "comapany Id Requires" })
  companyId: number;
  @IsNotEmpty({ message: "Opportunity Id Requires" })
  opportunityId: number;
  @IsNotEmpty({ message: "description Requires" })
  description: string;
}
