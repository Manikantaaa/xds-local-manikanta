import { Injectable } from "@nestjs/common";
import { CreateMyopportunityDto } from "./dto/create-myopportunity.dto";
// import { UpdateMyopportunityDto } from "./dto/update-myopportunity.dto";
import { MyopportunitiesRepository } from "./myopportunities.repository";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { MailerService } from "src/mailer/mailer.service";

@Injectable()
export class MyopportunitiesService {
  constructor(
    private readonly myopportunityRepo: MyopportunitiesRepository,
    private readonly mailerService: MailerService,) { }
  async create(createMyopportunityDto: CreateMyopportunityDto, role: string = "") {
    // return this.myopportunityRepo.create(createMyopportunityDto);
    const response = await this.myopportunityRepo.create(sanitizeData(createMyopportunityDto), role);
    if(response?.opportunityId && createMyopportunityDto.oppStatus == "publish"){
      await this.sendingEmailAndNotification(createMyopportunityDto, response.opportunityId);
    }
    return response;
  }

  findIndustriesService() {
    return this.myopportunityRepo.findIndustriesRepo();
  }

  async findIntrestedListservice(id: number, companyID: number) {
    await this.myopportunityRepo.updateIntrestSetToRead(+id);
    const count = await this.getCountOfNewIntrests(+companyID);
    const intrestedList = await this.myopportunityRepo.findIntrestedList(id);
    return {
      count: count,
      intrestedList: intrestedList,
      statusCode: 200
    }
  }
  
  async findAll(companyId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOpportunities: any = await this.myopportunityRepo.findall(companyId);
    if(allOpportunities.data && allOpportunities.data.length > 0) {
      for(let item of allOpportunities?.data) {
        item.anyNewIntrest = false;
        if(item.serviceProvidersIntrests && item.serviceProvidersIntrests.length > 0) {
          for(let intrest of item.serviceProvidersIntrests) {
            if(intrest.isNewIntrest) {
              item.anyNewIntrest = true;
            }
          }
        }
      }
    }
    return allOpportunities;
  }

  archiveOpportunityservice(id: number, companyId: number) {
    return this.myopportunityRepo.archiveMyOpportunity(id,companyId);
  }

  draftOrPublishOpportunityService(id: number) {
    return this.myopportunityRepo.draftOrPublishOpportunity(id);
  }

  findArchivedListService(companyId: number) {
    return this.myopportunityRepo.findArchivedMyOpportunities(companyId);
  }

  deleteMyOpportunityService(id: number) {
    return this.myopportunityRepo.deleteMyOpportunity(id);
  }

  async updateOpportunityService(updateMyopportunity: CreateMyopportunityDto) {
  const updatedOpportunity = await this.myopportunityRepo.updateMyOpportunity(sanitizeData(updateMyopportunity));
  if(updatedOpportunity?.opportunityId  && updateMyopportunity.oppStatus == "publish"){
    await this.sendingEmailAndNotification(updateMyopportunity, updatedOpportunity?.opportunityId);
  }  
   return updatedOpportunity;
    // return this.myopportunityRepo.updateMyOpportunity(updateMyopportunity);
  }

  findOne(id: number, companyId: number) {
    return this.myopportunityRepo.findById(id, companyId);
  }

  checkOpportunityByCompanyId(companyId: number, OpportunityId:number){
    return this.myopportunityRepo.checkOpportunityByCompanyId(companyId,OpportunityId);
  }

  async getCountOfNewIntrests(companyId: number){
    const details = await this.myopportunityRepo.getCountOfNewIntrests(companyId);
    let counts = 0;
    for(let item of details) {
      if(item.serviceProvidersIntrests.length > 0) {
        counts = counts + item.serviceProvidersIntrests.length;
      }
    }
    return counts;
  }

  async sendingEmailAndNotification(createMyopportunityDto: CreateMyopportunityDto, opportunityId: number) {
    const findServicesMatchedCompanies = await this.myopportunityRepo.findServicesMatchedCompanies(createMyopportunityDto);
    if(opportunityId && findServicesMatchedCompanies){
      let compniesList:{companyId:number, email: string, firstName: string}[] = [];
      // if(findServicesMatchedCompanies.capabilitiesSelected.length > 0){
      //   findServicesMatchedCompanies.capabilitiesSelected.map((company:{company:{id:number, user:{email: string, firstName: string}}})=>{
      //     compniesList.push({companyId: company.company.id, email: company.company.user.email, firstName: company.company.user.firstName});
      //   })  
      // }
      if(findServicesMatchedCompanies.servicesselected.length > 0){
        findServicesMatchedCompanies.servicesselected.map((company:{company:{id:number, user:{email: string, firstName: string}}})=>{
          compniesList.push({companyId: company.company.id, email: company.company.user.email, firstName: company.company.user.firstName});
        }) 
      }
      const uniqueCompanies = Array.from(
        new Map(compniesList.map((company) => [company.companyId, company])).values()
      );
      
      const companiesNotSentBefore = await this.myopportunityRepo.sendNotificationsToSp(createMyopportunityDto.companyId, opportunityId, uniqueCompanies);

      if(companiesNotSentBefore.success) {
        for( const sendMails of companiesNotSentBefore.data) {
         console.log(sendMails.email);
         this.mailerService.buyerNewOpportinityServicesMatchedCompanies(opportunityId, sendMails.email, sendMails.firstName);
        }
      }
    }
  }

  async getAllOpportunites() {
    return await this.myopportunityRepo.getAllOpportunites();
  }

}
