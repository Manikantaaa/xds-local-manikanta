import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateMylistDto } from "./dto/create-mylist.dto";
import { UpdateMylistDto } from "./dto/update-mylist.dto";
import { MylistRepository } from "./mylist.repository";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { generateToken, getDaysBetweenTwoDates, getThubnailUrl } from "src/common/methods/common-methods";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { $Enums, ROLE_CODE } from "@prisma/client";
@Injectable()
export class MylistService {
  constructor(private readonly mylistRepo: MylistRepository, private readonly gcsService: GoogleCloudStorageService) {}
  create(createMylistDto: CreateMylistDto, companyId: number, role: string = "") {
    // return this.mylistRepo.CreateMyList(createMylistDto);
    return this.mylistRepo.CreateMyList(sanitizeData(createMylistDto), companyId, role);
  }

  async findMylist(userId: number) {
    const responselist = this.mylistRepo.findAllMyLists(userId);
    return responselist;
  }

  findOne(id: number, userId: number) {
    return this.mylistRepo.findMylist(id, userId);
  }
  findMyIntrestedList(id: number, userId: number, type?: string) {
    return this.mylistRepo.findMylistIntrests(id, userId, type);
  }

  update(id: number, updateMylistDto: UpdateMylistDto, userId: number, companyId: number) {
    // return this.mylistRepo.updateMyList(id, updateMylistDto);
    return this.mylistRepo.updateMyList(id, sanitizeData(updateMylistDto), userId, companyId);
  }

  remove(id: number, userId: number) {
    return this.mylistRepo.deletemylist(id, userId);
  }
  async archiveMyList(id: number, userId: number) {
    return this.mylistRepo.archivemylist(id, userId);
  }

  async removeCompanyFromMyList(id: number, mylistId: number, userId: number) {
    return this.mylistRepo.removefrommylist(id, mylistId, userId);
  }

  async getarchivedMyList(id: number) {
    return this.mylistRepo.getarchivedMyList(id);
  }

  async generateToken(listId: number, userId: number, companyId: number,) {
    const theListDetails = await this.mylistRepo.getListById(listId);
    const companiesInList = await this.getCompaniesInList(listId);
    if(companiesInList.length <= 0){
      throw new BadRequestException("There are no companies to export");
    }
    if(userId == theListDetails?.userId) {
      if(theListDetails && theListDetails.id && companiesInList) {
        await this.checkExportLimit(companyId, companiesInList.length,theListDetails.name,1, "List", $Enums.EXPORT_TYPE.sharelink)
        this.createExportCount(companyId,companiesInList.length,1,$Enums.EXPORT_TYPE.sharelink)
        const theToken = generateToken();
        return this.mylistRepo.createListSharingDetail(theListDetails.id, theToken);
      } else {
        throw new BadRequestException("List not found");
      }
    } else {
      throw new BadRequestException("Unauthorized Access");
    }
  }

