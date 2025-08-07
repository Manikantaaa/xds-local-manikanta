import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateServiceproviderDto } from "./dto/create-serviceprovider.dto";
import { ProjectPerformanceDto } from "./dto/createbuyerProjectPerformance.dto";
import { CreateOverallratings } from "./dto/createOverallRating.dto";
import { CreateRatesByserviceDto } from "./dto/createratebyservice.dto";
import { ServiceProvidersRepository } from "./serviceproviders.repository";
import { $Enums, ROLE_CODE } from "@prisma/client";
import { toLocalISOString } from "src/common/methods/common-methods";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { Announcement } from "src/common/types/common-interface";
import { CompaniesRepository } from "src/companies/companies.repository";
@Injectable()
export class ServiceprovidersService {
  constructor(
    private readonly serviceprovidersRepo: ServiceProvidersRepository,
    private readonly gcsService: GoogleCloudStorageService,
    private readonly companiesRepo: CompaniesRepository
  ) { }

  async findAll(
    start: number,
    limit: number,
    searchVal: string,
    selectedCapabilityIdarray: { [serviceId: string]: string[] },
    region: string[],
    companysize: string[],
    sortField: string,
    sortColumn: string,
    sortColumnOrder: string,
    loggedInUser: number,
    isPremiumUsersOnly: string,
    eventsSelectedArray: { id: number, name: string }[],
    selectedPlatforms:  { id: number, name: string }[],
  ) {
    const serviceproviders = await this.serviceprovidersRepo.findUsers(
      start,
      limit,
      searchVal,
      selectedCapabilityIdarray,
      region,
      companysize,
      sortField,
      sortColumn,
      sortColumnOrder,
      loggedInUser,
      isPremiumUsersOnly,
      eventsSelectedArray,
      selectedPlatforms,
    );
    return serviceproviders;
  }

  async findSponsers() {
    const serviceproviders = await this.serviceprovidersRepo.findSponserUsers();
    return serviceproviders;
  }

  async findServiceslist() {
    const responselist = this.serviceprovidersRepo.findAllservices();
    return responselist;
  }
  async findRegionslist() {
    const responselist = this.serviceprovidersRepo.findAllregions();
    return responselist;
  }
  async findCompanySizeslist() {
    const responselist = this.serviceprovidersRepo.findAllCompanysizes();
    return responselist;
  }
  async findMyList(userId: number) {
    const responselist = this.serviceprovidersRepo.findMyAllList(userId);
    return responselist;
  }
  async findMyProjects(userId: number) {
    const responselist = this.serviceprovidersRepo.findMyAllProjects(userId);
    return responselist;
  }

