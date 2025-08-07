import { Injectable } from "@nestjs/common";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { OpportunitiesRepository } from "./opportunities.repository";

@Injectable()
export class OpportunitiesService {
  constructor(private readonly OpportunitiesRepo: OpportunitiesRepository) {}

  create(createOpportunityDto: {companyId: number, opportunityId: number, description: string, addedFiles: {
    albumId: number;
    albumName: string;
    type: string;
    checkedCount: number;
    files: {
        imageFile: string;
        imagePath: string;
        isChecked: boolean;
    }[];
}[] }) {
    return this.OpportunitiesRepo.createOpportnutyInstrest(
      createOpportunityDto,
    );
  }

  findAll(
    services: string[],
    search: string,
    page: number,
    limit: number,
    SortField: string,
    sortCustomColumn: string,
    sortCustomColumnOrder: string,
  ) {
    return this.OpportunitiesRepo.findOpportunities(
      services,
      search,
      page,
      limit,
      SortField,
      sortCustomColumn,
      sortCustomColumnOrder,

    );
  }

  findOpportunityDetails(id: number, companyId: number,Type:string = 'view') {
    return this.OpportunitiesRepo.findOpportunityDetailsById(id, companyId,Type);
  }
}