  async getListIdByToken(token: string) {
    try {
      return await this.mylistRepo.getListIdByToken(token);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getCompaniesInList(listId: number) {
    try{
      const theCompanies = await this.mylistRepo.getCompaniesPresentInList(listId);
      const theFinalArr = [];
      for(const item of theCompanies) {
        const theStructuredObject = {
          id: item.id,
          list: {
            id: item.list.id,
            name: item.list.name,
            description: item.list.description
          },
          company: {
            id: item.company.id,
            name: item.company.name,
            website: item.company.website,
            slug: item.company.slug,
            bannerLogo: {
              url: item.company.bannerAsset?.url ? await this.gcsService.getPublicSignedUrl(item.company.bannerAsset?.url) : ""
            },
            companyAddress: [],
            portfolioAlbums: [],
            services: []
          }
        }

        const companyLocation: any = item.company.CompanyAddress.map((addr) => {
          return addr.Country?.name;
        });

        const uniqueCompanyLocations = companyLocation.filter((item: string, index: number, self: any) => self.indexOf(item) === index)

        const companyServices: any = item.company.ServicesOpt.map((el) => {
          return {
            id: el.id,
            serviceName: el.service?.serviceName,
            groupId: el.service?.groupId
          }
        });

        const theFinalPortfolioFiles: any = [];
        for(let el of item.company.portfolioAlbum) {
          const theAlbum = {
            id: el.id,
            name: el.albumName,
            file: []
          }
          const theFilesArr: any = [];
          for(let subEl of el.portfolioAlbumFiles) {
            const theFileObj: any = {
              fileUrl: (subEl.fileUrl && subEl.fileUrl != "") ? (subEl.type == 'image') ? await this.gcsService.getPublicSignedUrl(subEl.fileUrl) : subEl.fileUrl : "",
              thumbnail: (subEl.thumbnail && subEl.thumbnail != "") ? await this.gcsService.getPublicSignedUrl(getThubnailUrl(subEl.thumbnail)) : "",
              type: subEl.type ? subEl.type : ""
            };
            theFilesArr.push(theFileObj);
          }
          theAlbum.file = theFilesArr;
          theFinalPortfolioFiles.push(theAlbum);
        }
        
        theStructuredObject.company.companyAddress = uniqueCompanyLocations;
        theStructuredObject.company.services = companyServices;
        theStructuredObject.company.portfolioAlbums = theFinalPortfolioFiles;
        theFinalArr.push(theStructuredObject);
      }
      return theFinalArr;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  async createExportReport(companyId: number, type: string, message: string, exportType: $Enums.EXPORT_TYPE){
    return this.mylistRepo.createExportReport(companyId, type, message, exportType);
  }

  async createExportCount(companyId:number, companyCount: number, listCount: number = 1, exportType: $Enums.EXPORT_TYPE){
    return this.mylistRepo.createExportCount(companyId, companyCount, listCount, exportType);
  }
  async findTodayLimitCount(companyId:number, exportType: $Enums.EXPORT_TYPE){
    return this.mylistRepo.findListToadyLimit(companyId, exportType);
  }

  async checkExportLimit(companyId: number, CompaniesCount: number, listName: string, listCount : number, Type: string, exportType:$Enums.EXPORT_TYPE){
    const errorFor = exportType == "export" ? "export" : "share"
    let message = "";
    let error = new Error();
    if(CompaniesCount > 30){
      error = new Error(`You may only ${errorFor} a list of up to 30 Service Providers per day.`);
      message = `Reached the limit of 30 companies ${errorFor} per day</n>List Name: ${listName}</n>Companies: ${CompaniesCount}`;
    }else if(listCount > 3){
      error = new Error(`You may only ${errorFor} up to 3 lists of Service Providers per day.`);
      message = `Reached the limit of 3 ${errorFor}s per day.</n>List Name: ${listName}</n>Companies: ${CompaniesCount}`;
    }
    if(message && message.length > 2){
      await this.createExportReport(companyId, Type, message, exportType);
      throw error;
    }
    const getTodayLimit = await this.findTodayLimitCount(companyId, exportType);
    
    if (getTodayLimit && getTodayLimit.exportedListCount && getTodayLimit.exportedCompaniesCount  && (getTodayLimit.exportedListCount > 2 || (getTodayLimit.exportedCompaniesCount + CompaniesCount > 30))) {
      let error = new Error(`You may only ${errorFor} a list of up to 30 Service Providers per day.`);

      message = `Reached the limit of 30 companies ${errorFor} per day</n>List Name: ${listName}</n>Companies: ${CompaniesCount}`;
      if ((getTodayLimit.exportedListCount > 2 || getTodayLimit.exportedListCount + listCount > 3)) {
        error = new Error(`You may only ${errorFor} up to 3 lists of Service Providers per day.`);
        message = `Reached the limit of 3 ${errorFor}s per day.</n>List Name: ${listName}</n>Companies: ${CompaniesCount}`;
      }

      
      // let message = `Attempted to export the list '${listName}' containing a total of ${CompaniesCount} service providers.`;
      if(Type === "Project"){
        message = `Reached the limit of 3 ${errorFor}s per day.</n>Project Name: ${listName}</n>List Count: ${listCount}</n>Companies: ${CompaniesCount}`
       // message = `Attempted to export the project '${listName}' containing a total of ${CompaniesCount} lists with ${CompaniesCount} service providers.`;
      }
      await this.createExportReport(companyId, Type, message, exportType);
      throw error;
    }
  }

  async addListInUser(token: string, userId: number, companyId: number, role: string = "") {
    try {
      const list = await this.mylistRepo.findListIdByToken(token);
      if(!list?.listId){
        throw new BadRequestException('Invalid Token');
      }
      if(getDaysBetweenTwoDates(new Date(), list.theTokenUpdatedDate) > 28){
        throw new BadRequestException("Link Expired");
      }

      const listId = list?.listId || 0;
      const listDetails = await this.mylistRepo.getListById(listId);
      if(listDetails) {
        const companiesInList = await this.mylistRepo.getCompaniesPresentInList(listId);
        if(companiesInList && companiesInList.length > 0) {
          const theCompanies = companiesInList.map((el) => el.company.id.toString());
          const theListToAdd: CreateMylistDto = {
            name: listDetails.name,
            description: listDetails.description,
            userId: userId,
            companies: theCompanies,
          }
          return await this.mylistRepo.CreateMyList(sanitizeData(theListToAdd), companyId, role);
        }
      }
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

}