  async addCompaniesToMyList(companies: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
  }, companyId: number) {

    if (companies.mylist && companies.mylist.length > 0) {
      const getListDetailsByIds = await this.serviceprovidersRepo.getListDetails(companies.mylist);
      getListDetailsByIds.forEach(list => {
        if (list.userId != companies.loggedUserId) {
          throw new HttpException('access denied', HttpStatus.FORBIDDEN);
        }
      });
    }
    return this.serviceprovidersRepo.CreateCompaniesToMyList(companies, companyId);
  }

  async addListsToMyProjects(companies: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
    projectId: number;
  }) {
    if (companies.mylist && companies.mylist.length > 0) {
      const getListDetailsByIds = await this.serviceprovidersRepo.getListDetails(companies.mylist);
      getListDetailsByIds.forEach(list => {
        if (list.userId != companies.loggedUserId) {
          throw new HttpException('access denied', HttpStatus.FORBIDDEN);
        }
      });
    }
    const projectDeatils = await this.serviceprovidersRepo.getProjectDetailsById(companies.projectId);
    if (projectDeatils && projectDeatils.userId == companies.loggedUserId) {
      return this.serviceprovidersRepo.CreateIntrestedListToMyProject(companies);
    } else {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
  }

  async addCompaniesToMyProject(companies: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
  }) {
    return this.serviceprovidersRepo.CreateCompaniesToMyProject(companies);
  }
  async findCompanyBySize(companySize: string) {
    const companyExist =
      await this.serviceprovidersRepo.findCompanyBySize(companySize);
    return companyExist;
  }

  async findServiceByName(service: string) {
    const companyExist =
      await this.serviceprovidersRepo.findServiceByName(service);
    return companyExist;
  }

  async findServiceNotInSystem(services: string[]) {
    const companyExist =
      await this.serviceprovidersRepo.findServiceNotInSystem(services);
    return companyExist;
  }
  async findone(id: number, loggedCompanyId: number) {
    return this.serviceprovidersRepo.findOne(id, loggedCompanyId);
  }
  async getSPDetailsForFreeUser(id: number, loggedUserId: number) {
    return this.serviceprovidersRepo.getSPDetailsForFreeUser(id, loggedUserId);
  }
  async findAlbumImages(albumId: string) {
    return this.serviceprovidersRepo.getAlbumImagesById(albumId);
  }

  async getAllCountries() {
    return this.serviceprovidersRepo.getAllCountries();
  }

  async getAllPlatforms() {
    return this.serviceprovidersRepo.getAllPlatforms();
  }

  async getAllHomePageApis(userId: number, date: string) {
    return this.serviceprovidersRepo.getAllHomePageApis(userId, date);
  }

  async getShuffledServiceProvidersIds() {
    const allSPsIdObjs = await this.serviceprovidersRepo.getShuffledServiceProvidersIds();
    let allSPsIds = allSPsIdObjs.map(obj => obj.id);
    allSPsIds = this.shuffleArray(allSPsIds);
    return allSPsIds;
  }

  async getShuffledServiceProvidersDetails(getDetailsOfTheIds: number[], loggedCompanyId: number) {
    const serviceProviders = await this.serviceprovidersRepo.getServiceProvidersFromList(getDetailsOfTheIds, loggedCompanyId);
    return serviceProviders;
  }

  async getCountOfServiceProviders() {
    const serviceProviders = await this.serviceprovidersRepo.getCountOfServiceProviders();
    return serviceProviders;
  }

  shuffleArray(arr: number[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Generate random index
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr;
  }

  //Creating buyer notes ----------------------------------------------------------------------------------------------------------

  async saveprojectreview(projectData: CreateServiceproviderDto) {
    return this.serviceprovidersRepo.saveprojectreview(projectData);
  }

  async getbuyerNotes(noteId: number, loggedId: number) {
    return this.serviceprovidersRepo.getbuyerNotes(noteId, loggedId);
  }

  async remove(id: number) {
    return this.serviceprovidersRepo.deleteNote(id);
  }

  async updateNote(noteId: number, updateNoteData: CreateServiceproviderDto) {
    return this.serviceprovidersRepo.updateNote(noteId, updateNoteData);
  }

  //Creating buyer notes ----------------------------------------------------------------------------------------------------------

  async saveratesbyservice(serviceRatesData: CreateRatesByserviceDto) {
    return this.serviceprovidersRepo.saveratesbyservice(serviceRatesData);
  }

  async getServiceRates(serviceId: number) {
    return this.serviceprovidersRepo.getServiceRates(serviceId);
  }

  async getAllServiceRates(buyerId: number, companyId: number) {
    return this.serviceprovidersRepo.getAllServiceRates(buyerId, companyId);
  }

  async deleteService(serviceId: number) {
    return this.serviceprovidersRepo.deleteService(serviceId);
  }

  async updateService(serviceId: number, updateserviceData: CreateRatesByserviceDto) {
    return this.serviceprovidersRepo.updateService(serviceId, updateserviceData);
  }

  //Creating buyer project performance ----------------------------------------------------------------------------------------------------------


  async createProjectperformance(serviceRatesData: ProjectPerformanceDto) {
    return this.serviceprovidersRepo.createProjectperformance(serviceRatesData);
  }

  async getprojectPerformance(projectId: number) {
    return this.serviceprovidersRepo.getprojectPerformance(projectId);
  }

  async deleteProject(projectId: number) {
    return this.serviceprovidersRepo.deleteProject(projectId);
  }

  async updateProject(projectId: number, projectPerformancedata: ProjectPerformanceDto) {
    return this.serviceprovidersRepo.updateProject(projectId, projectPerformancedata);
  }

  // Overall buyer ratings on sp --------------------------------------------------------------------------------------------------

  async createOverallRatings(overallPerformanceData: CreateOverallratings) {
    return this.serviceprovidersRepo.createOverallRatings(overallPerformanceData);
  }

  async getOverallRatings(companyId: number, loggedId: number) {
    return this.serviceprovidersRepo.getOverallRatingData(companyId, loggedId);
  }

  async getAllNotesFromBuyer(userId: number, companyId: number) {
    return this.serviceprovidersRepo.getAllNotesFromBuyer(userId, companyId);
  }

  async getAllProjectPerformanceReviews(userId: number, companyId: number) {
    return this.serviceprovidersRepo.getAllProjectPerformanceReviews(userId, companyId);
  }

  async addTheSearchedText(userId: number, searchText: string, fromOpportunity: boolean) {
    return await this.serviceprovidersRepo.addTheSearchedText(userId, searchText, fromOpportunity);
  }

  async addTheServiceText(userId: number, serviceVal: string, fromOpportunity: boolean) {
    return await this.serviceprovidersRepo.addTheServiceText(userId, serviceVal, fromOpportunity);
  }

  async addTheCapabilityText(userId: number, capabilityVal: string, fromOpportunity: boolean) {
    return await this.serviceprovidersRepo.addTheCapabilityText(userId, capabilityVal, fromOpportunity);
  }

  async getSearchFilterStats(role: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string) {
    const searchResult = await this.serviceprovidersRepo.getSearchStringDetails(role, startDate, endDate, fromPlace);
    const filteredServices = await this.serviceprovidersRepo.getFilteredServiceDetails(role, startDate, endDate, fromPlace);
    const filteredCapabilities = await this.serviceprovidersRepo.getFilteredCapabilityDetails(role, startDate, endDate, fromPlace);
    const finalList = [];
    for (let i = 0; i < searchResult.length; i++) {
      const theNewObj = {
        searches: {},
        services: {},
        capabilities: {}
      }
      theNewObj.searches = searchResult[i];
      finalList.push(theNewObj);
    }

    for (let i = 0; i < filteredServices.length; i++) {
      if (finalList[i]) {
        finalList[i].services = filteredServices[i];
      } else {
        const theNewObj = {
          searches: {},
          services: filteredServices[i],
          capabilities: {}
        }
        finalList.push(theNewObj);
      }
    }

    for (let i = 0; i < filteredCapabilities.length; i++) {
      if (finalList[i]) {
        finalList[i].capabilities = filteredCapabilities[i];
      } else {
        const theNewObj = {
          searches: {},
          services: {},
          capabilities: filteredCapabilities[i]
        }
        finalList.push(theNewObj);
      }
    }
    return finalList;
  }

  async getBuyersStats() {
    const buyersStats = await this.serviceprovidersRepo.getBuyersStats();
    let theFinalArr: any = [];
    for (let i = 0; i < buyersStats.length; i++) {
      if (theFinalArr.length < 1) {
        theFinalArr.push(buyersStats[i]);
        theFinalArr[0].providerDetails = [];
        if(buyersStats[i]?.providerCompany){
          const theCh = {
            id: buyersStats[i]?.providerCompany?.id,
            name: buyersStats[i]?.providerCompany?.name,
            isContacted: buyersStats[i].isContacted,
            count: buyersStats[i].visitCounts
          }
          theFinalArr[0].providerDetails.push(theCh);
          if(buyersStats[i]?.contactedAt) {
            theFinalArr[0].maxContactedAt = { type: "contact", id: buyersStats[i]?.providerCompany?.id, date: buyersStats[i]?.contactedAt };
          }
        }
        theFinalArr[0].followingDetails = [];
        if(buyersStats[i]?.buyerCompany?.followingCompanies && buyersStats[i]?.buyerCompany?.followingCompanies.length > 0) {
          const followingCompanies = buyersStats[i]?.buyerCompany?.followingCompanies.map((item: any) => {
            const followData = {
              createdAt: item.createdAt,
              followingCompanyId: item.followedCompany?.id ? item.followedCompany?.id : null,
              followingCompanyName: item.followedCompany?.name ? item.followedCompany?.name : "",
            }
            return followData;
          });
          theFinalArr[0].followingDetails = followingCompanies;
        }
      } else {
        let matched = false;
        for (let item of theFinalArr) {
          if (item.buyerCompanyId == buyersStats[i].buyerCompanyId) {
            matched = true;
            if (item.providerDetails.length < 5 && buyersStats[i]?.providerCompany) {
              const theCh = {
                id: buyersStats[i]?.providerCompany?.id,
                name: buyersStats[i]?.providerCompany?.name,
                isContacted: buyersStats[i].isContacted,
                count: buyersStats[i].visitCounts
              }
              item.providerDetails.push(theCh);
              if(item.maxContactedAt && item.maxContactedAt.date && buyersStats[i]?.contactedAt) {
                const date1 = new Date(item.maxContactedAt.date!);
                const date2 = new Date(buyersStats[i].contactedAt!);
                if(date2 > date1) {
                  item.maxContactedAt = { type: "contact", id: buyersStats[i]?.providerCompany?.id, date: buyersStats[i]?.contactedAt };
                }
              } else {
                if(!item.maxContactedAt && buyersStats[i]?.contactedAt) {
                  item.maxContactedAt = { type: "contact", id: buyersStats[i]?.providerCompany?.id, date: buyersStats[i]?.contactedAt };
                }
              }
            }
          }
        }
        if (!matched) {
          theFinalArr.push(buyersStats[i]);
          theFinalArr[(theFinalArr.length - 1)].providerDetails = [];
          if(buyersStats[i]?.providerCompany){
            const theCh = {
              id: buyersStats[i]?.providerCompany?.id,
              name: buyersStats[i]?.providerCompany?.name,
              isContacted: buyersStats[i].isContacted,
              count: buyersStats[i].visitCounts
            }
            theFinalArr[(theFinalArr.length - 1)].providerDetails.push(theCh);
            if(buyersStats[i]?.contactedAt) {
              theFinalArr[(theFinalArr.length - 1)].maxContactedAt = { type: "contact", id: buyersStats[i]?.providerCompany?.id, date: buyersStats[i]?.contactedAt };
            }
          }

          theFinalArr[(theFinalArr.length - 1)].followingDetails = [];
          if(buyersStats[i]?.buyerCompany?.followingCompanies && buyersStats[i]?.buyerCompany?.followingCompanies.length > 0) {
            const followingCompanies = buyersStats[i]?.buyerCompany?.followingCompanies.map((item: any) => {
              const followData = {
                createdAt: item.createdAt,
                followingCompanyId: item.followedCompany?.id ? item.followedCompany?.id : null,
                followingCompanyName: item.followedCompany?.name ? item.followedCompany?.name : "",
              }
              return followData;
            });
            theFinalArr[(theFinalArr.length - 1)].followingDetails = followingCompanies;
          }
        }
      }
    }
    for(let item of theFinalArr) {
      const dateTypesArr: any = [];
      if(item.maxContactedAt) {
        dateTypesArr.push(item.maxContactedAt);
      }
      if(item.buyerCompany.opportunities && item.buyerCompany.opportunities.length > 0) {
        const theMaxDetails = { type: "oppotunity", id: item.buyerCompany.opportunities[0].id, date: item.buyerCompany.opportunities[0].createdAt };
        for(let opp of item.buyerCompany.opportunities) {
          const date1 = new Date(theMaxDetails.date);
          const date2 = new Date(opp.createdAt);
          if(date2 > date1) {
            theMaxDetails.type = "oppotunity";
            theMaxDetails.id = opp.id;
            theMaxDetails.date = opp.createdAt;
          }
        }
        dateTypesArr.push(theMaxDetails);
      }
      if(item.buyerCompany.user.myLists && item.buyerCompany.user.myLists.length > 0) { 
        const theMaxDetails = { type: "list", id: item.buyerCompany.user.myLists[0].id, date: item.buyerCompany.user.myLists[0].createdAt };
        for(let list of item.buyerCompany.user.myLists) {
          const date1 = new Date(theMaxDetails.date);
          const date2 = new Date(list.createdAt);
          if(date2 > date1) {
            theMaxDetails.type = "list";
            theMaxDetails.id = list.id;
            theMaxDetails.date = list.createdAt;
          }
        }
        dateTypesArr.push(theMaxDetails);
      }
      if(item.buyerCompany.user.myProjects && item.buyerCompany.user.myProjects.length > 0) {  
        const theMaxDetails = { type: "project", id: item.buyerCompany.user.myProjects[0].id, date: item.buyerCompany.user.myProjects[0].createdAt };
        for(let project of item.buyerCompany.user.myProjects) {
          const date1 = new Date(theMaxDetails.date);
          const date2 = new Date(project.createdAt);
          if(date2 > date1) {
            theMaxDetails.type = "project";
            theMaxDetails.id = project.id;
            theMaxDetails.date = project.createdAt;
          }
        }
        dateTypesArr.push(theMaxDetails);
      }
      if(item.followingDetails && item.followingDetails.length > 0) {
        const theMaxDetails = { type: "follow", id: item.followingDetails[0]?.followingCompanyId, date: item.followingDetails[0]?.createdAt };
        for(let follow of item.followingDetails) {
          const date1 = new Date(theMaxDetails.date);
          const date2 = new Date(follow.createdAt);
          if(date2 > date1) {
            theMaxDetails.type = "follow";
            theMaxDetails.id = follow.followingCompanyId;
            theMaxDetails.date = follow.createdAt;
          }
        }
        dateTypesArr.push(theMaxDetails);
      }

      delete(item.contactedAt);
      delete(item.maxContactedAt);
      if(dateTypesArr && dateTypesArr.length > 0) {
        item.mostRecentUpdate = dateTypesArr[0];
        for(const dateType of dateTypesArr) {
          const date1 = new Date(item.mostRecentUpdate.date);
          const date2 = new Date(dateType.date);
          if(date2 > date1) {
            item.mostRecentUpdate = dateType;
          }
        }
      }
    }
    const dateArrangedArr = theFinalArr.map((item: any) => {
      if(!item.mostRecentUpdate) {
        item.mostRecentUpdate = { type: "created", id: item.id, date: item.createdAt };
      }
      return item;
    });
    return dateArrangedArr;
  }

  checkTheAlbumBelogsTocompany(albumId: number) {
    return this.serviceprovidersRepo.checkTheAlbumBelogsTocompany(albumId)
  }

  thePerformanceBelongsTo(performanceId: number) {
    return this.serviceprovidersRepo.checkThePerformanceBelongsTo(performanceId)
  }

  rateAddedByCompanyGet(serviceId: number) {
    return this.serviceprovidersRepo.rateAddedByCompanyGet(serviceId)
  }

  getCreatedNoteCompany(noteId: number) {
    return this.serviceprovidersRepo.getCreatedNoteCompany(noteId)
  }

  async checkValidityOfAlbumId(albumId: number, albumByCompanyId: number) {
    const theFirstFourRecords = await this.serviceprovidersRepo.checkValidityOfAlbumId(albumByCompanyId)
    const isValidAlbum = theFirstFourRecords.find(item => item.id == albumId);
    return isValidAlbum;
  }

  async findActiveEventsService() {
    return this.serviceprovidersRepo.findEventsActive();
  }

  async getCompanyById(companyId: number) {
    return this.serviceprovidersRepo.getCompanyById(companyId);
  }
  async findSponseredServices(currentDate: string) {
    return this.serviceprovidersRepo.findSponseredServices(currentDate);
  }
  async updateSlug() {
    return this.serviceprovidersRepo.updateSlug();
  }

  async addUserSettings(userId: number, settings:any){
    return this.serviceprovidersRepo.addUsersSettings(userId, settings);
  }
  async getUserSettings(userId: number){
    return this.serviceprovidersRepo.findUsersSettings(userId);
  }
  async getPlatformsList(){
    return this.serviceprovidersRepo.findPlatformsList();
  }

  async addOrUpdateAvgPerformanceRating(logggedCompanyId: number, postData: { companyId: number, avgRating: number }) {
    const isExist = await this.serviceprovidersRepo.getOverallRatingData(postData.companyId, logggedCompanyId);
    if(isExist && isExist.data) {
      const data = {
        avgPerformanceRating: postData.avgRating
      }
      await this.serviceprovidersRepo.updateOverallRating(isExist.data.id, data);
    } else {
      const data = {
        companyId: postData.companyId,
        buyerId: logggedCompanyId,
        avgPerformanceRating: postData.avgRating
      }
      await this.serviceprovidersRepo.addOverallRating(data);
    }
  }

  async addOrUpdateUpdatedAt(logggedCompanyId: number,  companyId: number) {
    const isExist = await this.serviceprovidersRepo.getOverallRatingData(companyId, logggedCompanyId);
    if(isExist && isExist.data) {
      const data = {
        avgPerformanceRating: isExist.data.avgPerformanceRating
      }
      await this.serviceprovidersRepo.updateOverallRating(isExist.data.id, data);
    } else {
      const data = {
        companyId: companyId,
        buyerId: logggedCompanyId,
        avgPerformanceRating: 0
      }
      await this.serviceprovidersRepo.addOverallRating(data);
    }
  }

  async migratiognAddOrUpdateUpdatedAt(logggedCompanyId: number,  companyId: number) {
    const isExist = await this.serviceprovidersRepo.getOverallRatingData(companyId, logggedCompanyId);
    if(isExist && isExist.data) {
      const data = {
        avgPerformanceRating: isExist.data.avgPerformanceRating
      }
      // await this.serviceprovidersRepo.updateOverallRating(isExist.data.id, data);
    } else {
      const data = {
        companyId: companyId,
        buyerId: logggedCompanyId,
        avgPerformanceRating: 0
      }
      await this.serviceprovidersRepo.addOverallRating(data);
    }
  }

  async migrateAvgPerformanceRating() {
    const groupedCompanies = await this.serviceprovidersRepo.getGroupedCompanies();
    if(groupedCompanies && groupedCompanies.length > 0) {
      for(const item of groupedCompanies) {
        let avgRating = 0;
        if (item && item._avg?.overallRating) {
          if(item._avg?.overallRating > 0 && item._avg.overallRating < 1) {
            avgRating = 1
          } else {
            avgRating = Math.round(item._avg?.overallRating);
          }
        }
        const postData = {
          companyId: item.companyId,
          avgRating: avgRating
        }
        await this.addOrUpdateAvgPerformanceRating(item.buyerId, postData);
      }
    }
  }

  async migrationForInsertingRecords(type: string) {
    const groupedCompanies = await this.serviceprovidersRepo.getGroupedCompaniesForInserting(type);
    if(groupedCompanies && groupedCompanies.length > 0) {
      for(const item of groupedCompanies) {
        await this.migratiognAddOrUpdateUpdatedAt(item.buyerId, item.companyId);
      }
    }
  }

  getPublicDynamicData(date: string){
    return this.serviceprovidersRepo.getDynamicPublicData(date)
  }
  async getbuyerMysparkReport(type: $Enums.ROLE_CODE){
    return await this.serviceprovidersRepo.getbuyerMysparkReport(type);
  }

//*******************************************Serviceproviders selected filter list share*********************************************** */

  async checkMail(mail: string) {
    return await this.serviceprovidersRepo.checkMail(mail);
  }

  async generateShareLink(postData: {
    selectedServiceIds: string;
    selectedSevices: string;
    isPremium: string;
    countrySearchValue: string;
    inputValue: string;
    selctedCompanySize: string;
    selectedEventValues: string;
    regionCheckboxFilter: string;
}, theToken: string, loggedCompanyId: number){

    const allColumns = {
      companyId: loggedCompanyId,
      selectedServiceIds: postData.selectedServiceIds,
      selectedSevices: postData.selectedSevices,
      isPremium: postData.isPremium,
      countrySearchValue: postData.countrySearchValue,
      inputValue: postData.inputValue,
      selctedCompanySize: postData.selctedCompanySize,
      selectedEventValues: postData.selectedEventValues,
      regionCheckboxFilter: postData.regionCheckboxFilter,
      shareLinkToken: theToken
    }
    return await this.serviceprovidersRepo.generateShareLink(allColumns);
  }

  async getFiltersData(token :string){
    return await this.serviceprovidersRepo.getFiltersData(token);
  }

  async addClickCounts(id: number, companyId: number){
    const sponsoredService = await this.serviceprovidersRepo.checkSponsoredService(id);
    if(sponsoredService && sponsoredService.serviceId && sponsoredService.companyId) {
      const isDataExist = await this.serviceprovidersRepo.checkSponsoredServiceClickCountData(sponsoredService.serviceId, sponsoredService.companyId, companyId);
      if(isDataExist) {
        const data = {
          clickCounts: isDataExist.clickCounts + 1
        }
        await this.serviceprovidersRepo.updateSponsoredServiceClickCountData(isDataExist.id, data);
      } else {
        const data = {
          serviceId: sponsoredService.serviceId,
          sponsoredCompanyId: sponsoredService.companyId,
          clickedCompanyId: companyId,
          clickCounts: 1
        }
        await this.serviceprovidersRepo.addSponsoredServiceClickCountData(data);
      }
    }
  }

  async getServiceCategoryStats(role: string = "") {
    try {
      let filter: any = {};
      if(role && role != "") {
        filter.clickedCompany = {
          user: {
            userRoles: {
              some: {
                roleCode: role,
              },
            }
          }
        } 
      };
      const stats = await this.serviceprovidersRepo.getServiceCategoryStats(filter);
      const formattedStats = Object.values(
        stats.reduce((acc: any, { service, clickCounts, sponsoredCompany }: { service: { serviceName: string }, clickCounts: number, sponsoredCompany: { name: string } }) => {
          if (!acc[service.serviceName]) {
            acc[service.serviceName] = { 
              serviceName: service.serviceName, 
              totalCount: 0, 
              sponsoredCompanies: [] 
            };
          }
          acc[service.serviceName].totalCount += clickCounts;
          const existingCompany = acc[service.serviceName].sponsoredCompanies.find((c: any) => c.name === sponsoredCompany.name);
          if (existingCompany) {
            existingCompany.counts += clickCounts;
          } else {
            acc[service.serviceName].sponsoredCompanies.push({ name: sponsoredCompany.name, counts: clickCounts });
          }
          return acc;
        }, {})
      );
      return formattedStats;
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async addAnnouncement(announcementData: Announcement, companyId: number) {
    if (announcementData.postExpiryDate) {
      announcementData.postExpiryDate = toLocalISOString(announcementData.postExpiryDate);
    }
    const data = {
      companyId: companyId,
      title: announcementData.announcementTitle,
      description: announcementData.eventDescription  ,
      linkUrl: announcementData.announcementUrl,
      imageUrl: announcementData.announcementImageUrl,
      expiryDate: announcementData.postExpiryDate ? announcementData.postExpiryDate : null,
      orderValue: 1,
    }
    await this.serviceprovidersRepo.deleteTemperoryFile("announcements", announcementData.announcementImageUrl);
    const res = await this.serviceprovidersRepo.addAnnouncement(data);
    await this.serviceprovidersRepo.updateCompanyAnnouncementAddedStatus(companyId);
    await this.serviceprovidersRepo.announcementUpdates(res.companyId, res.id, "Announcement", res.expiryDate);
    this.companiesRepo.checkNotificationAndSend(companyId, "Announcement", data.title);
    return res;
  }
  

  async getServiceProviderAnnouncements(companyId: number) {
    const announcements: any = await this.serviceprovidersRepo.getServiceProviderAnnouncements(companyId);
    for(let announcement of announcements) {
      if(announcement.imageUrl) {
        const signedUrl = await this.gcsService.getSignedUrl(announcement.imageUrl);
        announcement.signedImageUrl = signedUrl
      }
    }
    return announcements;
  }

  async updateAnnouncementOrder(ids: number[], companyId: number) {
    if(ids && ids.length > 0) {
      let orderVal = 1;
      for(const id of ids) {
        const whereClause = {
          id: id,
          companyId: companyId
        }
        const data = {
          orderValue: orderVal
        }
        await this.serviceprovidersRepo.updateServiceProviderAnnouncement(whereClause, data);
        orderVal++;
      }
    }
  }

  async toggleArchiveStatus(id: number, companyId: number) {
    const theAnnouncement = await this.serviceprovidersRepo.findAnnouncementById(id);
    if(theAnnouncement && theAnnouncement.companyId == companyId) {
      const whereClause = {
        id: id,
        companyId: companyId
      };
      const data = {
        isArchieve: !theAnnouncement.isArchieve
      }
      await this.serviceprovidersRepo.updateServiceProviderAnnouncement(whereClause, data);
    } else {
      throw new BadRequestException("Announcement not found")
    }
  }

  async getAnnouncementById(id: number) {
    return await this.serviceprovidersRepo.findAnnouncementById(id);
  }

  async deleteAnnouncementById(id: number) {
    const announcement = await this.serviceprovidersRepo.findAnnouncementById(id);
    if(announcement && announcement.imageUrl) {
      await this.gcsService.removeFile(announcement.imageUrl);
    }
    return await this.serviceprovidersRepo.deleteAnnouncementById({id: id});
  }

  async updateAnnouncement(id: number, companyId: number, announcementData: Announcement) {
    const announcement = await this.serviceprovidersRepo.findAnnouncementById(id);
    if(announcement && announcement.companyId == companyId) {
      if (announcementData.postExpiryDate) {
        announcementData.postExpiryDate = toLocalISOString(announcementData.postExpiryDate);
      }
      const data = {
        title: announcementData.announcementTitle,
        description: announcementData.eventDescription  ,
        linkUrl: announcementData.announcementUrl,
        imageUrl: announcementData.announcementImageUrl,
        expiryDate: announcementData.postExpiryDate ? announcementData.postExpiryDate : null,
      }
      const whereClause = {
        id: id,
        companyId: companyId
      }
      await this.serviceprovidersRepo.deleteTemperoryFile("announcements", data.imageUrl);
      await this.serviceprovidersRepo.updateServiceProviderAnnouncement(whereClause, data);
      // this.companiesRepo.checkNotificationAndSend(companyId, "Announcement");
    } else {
      throw new HttpException('access denied',HttpStatus.FORBIDDEN);
    }
  }

  async addOrUpdateViewCountAnnouncementStat(announcementIds: number[], companyId: number) {
    if(announcementIds && announcementIds.length > 0) {
      const announcement = await this.serviceprovidersRepo.findAnnouncementById(announcementIds[0]);
      if(announcement && announcement.companyId == companyId) {
        return;
      }
      for(const id of announcementIds) {
        const condition = {
          announcementId: id,
          companyId: companyId
        }
        const announcementStat = await this.serviceprovidersRepo.findAnnounancementStat(condition);
        if(announcementStat) {
          const whereClause = {
            id: announcementStat.id,
          };
          const data = {
            viewCount: announcementStat.viewCount + 1,
          }
          await this.serviceprovidersRepo.updateAnnouncementStat(whereClause, data);
        } else {
          const data = {
            announcementId: id,
            companyId: companyId,
            viewCount: 1,
          }
          await this.serviceprovidersRepo.createAnnouncementStat(data);
        }
      }
    }
  }

  async addOrUpdateViewCountTestMonialStat(testmonialId: number, companyId: number) {
    if(testmonialId && testmonialId != 0 ) {
      const testmonial = await this.serviceprovidersRepo.findTestmonialById(testmonialId);
      // if(announcement && announcement.companyId == companyId) {
      //   return;
      // }
      if(testmonial?.companyId != companyId) {
        const condition = {
          testimonialId: testmonialId,
          companyId: companyId
        }
        const testmonialStat = await this.serviceprovidersRepo.findTestMonialStat(condition);
        if(testmonialStat) {
          const whereClause = {
            id: testmonialStat.id,
          };
          const data = {
            clickCount: testmonialStat.clickCount + 1,
          }
          await this.serviceprovidersRepo.updateTestMonialStat(whereClause, data);
        } else {
          const data = {
            testimonialId: testmonialId,
            companyId: companyId,
            clickCount: 1,
          }
          await this.serviceprovidersRepo.createTestMonialStat(data);
        }
      }
    }
  }

  async addOrUpdateClickCountAnnouncementStat(announcementId: number, companyId: number) {
    const announcement = await this.serviceprovidersRepo.findAnnouncementById(announcementId);
    if(announcement && announcement.companyId == companyId) {
      return;
    }
    const condition = {
      announcementId: announcementId,
      companyId: companyId
    }
    const announcementStat = await this.serviceprovidersRepo.findAnnounancementStat(condition);
    if(announcementStat) {
      const whereClause = {
        id: announcementStat.id,
      };
      const data = {
        clickCount: announcementStat.clickCount + 1,
      }
      await this.serviceprovidersRepo.updateAnnouncementStat(whereClause, data);
    } else {
      const data = {
        announcementId: announcementId,
        companyId: companyId,
        clickCount: 1,
      }
      await this.serviceprovidersRepo.createAnnouncementStat(data);
    }
  }

  async getAnnouncementsStats(searchVal: string="") {
    try {
      const announcementDetails = await this.serviceprovidersRepo.getAnnouncementDetails(searchVal);
      const finalArr: any = [];
      if(announcementDetails && announcementDetails.length > 0) {
        for(const item of announcementDetails) {
          const details = {
            announcementId: item.id,
            announcement: {
              title: item.title,
              linkUrl: item.linkUrl,
              createdAt: item.createdAt,
              isArchieve: item.isArchieve,
              company: {
                id: item.company.id,
                name: item.company.name,
                slug: item.company.slug,
              }
            },
            companies: Object.values(
              item.AnnouncementStats.reduce((acc: any, announcement) => {
                if (!acc[announcement.company.id]) {
                  acc[announcement.company.id] = { name: announcement.company.name, viewCount: announcement.viewCount, clickCount: announcement.clickCount };
                } else {
                  acc[announcement.company.id].viewCount = acc[announcement.company.id].viewCount + announcement.viewCount;
                  acc[announcement.company.id].clickCount = acc[announcement.company.id].clickCount + announcement.clickCount;
                }
                return acc;
              }, {})
            ),
            viewCount: item.AnnouncementStats.reduce((sum, item) => sum + item.viewCount, 0),
            clickCount: item.AnnouncementStats.reduce((sum, item) => sum + item.clickCount, 0)
          }
          finalArr.push(details);
        }
      }
      return finalArr
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async getTestmonialsStats(searchVal: string="") {
    try {
      const announcementDetails = await this.serviceprovidersRepo.getTestmonialProjects(searchVal);
      const finalArr: any = [];
      if(announcementDetails && announcementDetails) {
        for(const item of announcementDetails) {
          const details = {
            announcementId: item.id,
            announcement: {
              title: item.name,
              linkUrl: process.env.XDS_FRONTEND_BASE_URL + `/serviceproviders-details/${item.company.slug}?tab=1&&projectId=${item.name}`,
              createdAt: item.AnnouncementUpdates[0].displayDate,
              isActive: item.AnnouncementUpdates[0].isActive,
              company: {
                id: item.company.id,
                name: item.company.name,
                slug: item.company.slug,
              }
            },
            companies: Object.values(
              item.TestimonialStats.reduce((acc: any, announcement) => {
                if (!acc[announcement.company.id]) {
                  acc[announcement.company.id] = { name: announcement.company.name, viewCount: announcement.viewCount, clickCount: announcement.clickCount };
                } else {
                  acc[announcement.company.id].viewCount = acc[announcement.company.id].viewCount + announcement.viewCount;
                  acc[announcement.company.id].clickCount = acc[announcement.company.id].clickCount + announcement.clickCount;
                }
                return acc;
              }, {})
            ),
            viewCount: item.TestimonialStats.reduce((sum, item) => sum + item.viewCount, 0),
            clickCount: item.TestimonialStats.reduce((sum, item) => sum + item.clickCount, 0)
          }
          finalArr.push(details);
        }
      }
      return finalArr
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async adminToggleAnnouncementArchiveStatus(announcementId: number) {
    try {
      const theAnnouncement = await this.serviceprovidersRepo.findAnnouncementById(announcementId);
      if(theAnnouncement && theAnnouncement.id) {
        const whereClause = {
          id: theAnnouncement.id,
        };
        const data = {
          isArchieve: !theAnnouncement.isArchieve
        }
        await this.serviceprovidersRepo.updateServiceProviderAnnouncement(whereClause, data);
      } else {
        throw new BadRequestException("Announcement not found");
      }
    } catch(err) {  
      throw new BadRequestException(err.message);
    }
  }

  async addOrUpdateHideTestMonialStat(testmonialId: number, toggle: boolean) {
    return await this.serviceprovidersRepo.updateHideTestmonialProject(testmonialId, toggle);
  }

}
