import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { $Enums, OPPORTUNITY_STATUS, Prisma, ROLE_CODE, SPBuyerRatingOnserviceProvider } from "@prisma/client";
import { Exception } from "handlebars";
import { PrismaService } from "src/prisma/prisma.service";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { CreateServiceproviderDto } from "./dto/create-serviceprovider.dto";
import { ProjectPerformanceDto } from "./dto/createbuyerProjectPerformance.dto";
import { CreateOverallratings } from "./dto/createOverallRating.dto";
import { CreateRatesByserviceDto } from "./dto/createratebyservice.dto";
import { formatDateIntoString, generateSlug, toLocalISOString } from "src/common/methods/common-methods";
import { ReportItem } from "./type";
import admin from "firebase-admin";

// import OpenAIApi  from "openai";
interface SignedUrlAddedDto {
  signedUrl?: string,
}
@Injectable()
export class ServiceProvidersRepository {
  // public openai: OpenAIApi;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) {
    // this.openai = new OpenAIApi({
    //   apiKey: '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',
    // });
  }

  async findUsers(
    start: number,
    limit: number | undefined,
    searchString: string,
    selectedCapabilityIdarray: { [serviceId: string]: string[] },
    region: string[],
    companysizes: string[],
    sortField: string,
    sortColumn: string,
    sortColumnOrder: string,
    loggedInUser: number,
    isPremiumUsersOnly: string,
    eventsSelectedArray: { id: number, name: string }[],
    selectedPlatforms: { id: number, name: string }[],
  ) {

    let orderBy:
      | { [key: string]: "asc" | "desc" }
      | { [key: string]: { [key: string]: "asc" | "desc" } }
      | { [key: string]: { [key: string]: { [key: string]: "asc" | "desc" } } }
      = { name: "asc" };

    if (sortField === "NameA_Z") {
      orderBy = { name: "asc" };
    } else if (sortField === "NameZ_A") {
      orderBy = { name: "desc" };
    } else if (sortField === "Company_L_S") {
      orderBy = { companySize: "desc" };
    } else if (sortField === "Company_S_L") {
      orderBy = { companySize: "asc" };
    } else if (sortField === "FoundNewFirst" || sortField === "FoundOldFirst") {
      orderBy = {
        CertificationAndDiligence: {
          foundingYear: sortField === "FoundNewFirst" ? "desc" : "asc",
        },
      };
    }
    let orderByCountry: { [key: string]: { [key: string]: "asc" | "desc" } } = {};
    if (sortColumn != '' && sortColumnOrder && sortColumn != undefined && sortColumnOrder != undefined) {
      if (sortColumnOrder === 'asc' || sortColumnOrder === 'desc') {
        if (sortColumn == "Name") {
          orderBy = { name: sortColumnOrder }
        } else if (sortColumn == 'Website') {
          orderBy = { website: sortColumnOrder }
        }
        else if (sortColumn == 'Company Size') {
          orderBy = { companySize: sortColumnOrder }
        } else if (sortColumn == 'Tier') {
          // orderBy = { user: { isPaidUser: sortColumnOrder } }
        } else if (sortColumn == 'Partner Status') {
          orderBy = { sPBuyerCompanyRatings: { _count: sortColumnOrder } }
        }
        else if (sortColumn === "Country") {
          orderBy = {
            countryNames: sortColumnOrder,
          };
        }

      }
    }
    let skip = start;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereclause: any = {
      isDelete: false,
      isArchieve: false,
      user: {
        approvalStatus: "completed",
        isArchieve: false,
        userRoles: {
          some: {
            roleCode: "service_provider",
          },
        },
      },
    };
    if (isPremiumUsersOnly) {
      if (isPremiumUsersOnly === 'true') {
        whereclause.user.isPaidUser = true
      }
    }
    let queryConditions: any = [];
    if (selectedCapabilityIdarray && Object.keys(selectedCapabilityIdarray).length > 0) {

      // Remove empty elements from arrays
      Object.keys(selectedCapabilityIdarray).forEach(serviceId => {
        selectedCapabilityIdarray[serviceId] = selectedCapabilityIdarray[serviceId].filter(capability => capability !== "");
      });

      const servicesIds = Object.keys(selectedCapabilityIdarray);

      queryConditions = servicesIds.map(serviceId => {
        const capabilities = selectedCapabilityIdarray[serviceId];
        if (capabilities && capabilities.length > 0) {
          // Create an array of conditions where each capability must be present
          const NumberServiceId = serviceId.replace('a', '');
          const capabilityConditions = capabilities.map(capabilityId => ({
            AND: [
              {
                serviceId: Number(NumberServiceId),
              },
              {
                capabilityId: Number(capabilityId),
              }
            ]
          }));

          return {
            AND: capabilityConditions.map(condition => ({
              ServicesOpt: {
                some: condition
              }
            }))
          };
        }
        return {
          ServicesOpt: {
            some: {
              serviceId: Number(serviceId.replace('a', ''))
            }
          }
        };
      });

      // whereclause.ServicesOpt = {
      //   some: {
      //     OR: queryConditions,
      //   },
      // }





      // // Remove empty elements from arrays
      // Object.keys(capabilitiessearch).forEach(serviceName => {
      //   capabilitiessearch[serviceName] = capabilitiessearch[serviceName].filter(capability => capability !== "");
      // });




      /************************************************************
        //  const servicesIds = Object.keys(capabilitiessearch);

        // const queryConditions = services.map(serviceName => {
        //   const capabilitiesConditions = capabilitiessearch[serviceName].map(capability => ({
        //     capability: {
        //       capabilityName: {
        //         equals: capability,
        //         mode: "insensitive"
        //       }
        //     }
        //   }));
        
        //   if (capabilitiesConditions.length > 0) {
        //     return {
        //       AND: [
        //         {
        //           service: {
        //             serviceName: {
        //               equals: serviceName,
        //               mode: "insensitive"
        //             }
        //           }
        //         },
        //         ...capabilitiesConditions
        //       ]
        //     };
        //   } else {
        //     return {
        //       service: {
        //         serviceName: {
        //           equals: serviceName,
        //           mode: "insensitive"
        //         }
        //       }
        //     };
        //   }
        // });

        // whereclause.ServicesOpt = {
        //   some: {
        //     OR: queryConditions,
        //   },
        // }
      *******************************************************************/
      // whereclause.ServicesOpt = {
      //   some: {
      //     AND: [
      //       {
      //         service: {
      //           serviceName: {
      //             in: services,
      //             mode: "insensitive",
      //           },
      //         },
      //       },
      //       {
      //         capability: {
      //           capabilityName: {
      //             in: capabilitiessearch,
      //             mode: "insensitive",
      //           },
      //         },
      //       },
      //     ],
      //   },
      // };
    }
    if (region && region.length > 0) {
      whereclause.CompanyAddress = {
        some: {
          Country: {
            name: {
              in: region,
            },
          },
        },
      };
    }

    if (companysizes && companysizes.length > 0) {
      whereclause.companySizes = {
        size: {
          in: companysizes,
        },
      };
    }

    let eventsQuery: any = [];
    if (eventsSelectedArray.length > 0) {
      const eventIds = eventsSelectedArray.map((events) => Number(events.id));

      eventsQuery = eventIds.map(eventId => ({
        EventAttendees: {
          some: {
            eventsId: eventId
          }
        }
      }))
    };
    let platformsQuery: any = [];
    if (selectedPlatforms.length > 0) {
      const platformId = selectedPlatforms.map((events) => Number(events.id));
      platformsQuery = platformId.map(pId => ({
        CompanyPlatformExperience: {
          some: {
            platformId: pId
          }
        }
      }))
    };

    let mergedWhereClause: any = {
      AND: [
        whereclause,
        {
          OR: queryConditions
        },
        { AND: eventsQuery },
        { OR: platformsQuery }
      ]
    };
    let getCompanyIds: number[] = [];
    if (sortColumn === "Partner Status") {
      const takelimit = (sortColumn == "Partner Status") ? undefined : limit;
      let PartnerserviceProviders = await this.prismaService.companies.findMany({
        where: mergedWhereClause,
        select: {
          id: true,
          sPBuyerCompanyRatings: {
            where: {
              buyerId: loggedInUser,
              prefferedPartner: {
                not: null,
              }
            },
            select: {
              id: true,
              prefferedPartner: true,
            },
          },
        },
        skip: 0,
        take: takelimit,
      });

      const customOrder: any = { "no": 1, "yes": 0, "inprogress": 2 };
      // Sorting the serviceProviders array based on both "prefferedPartner" and "status" fields
      PartnerserviceProviders.sort((a: any, b: any, sortOrder: string = sortColumnOrder) => {
        const multiplier = sortOrder === "asc" ? -1 : 1;
        // For simplicity, assuming the first rating is considered for sorting
        const preferredPartnerA = a.sPBuyerCompanyRatings.length > 0 && a.sPBuyerCompanyRatings[0].prefferedPartner && a.sPBuyerCompanyRatings[0].prefferedPartner != "Select" ? a.sPBuyerCompanyRatings[0].prefferedPartner.toLowerCase() : "";
        const preferredPartnerB = b.sPBuyerCompanyRatings.length > 0 && b.sPBuyerCompanyRatings[0].prefferedPartner && b.sPBuyerCompanyRatings[0].prefferedPartner != "Select" ? b.sPBuyerCompanyRatings[0].prefferedPartner.toLowerCase() : "";

        // Handle null or empty values
        if (!preferredPartnerA && !preferredPartnerB) return 0; // Both are empty, no change in order
        if (!preferredPartnerA) return 1; // Place empty/null at the end
        if (!preferredPartnerB) return -1; // Place empty/null at the end

        // Both values are not empty/null, apply custom sorting
        return (customOrder[preferredPartnerA] - customOrder[preferredPartnerB]) * multiplier;
      });


      PartnerserviceProviders = PartnerserviceProviders.slice(skip, skip + (limit ? limit : 0));
      getCompanyIds = PartnerserviceProviders.map((company) => Number(company.id));
      mergedWhereClause = {
        id: {
          in: getCompanyIds
        }
      };
      skip = 0;
    }

    if (sortColumn == "Performance Ratings") {
      const ratingsWithAvg = await this.prismaService.companies.findMany({
        where: mergedWhereClause,
        select: {
          id: true,
          sPBuyerCompanyRatings: {
            where: {
              buyerId: loggedInUser,
            },
            select: {
              avgPerformanceRating: true,
            },
            orderBy: {
              avgPerformanceRating: sortColumnOrder == "desc" ? "desc" : "asc"
            }
          }
        }
      });

      const multiplier = sortColumnOrder === "asc" ? -1 : 1;
      const validRatings = ratingsWithAvg.filter((item: any) => {
        const avgPerformanceRating = item.sPBuyerCompanyRatings[0]?.avgPerformanceRating;
        return avgPerformanceRating !== undefined && avgPerformanceRating !== null && avgPerformanceRating !== 0;
      });

      const invalidRatings = ratingsWithAvg.filter((item: any) => {
        const avgPerformanceRating = item.sPBuyerCompanyRatings[0]?.avgPerformanceRating;
        return avgPerformanceRating === undefined || avgPerformanceRating === null || avgPerformanceRating === 0;
      });

      const sortedCompanyPerformance = [
        ...validRatings.sort((a: any, b: any) => {
          const avgA = a.sPBuyerCompanyRatings[0]?.avgPerformanceRating || 0;
          const avgB = b.sPBuyerCompanyRatings[0]?.avgPerformanceRating || 0;

          return (avgB - avgA) * multiplier;
        }),
        ...invalidRatings,
      ];

      getCompanyIds = sortedCompanyPerformance.map((rating) => rating.id);
      mergedWhereClause = {
        id: {
          in: getCompanyIds
        }
      };
    }



    let serviceProviders = await this.prismaService.companies.findMany({
      where: mergedWhereClause,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        about: true,
        companySize: true,
        createdAt: true,
        website: true,
        slug: true,
        logoAsset: {
          select: {
            url: true,
          },
        },
        user: {
          select: {
            isPaidUser: true,
          },

        },
        ServicesOpt: {
          select: {
            service: {
              select: {
                serviceName: true,
                groupId: true,
              },
            },
          },
          where: {
            capabilityId: null,
            isDelete: false,
            status: 1,
          }
        },
        companySizes: {
          select: {
            size: true,
          },
        },
        CompanyAddress: {
          orderBy: orderByCountry,
          select: {
            location_name: true,
            Country: {

              select: {
                name: true,
              },
            },
          },
        },
        CompanyContacts: {
          select: {
            name: true,
            email: true,
          },
          take: 1,
        },
        sPBuyerCompanyRatings: {
          where: {
            buyerId: loggedInUser,
          },
          select: {
            id: true,
            prefferedPartner: true,
            avgPerformanceRating: true,
          },
        },
        CompanyGameEngines: {
          where: {
            isChecked: true,
          },
          select: {
            gameEngineName: true,
          }
        },
        sPBuyerprojectcompanyId: {
          select: {
            overallRating: true,
          }
        },
        followedCompanies: {
          where: {
            companyId: loggedInUser,
            isActive: true
          }
        },
        portfolioProjects: true,
      },
    });

    if ((sortColumn === "Partner Status" || sortColumn === "Performance Ratings") && getCompanyIds.length > 0) {
      serviceProviders = serviceProviders.sort((a: any, b: any) => {
        return getCompanyIds.indexOf(a.id) - getCompanyIds.indexOf(b.id)
      });
    }

    // ordering to get premium Users First
    if (searchString == "" && sortColumn == "" && (Object.keys(selectedCapabilityIdarray).length > 0 || region.length > 0 || companysizes.length > 0)) {
      serviceProviders.sort((a: any, b: any) => {
        // First, sort by isPaidUser in descending order 
        if (a.user.isPaidUser !== b.user.isPaidUser) {
          return b.user.isPaidUser - a.user.isPaidUser;
        }
        return 1;
      });
    }

    let results: any = [];

    if (searchString != "") {
      //   const keywords = searchString.toLowerCase().split(' ');
      // keywords.push(searchString);
      // const firstKeyword = keywords[0];
      const keywords = searchString.toLowerCase().split(' ');
      const normalizedSearchTerm = keywords.join('');

      const normalizeString = (str: string) => str.toLowerCase().replace(/\s+/g, '');

      results = serviceProviders
        .filter(company => {
          const services = company.ServicesOpt.map(opt => opt.service?.serviceName).join(' ').toLowerCase();
          const gameEngines = company.CompanyGameEngines.map(engine => engine.gameEngineName).join(' ').toLocaleLowerCase();
          const projectHeilegths = company.portfolioProjects.map(project => project.name).join(' ').toLocaleLowerCase();
          const projectHeilegthsDesc = company.portfolioProjects.map(project => project.description).join(' ').toLocaleLowerCase();
          const searchIn = [company.name, company.about, services, gameEngines, projectHeilegths, projectHeilegthsDesc].join(' ').toLowerCase();
          const normalizedSearchIn = normalizeString(searchIn);
          return normalizedSearchIn.includes(normalizedSearchTerm) || keywords.some(keyword => searchIn.includes(keyword));
        })
        .sort((a, b) => {
          const aNormalizedName = normalizeString(a.name);
          const bNormalizedName = normalizeString(b.name);
          const aServices = a.ServicesOpt.map(opt => opt.service?.serviceName).join(' ').toLowerCase();
          const bServices = b.ServicesOpt.map(opt => opt.service?.serviceName).join(' ').toLowerCase();

          // Prioritize exact match of normalized search term in company name
          const aFirstKeywordMatch = aNormalizedName.includes(normalizedSearchTerm);
          const bFirstKeywordMatch = bNormalizedName.includes(normalizedSearchTerm);

          if (aFirstKeywordMatch && !bFirstKeywordMatch) {
            return -1; // a should come before b
          }
          if (!aFirstKeywordMatch && bFirstKeywordMatch) {
            return 1; // a should come after b
          }

          // Next, prioritize any keyword match in company name
          const aNameMatch = keywords.some(keyword => aNormalizedName.includes(keyword));
          const bNameMatch = keywords.some(keyword => bNormalizedName.includes(keyword));

          if (aNameMatch && !bNameMatch) {
            return -1; // a should come before b
          }
          if (!aNameMatch && bNameMatch) {
            return 1; // a should come after b
          }

          // Finally, prioritize any keyword match in services
          const aServiceMatch = keywords.some(keyword => aServices.includes(keyword));
          const bServiceMatch = keywords.some(keyword => bServices.includes(keyword));

          if (aServiceMatch && !bServiceMatch) {
            return -1; // a should come before b
          }
          if (!aServiceMatch && bServiceMatch) {
            return 1; // a should come after b
          }

          return 0; // no change in order
        });
    }

    if (searchString) {
      serviceProviders = results
    }
    const totalusers = serviceProviders.length;
    if (sortColumn == 'Tier') {
      serviceProviders.sort((a: any, b: any) => {
        // First, sort by isPaidUser in descending order
        const multiplier = sortColumnOrder == "desc" ? 1 : 0;
        if (a.user.isPaidUser !== b.user.isPaidUser) {
          return b.user.isPaidUser - a.user.isPaidUser * multiplier;
        }
        // If isPaidUser is the same, then sort by id in ascending order
        if (multiplier == 1) {
          return a.id - b.id;
        } else {
          return -1;
        }

      });
    }

    //Sponsered Company For a service
    if (selectedCapabilityIdarray && Object.keys(selectedCapabilityIdarray).length > 0) {
      let serviceids = Object.keys(selectedCapabilityIdarray);
      const updatedserviceids = serviceids.map((serivceId) => Number(serivceId.replace('a', '')))
      const sponseredCompanies = await this.prismaService.sponseredServices.findMany({
        where: {
          serviceId: {
            in: updatedserviceids
          },
          endDate: {
            gte: new Date(),
          },
        },
        select: {
          companyId: true,
        }
      });

      const sponseredIds = sponseredCompanies.map((company) => company.companyId);
      const filteredService = serviceProviders.filter(
        (company) => !sponseredIds.includes(company.id)
      );

      const removedServices = serviceProviders.filter(
        (company) => sponseredIds.includes(company.id)
      );
      const updatedServiceProviders = [...removedServices, ...filteredService];

      serviceProviders = updatedServiceProviders;
    }

    const currentSearchCompanyIds = serviceProviders.map((provider) => provider.id);
    if (sortColumn === "Following") {
      const multiplier = sortColumnOrder == "desc" ? 1 : -1;
      serviceProviders.sort((a: any, b: any) => {
        const returndata = ((b.followedCompanies?.length || -1) - (a.followedCompanies?.length || -1)) * multiplier;
        return returndata;
      });
    }

    serviceProviders = serviceProviders.slice(skip, skip + (limit ? limit : 0));

    for (const provider of serviceProviders) {
      if (provider.logoAsset && provider.logoAsset.url) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.logoAsset.url,
        );
        provider.logoAsset.url = logosignedUrl;
      }

      if (provider.ServicesOpt && provider.ServicesOpt.length > 0) {
        const uniqueServices = new Set();
        const uniqueServicesOpt = provider.ServicesOpt.filter(serviceOpt => {
          const serviceKey = `${serviceOpt.service?.serviceName}-${serviceOpt.service?.groupId}`;
          if (!uniqueServices.has(serviceKey)) {
            uniqueServices.add(serviceKey);
            return true;
          }
          return false;
        });

        provider.ServicesOpt = uniqueServicesOpt;
      }

    }
    return {
      list: serviceProviders,
      currentSearchCompanyIds,
      success: true,
      statusCode: HttpStatus.OK,
      currentpage: start,
      totalpages: totalusers,
    };
  }

  async findSponserUsers() {
    try {
      const sponsers = await this.prismaService.companies.findMany({
        where: {
          isArchieve: false,
          isDelete: false,
          user: {
            approvalStatus: "completed",
            userRoles: {
              some: {
                roleCode: "service_provider",
              },
            },
          },
          isFoundingSponcer: true,
        },
        take: 6,
        include: {
          logoAsset: {
            select: {
              url: true,
            },
          },
          bannerAsset: {
            select: {
              url: true,
            },
          },
          user: {
            include: {
              assets: {
                select: {
                  url: true,
                },
              },
              userRoles: {
                select: {
                  roleCode: true,
                },
              },
            },
          },
          ServicesOpt: {
            select: {
              service: {
                select: {
                  serviceName: true,
                  groupId: true,
                },
              },
            },
            where: {
              capabilityId: null,
              isDelete: false,
              status: 1,
            }
          },
          companySizes: {
            select: {
              size: true,
            },
          },
          CompanyAddress: {
            select: {
              location_name: true,
              Country: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (sponsers) {
        await Promise.all(
          sponsers.map(async (sponser) => {
            if (sponser?.logoAsset && sponser?.logoAsset?.url) {
              const signedLogo = await this.gcsService.getSignedUrl(
                sponser.logoAsset.url,
              );
              sponser.logoAsset.url = signedLogo;
            }
          }),
        );
      }
      if (sponsers) {
        await Promise.all(
          sponsers.map(async (sponser) => {
            if (sponser?.bannerAsset && sponser?.bannerAsset?.url) {
              const signedLogo = await this.gcsService.getSignedUrl(
                sponser.bannerAsset.url,
              );
              sponser.bannerAsset.url = signedLogo;
            }
          }),
        );
      }
      const shuffledArray = [...sponsers];

      shuffledArray.sort(() => Math.random() - 0.5);
      return {
        list: shuffledArray,
        success: true,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw new error;
    }
  }

  async findAllservices() {
    try {
      const response = await this.prismaService.services.findMany({
        where: {
          status: 1,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findAllregions() {
    try {
      const response = await this.prismaService.region.findMany({
        where: {
          status: 1,
        },
        select: {
          name: true,
          Country: true,
        },
        orderBy: {
          name: 'asc',
        }
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findAllCompanysizes() {
    try {
      const response = await this.prismaService.companySizes.findMany({
        where: {
          status: 1,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findMyAllList(userId: number) {
    try {
      const response = await this.prismaService.myLists.findMany({
        where: {
          userId: Number(userId),
          status: 1,
          isArchieve: false,
          isDelete: false,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findMyAllProjects(userId: number) {
    try {
      const response = await this.prismaService.myProjects.findMany({
        where: {
          userId: Number(userId),
          status: 1,
          isArchieve: false,
          isDelete: false,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async CreateCompaniesToMyList(mylist: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
  }, companyId: number) {
    const newMylistObj: newtest[] = [];

    //if companies adding to new list adding
    if (mylist.newlistname) {
      try {
        const insertedData = await this.prismaService.myLists.create({
          data: {
            name: mylist.newlistname,
            userId: mylist.loggedUserId,
            description: "",
          },
        });
        const insertedId = insertedData.id;
        mylist.companies.forEach((company) => {
          const newObj = {
            listId: insertedId,
            companyId: company,
          };
          newMylistObj.push(newObj);
        });
        await this.prismaService.intrestedInMyLists.createMany({
          data: newMylistObj,
        });
        this.addAndSendListNotifications(companyId, mylist.companies);
        return {
          success: true,
          message: "Added Successfully",
          StatusCode: HttpStatus.CREATED,
        };
      } catch (error) {
        throw new Exception(error);
      }
    }

    // if companies adding to existing list
    type newtest = {
      listId: number;
      companyId: number;
    };

    mylist.companies.forEach((company) => {
      mylist.mylist.forEach(async (list) => {
        const newObj = {
          listId: list,
          companyId: company,
        };
        newMylistObj.push(newObj);

      });
    });

    for (const list of mylist.mylist) {
      const existingCompaniesInList = await this.prismaService.intrestedInMyLists.findMany({
        where: {
          listId: list
        },
        select: {
          companyId: true
        }
      });
      const newlyAddedCompanies = mylist.companies?.filter((item) => {
        return !existingCompaniesInList.some(el => el.companyId == +item)
      });
      await this.addAndSendListNotifications(companyId, newlyAddedCompanies);
    }

    for (const entry of newMylistObj) {
      try {
        // Update existing records with isDelete: true
        await this.prismaService.intrestedInMyLists.deleteMany({
          where: {
            listId: entry.listId,
            companyId: entry.companyId,
          },
        });
      } catch (error) {
        console.error(`Error updating records: ${error}`);
        return {
          success: false,
          message: `Something went wrong: ${error}`,
          StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
    }

    try {
      await this.prismaService.intrestedInMyLists.createMany({
        data: newMylistObj,
      });
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async CreateIntrestedListToMyProject(mylist: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
    projectId: number;
  }) {
    const newMylistObj: newList[] = [];

    //if companies adding to new list adding
    if (mylist.newlistname) {
      try {
        const insertedData = await this.prismaService.myLists.create({
          data: {
            name: mylist.newlistname,
            userId: mylist.loggedUserId,
            description: "",
          },
        });
        const insertedId = insertedData.id;
        // mylist.companies.forEach((company) => {
        const newObj = {
          listId: insertedId,
          projectId: mylist.projectId,
        };
        newMylistObj.push(newObj);
        // });
        await this.prismaService.myIntrestedProjectsList.createMany({
          data: newMylistObj,
        });
        return {
          success: true,
          message: "Added Successfully",
          StatusCode: HttpStatus.CREATED,
        };
      } catch (error) {
        throw new Exception(error);
      }
    }

    // if companies adding to existing list
    type newtest = {
      listId: number;
      companyId: number;
    };

    type newList = {
      listId: number;
      projectId: number;
    };

    // mylist.companies.forEach((company) => {
    mylist.mylist.forEach(async (list) => {
      const newObj = {
        listId: list,
        projectId: mylist.projectId,
      };
      newMylistObj.push(newObj);
    });
    // });
    for (const entry of newMylistObj) {
      try {
        // Update existing records with isDelete: true
        await this.prismaService.myIntrestedProjectsList.deleteMany({
          where: {
            listId: entry.listId,
            projectId: entry.projectId,
          },
        });
      } catch (error) {
        console.error(`Error updating records: ${error}`);
        return {
          success: false,
          message: `Something went wrong: ${error}`,
          StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
    }
    try {
      await this.prismaService.myIntrestedProjectsList.createMany({
        data: newMylistObj,
      });
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async CreateCompaniesToMyProject(myProject: {
    loggedUserId: number;
    companies: number[];
    mylist: number[];
    newlistname: string;
  }) {
    const newMylistObj: newprojTypes[] = [];

    //if companies adding to new Project adding
    if (myProject.newlistname) {
      try {
        const insertedData = await this.prismaService.myProjects.create({
          data: {
            name: myProject.newlistname,
            userId: myProject.loggedUserId,
            description: "",
          },
        });
        const insertedId = insertedData.id;
        myProject.companies.forEach((company) => {
          const newObj = {
            projectId: insertedId,
            companyId: company,
          };
          newMylistObj.push(newObj);
        });

        await this.prismaService.intrestedInMyProjects.createMany({
          data: newMylistObj,
        });
        return {
          success: true,
          message: "Added Successfully",
          StatusCode: HttpStatus.CREATED,
        };
      } catch (error) {
        throw new Exception(error);
      }
    }

    // if companies adding to existing list
    type newprojTypes = {
      projectId: number;
      companyId: number;
    };

    myProject.companies.forEach((company) => {
      myProject.mylist.forEach((list) => {
        const newObj = {
          projectId: list,
          companyId: company,
        };
        newMylistObj.push(newObj);
      });
    });

    for (const entry of newMylistObj) {
      try {
        // Update existing records with isDelete: true
        await this.prismaService.intrestedInMyProjects.deleteMany({
          where: {
            projectId: entry.projectId,
            companyId: entry.companyId,
          },
        });
      } catch (error) {
        console.error(`Error updating records: ${error}`);
        return {
          success: false,
          message: `Something went wrong: ${error}`,
          StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
    }

    try {
      await this.prismaService.intrestedInMyProjects.createMany({
        data: newMylistObj,
      });
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async findCompanyBySize(sizeStr: string) {
    try {
      const response = await this.prismaService.companySizes.findFirst({
        where: {
          size: sizeStr,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findServiceByName(service: string) {
    try {
      const response = await this.prismaService.services.findFirst({
        where: {
          serviceName: {
            contains: service,
            mode: "insensitive",
          },
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async findServiceNotInSystem(services: string[]) {
    try {
      const response = await this.prismaService.services.findMany({
        where: {
          serviceName: {
            notIn: services.map((value) => value.toLowerCase()),
          },
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        list: response,
      };
    } catch (error) {
      throw new Exception(error);
    }
  }

  async getCompanyById(companyId: number) {
    return await this.prismaService.companies.findFirst({
      where: {
        id: companyId,
        isArchieve: false,
        isDelete: false,
        user: {
          approvalStatus: "completed",
          isArchieve: false,
          userRoles: {
            some: {
              roleCode: "service_provider",
            },
          }
        }
      }
    })
  }

  async getSPDetailsForFreeUser(spId: number, loggedUserId: number) {
    try {
      const serviceProviders = await this.prismaService.companies.findFirst({
        where: {
          id: Number(spId),
          isArchieve: false,
          isDelete: false,
          user: {
            approvalStatus: "completed",
            isArchieve: false,
            isDelete: false,
            userRoles: {
              some: {
                roleCode: "service_provider",
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          about: true,
          profilePdfPath: true,
          profilePdfName: true,
          isFlagged: true,
          slug: true,
          shortDescription:true,
          logoAsset: {
            select: {
              url: true,
            },
          },
          bannerAsset: {
            select: {
              url: true,
            },
          },
          user: {
            select: {
              id: true,
              isPaidUser: true,
              userRoles: {
                select: {
                  roleCode: true,
                },
              },
            },
          },
          ServicesOpt: {
            select: {
              service: {
                select: {
                  serviceName: true,
                  groupId: true,
                },
              },
            },
            where: {
              capabilityId: null,
              isDelete: false,
              status: 1,
            }
          },
          companySizes: {
            select: {
              size: true,
            },
          },
          ServiceProviderAnnouncements: {
            where: {
              isArchieve: false,
              isDelete: false,
            },
            orderBy:{
              orderValue:'asc'
            }
          }
        }
      })
      if (serviceProviders?.profilePdfPath && serviceProviders?.user.isPaidUser) {
        const profileSignedUrl = await this.gcsService.getSignedUrl(
          serviceProviders?.profilePdfPath,
        );
        serviceProviders.profilePdfPath = profileSignedUrl;
      } else {
        if (serviceProviders) serviceProviders.profilePdfPath = '';
      }

      if (serviceProviders?.logoAsset?.url) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          serviceProviders?.logoAsset?.url,
        );
        serviceProviders.logoAsset.url = bannersignedUrl;
      }

      if (serviceProviders?.bannerAsset?.url) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          serviceProviders?.bannerAsset?.url,
        );
        serviceProviders.bannerAsset.url = bannersignedUrl;
      }
      let flaggedUsersDetails;
      if (serviceProviders) {
        if (serviceProviders?.isFlagged) {
          flaggedUsersDetails = await this.prismaService.flaggedUsers.findFirst({
            where: {
              isDelete: false,
              status: 1,
              reportedCompanyId: Number(spId),
              companyId: Number(loggedUserId),
            },
          })
        }
      }
      let evenstAvaialble = 0;
      if (!serviceProviders?.user.isPaidUser) {
        evenstAvaialble = await this.prismaService.events.count({
          where: {
            isArchieve: false,
            isDelete: false,
          }
        })
      }
      if(serviceProviders && serviceProviders.ServiceProviderAnnouncements?.length > 0) {
        for(const item of serviceProviders.ServiceProviderAnnouncements) {
          const signedImageUrl = item.imageUrl ? await this.gcsService.getSignedUrl(item.imageUrl) : "";
          item.imageUrl = signedImageUrl;
        }
      }
      return {
        list: serviceProviders,
        evenstAvaialble,
        flaggedDetails: flaggedUsersDetails,
        success: true,
        statusCode: HttpStatus.OK,
      };
    }
    catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      };
    }
  }

  async findOne(spId: number, loggedCompanyId: number) {
    try {
      const serviceProviders = await this.prismaService.companies.findFirst({
        where: {
          id: Number(spId),
          isArchieve: false,
          isDelete: false,
          user: {
            approvalStatus: "completed",
            isArchieve: false,
            isDelete: false,
            userRoles: {
              some: {
                roleCode: "service_provider",
              },
            },
          },
        },
        include: {
          logoAsset: {
            select: {
              url: true,
            },
          },
          bannerAsset: {
            select: {
              url: true,
            },
          },
          user: {
            select: {
              id: true,
              isPaidUser: true,
              userRoles: {
                select: {
                  roleCode: true,
                },
              },
            },
          },
          ServicesOpt: {
            select: {
              service: {
                select: {
                  serviceName: true,
                  groupId: true,
                },
              },
            },
            where: {
              capabilityId: null,
              isDelete: false,
              status: 1,
            }
          },
          companySizes: {
            select: {
              size: true,
            },
          },
          CompanyAddress: {
            include: {
              Country: {
                select: {
                  name: true,
                },
              },
            },
          },
          CertificationAndDiligence: true,
          CompanyPlatformExperience: {
            select: {
              platforms: {
                select: {
                  name: true,
                }
              }
            }
          },
          CompanyGameEngines: {
            where: {
              isChecked: true,
            },
            select: {
              gameEngineName: true,
            }
          },
          portfolioProjects: {
            select: {
              id: true,
              name: true,
              completionDate: true,
              testimonial_company: true,
              testimonial_feedback: true,
              testimonial_name: true,
              testimonial_title: true,
              description: true,
              FileUploads: true,
              PlatformsOpt: {
                select: {
                  platforms: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              reOrderingId: "asc",
            },
          },
          portfolioAlbum: {
            orderBy: { reOrderingId: "asc" },
            include: {
              portfolioAlbumFiles: {
                orderBy: { id: "asc" },
                take: 1,
              },
            }
          },
          CompanyContacts: {
            select: {
              name: true,
              email: true,
              title: true,
              linkedInUrl: true,
              profilePic: true,
              calendarLink: true,
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
          ServiceProviderAnnouncements: {
            where: {
              isArchieve: false,
              isDelete: false
            },
            orderBy:{
              orderValue: 'asc'
            }
          }
          // followedCompanies: {
          //   where: {
          //     followingCompany: {
          //       id: loggedUserId
          //     }
          //   }
          // }
        },
      });
      let flaggedUsersDetails;

      let followDetails;
      if (serviceProviders) {
        followDetails = await this.prismaService.followDetails.findFirst({
          where: {
            isActive: true,
            followedCompanyId: +spId,
            companyId: +loggedCompanyId
          }
        });

        if (serviceProviders?.isFlagged) {
          flaggedUsersDetails = await this.prismaService.flaggedUsers.findFirst({
            where: {
              isDelete: false,
              status: 1,
              reportedCompanyId: Number(spId),
              companyId: Number(loggedCompanyId),
            },
          })
        }

        if (serviceProviders?.profilePdfPath && serviceProviders?.user.isPaidUser) {
          const profileSignedUrl = await this.gcsService.getSignedUrl(
            serviceProviders?.profilePdfPath,
          );
          serviceProviders.profilePdfPath = profileSignedUrl;
        } else {
          if (serviceProviders) serviceProviders.profilePdfPath = '';
        }

        if (serviceProviders?.logoAsset?.url) {
          const bannersignedUrl = await this.gcsService.getSignedUrl(
            serviceProviders?.logoAsset?.url,
          );
          serviceProviders.logoAsset.url = bannersignedUrl;
        }

        if (serviceProviders?.bannerAsset?.url) {
          const bannersignedUrl = await this.gcsService.getSignedUrl(
            serviceProviders?.bannerAsset?.url,
          );
          serviceProviders.bannerAsset.url = bannersignedUrl;
        }
        // const loggedCompany = await this.prismaService.users.findFirst({
        //   where: {
        //     id: loggedUserId,
        //   },
        //   select: {
        //     isPaidUser: true,
        //     userRoles: {
        //       select: {
        //         roleCode: true,
        //       }
        //     }
        //   }
        // })
        // if (loggedCompany?.userRoles[0].roleCode == 'buyer' && !loggedCompany.isPaidUser) {
        //   if (serviceProviders.portfolioAlbum) {
        //     serviceProviders.portfolioAlbum = serviceProviders.portfolioAlbum.slice(0, 4);
        //   }
        //   if (serviceProviders.portfolioProjects) {
        //     serviceProviders.portfolioProjects = serviceProviders.portfolioProjects.slice(0, 1);
        //   }
        //   if (serviceProviders.CertificationAndDiligence) {
        //     serviceProviders.CertificationAndDiligence = null;
        //   }
        //   if (serviceProviders.CompanyContacts) {
        //     serviceProviders.CompanyContacts = [];
        //   }
        // }
        if (serviceProviders && serviceProviders.portfolioAlbum && serviceProviders.user?.isPaidUser) {
          for (const albums of serviceProviders.portfolioAlbum) {
            for (const fileUpload of albums.portfolioAlbumFiles) {
              if (fileUpload.thumbnail) {
                let fileName = fileUpload.thumbnail;
                if (fileUpload.thumbnail.startsWith("http")) {
                  const queryString = decodeURIComponent(fileUpload.thumbnail.split("?")[1]);
                  const queryParams = new URLSearchParams(queryString);
                  const expirationTime = queryParams.get("X-Goog-Expires");
                  const urlObj = new URL(fileUpload.thumbnail);
                  const pathname = decodeURIComponent(urlObj.pathname);
                  // Extract file name from the pathname
                  fileName = pathname.split('/').slice(2).join('/');
                }
                const signedUrl = await this.gcsService.getPublicSignedUrl(
                  fileName,
                );
                fileUpload.thumbnail = signedUrl;
              }
              if (fileUpload.fileUrl && fileUpload.type === "image") {
                const signedUrl = await this.gcsService.getPublicSignedUrl(
                  fileUpload.fileUrl,
                );
                fileUpload.fileUrl = signedUrl;
              }

              // } else if (fileUpload.fileUrl.startsWith('https') && fileUpload.type === "video") {
              //  fileUpload.fileUrl = fileUpload.fileUrl;
              //  }

              // old code============================================================
              // if (!fileUpload.fileUrl.startsWith('https')) {
              //   const bannersignedUrl = await this.gcsService.getSignedUrl(
              //     fileUpload.fileUrl,
              //   );
              //   fileUpload.fileUrl = bannersignedUrl;
              // }else if(fileUpload.fileUrl.startsWith('https')){
              //   fileUpload.fileUrl = fileUpload.fileUrl ? fileUpload.fileUrl : "";
              // }
              // old code===============================================================
            }

          }
        } else {
          serviceProviders.portfolioAlbum = [];
        }
        if (serviceProviders && serviceProviders.CompanyContacts && serviceProviders.user?.isPaidUser) {
          for (const contact of serviceProviders.CompanyContacts) {
            if (contact.profilePic) {
              const signedUrlThumb = await this.gcsService.getSignedUrl(
                contact.profilePic,
              );
              contact.profilePic = signedUrlThumb;
            }
          }
        } else {
          serviceProviders.CompanyContacts = [];
        }
        if (serviceProviders && serviceProviders.portfolioProjects && serviceProviders.user?.isPaidUser) {
          for (const project of serviceProviders.portfolioProjects) {
            if (project.FileUploads) {
              for (const fileUpload of project.FileUploads) {
                if (fileUpload.type === "image") {
                  if (fileUpload.thumbnail) {
                    const signedUrlThumb = await this.gcsService.getSignedUrl(
                      fileUpload.thumbnail,
                    );
                    fileUpload.thumbnail = signedUrlThumb;
                  }
                  const signedUrl = await this.gcsService.getSignedUrl(
                    fileUpload.fileUrl,
                  );
                  fileUpload.fileUrl = signedUrl;
                } else {
                  if (fileUpload.thumbnail && !fileUpload.thumbnail.startsWith('https')) {

                    const signedUrlThumb = await this.gcsService.getSignedUrl(
                      fileUpload.thumbnail,
                    );
                    fileUpload.thumbnail = signedUrlThumb;

                  }
                }
              }
            }
          }
        } else {
          serviceProviders.portfolioProjects = [];
        }

        if (serviceProviders.ServicesOpt) {
          if (serviceProviders.ServicesOpt && serviceProviders.ServicesOpt.length > 0) {
            const uniqueServices = new Set();
            const uniqueServicesOpt = serviceProviders.ServicesOpt.filter(serviceOpt => {
              const serviceKey = `${serviceOpt.service?.serviceName}-${serviceOpt.service?.groupId}`;
              if (!uniqueServices.has(serviceKey)) {
                uniqueServices.add(serviceKey);
                return true;
              }
              return false;
            });

            serviceProviders.ServicesOpt = uniqueServicesOpt;
          }
        }
      }

      let evenstAvaialble = 0;
      if (serviceProviders && !serviceProviders?.user.isPaidUser) {
        evenstAvaialble = await this.prismaService.events.count({
          where: {
            isArchieve: false,
            isDelete: false,
          }
        })
        serviceProviders.CertificationAndDiligence = null;
        serviceProviders.CompanyGameEngines = [];
        serviceProviders.CompanyAddress = [];
      }
      if(serviceProviders && serviceProviders.ServiceProviderAnnouncements?.length > 0) {
        for(const item of serviceProviders.ServiceProviderAnnouncements) {
          const signedImageUrl = item.imageUrl ? await this.gcsService.getSignedUrl(item.imageUrl) : "";
          item.imageUrl = signedImageUrl;
        }
      }
      return {
        list: serviceProviders,
        followDetails: followDetails,
        evenstAvaialble,
        flaggedDetails: flaggedUsersDetails,
        success: true,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      };
    }
  }

  async getAllCountries() {
    return this.prismaService.country.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getAllPlatforms() {
    return this.prismaService.platforms.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      }
    });
  }

  async getAllHomePageApis(userId: number, date: string) {

    const currentDate = new Date();
    const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    const getCompanyId = await this.prismaService.companies.findFirst({
      where: {
        userId: Number(userId),
      },
      select: {
        id: true,
        user: {
          select: {
            userRoles: {
              select: {
                roleCode: true,
              }
            }
          }
        }
      },
    });

    const mylist = await this.prismaService.myLists.findMany({
      where: {
        userId: Number(userId),
        isArchieve: false,
        isDelete: false,
      },
      take: 4,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        name: true,
        description: true,
        updatedAt: true,
        id: true,
      },
    });
    const myProjects = await this.prismaService.myProjects.findMany({
      where: {
        userId: Number(userId),
        isArchieve: false,
        isDelete: false,
      },
      take: 4,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        name: true,
        description: true,
        updatedAt: true,
        id: true,
      },
    });
    const localDate = new Date(date).toLocaleDateString('en-US');
    let justJoinedUsers = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        displayDate: toLocalISOString(localDate),
        userCategory: 'just joined',
        isDelete: false,
      },
      select: {
        companyId: true,
        userCategory: true,
        categoryType: true,
        displayDate: true,
        Companies: {
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select: {
            name: true,
            slug: true,
            updatedAt: true,
            logoAsset: {
              select: {
                url: true,
              },
            },
          },
        }
      },
      orderBy: {
        categoryType: 'asc',
      }
    });

    justJoinedUsers = justJoinedUsers.filter(user => user.Companies && user.Companies.name);
    let announcements = await this.prismaService.announcementUpdates.findMany({
      where: {
        displayDate: toLocalISOString(localDate),
        isDelete: false,
        isActive: true,
        // SpAnnouncements:{
        //   isArchieve:false,
        //   isDelete:false,
        // }
      },
      select: {
        companyId: true,
        displayDate: true,
        categoryType: true,
        SpAnnouncements:{
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select:{
            title: true,
            description: true,
            imageUrl: true,
          }
        },
        testimonials:{
          where: {  
            isDelete: false,
          },
          select: {
            id: true,
            name: true,
            testimonial_name: true,
            testimonial_company: true,
          }
        },
        Companies: {
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select: {
            name: true,
            slug: true,
            updatedAt: true,
            logoAsset: {
              select: {
                url: true,
              },
            },
          },
        }
      },
      orderBy: {
        id: 'asc',
      }
    });
    // announcements = announcements.filter(user => user.Companies && user.Companies.name);

    let freshAndUpdated = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        displayDate: toLocalISOString(localDate),
        userCategory: 'fresh and updated',
        isDelete: false,
      },
      select: {
        companyId: true,
        userCategory: true,
        categoryType: true,
        displayDate: true,
        Companies: {
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select: {
            name: true,
            slug: true,
            updatedAt: true,
            logoAsset: {
              select: {
                url: true,
              },
            },
          },
        }
      },
      orderBy: {
        categoryType: 'asc',
      }
    });
    freshAndUpdated = freshAndUpdated.filter(user => user.Companies && user.Companies.name);
    const groupedResults = freshAndUpdated.reduce((acc: Record<number, {
      companyId: number;
      name: string;
      updatedAt: Date;
      slug: string,
      logoUrl: string;
      categories: number[];
      userCategory: string;
    }>, item: any) => {
      const { companyId, categoryType, Companies, displayDate } = item;

      // Check if companyId is not null
      if (companyId !== null) {
        // Check if the company already exists in the accumulator
        if (!acc[companyId]) {
          acc[companyId] = {
            companyId,
            name: Companies?.name,
            updatedAt: displayDate,
            logoUrl: Companies?.logoAsset ? Companies?.logoAsset.url : '',
            categories: [],
            userCategory: Companies?.logoAsset ? Companies?.logoAsset.url : '',
            slug: Companies?.slug
          };
        }

        // Add the categoryType to the company's categories array
        acc[companyId].categories.push(categoryType);
      }

      return acc;
    }, {});

    const freshAndUpdatedUsers = Object.values(groupedResults);


    const sponsoredPartnersData = await this.prismaService.sponsoredPartners.findMany({
      where: {
        fileType: 'sponsered',
        isSelected: true,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        fileUrl: true,
        fileName: true,
      },
    });
    const articles = await this.prismaService.latestArticles.findMany({
      where: {
        isDelete: false,
        AND: {
          isActive: true,
          StartDate: {
            lte: toLocalISOString(localDate),
          },
          EndDate: {
            gte: toLocalISOString(localDate),
          },
        }
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        webUrl: true,
        logoPath: true,
        StartDate: true,
        EndDate: true,
        description: true,
        displayOrder: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        ArticleCategory: {
          select: {
            categoryName: true,
          }
        },
        advtId: true,
      },
      orderBy: {
        displayOrder: 'asc',
      }
    });
    if (articles) {
      for (const data of articles) {
        if (data.logoPath) {
          const signedUrl = await this.gcsService.getSignedUrl(
            data.logoPath,
          );
          (data as unknown as SignedUrlAddedDto).signedUrl = signedUrl;
        }
        if (data.StartDate && data.createdAt) {
          if (data.StartDate.getDate() == data.createdAt.getDate()) {
            data.StartDate = data.createdAt;
          }
        }
      }
    }

    // if(getCompanyId?.id){
    // const submittedIntrested =
    //   await this.prismaService.serviceProvidersIntrests.findMany({
    //     where: {
    //       companyId: getCompanyId?.id,
    //       opportunity: {
    //         oppStatus: OPPORTUNITY_STATUS.publish,
    //         expiryDate: {
    //           gt: currentDateWithoutTime,
    //         },
    //         company: {
    //           isArchieve: false,
    //           isDelete: false
    //         }
    //       },
    //     },
    //     take: 4,
    //     orderBy: {
    //       id: "desc",
    //     },
    //     include: {

    //       opportunity: {
    //         include: {
    //           company: {
    //             select: {
    //               slug: true,
    //               name: true,
    //               logoAsset: {
    //                 select: {
    //                   url: true,
    //                 },
    //               },
    //             },
    //           },
    //           FileUploads: true,
    //         },
    //       },
    //     },
    //   });
    // if (submittedIntrested) {
    //   await Promise.all(
    //     submittedIntrested.map(async (intrested) => {
    //       if (intrested.opportunity.company.logoAsset) {
    //         intrested.opportunity.company.logoAsset.url = await this.gcsService.getSignedUrl(intrested.opportunity.company.logoAsset.url);
    //       }
    //       if (intrested.opportunity.FileUploads) {
    //         await Promise.all(
    //           intrested.opportunity.FileUploads.map(async (fileurl) => {
    //             fileurl.fileUrl = await this.gcsService.getSignedUrl(
    //               fileurl.fileUrl,
    //             );
    //           }),
    //         );
    //       }
    //       intrested.opportunity.companyId = 0;
    //       if (!intrested.opportunity.showCompanyName) {
    //         intrested.opportunity.company.name = '';
    //       }
    //     }),
    //   );
    // }
    // }
    const recentViewedProfiles =
      await this.prismaService.recentlyViewedProfiles.findMany({
        where: {
          visitorCompanyId: getCompanyId?.id,
          viewedCompany: {
            isArchieve: false,
            isDelete: false,
          },
          visitorCompany: {
            isArchieve: false,
            isDelete: false,
          }
        },
        take: 4,
        distinct: ['companyId'],
        include: {
          viewedCompany: {
            select: {
              id: true,
              name: true,
              slug: true,
              ServicesOpt: {
                select: {
                  service: {
                    select: {
                      serviceName: true,
                      groupId: true,
                    },
                  },
                },
                where: {
                  capabilityId: null,
                  isDelete: false,
                  status: 1,
                }
              },
              logoAsset: {
                select: {
                  url: true,
                },
              },
              bannerAsset: {
                select: {
                  url: true,
                },
              },
              // user: {
              //   include: {
              //     userRoles: {
              //       select: {
              //         roleCode: true,
              //       },
              //     },
              //   },
              // },
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      });

    const companyUsers = await this.prismaService.companyAdminUser.findMany({
      where: {
        companyId: getCompanyId?.id,
      },
      select: {
        id: true,
        firstName: true,
        LastName: true,
        createdAt: true,
        lastLoginDate: true,
      }
    })

    if (recentViewedProfiles) {
      recentViewedProfiles.map((company) => {

        if (company.viewedCompany.ServicesOpt) {
          const uniqueServices = new Set();
          const uniqueServicesOpt = company.viewedCompany.ServicesOpt.filter(serviceOpt => {
            const serviceKey = `${serviceOpt.service?.serviceName}-${serviceOpt.service?.groupId}`;
            if (!uniqueServices.has(serviceKey)) {
              uniqueServices.add(serviceKey);
              return true;
            }
            return false;
          });

          company.viewedCompany.ServicesOpt = uniqueServicesOpt;
        }
      })
    }
    // const recentJoinedProfiles =
    //   await this.prismaService.companies.findMany({
    //     where: {
    //       isArchieve: false,
    //       isDelete: false,
    //     },
    //     take: 5,
    //     include: {
    //       ServicesOpt: {
    //         select: {
    //           service: {
    //             select: {
    //               serviceName: true,
    //               groupId: true,
    //             },
    //           },
    //         },
    //         where: {
    //           capabilityId: null,
    //           isDelete: false,
    //           status: 1,
    //         }
    //       },
    //       logoAsset: {
    //         select: {
    //           url: true,
    //         },
    //       },
    //       bannerAsset: {
    //         select: {
    //           url: true,
    //         },
    //       },
    //       user: {
    //         include: {
    //           userRoles: {
    //             select: {
    //               roleCode: true,
    //             },
    //           },
    //         },
    //       },
    //     },
    //     orderBy: {
    //       id: "desc",
    //     },
    //   });
    // if (recentJoinedProfiles) {
    //   recentJoinedProfiles.map((company) => {

    //     if (company.ServicesOpt) {
    //       const uniqueServices = new Set();
    //       const uniqueServicesOpt = company.ServicesOpt.filter(serviceOpt => {
    //         const serviceKey = `${serviceOpt.service?.serviceName}-${serviceOpt.service?.groupId}`;
    //         if (!uniqueServices.has(serviceKey)) {
    //           uniqueServices.add(serviceKey);
    //           return true;
    //         }
    //         return false;
    //       });
    //       company.ServicesOpt = uniqueServicesOpt;
    //     }
    //   })
    // }
    const bannerAdImage = await this.prismaService.advertisements.findMany({
      where: {
        isArchieve: false,
        isDelete: false,
        adPage: "home",
        startDate: {
          lte: new Date(toLocalISOString(date)),
        },
        endDate: {
          gte: new Date(toLocalISOString(date)),
        },
      },
      select: {
        id: true,
        adImagePath: true,
        mobileAdImagePath: true,
        adPage: true,
        adURL: true,
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    for (const provider of sponsoredPartnersData) {
      if (
        provider &&
        provider.fileUrl
      ) {
        const sponseredLogoUrl = await this.gcsService.getSignedUrl(
          provider.fileUrl,
        );
        provider.fileUrl = sponseredLogoUrl;
      }
    }

    for (const provider of recentViewedProfiles) {
      if (
        provider.viewedCompany.bannerAsset &&
        provider.viewedCompany.bannerAsset.url
      ) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          provider.viewedCompany.bannerAsset.url,
        );
        provider.viewedCompany.bannerAsset.url = bannersignedUrl;
      }
      if (
        provider.viewedCompany.logoAsset &&
        provider.viewedCompany.logoAsset.url
      ) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.viewedCompany.logoAsset.url,
        );
        provider.viewedCompany.logoAsset.url = logosignedUrl;
      }
    }

    // for (const provider of recentJoinedProfiles) {
    //   if (
    //     provider.bannerAsset &&
    //     provider.bannerAsset.url
    //   ) {
    //     const bannersignedUrl = await this.gcsService.getSignedUrl(
    //       provider.bannerAsset.url,
    //     );
    //     provider.bannerAsset.url = bannersignedUrl;
    //   }
    //   if (
    //     provider.logoAsset &&
    //     provider.logoAsset.url
    //   ) {
    //     const logosignedUrl = await this.gcsService.getSignedUrl(
    //       provider.logoAsset.url,
    //     );
    //     provider.logoAsset.url = logosignedUrl;
    //   }
    // }
    for (const provider of bannerAdImage) {
      if (provider.adImagePath) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          provider.adImagePath,
        );
        const mbBannersignedUrl = await this.gcsService.getSignedUrl(
          provider.mobileAdImagePath,
        );
        provider.adImagePath = bannersignedUrl;
        provider.mobileAdImagePath = mbBannersignedUrl;
      }
    }
    for (const provider of justJoinedUsers) {
      if (provider.Companies?.logoAsset?.url) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.Companies?.logoAsset?.url,
        );
        provider.userCategory = logosignedUrl;
      }
    }
    for (const provider of announcements) {
      if (provider.SpAnnouncements?.imageUrl) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.SpAnnouncements?.imageUrl,
        );
        provider.SpAnnouncements.imageUrl = logosignedUrl;
      }
    }

    for (const provider of announcements) {
      if (provider.Companies?.logoAsset?.url) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.Companies?.logoAsset?.url,
        );
        provider.Companies.logoAsset.url = logosignedUrl;
      }
    }

    for (const provider of freshAndUpdatedUsers) {
      if (provider.userCategory) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.userCategory,
        );
        provider.userCategory = logosignedUrl;
      }
    }
    let sponsoredPartners = sponsoredPartnersData;
    if (getCompanyId && getCompanyId?.user.userRoles[0].roleCode !== 'service_provider') {
      sponsoredPartners = [];
    }
    return {
      list: {
        // latestOpportunities,
        // myrecentOpportunities,
        mylist,
        myProjects,
        // submittedIntrested,
        recentViewedProfiles,
        // recentJoinedProfiles,
        sponsoredPartners,
        bannerAdImage,
        justJoinedUsers,
        freshAndUpdatedUsers,
        articles,
        companyUsers,
        announcements
      },
      success: true,
      statusCode: HttpStatus.OK,
    };
  }


  async getShuffledServiceProvidersIds() {
    return this.prismaService.companies.findMany({
      where: {
        isDelete: false,
        isArchieve: false,
        user: {
          isArchieve: false,
          approvalStatus: "completed",
          userRoles: {
            some: {
              roleCode: "service_provider",
            },
          },
        },

      },
      select: {
        id: true
      }
    });
  }

  async getServiceProvidersFromList(getDetailsOfTheIds: number[], loggedCompanyId: number) {
    const serviceProviders = await this.prismaService.companies.findMany({
      where: {
        isArchieve: false,
        isDelete: false,
        id: {
          in: getDetailsOfTheIds
        },
        user: {
          approvalStatus: "completed",
          isArchieve: false,
          isDelete: false,
        }
      },
      select: {
        id: true,
        name: true,
        about: true,
        companySize: true,
        createdAt: true,
        website: true,
        slug: true,
        logoAsset: {
          select: {
            url: true,
          },
        },
        user: {
          select: {
            isPaidUser: true,
          },
        },
        ServicesOpt: {
          select: {
            service: {
              select: {
                serviceName: true,
                groupId: true,
              },
            },
          },
          where: {
            capabilityId: null,
            isDelete: false,
            status: 1,
          }
        },
        companySizes: {
          select: {
            size: true,
          },
        },
        CompanyAddress: {
          select: {
            location_name: true,
            Country: {

              select: {
                name: true,
              },
            },
          },
        },
        CompanyContacts: {
          select: {
            name: true,
            email: true,
          },
          take: 1,
        },
        sPBuyerCompanyRatings: {
          where: {
            buyerId: loggedCompanyId,
          },
          select: {
            prefferedPartner: true,
            avgPerformanceRating: true
          }
        },
        CompanyGameEngines: {
          where: {
            isChecked: true,
          },
          select: {
            gameEngineName: true,
          }
        },
        sPBuyerprojectcompanyId: {
          select: {
            overallRating: true,
          }
        },
        followedCompanies: {
          where: {
            companyId: loggedCompanyId,
            isActive: true
          }
        }
      },

      orderBy: {
        id: "asc",
      },
    });

    for (const provider of serviceProviders) {
      // if (provider.bannerAsset && provider.bannerAsset.url) {
      //   const bannersignedUrl = await this.gcsService.getSignedUrl(
      //     provider.bannerAsset.url,
      //   );
      //   provider.bannerAsset.url = bannersignedUrl;
      // }
      if (provider.logoAsset && provider.logoAsset.url) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.logoAsset.url,
        );
        provider.logoAsset.url = logosignedUrl;
      }

      if (provider.ServicesOpt && provider.ServicesOpt.length > 0) {
        const filteredServices = provider.ServicesOpt.filter(serviceOpt => serviceOpt.service !== null);
        provider.ServicesOpt = filteredServices;
      }
    }

    return serviceProviders;

  }

  async getCountOfServiceProviders() {
    return await this.prismaService.companies.count({
      where: {
        user: {
          approvalStatus: "completed",
          userRoles: {
            some: {
              roleCode: "service_provider",
            },
          },
        },
        isArchieve: false
      }
    });
  }

  // buyer notes on sp  -----------------------------------------------------------------------------------------------------

  async saveprojectreview(projectData: CreateServiceproviderDto) {
    try {
      await this.prismaService.spBuyerNotes.create({
        data: projectData,
      });
      await this.updateDateForRating(projectData.companyId, projectData.buyerId);
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getbuyerNotes(noteId: number, loggedId: number) {
    try {
      const list = await this.prismaService.spBuyerNotes.findMany({
        where: {
          id: noteId,
          buyerId: loggedId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          note: true,
        }
      })
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        data: list,
      }

    } catch (error) {
      return {
        success: false,
        message: "List Getting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async deleteNote(id: number) {
    try {
      await this.prismaService.spBuyerNotes.deleteMany({
        where: {
          id: id,
        }
      })
      return {
        success: true,
        message: "Note Deleted successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Note Delete Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async updateNote(noteId: number, updateNoteData: CreateServiceproviderDto) {
    try {
      const updatedata = {
        buyerId: updateNoteData.buyerId,
        companyId: updateNoteData.companyId,
        title: updateNoteData.title,
        note: updateNoteData.note,
      };

      await this.prismaService.spBuyerNotes.update({
        where: {
          id: noteId,
          companyId: updateNoteData.companyId
        },
        data: updatedata,
      });
      await this.updateDateForRating(updateNoteData.companyId, updateNoteData.buyerId);
      return {
        success: true,
        message: "Buyer Note Updated successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Buyer Note Update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  //Creating buyer ratesby service ----------------------------------------------------------------------------------------------------------

  async saveratesbyservice(serviseratesData: CreateRatesByserviceDto) {
    try {
      await this.prismaService.spRatesbyService.createMany({
        data: serviseratesData,
      });
      await this.updateDateForRating(serviseratesData.companyId, serviseratesData.buyerId);
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getServiceRates(serviceId: number) {
    try {
      const services = await this.prismaService.spRatesbyService.findMany({
        where: {
          id: serviceId,
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        data: services,
      }

    } catch (error) {
      return {
        success: false,
        message: "Services Getting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async getAllServiceRates(buyerId: number, companyId: number) {
    try {
      const services = await this.prismaService.spRatesbyService.findMany({
        where: {
          buyerId: buyerId,
          companyId: companyId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
      return {
        success: true,
        StatusCode: HttpStatus.OK,
        data: services,
      }

    } catch (error) {
      return {
        success: false,
        message: "Services Getting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async deleteService(serviceId: number) {
    try {
      await this.prismaService.spRatesbyService.delete({
        where: {
          id: serviceId,
        }
      })
      return {
        success: true,
        message: "Service Deleted successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Service Delete Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async updateService(serviceId: number, updateserviceData: CreateRatesByserviceDto) {
    try {
      const updatedata = {
        buyerId: updateserviceData.buyerId,
        companyId: updateserviceData.companyId,
        service: updateserviceData.service,
        dayRate: updateserviceData.dayRate,
        montlyRate: updateserviceData.montlyRate,
        discountRate: updateserviceData.discountRate,
        notes: updateserviceData.notes,
      };

      await this.prismaService.spRatesbyService.update({
        where: {
          id: serviceId,
        },
        data: updatedata,
      });
      await this.updateDateForRating(updateserviceData.companyId, updateserviceData.buyerId);
      return {
        success: true,
        message: "Buyer Service Rates Updated successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Buyer Service Rates Update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  //Creating buyer project performance ----------------------------------------------------------------------------------------------------------


  async createProjectperformance(projectPerformanceData: ProjectPerformanceDto) {
    try {
      const updatedata = {
        buyerId: projectPerformanceData.buyerId,
        companyId: projectPerformanceData.companyId,
        projectname: projectPerformanceData.projectname,
        quality: projectPerformanceData.quality,
        onTimeDelivery: projectPerformanceData.onTimeDelivery,
        communication: projectPerformanceData.communication,
        overallRating: projectPerformanceData.overallRating,
        comment: projectPerformanceData.comment,
      };
      const lastId = await this.prismaService.spProjectPerformance.create({
        data: updatedata,
      });
      const projectServices: {
        serviceId: number;
        projectId: number;
      }[] = [];
      if (projectPerformanceData && projectPerformanceData.services.length > 0) {
        projectPerformanceData.services.map((service: { serviceId: number }) => {
          const servicedata = {
            serviceId: Number(service.serviceId),
            projectId: Number(lastId.id),
          };
          projectServices.push(servicedata);
        });

        await this.prismaService.spProjectservices.createMany({
          data: projectServices
        })
      }
      await this.updateDateForRating(projectPerformanceData.companyId, projectPerformanceData.buyerId);

      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getprojectPerformance(projectId: number) {
    try {
      const services = await this.prismaService.spProjectPerformance.findMany({
        where: {
          id: projectId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          spProjectservices: {
            where: {
              projectId: projectId,
            },
            select: {
              service: {
                select: {
                  serviceName: true,
                }
              },
            }
          },
        }
      });

      return {
        success: true,
        StatusCode: HttpStatus.OK,
        data: services,
      }

    } catch (error) {
      return {
        success: false,
        message: "Services Getting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }

  }

  async deleteProject(projectId: number) {
    try {

      await this.prismaService.spProjectservices.deleteMany({
        where: {
          projectId: projectId,
        }
      });

      await this.prismaService.spProjectPerformance.delete({
        where: {
          id: projectId,
        }
      });

      return {
        success: true,
        message: "Project Performance Deleted successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Note Delete Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }


  async updateProject(projectId: number, projectPerformanceUpdatedData: ProjectPerformanceDto) {
    try {
      const updatedata = {
        buyerId: projectPerformanceUpdatedData.buyerId,
        companyId: projectPerformanceUpdatedData.companyId,
        projectname: projectPerformanceUpdatedData.projectname,
        quality: projectPerformanceUpdatedData.quality,
        onTimeDelivery: projectPerformanceUpdatedData.onTimeDelivery,
        communication: projectPerformanceUpdatedData.communication,
        overallRating: projectPerformanceUpdatedData.overallRating,
        comment: projectPerformanceUpdatedData.comment,
      };
      await this.prismaService.spProjectservices.deleteMany({
        where: {
          projectId: projectId,
        },
      });
      await this.updateDateForRating(projectPerformanceUpdatedData.companyId, projectPerformanceUpdatedData.buyerId);
      await this.prismaService.spProjectPerformance.update({
        where: {
          id: projectId,
        },
        data: updatedata,
      });

      const projectServices: {
        serviceId: number;
        projectId: number;
      }[] = [];

      if (projectPerformanceUpdatedData && projectPerformanceUpdatedData.services.length > 0) {
        projectPerformanceUpdatedData.services.map((service: { serviceId: number }) => {
          const servicedata = {
            serviceId: Number(service.serviceId),
            projectId: Number(projectId),
          };
          projectServices.push(servicedata);
        });

        await this.prismaService.spProjectservices.createMany({
          data: projectServices
        })
      }
      return {
        success: true,
        message: "Buyer Service Rates Updated successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Buyer Service Rates Update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  // Overall buyer ratings on sp --------------------------------------------------------------------------------------------------


  async createOverallRatings(overallPerformanceData: CreateOverallratings) {

    try {

      const overAllRating =
      {
        buyerId: overallPerformanceData.buyerId,
        companyId: overallPerformanceData.companyId,
        performanceRating: overallPerformanceData.performanceRating,
        prefferedPartner: overallPerformanceData.prefferedPartner,
        nonDiscloser: overallPerformanceData.nonDiscloser,
        masterService: overallPerformanceData.masterService,
        securityStatus: overallPerformanceData.securityStatus,
        sowStatus: overallPerformanceData.sowStatus ? overallPerformanceData.sowStatus : null
      };
      const getId = this.getOverallRatingData(overAllRating.companyId, overAllRating.buyerId);
      if ((await getId).data) {
        await this.prismaService.sPBuyerRatingOnserviceProvider.update({
          where: {
            id: (await getId).data?.id,
            companyId: overAllRating.companyId,
          },
          data: overAllRating,
        });
      }
      else {
        await this.prismaService.sPBuyerRatingOnserviceProvider.create({
          data: overAllRating,
        });
      }
      return {
        success: true,
        message: "Added Successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: `something went wrong :${error}`,
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getOverallRatingData(companyId: number, loggedId: number) {
    try {
      const responseData = await this.prismaService.sPBuyerRatingOnserviceProvider.findFirst({
        where: {
          companyId: companyId,
          buyerId: loggedId,
        },
      });
      if (responseData && responseData?.rateCardUrl) {
        const sponseredLogoUrl = await this.gcsService.getSignedUrl(
          responseData?.rateCardUrl,
        );
        responseData.rateCardUrl = sponseredLogoUrl;
      }

      return {
        success: true,
        StatusCode: HttpStatus.OK,
        data: responseData,
      }

    } catch (error) {
      return {
        success: false,
        message: "Services Getting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async updateDateForRating(companyId: number, buyerId: number) {
    const getId = await this.getOverallRatingData(companyId, buyerId);
    if ((getId).data) {
      await this.prismaService.sPBuyerRatingOnserviceProvider.update({
        where: {
          id: (getId).data?.id,
          companyId: companyId,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  }

  async getAllNotesFromBuyer(userId: number, companyId: number) {
    try {
      return this.prismaService.spBuyerNotes.findMany({
        where: {
          isDelete: false,
          buyerId: userId,
          companyId: companyId
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async uploadRateCard(ratecardPath: string, buyerId: number, companyId: number, fileName: string, tokenDate: string) {
    try {
      const getId = await this.getOverallRatingData(companyId, buyerId);
      const responseData = await this.prismaService.sPBuyerRatingOnserviceProvider.findFirst({
        where: {
          companyId: companyId,
        },
      });
      if (responseData && responseData.rateCardUrl && responseData.rateCardUrl != '') {
        await this.prismaService.temporaryUploadedFiles.createMany({
          data: { formUniqueId: "formId", fileName: responseData.rateCardUrl },
        });
      }
      if (getId.data) {
        const filedate = tokenDate;
        const fileNameParts = fileName.split('---');
        fileNameParts[fileNameParts.length - 1] = filedate;
        const fileNameWithDate = fileNameParts.join('---');
        const responseData = await this.prismaService.sPBuyerRatingOnserviceProvider.update({
          where: {
            id: getId.data?.id,
            companyId: companyId,
          },
          data: {
            rateCardUrl: ratecardPath,
            fileName: fileNameWithDate,
          },
        });

        if (responseData && responseData?.rateCardUrl && responseData?.rateCardUrl != '') {
          const sponseredLogoUrl = await this.gcsService.getSignedUrl(
            responseData?.rateCardUrl,
          );
          responseData.rateCardUrl = sponseredLogoUrl;
        }
        return {
          success: true,
          message: "Updated Successfully",
          data: responseData,
          StatusCode: HttpStatus.CREATED,
        };
      }
      else {
        const responseData = await this.prismaService.sPBuyerRatingOnserviceProvider.create({
          data: {
            buyerId: buyerId,
            companyId: companyId,
            rateCardUrl: ratecardPath,
            fileName: fileName,
          },
        });
        return {
          success: true,
          message: "Added Successfully",
          data: responseData,
          StatusCode: HttpStatus.CREATED,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async getAllProjectPerformanceReviews(userId: number, companyId: number) {
    try {
      return this.prismaService.spProjectPerformance.findMany({
        where: {
          isDelete: false,
          buyerId: userId,
          companyId: companyId
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          spProjectservices: {
            select: {
              service: {
                select: {
                  id: true,
                  serviceName: true,
                  groupId: true
                }
              }
            }
          }
        }
      });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getAlbumImagesById(albumId: string) {

    const albumImages = await this.prismaService.portfolioAlbumFiles.findMany({
      where: {
        albumId: Number(albumId)
      },
      orderBy: {
        id: "asc",
      }
    })

    for (const fileUpload of albumImages) {
      if (fileUpload.thumbnail) {
        let fileName = fileUpload.thumbnail;
        if (fileUpload.thumbnail.startsWith("http")) {
          const urlObj = new URL(fileUpload.thumbnail);
          const pathname = decodeURIComponent(urlObj.pathname);
          // Extract file name from the pathname
          fileName = pathname.split('/').slice(2).join('/');
        }
        const signedUrl = await this.gcsService.getPublicSignedUrl(
          fileName,
        );
        fileUpload.thumbnail = signedUrl;
      }
      if (fileUpload.fileUrl && fileUpload.type === "image") {
        const signedUrl = await this.gcsService.getPublicSignedUrl(
          fileUpload.fileUrl,
        );
        fileUpload.fileUrl = signedUrl;
      }
    }

    return {
      success: true,
      data: albumImages,
      message: "fetching success",
      StatusCode: HttpStatus.OK,
    }
  }

  addTheSearchedText(userId: number, searchText: string, fromOpportunity: boolean) {
    return this.prismaService.searchTextStats.create({
      data: {
        userId: userId,
        searchText: searchText,
        fromOpportunity: fromOpportunity
      }
    });
  }

  addTheServiceText(userId: number, serviceVal: string, fromOpportunity: boolean) {
    return this.prismaService.serviceTextStats.create({
      data: {
        userId: userId,
        serviceText: serviceVal,
        fromOpportunity: fromOpportunity
      }
    });
  }

  addTheCapabilityText(userId: number, capabilityVal: string, fromOpportunity: boolean) {
    return this.prismaService.capabilityTextStats.create({
      data: {
        userId: userId,
        capabilityText: capabilityVal,
        fromOpportunity: fromOpportunity
      }
    });
  }

  async getSearchStringDetails(role: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string) {
    const theResult = await this.prismaService.searchTextStats.groupBy({
      by: ['searchText'],
      where: this.getWhereClause(role, startDate, endDate, fromPlace),
      _count: {
        searchText: true
      },
    });
    const groupedData = theResult.map(result => ({
      searchText: result.searchText,
      count: result._count.searchText
    }));
    return groupedData.sort((a, b) => b.count - a.count);
  }

  async getFilteredServiceDetails(role: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string) {
    const theResult = await this.prismaService.serviceTextStats.groupBy({
      by: ['serviceText'],
      where: this.getWhereClause(role, startDate, endDate, fromPlace),
      _count: {
        serviceText: true
      },
    });
    const groupedData = theResult.map(result => ({
      searchText: result.serviceText,
      count: result._count.serviceText
    }));
    return groupedData.sort((a, b) => b.count - a.count);
  }

  async getFilteredCapabilityDetails(role: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string) {
    const theResult = await this.prismaService.capabilityTextStats.groupBy({
      by: ['capabilityText'],
      where: this.getWhereClause(role, startDate, endDate, fromPlace),
      _count: {
        capabilityText: true
      },
    });
    const groupedData = theResult.map(result => ({
      searchText: result.capabilityText,
      count: result._count.capabilityText
    }));
    return groupedData.sort((a, b) => b.count - a.count);
  }

  async getBuyersStats() {
    return await this.prismaService.buyersStats.findMany({
      where: {
        buyerCompany: {
          isDelete: false,
          isArchieve: false
        }
      },
      include: {
        buyerCompany: {
          select: {
            id: true,
            name: true,
            opportunities: {
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                isLoggedOnce: true,
                isPaidUser: true,
                userType: true,
                trialDuration: true,
                myLists: {
                  select: {
                    id: true,
                    name: true,
                    createdAt: true
                  }
                },
                myProjects: {
                  select: {
                    id: true,
                    name: true,
                    createdAt: true
                  }
                },
                BillingDetails: {
                  where: {
                    isActive: true
                  },
                  select: {
                    id: true,
                    isActive: true,
                    subscriptionType: true
                  }
                }
              }
            },
            followingCompanies: {
              select: {
                id: true,
                createdAt: true,
                followedCompany: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        providerCompany: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        visitCounts: 'desc'
      }
    });
  }

  getWhereClause(role: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string): any {
    const endOfDay = new Date(startDate);
    endOfDay.setHours(23, 59, 59, 999);
    const formattedEndOfDay = endOfDay.toISOString();
    let whereDateCondition: any = {};


    if (endDate == "") {
      if (role == "") {
        whereDateCondition = {
          // user: {
          //   userRoles: {
          //     some: {
          //       roleCode: role
          //     }
          //   }
          // },
          // fromOpportunity: (fromPlace && fromPlace == "broswe_opp") ? true : false,
          createdAt: {
            lte: new Date(formattedEndOfDay)
          }
        }
      } else {
        whereDateCondition = {
          user: {
            userRoles: {
              some: {
                roleCode: role
              }
            }
          },
          fromOpportunity: (fromPlace && fromPlace == "broswe_opp") ? true : false,
          createdAt: {
            lte: new Date(formattedEndOfDay)
          }
        }
      }
    } else {
      if (role == "") {
        whereDateCondition = {
          // user: {
          //   userRoles: {
          //     some: {
          //       roleCode: role
          //     }
          //   }
          // },
          // fromOpportunity: (fromPlace && fromPlace == "broswe_opp") ? true : false,
          AND: [
            { createdAt: { lte: new Date(formattedEndOfDay) } },
            { createdAt: { gte: new Date(endDate) } }
          ]
        }
      } else {
        whereDateCondition = {
          user: {
            userRoles: {
              some: {
                roleCode: role
              }
            }
          },
          fromOpportunity: (fromPlace && fromPlace == "broswe_opp") ? true : false,
          AND: [
            { createdAt: { lte: new Date(formattedEndOfDay) } },
            { createdAt: { gte: new Date(endDate) } }
          ]
        }
      }
    }
    return whereDateCondition;
  }

  checkTheAlbumBelogsTocompany(albumId: number) {
    return this.prismaService.portfolioAlbumFiles.findFirst({
      where: {
        albumId: albumId
      },
      select: {
        portfolioAlbum: {
          select: {
            companies: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })
  }

  checkValidityOfAlbumId(albumByCompanyId: number) {
    return this.prismaService.portfolioAlbum.findMany({
      where: {
        companyId: albumByCompanyId
      },
      orderBy: {
        reOrderingId: 'asc'
      },
      take: 4
    })
  }

  checkThePerformanceBelongsTo(performanceId: number) {
    return this.prismaService.spProjectservices.findFirst({
      where: {
        projectId: performanceId
      },
      select: {
        spProject: {
          select: {
            sPBuyerCompanyId: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  rateAddedByCompanyGet(serviceId: number) {
    return this.prismaService.spRatesbyService.findFirst({
      where: {
        id: serviceId
      },
      select: {
        sPBuyerRateId: {
          select: {
            id: true,
            name: true
          }
        },
        sPBuyerRateCompanyId: {
          select: {
            id: true,
          }
        }
      }
    });
  }

  getCreatedNoteCompany(noteId: number) {
    return this.prismaService.spBuyerNotes.findFirst({
      where: {
        id: noteId
      },
      select: {
        sPBuyerNoteId: {
          select: {
            id: true,
            name: true
          }
        },
        sPNotecompanyId: {
          select: {
            id: true,
          }
        }
      }
    });
  }

  getListDetails(ids: number[]) {
    return this.prismaService.myLists.findMany({
      where: {
        id: {
          in: ids
        },
      }
    });
  }

  getProjectDetailsById(id: number) {
    return this.prismaService.myProjects.findUnique({
      where: {
        id: id
      }
    })
  }

  async findEventsActive() {
    try {
      const data = await this.prismaService.events.findMany({
        where: {
          isArchieve: false,
          isDelete: false,
        },
        select: {
          eventName: true,
          id: true,
        },
        orderBy: {
          displayOrder: "asc",
        }
      });
      return {
        success: true,
        list: data,
        message: 'successfully fetched'
      }
    } catch (error) {
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }
  }

  async findSponseredServices(currentDate: string) {
    try {
      const response = await this.prismaService.sponseredServices.findMany({
        where: {
          isArchieve: false,
          isDelete: false,
        },
        select: {
          id: true,
          endDate: true,
          serviceId: true,
          defafultImg: true,
          sponseredImg: true,
          sponseredLogoImg: true,
          serviceTitle: true,
          startDate: true,
          Companies: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoAsset: {
                select: {
                  url: true,
                },
              },
              bannerAsset: {
                select: {
                  url: true,
                },
              }
            },
          },
          Services: {
            select: {
              serviceName: true,
              id: true,
            },
          }
        },
        orderBy: {
          Services: {
            serviceName: "asc",
          }
        }
      });

      if (response) {
        for (const item of response) {
          if (item.defafultImg != "") {
            if (item.endDate && item.serviceTitle && item.startDate) {
              const endDate = new Date(item.endDate).setHours(0, 0, 0, 0);
              const startDate = new Date(item.startDate).setHours(0, 0, 0, 0);
              const localCurrentDate = new Date(toLocalISOString(new Date(currentDate).toLocaleDateString('en-US'))).setHours(0, 0, 0, 0);
              if (localCurrentDate <= endDate && startDate <= localCurrentDate) {
                if(item.Companies && item.Companies.bannerAsset && item.Companies.bannerAsset.url){
                  const signedUrl = await this.gcsService.getSignedUrl(item.Companies.bannerAsset.url);
                  item.defafultImg = signedUrl;
                } else {
                  const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                  item.defafultImg = signedUrl;
                }
                if(item.Companies && item.Companies.logoAsset && item.Companies.logoAsset.url){
                  const signedLogoUrl = await this.gcsService.getSignedUrl(item.Companies.logoAsset.url);
                  item.sponseredLogoImg = signedLogoUrl;
                }
              } else {
                const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                item.defafultImg = signedUrl;
                item.serviceTitle = "";
              }
            } else if (item.startDate && item.serviceTitle) {
              const startDate = new Date(item.startDate).setHours(0, 0, 0, 0);
              const localCurrentDate = new Date(toLocalISOString(new Date(currentDate).toLocaleDateString('en-US'))).setHours(0, 0, 0, 0);
              if (localCurrentDate >= startDate) {
                if(item.Companies && item.Companies.bannerAsset && item.Companies.bannerAsset.url){
                  const signedUrl = await this.gcsService.getSignedUrl(item.Companies.bannerAsset.url);
                  item.defafultImg = signedUrl;
                } else {
                  const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                  item.defafultImg = signedUrl;
                }
                if(item.Companies && item.Companies.logoAsset && item.Companies.logoAsset.url){
                  const signedLogoUrl = await this.gcsService.getSignedUrl(item.Companies.logoAsset.url);
                  item.sponseredLogoImg = signedLogoUrl;
                }
              } else {
                const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                item.defafultImg = signedUrl;
                item.serviceTitle = "";
              }
            } else {
              const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
              item.defafultImg = signedUrl;
              item.serviceTitle = "";
            }

            if (item.endDate) {
              item.endDate = null;
            }
            if (item.sponseredImg) {
              item.sponseredImg = null;
            }
          }
        }
      }
      return response
    } catch (error) {
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }
  }

  async updateSlug() {
    const companies = await this.prismaService.companies.findMany({
      where: {
        slug: null,
        user: {
          userRoles: {
            some: {
              roleCode: {
                in: ["service_provider"],
              },
            },
          },
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });
    const slugcompanies = await this.prismaService.companies.findMany({
      where: {
        isArchieve: false,
        isDelete: false,
        slug: {
          not: null,
        },
        user: {
          userRoles: {
            some: {
              roleCode: {
                in: ["service_provider"],
              },
            },
          },
          approvalStatus: $Enums.APPROVAL_STATUS.completed,
          isArchieve: false,
          isDelete: false,
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });

    for (let company of companies) {
      let slug = generateSlug(company.name);
      let count = 1;
      while (true) {
        const isAlreadyPresent = slugcompanies.find((company) => company.slug === slug);
        if (isAlreadyPresent) {
          slug = slug + '' + count
        }
        count++;
        if (!isAlreadyPresent) {
          break;
        }
      }

      try {
        await this.prismaService.companies.update({
          where: {
            id: company.id
          },
          data: {
            slug: slug,
          }
        })
      } catch (error) {
        console.log(slug);
        console.log(company);
      }

    }
    return {
      success: true,
      message: "successfully updated",
    }
  }

  async addUsersSettings(userId: number, settings: any) {

    await this.prismaService.userSetting.deleteMany({
      where: {
        userId: userId,
      }
    });
    const insetData = {
      userId: userId,
      userSPTableOrder: settings,
    }
    return await this.prismaService.userSetting.create({ data: insetData });
  }

  async findUsersSettings(userId: number) {
    return await this.prismaService.userSetting.findMany({ where: { userId: userId }, select: { userSPTableOrder: true } });
  }

  async findPlatformsList() {
    return await this.prismaService.platforms.findMany({
      where: {
        status: 1,
      },
      select: {
        id: true,
        name: true,
      }
    });
  }

  async updateOverallRating(id: number, data: any) {
    await this.prismaService.sPBuyerRatingOnserviceProvider.update({
      where: {
        id: id
      },
      data: data
    });
  }

  async addOverallRating(data: any) {
    await this.prismaService.sPBuyerRatingOnserviceProvider.create({
      data: data
    });
  }

  async getGroupedCompanies() {
    return await this.prismaService.spProjectPerformance.groupBy({
      by: ['buyerId', 'companyId'],
      _avg: {
        overallRating: true
      }
    })
  }

  async getGroupedCompaniesForInserting(type: string) {
    if (type == "notes") {
      return await this.prismaService.spBuyerNotes.groupBy({
        by: ['buyerId', 'companyId'],
      })
    } else if (type == "service") {
      return await this.prismaService.spRatesbyService.groupBy({
        by: ['buyerId', 'companyId'],
      })
    }

  }

  async getDynamicPublicData(date: string) {
    const localDate = new Date(date).toLocaleDateString('en-US');
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2);

    const oneDayLater = new Date();
    oneDayLater.setDate(currentDate.getDate() + 1);
    if (!(twoDaysAgo <= new Date(localDate) && new Date(localDate) < oneDayLater)) {
      return {
        justJoined: [],
        freshAndUpdated: [],
        bannerAdImage: [],
      }
    }
    let justJoinedUsers = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        displayDate: toLocalISOString(localDate),
        userCategory: 'just joined',
        isDelete: false,
      },
      take: 1,
      select: {
        companyId: true,
        userCategory: true,
        categoryType: true,
        displayDate: true,
        Companies: {
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select: {
            name: true,
            slug: true,
            updatedAt: true,
            logoAsset: {
              select: {
                url: true,
              },
            },
          },
        }
      },
      orderBy: {
        categoryType: 'asc',
      }
    });

    justJoinedUsers = justJoinedUsers.filter(user => user.Companies && user.Companies.name);

    for (const provider of justJoinedUsers) {
      if (provider.Companies?.logoAsset?.url) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.Companies?.logoAsset?.url,
        );
        provider.userCategory = logosignedUrl;
      }
    }

    let freshAndUpdated = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        displayDate: toLocalISOString(localDate),
        userCategory: 'fresh and updated',
        isDelete: false,
      },
      select: {
        companyId: true,
        userCategory: true,
        categoryType: true,
        displayDate: true,
        Companies: {
          where: {
            isArchieve: false,
            isDelete: false,
          },
          select: {
            name: true,
            slug: true,
            updatedAt: true,
            logoAsset: {
              select: {
                url: true,
              },
            },
          },
        }
      },
      orderBy: {
        categoryType: 'asc',
      },
    });
    freshAndUpdated = freshAndUpdated.filter(user => user.Companies && user.Companies.name);
    const groupedResults = freshAndUpdated.reduce((acc: Record<number, {
      companyId: number;
      name: string;
      updatedAt: Date;
      slug: string,
      logoUrl: string;
      categories: number[];
      userCategory: string;
    }>, item: any) => {
      const { companyId, categoryType, Companies, displayDate } = item;

      // Check if companyId is not null
      if (companyId !== null) {
        // Check if the company already exists in the accumulator
        if (!acc[companyId]) {
          acc[companyId] = {
            companyId,
            name: Companies?.name,
            updatedAt: displayDate,
            logoUrl: Companies?.logoAsset ? Companies?.logoAsset.url : '',
            categories: [],
            userCategory: Companies?.logoAsset ? Companies?.logoAsset.url : '',
            slug: Companies?.slug
          };
        }

        // Add the categoryType to the company's categories array
        acc[companyId].categories.push(categoryType);
      }

      return acc;
    }, {});

    const freshAndUpdatedUsers = Object.values(groupedResults);
    for (const provider of freshAndUpdatedUsers) {
      if (provider.userCategory) {
        const logosignedUrl = await this.gcsService.getSignedUrl(
          provider.userCategory,
        );
        provider.userCategory = logosignedUrl;
      }
    }


    //banner image
    const bannerAdImage = await this.prismaService.advertisements.findMany({
      where: {
        isArchieve: false,
        isDelete: false,
        adPage: "home",
        startDate: {
          lte: new Date(toLocalISOString(date)),
        },
        endDate: {
          gte: new Date(toLocalISOString(date)),
        },
      },
      select: {
        id: true,
        adImagePath: true,
        mobileAdImagePath: true,
        adPage: true,
        adURL: true,
        adURLStaticPage: true,
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    for (const provider of bannerAdImage) {
      if (provider.adImagePath) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          provider.adImagePath,
        );
        const mbBannersignedUrl = await this.gcsService.getSignedUrl(
          provider.mobileAdImagePath,
        );
        provider.adImagePath = bannersignedUrl;
        provider.mobileAdImagePath = mbBannersignedUrl;
      }
    }

    //platinum partners
    const platinumPartners = await this.prismaService.sponsoredPartners.findMany({
      where:{
        fileType: "platinum",
        isSelected: true,
      },
      select:{
        fileUrl: true,
        companyWebsiteUrl: true,
      }
    });

    
    for (const provider of platinumPartners) {
      if (provider.fileUrl) {
        const bannersignedUrl = await this.gcsService.getSignedUrl(
          provider.fileUrl,
        );
        provider.fileUrl = bannersignedUrl;
      }
    }


    return {
      justJoined: justJoinedUsers,
      freshAndUpdated: freshAndUpdatedUsers[0] ? [freshAndUpdatedUsers[0]] : [],
      bannerAdImage,
      platinumPartners,
    }
  }

  async getbuyerMysparkReport(type: $Enums.ROLE_CODE) {
    let whereclause: any = type == "admin" ? {} : {
      sPBuyerRating: {
        user: {
          userRoles: {
            some: {
              roleCode: type,
            },
          },
        },
      },
    };

    const reportData = await this.prismaService.sPBuyerRatingOnserviceProvider.findMany({
      where: whereclause,
      select: {
        buyerId: true,
        companyId: true,
        prefferedPartner: true,
        nonDiscloser: true,
        masterService: true,
        securityStatus: true,
        sowStatus: true,
        rateCardUrl: true,
        updatedAt: true,
        sPBuyerRating: {
          select: {
            name: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userType: true,
                trialDuration: true,
                userRoles: {
                  select: {
                    roleCode: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'asc',
      }
    });

    const groupedDataa: { [buyerId: number]: ReportItem[] } = reportData.reduce((acc: any, item) => {
      if (!acc[item.buyerId]) {
        acc[item.buyerId] = [];
      }
      acc[item.buyerId].push(item);
      return acc;
    }, {});

    const totalColumns = 4;

    let dataa = [];
    for (const rate of Object.values(groupedDataa)) {

      let rateServicesAverage = 0;
      const rateServices = await this.prismaService.spRatesbyService.groupBy({
        by: ['buyerId', 'companyId'],
        where: {
          buyerId: rate[0].buyerId,
        },
      });
      if (rateServices.length > 0) {
        rateServicesAverage = (rateServices.length / rate.length) * 100;
      }

      const projectPerformance = await this.prismaService.spProjectPerformance.groupBy({
        by: ['buyerId', 'companyId'],
        where: {
          buyerId: rate[0].buyerId,
        }
      });
      let projectPerformanceAverage = 0;
      if (projectPerformance.length > 0) {
        projectPerformanceAverage = (projectPerformance.length / rate.length) * 100;
      }

      const notes = await this.prismaService.spBuyerNotes.groupBy({
        by: ['buyerId', 'companyId'],
        where: {
          buyerId: rate[0].buyerId,
        }
      });
      let notesAverage = 0;
      if (notes.length > 0) {
        notesAverage = (notes.length / rate.length) * 100;
      }

      let totalUpdatedColumns = 0;
      let partnerStatusUpdatedColumns = 0;
      rate.forEach((rating: ReportItem) => {
        let updatedColumns = 0;
        let partberStatusColumns = 0;
        if (rating.nonDiscloser !== null && rating.nonDiscloser !== 'Select') updatedColumns++;
        if (rating.masterService !== null && rating.masterService !== 'Select') updatedColumns++;
        if (rating.securityStatus !== null && rating.securityStatus !== 'Select') updatedColumns++;
        if (rating.sowStatus !== null) updatedColumns++;
        if (rating.prefferedPartner !== null && rating.prefferedPartner !== 'Select') partberStatusColumns++;

        totalUpdatedColumns += updatedColumns;
        partnerStatusUpdatedColumns += partberStatusColumns;
      });

      const averageActivity = (totalUpdatedColumns / (rate.length * totalColumns)) * 100;
      const partnerStatusAverage = (partnerStatusUpdatedColumns / rate.length) * 100;
      dataa.push({
        companyId: rate[0].buyerId,
        userId: rate[0].sPBuyerRating.user.id,
        userName: rate[0].sPBuyerRating.user.firstName + " " + rate[0].sPBuyerRating.user.lastName,
        companyname: rate[0].sPBuyerRating.name,
        userType: rate[0].sPBuyerRating.user.userType,
        trialDuration: rate[0].sPBuyerRating.user.trialDuration,
        roleCode: rate[0].sPBuyerRating.user.userRoles[0].roleCode,
        companiesUpdatedCount: rate.length,
        partnerStatus: parseFloat(partnerStatusAverage.toFixed(2)),
        average: parseFloat(averageActivity.toFixed(2)),
        rateServicesAverage: parseFloat(rateServicesAverage.toFixed(2)),
        projectPerformanceAverage: parseFloat(projectPerformanceAverage.toFixed(2)),
        notesAverage: parseFloat(notesAverage.toFixed(2)),
        updatedAt: rate[rate.length - 1].updatedAt
      });
    }
    return dataa;
  }

  async addAndSendListNotifications(companyId: number, serviceProvidersIds: number[]) {
    if (serviceProvidersIds && serviceProvidersIds?.length > 0) {
      const notificationArr: { notificationById: number, notificationToId: number, notificationDescription: string, type: number }[] = []
      serviceProvidersIds.forEach((item) => {
        const notification = {
          notificationById: companyId,
          notificationToId: item,
          notificationDescription: "You have been added to a list.",
          type: 2
        };
        notificationArr.push(notification);
      });
      if (notificationArr.length > 0) {
        await this.prismaService.generalNotifications.createMany({
          data: notificationArr
        });
        const spCompanyIds = notificationArr.map(item => item.notificationToId);
        if (spCompanyIds.length > 0) {
          let theUrl = "";
          theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/generalNotification`;
          const notificationRef = admin.database().ref(theUrl).push();
          await notificationRef.set({
            companyId: companyId,
            toCompanyIds: spCompanyIds,
            descirption: "You have been added to a list.",
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

//*******************************************Serviceproviders selected filter list share*********************************************** */

  async checkMail(email:string) {
    try{
      return await this.prismaService.generateFilterShareLinkaccess.findFirst({
        where:{
          email: email,
          isArchieve: false,
        }
      })

    } catch (error) {
      throw new error;
    }
  }

  async generateShareLink(data: {
    companyId: number;
    selectedServiceIds: string;
    selectedSevices: string;
    isPremium: string;
    countrySearchValue: string;
    inputValue: string;
    selctedCompanySize: string;
    selectedEventValues: string;
    shareLinkToken: string;
    regionCheckboxFilter: string;
}){
    try{
        const res = await this.prismaService.filtersShareLink.create({
          data:data,
        })
        return {status:true, token: data.shareLinkToken};
      } catch (error) {
        throw new error;
      }
  }

  async getFiltersData(token: string){
    try{
      return await this.prismaService.filtersShareLink.findFirst({
      where:{
        shareLinkToken: token,
      }
      })
    } catch (error) {
      throw new error;
    }
  }

  async checkSponsoredService(id: number){
    try {
      return await this.prismaService.sponseredServices.findFirst({
        where: {
          id: id
        }
      });
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async checkSponsoredServiceClickCountData(serviceId: number, sponsoredCompanyId: number, viewCompanyId: number){
    try {
      return await this.prismaService.serviceCategoryStats.findFirst({
        where: {
          serviceId: serviceId,
          sponsoredCompanyId: sponsoredCompanyId,
          clickedCompanyId: viewCompanyId
        }
      });
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async addSponsoredServiceClickCountData(createData: Prisma.ServiceCategoryStatsUncheckedCreateInput){
    try {
      return await this.prismaService.serviceCategoryStats.create({ data : createData });
    } catch(err){
      throw new BadRequestException(err.message);
    }
  }

  async updateSponsoredServiceClickCountData(id: number, updateData: Prisma.ServiceCategoryStatsUncheckedUpdateInput){
    try {
      return await this.prismaService.serviceCategoryStats.update({
        where: {
          id: id
        },
        data: updateData
      });
    } catch(err){
      throw new BadRequestException(err.message);
    }
  }

  async getServiceCategoryStats(whereClause: any) {
    try {
      return await this.prismaService.serviceCategoryStats.findMany({
        where: whereClause,
        select: {
          service: {
            select: {
              serviceName: true,
            }
          },
          sponsoredCompany: {
            select: {
              name: true
            }
          },
          clickCounts: true
        }
      });
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async addAnnouncement(data: Prisma.ServiceProviderAnnouncementsUncheckedCreateInput) {
    try {
      const existingPost = await this.prismaService.serviceProviderAnnouncements.findMany({
        where:{
          companyId: data.companyId
        }
      });
      existingPost.map(async (announcements)=>{
        await this.prismaService.serviceProviderAnnouncements.update({
          where:{
            id: announcements.id
          },
          data: {
            orderValue: announcements.orderValue+1
          }
        });
      })
      return await this.prismaService.serviceProviderAnnouncements.create({
        data: data
      });
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  
  async announcementUpdates(companyId: number, announcementId: number, categoryType: string, annoncExpiryDate: Date | null, add: 'update' | 'create' = 'create') {
    // const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles'});
    if(add == "update" && categoryType == 'Testimonial') {
      const isExisted = await this.prismaService.announcementUpdates.findFirst({
        where: {
          projectId: announcementId,
        }
      });
      if(isExisted){
        return;
      }
    }
    const currentDate = new Date();
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const before30Days = new Date(nextDay);
    before30Days.setDate(before30Days.getDate() - 30);

    let dateIs = await this.checkDisplayCompaniesCount(companyId, nextDay, announcementId, categoryType);

    while (!dateIs) {
      nextDay.setDate(nextDay.getDate() + 1);
      dateIs = await this.checkDisplayCompaniesCount(companyId, nextDay, announcementId, categoryType);
    }
    let companyLastDispalyDates;
    if(categoryType == 'Testimonial') {
      companyLastDispalyDates = await this.prismaService.announcementUpdates.groupBy({
        by:['projectId'],
        where: {
          companyId: companyId,
          categoryType: categoryType,
          Companies: {
            isArchieve: false,
            isDelete: false
          },
          displayDate: {
            gte: before30Days,
            lte: nextDay,
          },
        },
        _count:{
          companyId:true,
          announcementId: true,
          displayDate: true,
        }
      });
    } else {
      companyLastDispalyDates = await this.prismaService.announcementUpdates.groupBy({
        by:['announcementId'],
        where: {
          companyId: companyId,
          categoryType: categoryType,
          Companies: {
            isArchieve: false,
            isDelete: false
          },
          displayDate: {
            gte: before30Days,
            lte: nextDay,
          },
        },
        _count:{
          companyId:true,
          announcementId: true,
          displayDate: true,
        }
      });
    }

    if (companyLastDispalyDates) {
      if (companyLastDispalyDates.length >= 2) {
          return;
      }

      // nextDay.setDate(companyLastDispalyDates[companyLastDispalyDates.length-1]._count.displayDate);

      if(dateIs){
        await this.savingAnnouncementUpdates(companyId, announcementId, nextDay, annoncExpiryDate, categoryType);
      }
    } else {
      let dateIs = await this.checkDisplayCompaniesCount(companyId, nextDay, announcementId, categoryType);
      while (!dateIs) {
        nextDay.setDate(nextDay.getDate() + 1);
        dateIs = await this.checkDisplayCompaniesCount(companyId, nextDay, announcementId, categoryType);
      }
      if(dateIs){
        await this.savingAnnouncementUpdates(companyId, announcementId, nextDay, annoncExpiryDate, categoryType);
      }
    }
  }

  async savingAnnouncementUpdates(companyId: number, announcementId: number, nextDay:Date, annoncExpiryDate:Date | null, categoryType: string) {
    let days = 1
    while (days < 8) {
      if(annoncExpiryDate != null && annoncExpiryDate < nextDay ){
        days = 8;
      } else {
        await this.prismaService.announcementUpdates.createMany({
          data:{
            companyId:companyId,
            announcementId: categoryType == 'Announcement' ? announcementId : null,
            projectId: categoryType == 'Testimonial' ? announcementId : null,
            categoryType: categoryType,
            isActive:true,
            isDelete:false,
            displayDate: nextDay
          }
        });
        if(nextDay.getDay() != 0 && nextDay.getDay() != 6) {
          days++;
        }
        nextDay.setDate(nextDay.getDate() + 1);
      }
    }
  }

  async checkDisplayCompaniesCount(companyId: number, nextDay: Date, announcementId: number, categoryType: string) {
    const displayedDatecounts = await this.prismaService.announcementUpdates.findMany({
      where: {
        displayDate: nextDay,
        categoryType: categoryType,
        // announcementId: categoryType == 'Announcement' ? announcementId : null,
        // projectId: categoryType == 'Testimonial' ? announcementId : null,
      }
    })
    if (categoryType =="Announcement" && displayedDatecounts && displayedDatecounts.length > 5) {
      return false;
    } else if (categoryType == "Testimonial" && displayedDatecounts && displayedDatecounts.length > 3) {
      return false;
    }
    const displayedDateCheck = await this.prismaService.announcementUpdates.findMany({
      where: {
        companyId: companyId,
        displayDate: nextDay,
        categoryType: categoryType,
        // announcementId: categoryType == 'Announcement' ? announcementId : null,
        // projectId: categoryType == 'Testimonial' ? announcementId : null,
      },
    });
    if (displayedDateCheck && displayedDateCheck.length > 0) {
      return false;
    } else {
      return true;
    }
  }

  async getMaxOrderVal(companyId: number) {
    try {
      return await this.prismaService.serviceProviderAnnouncements.aggregate({
        where: { companyId },
        _max: {
          orderValue: true
        }
      });
    } catch(err) {
      throw new BadRequestException(err.message); 
    }
  }

  async getServiceProviderAnnouncements(companyId: number) {
    try {
      return await this.prismaService.serviceProviderAnnouncements.findMany({
        where: {
          companyId: companyId
        },
        orderBy: [
          { orderValue: 'asc' },
          { createdAt: 'desc' }
        ],
      });
    } catch(err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateServiceProviderAnnouncement(whereClause: Prisma.ServiceProviderAnnouncementsWhereUniqueInput, data: Prisma.ServiceProviderAnnouncementsUpdateInput) {
    try {
      await this.prismaService.serviceProviderAnnouncements.update({
        where: whereClause,
        data: data
      })
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  async findAnnouncementById(id: number) {
    try {
      return await this.prismaService.serviceProviderAnnouncements.findUnique({
        where: {
          id: id
        }
      })
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  async findTestmonialById(id: number) {
    try {
      return await this.prismaService.portfolioProjects.findUnique({
        where: {
          id: id
        },
        select: {
          companyId: true,
        }
      })
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  async deleteAnnouncementById(whereClause: Prisma.ServiceProviderAnnouncementsWhereUniqueInput) {
    try {
      return await this.prismaService.serviceProviderAnnouncements.delete({
        where: whereClause
      });
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  async deleteTemperoryFile(from: string, imagePath: string) {
    try {
      await this.prismaService.temporaryUploadedFiles.deleteMany({
        where: {
          formUniqueId: from,
          fileName: imagePath,
        }
      });
    } catch(err) {  
      throw new BadRequestException(err.message);
    }
  }

  async findAnnounancementStat(whereClause: Prisma.AnnouncementStatsWhereInput) {
    return await this.prismaService.announcementStats.findFirst({
      where: whereClause,
      include: {
        annoncement: true
      }
    });
  }

  async findTestMonialStat(whereClause: Prisma.TestimonialStatsUncheckedCreateInput) {
    return await this.prismaService.testimonialStats.findFirst({
      where: whereClause,
      include: {
        testimonials: true
      }
    });
  }

  async createAnnouncementStat(data: Prisma.AnnouncementStatsUncheckedCreateInput) {
    return await this.prismaService.announcementStats.create({
      data: data
    });
  }

  async createTestMonialStat(data: Prisma.TestimonialStatsUncheckedCreateInput) {
    return await this.prismaService.testimonialStats.create({
      data: data
    });
  }

  async updateAnnouncementStat(whereClause: Prisma.AnnouncementStatsWhereUniqueInput, data: Prisma.AnnouncementStatsUpdateInput) {
    return await this.prismaService.announcementStats.update({
      where: whereClause,
      data: data
    });
  }

  async updateTestMonialStat(whereClause: Prisma.TestimonialStatsWhereUniqueInput, data: Prisma.TestimonialStatsUpdateInput) {
    return await this.prismaService.testimonialStats.update({
      where: whereClause,
      data: data
    });
  }

  async getAnnouncementDetails(searchVal: string = "") {
    return await this.prismaService.serviceProviderAnnouncements.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchVal,
              mode: 'insensitive'
            }
          },
          {
            company: {
              name:{
                contains: searchVal,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        AnnouncementStats: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async updateCompanyAnnouncementAddedStatus(companyId: number) {
    await this.prismaService.companies.update({
      where: {
        id: companyId
      },
      data: {
        addedAnnouncement: true
      }
    });
  }

  async getTestmonialProjects(searchVal: string = ""){
    return await this.prismaService.portfolioProjects.findMany({
      where: {
        testimonial_company: {
          not: "",
        },
        AnnouncementUpdates:{
          some: {
            categoryType: 'Testimonial',
          }
        },
        OR: [
          {
            name: {
              contains: searchVal,
              mode: 'insensitive'
            }
          },
          {
            company: {
              name:{
                contains: searchVal,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        TestimonialStats: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        AnnouncementUpdates: {
          where: {
            categoryType: 'Testimonial',
          },
          select: {
            displayDate: true,
            isActive: true
          },
          orderBy: {
            id: 'asc'
          }
        }, 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async updateHideTestmonialProject(id: number, toggle: boolean) {
    await this.prismaService.announcementUpdates.updateMany({
      where: {
        projectId: id,
        categoryType: 'Testimonial',
      },
      data: {
        isActive: !toggle,
      },
    });
  }
}

