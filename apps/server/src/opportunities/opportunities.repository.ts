import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { $Enums, OPPORTUNITY_STATUS } from "@prisma/client";
import admin from "firebase-admin";

type ServiceOpt = {
  some: {
    OR: [
      {
        service: {
          serviceName: {
            in: string[];
            mode: "insensitive";
          };
        };
      },

      {
        capability: {
          capabilityName: {
            in: string[];
            mode: "insensitive";
          };
        };
      },
    ];
  };
};

type whereclauseTypes = {
  isDelete: boolean;
  isArchieve: boolean;
  expiryDate?: { gt: Date };
  oppStatus: OPPORTUNITY_STATUS;
  name: {
    contains: string;
    mode: "insensitive";
  };
  ServicesOpt?: ServiceOpt;
  company: {
    isArchieve: boolean,
    isDelete: boolean
  }
};
type whereEditclauseTypes = {
  id: number,
  companyId?: number,
  expiryDate?: { gt: Date };
  oppStatus?: OPPORTUNITY_STATUS;
};
@Injectable()
export class OpportunitiesRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) { }
  async findOpportunities(
    services: string[],
    search: string,
    page: number,
    limit: number,
    SortField: string,
    sortCustomColumn: string,
    sortCustomColumnOrder: string,
  ) {
    try {

      const currentDate = new Date();
      const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      const whereclause: whereclauseTypes = {
        isDelete: false,
        isArchieve: false,
        company: {
          isArchieve: false,
          isDelete: false
        },
        expiryDate: {
          gt: currentDateWithoutTime,
        },
        oppStatus: OPPORTUNITY_STATUS.publish,
        name: {
          contains: search,
          mode: "insensitive",
        },
      };

      if (services && services.length > 0) {
        whereclause.ServicesOpt = {
          some: {
            OR: [
              {
                service: {
                  serviceName: {
                    in: services,
                    mode: "insensitive",
                  },
                },
              },
              {
                capability: {
                  capabilityName: {
                    in: services,
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
        };
      }

      let orderBy: { [key: string]: { [key: string]: "asc" | "desc" } } | { [key: string]: "asc" | "desc" } = { name: "asc" };
      if (SortField == "AZ") {
        orderBy = { name: "asc" };
      } else if (SortField == "ZA") {
        orderBy = { name: "desc" };
      } else if (SortField === "PostedOld") {
        orderBy = { createdAt: "asc" };
      } else if (SortField === "PostedNew") {
        orderBy = { createdAt: "desc" };
      } else {
        orderBy = { createdAt: "desc" };
      }
      const sortCustomColumnOrderText = (sortCustomColumnOrder == 'asc') ? 'asc' : 'desc';
      if (sortCustomColumn && sortCustomColumn != '' && sortCustomColumnOrder != '') {
        if (sortCustomColumn === 'Company') {
          orderBy = { company: { name: sortCustomColumnOrderText } };
        } else if (sortCustomColumn === 'Opportunity') {
          orderBy = { name: sortCustomColumnOrderText };
        } else if (sortCustomColumn === 'Industry Type') {
          orderBy = { industryTypes: { name: sortCustomColumnOrderText } };
        } else if (sortCustomColumn === 'Platform') {
          orderBy = { PlatformsOpt: { _count: sortCustomColumnOrderText } };
        } else if (sortCustomColumn === 'Start') {
          orderBy = { approxStartDateCondition: sortCustomColumnOrderText };
        } else if (sortCustomColumn === 'End') {
          orderBy = { approxEndDateCondition: sortCustomColumnOrderText };
        } else if (sortCustomColumn === 'Staff Months') {
          orderBy = { staffMonths: sortCustomColumnOrderText };
        } else if (sortCustomColumn === 'Posted Date') {
          orderBy = { createdAt: sortCustomColumnOrderText };
        }
      }

      const data = await this.prismaService.opportunities.findMany({
        where: whereclause,
        orderBy: orderBy,
        //  orderBy: [
        // {approxEndDate: 'desc' },
        //  {approxStartDateCondition: 'desc' },
        //   {approxEndDateCondition: 'asc' },

        //   ],
        include: {
          industryTypes: {
            select: {
              name: true,
            },
          },
          company: {
            select: {
              name: true,
            },
          },
          PlatformsOpt: {
            select: {
              platforms: true,
            },
          },
          ServicesOpt: {
            select: {
              capabilityId: true,
              service: true,
            },
          },
        },
        skip: Number(page),
        take: Number(limit),
      });

      const datacount = await this.prismaService.opportunities.findMany({
        where: whereclause
      });

      for (const provider of data) {
        provider.companyId = 0;
        if(!provider.showCompanyName) {
          provider.company.name = '';
        }
        if (provider.ServicesOpt && provider.ServicesOpt.length > 0) {
          // Filter out null capabilityId services
          const filteredServices = provider.ServicesOpt.filter(serviceOpt => serviceOpt.capabilityId === null);
          provider.ServicesOpt = filteredServices;
        }
      }
      return {
        success: true,
        message: "Opportunities Fetching successfully",
        list: data,
        count: datacount.length,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Opportunities Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async findOpportunityDetailsById(id: number, companyId: number, Type: string = 'view') {
    try {

      const currentDate = new Date();
      const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      const whereOptions: whereEditclauseTypes = {
        id: Number(id),
      }
 
      // if (Type === 'view') {
      //     whereOptions.expiryDate = {
      //       gt: currentDateWithoutTime, 
      //     }; 
      //     whereOptions.oppStatus = $Enums.OPPORTUNITY_STATUS.publish
      // }else{
      //   whereOptions.companyId = Number(companyId)
      // }

      const data = await this.prismaService.opportunities.findFirst({
        where: whereOptions,
        include: {
          industryTypes: {
            select: {
              name: true,
            },
          },
          company: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                },
              },
              name: true,
            },
          },
          serviceProvidersIntrests: {
            where: {
              companyId: Number(companyId),
            },
            select: {
              description: true,
            },
          },
          ServicesOpt: {
            select: {
              service: true,
              id: true,
            },
            distinct: ['serviceId'],
          },
          PlatformsOpt: {
            select: {
              platforms: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          FileUploads: true,
        },
      });

      if(Number(data?.companyId) !== Number(companyId) && ((data?.oppStatus != $Enums.OPPORTUNITY_STATUS.publish) || (data?.isArchieve) || (data?.expiryDate && data?.expiryDate <= currentDateWithoutTime))){
        return {
          success: true,
          message: "Opportunities Fetching successfully",
          list: null,
          StatusCode: HttpStatus.OK,
        }
      }
      if (data) {
        if (Type == 'view' ) {
          data.company.user.email = '';
          data.company.user.firstName = '';
          if (!data.showCompanyName) {
            data.company.name = '';
          }
          const serviceNames = data.ServicesOpt
          .map(opt => opt.service?.serviceName ?? null)
          .filter(Boolean) as string[];
          const servicesSelected = await this.prismaService.servicesOpt.findMany({
            where: {
              companyId: +companyId,
              capabilityId: null,
              company: {
                isArchieve: false,
                isDelete: false,
              },
              service: {
                serviceName: {
                  in: serviceNames, // Checking if service name matches
                },
              },
            },
            select: {
              company: {
                select: {
                  id: true,
                  user:{
                    select:{
                      userRoles:{
                        select:{
                          roleCode: true,
                        }
                      }
                    }
                  }
                },
              },
            },
          });
          const loggedComp = await this.prismaService.companies.findFirst({
            where:{
              id: +companyId,
            },
            select:{
              user:{
                select:{
                  userRoles:{
                    select:{
                      roleCode: true,
                    }
                  }
                }
              }
            }
          })
          if( loggedComp && loggedComp.user.userRoles[0].roleCode == "service_provider"){
            data.companyId = 0;
            if(servicesSelected.length == 0){
              return {
                success: false,
                message: "Opportunities Fetching Failed",
                StatusCode: HttpStatus.NOT_FOUND,
                error: "",
              };
            }
          }
          
        }
        for (const fileUpload of data.FileUploads) {
          if (fileUpload.type === "image" || fileUpload.type === "file") {
            const oldUrl = fileUpload.fileUrl;
            const bannersignedUrl = await this.gcsService.getSignedUrl(
              fileUpload.fileUrl,
            );
            // const lastDotIndex = fileUpload.fileUrl.lastIndexOf('.');
            // const nameWithoutExtension = fileUpload.fileUrl.substring(0, lastDotIndex);
            // const fileExtension = fileUpload.fileUrl.substring(lastDotIndex);
            // const thumbnailFileName = nameWithoutExtension + '_thumbnail' + fileExtension;
            // const thumbnailUrl = await this.gcsService.getSignedUrl(thumbnailFileName);
            fileUpload.fileUrl = bannersignedUrl;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (fileUpload as any).dburl = oldUrl;
            // (fileUpload as any).thumbUrl = thumbnailUrl;
          }
        }
      }
      return {
        success: true,
        message: "Opportunities Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Opportunities Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async createOpportnutyInstrest(createOpportunityDto: {companyId: number, opportunityId: number, description: string, addedFiles: {
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
    try {
      const intrestExisted = await this.prismaService.serviceProvidersIntrests.findFirst({
        where:{
          companyId: createOpportunityDto.companyId,
          opportunityId: createOpportunityDto.opportunityId,
        }
      })
      const opportuniyDetrails = await this.prismaService.opportunities.findFirst({
        where:{
          id: createOpportunityDto.opportunityId,
        }
      })
      if(intrestExisted) {
        return {
          success: false,
          message: "Opportunity Intrest already Added",
          StatusCode: HttpStatus.OK,
        }
      }
      const intrestedOppId =  await this.prismaService.serviceProvidersIntrests.create({
        data: {
          companyId: createOpportunityDto.companyId,
          opportunityId: createOpportunityDto.opportunityId,
          description: createOpportunityDto.description,
        }
      });
      if(createOpportunityDto.addedFiles.length > 0 ){
        for (const albums of createOpportunityDto.addedFiles){
          albums.files.map(async(fileData: {imagePath: string, imageFile : string})=>{
            await this.prismaService.opportinityIntrestWithFiles.create({
              data: {
                oppoId : intrestedOppId.id,
                fileUrl: fileData.imagePath,
                thumbnailUrl: fileData.imageFile,
              }
            })
          })
        }
      }
      if(opportuniyDetrails){
        const notification = {
          notificationById: createOpportunityDto.companyId,
          notificationToId: opportuniyDetrails?.companyId,
          opportunityId: createOpportunityDto.opportunityId,
          notificationDescription: `👉 Looks like somebody is interested in `+opportuniyDetrails?.name+`.`,
          type: 6
        }
        await this.prismaService.generalNotifications.create({
          data: notification
        });
          let theUrl = "";
          theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/generalNotification`;
          const notificationRef = admin.database().ref(theUrl).push();
          const toCompanies = [opportuniyDetrails?.companyId];
          await notificationRef.set({
            companyId: createOpportunityDto.companyId,
            toCompanyIds: toCompanies,
            description: `👉 Looks like somebody is interested in `+opportuniyDetrails?.name+`.
            <span>
              <a href="${process.env.XDS_FRONTEND_BASE_URL}/opportunity-details/${opportuniyDetrails?.id}"> See details
              </a>
            </span>`,
            timestamp: new Date().toISOString(),
          });
      }
      return {
        success: true,
        message: "Opportunities Intrest Added successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Opportunities Intrest Adding Failed",
        StatusCode: HttpStatus.OK,
        error,
      };
    }
  }
}
