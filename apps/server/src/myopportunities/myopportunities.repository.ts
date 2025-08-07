import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMyopportunityDto } from "./dto/create-myopportunity.dto";
import { $Enums } from "@prisma/client";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import admin from "firebase-admin";

type myOppoSaveDataType = {
  companyId: number;
  name: string;
  description: string;
  oppStatus: $Enums.OPPORTUNITY_STATUS;
  industryId: number;
  approxStartDateCondition: number;
  approxStartDate: Date | null;
  approxEndDateCondition: number;
  approxEndDate: Date | null;
  staffMonths: number;
  showCompanyName: boolean;
  showContactPerson: boolean;
  contactPersonName: string | null;
  isReceiveEmailEnabled: boolean;
  expiryDate: Date | null;
  technologies: string;
};

interface InterestedFile {
  id: number;
  createdAt: Date;
  oppoId: number;
  fileUrl: string;
  thumbnailUrl: string;
  thumbnail: string;
  type: string;
}


@Injectable()
export class MyopportunitiesRepository {
  constructor(
    private readonly Prismaservice: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) { }

  async create(createMyopportunityDto: CreateMyopportunityDto, role: string = "") {
    try {
      const newpostObj: myOppoSaveDataType = {
        companyId: Number(createMyopportunityDto.companyId),
        name: createMyopportunityDto.name,
        description: createMyopportunityDto.description,
        oppStatus:
          createMyopportunityDto.oppStatus == "draft" ? "draft" : "publish",
        industryId: Number(createMyopportunityDto.industryId),
        approxStartDateCondition: Number(
          createMyopportunityDto.approxStartDateCondition,
        ),
        approxStartDate: createMyopportunityDto.approxStartDate
          ? new Date(createMyopportunityDto.approxStartDate)
          : null,
        approxEndDateCondition: Number(
          createMyopportunityDto.approxEndDateCondition,
        ),
        approxEndDate: createMyopportunityDto.approxEndDate
          ? new Date(createMyopportunityDto.approxEndDate)
          : null,
        staffMonths: Number(createMyopportunityDto.staffMonths),
        showCompanyName: createMyopportunityDto.showCompanyName ? true : false,
        showContactPerson: createMyopportunityDto.showContactPerson
          ? true
          : false,
        contactPersonName: createMyopportunityDto.contactPersonName,
        isReceiveEmailEnabled: createMyopportunityDto.isReceiveEmailEnabled
          ? true
          : false,
        expiryDate: createMyopportunityDto.expiryDate
          ? new Date(createMyopportunityDto.expiryDate)
          : null,
        technologies: createMyopportunityDto.technologies,
      };

      const opportunityId = await this.Prismaservice.opportunities.create({
        data: newpostObj,
      });
      // services opt
      const platforms: { platformId: number; opportunityId: number }[] = [];
      if (Array.isArray(createMyopportunityDto.platforms)) {
        createMyopportunityDto.platforms.map((platform) => {
          const platformdata = {
            platformId: Number(platform),
            opportunityId: opportunityId.id,
          };
          platforms.push(platformdata);
        });
      } else {
        const platformdata = {
          platformId: Number(createMyopportunityDto.platforms),
          opportunityId: opportunityId.id,
        };
        platforms.push(platformdata);
      }

      await this.Prismaservice.platformsOpt.createMany({
        data: platforms,
      });

      // services opt

      const servicesopt: {
        serviceId: number;
        capabilityId: number | null;
        opportunityId: number;
      }[] = [];
      if (Array.isArray(createMyopportunityDto.combinedservices)) {
        createMyopportunityDto.combinedservices.map((service) => {
          const servicedata = {
            serviceId: Number(service.serviceId),
            capabilityId:
              service.capabilityId !== null
                ? Number(service.capabilityId)
                : null,
            opportunityId: Number(opportunityId.id),
          };
          servicesopt.push(servicedata);
        });
      } else {
        // const servicedata = {
        //   serviceId: Number(createMyopportunityDto.combinedservices.serviceId),
        //   capabilityId: Number(createMyopportunityDto.combinedservices.capabilityId),
        //   opportunityId: opportunityId.id,
        // };
        // servicesopt.push(servicedata);
      }

      await this.Prismaservice.servicesOpt.createMany({
        data: servicesopt,
      });

      // add buyer stat
      const isBuyerStatExist = await this.Prismaservice.buyersStats.findFirst({
        where: {
          buyerCompanyId: +createMyopportunityDto.companyId
        }
      });
      if(!isBuyerStatExist && role && role == $Enums.ROLE_CODE.buyer ) {
        await this.Prismaservice.buyersStats.create({
          data: {
            buyerCompanyId: +createMyopportunityDto.companyId,
            visitCounts: 0
          }
        })
      }

      //files upload
      const uploadedFiles: {
        type: $Enums.ASSET_TYPE;
        opportunityId: number;
        fileUrl: string;
      }[] = [];
      if (Array.isArray(createMyopportunityDto.dbInputFiles)) {
        createMyopportunityDto.dbInputFiles.map((inpFile: { type: string, fileUrl: string }) => {
          let fileType: $Enums.ASSET_TYPE;
          if (inpFile.type === "image" || inpFile.type === "video" || inpFile.type === "file") {
            fileType = inpFile.type;
          }else{
            return;
          }
          const filedata = {
            type: fileType,
            fileUrl: inpFile.fileUrl,
            opportunityId: opportunityId.id,
          };
          uploadedFiles.push(filedata);
        });
      } else {
        let fileType: $Enums.ASSET_TYPE;
        if (createMyopportunityDto.dbInputFiles.type === "image" || createMyopportunityDto.dbInputFiles.type === "video" || createMyopportunityDto.dbInputFiles.type === "file") {
          fileType = createMyopportunityDto.dbInputFiles.type;
        }else{
          return;
        }
        const filetext: string = createMyopportunityDto.dbInputFiles.fileUrl;
        const filedata = {
          type: fileType,
          fileUrl: filetext,
          opportunityId: opportunityId.id,
        };
        uploadedFiles.push(filedata);
      }

      const fileUrlsArray = uploadedFiles.map(file => file.fileUrl);
      if (createMyopportunityDto.uniqueFormId) {
        await this.deleteTempFiles(fileUrlsArray, createMyopportunityDto.uniqueFormId, 'DeleteSavedFiles');
      }
      

      await this.Prismaservice.fileUploads.createMany({
        data: uploadedFiles,
      });

      return {
        success: true,
        message: "My Opportunity Created successfully",
        opportunityId: opportunityId.id,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity save Failed",
        StatusCode: HttpStatus.BAD_REQUEST,
        error: error,
      };
    }
  }

  async deleteTempFiles(fileUrls:string[] | string,formId:string, delType:string = 'DeleteSavedFiles'){
    // const fileNames = fileUrls.map(file => file.name);
    if(typeof fileUrls === 'string'){
     fileUrls = [fileUrls]
    }
    if(delType == 'DeleteSavedFiles'){
     return await this.Prismaservice.temporaryUploadedFiles.deleteMany({
       where:{
         formUniqueId:formId,
         fileName:{
           in:fileUrls,
         }
       }
     });
    }else if(delType == 'AddDeletedFiles'){
     const newfiles:{fileName : string, formUniqueId: string}[] = [];
     fileUrls.forEach((fileUrl) => {
       const singleFile = {fileName : fileUrl, formUniqueId: formId};
       newfiles.push(singleFile);
     });
     return await this.Prismaservice.temporaryUploadedFiles.createMany({
       data:newfiles
     });
    }
 
   }

  async updateMyOpportunity(updateData: CreateMyopportunityDto) {
    try {

      await this.Prismaservice.opportunities.findUniqueOrThrow({
        where:{
          id:updateData.id,
          companyId: Number(updateData.companyId),
        }
      });
      const newpostObj: myOppoSaveDataType = {
        companyId: Number(updateData.companyId),
        name: updateData.name,
        description: updateData.description,
        oppStatus: updateData.oppStatus == "draft" ? "draft" : "publish",
        industryId: Number(updateData.industryId),
        approxStartDateCondition: Number(updateData.approxStartDateCondition),
        approxStartDate: updateData.approxStartDate
          ? new Date(updateData.approxStartDate)
          : null,
        approxEndDateCondition: Number(updateData.approxEndDateCondition),
        approxEndDate: updateData.approxEndDate
          ? new Date(updateData.approxEndDate)
          : null,
        staffMonths: Number(updateData.staffMonths),
        showCompanyName: updateData.showCompanyName ? true : false,
        showContactPerson: updateData.showContactPerson ? true : false,
        contactPersonName: updateData.contactPersonName,
        isReceiveEmailEnabled: updateData.isReceiveEmailEnabled ? true : false,
        expiryDate: updateData.expiryDate
          ? new Date(updateData.expiryDate)
          : null,
        technologies: updateData.technologies,
      };

      const opportunityId = await this.Prismaservice.opportunities.update({
        where: {
          id: updateData.id,
        },
        data: newpostObj,
      });
      // services opt
      await this.Prismaservice.platformsOpt.deleteMany({
        where: {
          opportunityId: updateData.id,
        },
      });
      const platforms: { platformId: number; opportunityId: number }[] = [];
      if (Array.isArray(updateData.platforms)) {
        updateData.platforms.map((platform) => {
          const platformdata = {
            platformId: Number(platform),
            opportunityId: opportunityId.id,
          };
          platforms.push(platformdata);
        });
      } else {
        const platformdata = {
          platformId: Number(updateData.platforms),
          opportunityId: opportunityId.id,
        };
        platforms.push(platformdata);
      }

      await this.Prismaservice.platformsOpt.createMany({
        data: platforms,
      });

      // services opt
      await this.Prismaservice.servicesOpt.deleteMany({
        where: {
          opportunityId: updateData.id,
        },
      });
      const servicesopt: {
        serviceId: number;
        capabilityId: number | null;
        opportunityId: number;
      }[] = [];
      if (Array.isArray(updateData.combinedservices)) {
        updateData.combinedservices.map((service) => {
          const servicedata = {
            serviceId: Number(service.serviceId),
            capabilityId:
              service.capabilityId !== null
                ? Number(service.capabilityId)
                : null,
            opportunityId: Number(opportunityId.id),
          };
          servicesopt.push(servicedata);
        });
      } else {
        //   const servicedata = {
        //     serviceId: Number(updateData.servicesselected),
        //     opportunityId: opportunityId.id,
        //   };
        //   servicesopt.push(servicedata);
      }

      await this.Prismaservice.servicesOpt.createMany({
        data: servicesopt,
      });

      //files upload
      await this.Prismaservice.fileUploads.deleteMany({
        where: {
          opportunityId: updateData.id,
        },
      });
      const uploadedFiles: {
        type: $Enums.ASSET_TYPE;
        opportunityId: number;
        fileUrl: string;
      }[] = [];
      if (Array.isArray(updateData.dbInputFiles)) {
        updateData.dbInputFiles.length &&
          updateData.dbInputFiles.map((inpFiles: { type: string, fileUrl: string }) => {
            let fileType: $Enums.ASSET_TYPE;
            if (inpFiles.type === "image" || inpFiles.type === "video" || inpFiles.type === "file") {
              fileType = inpFiles.type;
            }else{
              return;
            }
            const filedata = {
              type: fileType,
              fileUrl: inpFiles.fileUrl,
              opportunityId: opportunityId.id,
            };
            uploadedFiles.push(filedata);
          });
      } else {
        let fileType: $Enums.ASSET_TYPE;
        if (updateData.dbInputFiles.type === "image" || updateData.dbInputFiles.type === "video" || updateData.dbInputFiles.type === "file") {
          fileType = updateData.dbInputFiles.type;
        }else{
          return;
        }
        const filetext: string = updateData.dbInputFiles.fileUrl;
        const filedata = {
          type: $Enums.ASSET_TYPE.image,
          fileUrl: filetext,
          opportunityId: opportunityId.id,
        };
        uploadedFiles.push(filedata);
      }

      const fileUrlsArray = uploadedFiles.map(file => file.fileUrl);
      const formId  = updateData.uniqueFormId;
      const deletedFiles = updateData.deletdFilePaths;
      if (formId) {
        await this.deleteTempFiles(fileUrlsArray, formId, 'DeleteSavedFiles');
        if (deletedFiles) {
          await this.deleteTempFiles(deletedFiles, formId, 'AddDeletedFiles');
        }
      } 
      await this.Prismaservice.fileUploads.createMany({
        data: uploadedFiles,
      });

      return {
        success: true,
        message: "My Opportunity Updated successfully",
        StatusCode: HttpStatus.OK,
        opportunityId: opportunityId.id,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Update Failed",
        StatusCode: HttpStatus.BAD_REQUEST,
        error: error,
      };
    }
  }
  async findall(companyId: number) {
    try {
      const data = await this.Prismaservice.opportunities.findMany({
        where: {
          companyId: companyId,
          isArchieve: false,
          isDelete: false,
          company:{
            isArchieve: false,
            isDelete: false,
          }
        },
        orderBy:{
          createdAt:'desc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          approxStartDate: true,
          approxEndDate: true,
          staffMonths: true,
          createdAt: true,
          approxEndDateCondition: true,
          approxStartDateCondition: true,
          updatedAt: true,
          oppStatus:true,
          expiryDate:true,
          industryTypes: {
            select: {
              name: true,
            },
          },
          PlatformsOpt: {
            select: {
              platforms: {
                select: {
                  name: true,
                },
              },
            },
          },
          serviceProvidersIntrests: {
            where:{
              company: {
                isArchieve: false,
                isDelete: false,
              }
            },
            select: {
              companyId: true,
              isNewIntrest: true
            },
          },
        },
      });
      return {
        success: true,
        message: "My Opportunity Fetching successfully",
        StatusCode: HttpStatus.OK,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async findById(id: number, companyId: number) {
    try {
      const data = await this.Prismaservice.opportunities.findMany({
        where: {
          id: Number(id),
          companyId: companyId,
        },
        select: {
          name: true,
          companyId: true
        },
      });
      return {
        success: true,
        message: "My Opportunity Intrest list Fetching successfully",
        StatusCode: HttpStatus.OK,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Intrest list Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async findIntrestedList(id: number) {
    try {
      const data = await this.Prismaservice.serviceProvidersIntrests.findMany({
        where: {
          opportunityId: Number(id),
          isDelete: false,
          company:{
            isArchieve: false,
            isDelete: false,
          }
        },
        select: {
          id: true,
          createdAt: true,
          description: true,
          isNewIntrest: true,
          opportunityIntrested: true,
          opportunity: {
            select: {
              name: true,
            },
          },
          company: {
            select: {
              userId: true,
              slug: true,
              id: true,
              name: true,
              website: true,
              isArchieve: true,
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
                  firstName: true,
                  lastName: true,
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
                where:{
                  serviceId:{
                    not: null,
                  },
                  capabilityId: null,
                },
                select: {
                  service: {
                    select: {
                      serviceName: true,
                      groupId: true,
                    },
                  },
                },
              },
              companySizes: {
                select: {
                  size: true,
                },
              },
              CompanyAddress: {
                select: {
                  city: true,
                  Country: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy:{
          createdAt:'desc'
        }
      });
      if (data) {
        await Promise.all(
          data.map(async (dataimages) => {
            if (dataimages.company.logoAsset) {
              try {
                const signedLogoUrl = await this.gcsService.getSignedUrl(
                  dataimages.company.logoAsset.url,
                );
                dataimages.company.logoAsset.url = signedLogoUrl;
              } catch (error) {
                console.error(
                  "Error fetching signed URL for logoAsset:",
                  error,
                );
              }
            }
            if (dataimages.company.bannerAsset) {
              try {
                const signedLogoUrl = await this.gcsService.getSignedUrl(
                  dataimages.company.bannerAsset.url,
                );
                dataimages.company.bannerAsset.url = signedLogoUrl;
              } catch (error) {
                console.error(
                  "Error fetching signed URL for logoAsset:",
                  error,
                );
              }
            }

            if (dataimages.company.user.assets) {
              await Promise.all(
                dataimages.company.user.assets.map(async (asseturls) => {
                  try {
                    const signedAssetUrl = await this.gcsService.getSignedUrl(
                      asseturls.url,
                    );
                    asseturls.url = signedAssetUrl;
                  } catch (error) {
                    console.error(
                      "Error fetching signed URL for user asset:",
                      error,
                    );
                  }
                }),
              );
            };
            if (dataimages.opportunityIntrested) {
              try {
                for(const intrestedFiles of dataimages.opportunityIntrested as InterestedFile[]){
                  if(intrestedFiles.fileUrl.startsWith("user_images/")){
                    const signedLogoUrl = await this.gcsService.getSignedUrl(
                      intrestedFiles.fileUrl,
                    );
                    intrestedFiles.fileUrl = signedLogoUrl;
                    intrestedFiles.type = "image";
                    intrestedFiles.thumbnail = intrestedFiles.thumbnailUrl;
                  } else {
                    intrestedFiles.type = "video";
                    intrestedFiles.thumbnail = intrestedFiles.thumbnailUrl;
                  }
                }

              } catch (error) {
                console.error(
                  "Error fetching signed URL for logoAsset:",
                  error,
                );
              }
            }
          }),
        );
      }
      return {
        success: true,
        message: "My Opportunity Intrest list Fetching successfully",
        StatusCode: HttpStatus.OK,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Intrest list Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async archiveMyOpportunity(oppId: number,companyId: number) {
    try {
      const existingList = await this.Prismaservice.opportunities.findFirst({
        where: {
          id: Number(oppId),
          companyId: Number(companyId),
        },
      });

      if (!existingList) {
        return {
          success: false,
          message: "My Opportunity  Not Found",
          StatusCode: HttpStatus.NOT_FOUND,
        };
      }
      const updateIsArchive = !existingList.isArchieve;
      await this.Prismaservice.opportunities.update({
        where: {
          id: Number(oppId),
        },
        data: {
          isArchieve: updateIsArchive,
        },
      });
      return {
        success: true,
        message: "My Opportunity updated successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity updating Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error,
      };
    }
  }
  async draftOrPublishOpportunity(oppId: number) {
    try {
      const existingList = await this.Prismaservice.opportunities.findFirst({
        where: {
          id: Number(oppId),
        },
      });

      if (!existingList) {
        return {
          success: false,
          message: "My Opportunity  Not Found",
          StatusCode: HttpStatus.NOT_FOUND,
        };
      }
      const updateIsStatus = existingList.oppStatus === $Enums.OPPORTUNITY_STATUS.draft ? 'publish' : 'draft';
      await this.Prismaservice.opportunities.update({
        where: {
          id: Number(oppId),
        },
        data: {
          oppStatus: updateIsStatus,
        },
      });
      return {
        success: true,
        message: "My Opportunity updated successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity updating Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error,
      };
    }
  }

  async findArchivedMyOpportunities(companyId: number) {
    try {
      const data = await this.Prismaservice.opportunities.findMany({
        where: {
          companyId: companyId,
          isArchieve: true,
          isDelete: false,
          company:{
            isArchieve: false,
            isDelete: false,
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          approxStartDate: true,
          approxEndDate: true,
          staffMonths: true,
          approxEndDateCondition: true,
          approxStartDateCondition: true,
          createdAt: true,
          updatedAt: true,
          industryTypes: {
            select: {
              name: true,
            },
          },
          PlatformsOpt: {
            select: {
              platforms: {
                select: {
                  name: true,
                },
              },
            },
          },
          serviceProvidersIntrests: {
            select: {
              companyId: true,
            },
          },
        },
      });
      return {
        success: true,
        message: "My Opportunity Fetching successfully",
        StatusCode: HttpStatus.OK,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async deleteMyOpportunity(id: number) {
    try {
      await this.Prismaservice.opportunities.update({
        where: {
          id: id,
        },
        data: {
          isDelete: true,
        },
      });
      return {
        success: true,
        message: "My Opportunity Deleted successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Opportunity Deleting Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error,
      };
    }
  }

  async findIndustriesRepo() {
    try {
      const data = await this.Prismaservice.industryTypes.findMany();
      return {
        success: true,
        message: "Archived My Opportunity Fetching successfully",
        StatusCode: HttpStatus.OK,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Industries Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async checkOpportunityByCompanyId(companyId:number, OpportunityId: number){
    return await this.Prismaservice.opportunities.findFirstOrThrow({
      where:{
        companyId: Number(companyId),
        id: Number(OpportunityId),
      }
    });
  }

  async getCountOfNewIntrests(companyId:number){
    return await this.Prismaservice.opportunities.findMany({
      where:{
        companyId: Number(companyId),
        isArchieve: false,
        isDelete: false,
        company:{
          isArchieve: false,
          isDelete: false,
        }
      }, 
      include: {
        serviceProvidersIntrests: {
          where: {
            isNewIntrest: true
          }
        }
      }
    });
  }

  async updateIntrestSetToRead(oppId:number){
    return await this.Prismaservice.serviceProvidersIntrests.updateMany({
      where:{
        opportunityId: oppId,
        company:{
          isArchieve: false,
          isDelete: false,
        }
      },
      data: {
        isNewIntrest: false
      }
    });
  }

  async findServicesMatchedCompanies(selectedServices : CreateMyopportunityDto) {
    const servicesselected =  await this.Prismaservice.servicesOpt.findMany({
      where: {
        companyId: { not: null },
        capabilityId: null ,
        company:{
          isArchieve: false,
          isDelete: false,
          user:{
            isPaidUser: true,
          }
        },
        serviceId: {
          in: selectedServices.servicesselected.map(Number),
        },
      },
      select:{
        company:{
          select:{
            id: true,
            user:{
              select:{
                email: true,
                firstName: true,
              }
            }
          }
        }
      }
    });
    // const capabilitiesSelected =  await this.Prismaservice.servicesOpt.findMany({
    //   where: {
    //     companyId: { not: null },
    //     company:{
    //       user:{
    //         isPaidUser: true,
    //       }
    //     },
    //     capabilityId: {
    //       in: selectedServices.capabilitiesSelected.map(Number),
    //     },
    //   },
    //   select:{
    //     company:{
    //       select:{
    //         id: true,
    //         user:{
    //           select:{
    //             email: true,
    //             firstName: true,
    //           }
    //         }
    //       }
    //     }
    //   }
    // });
    return {servicesselected: servicesselected};
  }

  async sendNotificationsToSp(loggedComanyId: string, oppoId: number, companies: {
    companyId: number;
    email: string;
    firstName: string;
}[]) {

  try{
    const getAlreadySentNotification = await this.Prismaservice.generalNotifications.findMany({
      where :{
        type: 5,
      }
    });
    companies = companies.filter((company) =>
      !getAlreadySentNotification.some(
        (notification) =>
          notification.opportunityId === oppoId &&
          notification.notificationToId === company.companyId
      )
    );
    const notificationArr: {notificationById: number, notificationToId: number, opportunityId: number, notificationDescription: string, type: number}[] = []
    companies.forEach((item) => {
      const notification = {
        notificationById: +loggedComanyId,
        notificationToId: item.companyId,
        opportunityId: oppoId,
        notificationDescription: "👏 A buyer has posted an opportunity that matches your core services.",
        type: 5
      }
      notificationArr.push(notification);
    });
    if(notificationArr.length > 0) {
      const spCompanyIds = notificationArr.map(item => item.notificationToId);
      if(spCompanyIds.length > 0) {
        await this.Prismaservice.generalNotifications.createMany({
          data: notificationArr
        });
        let theUrl = "";
        theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/generalNotification`;
        const notificationRef = admin.database().ref(theUrl).push();
        console.log(spCompanyIds);
        await notificationRef.set({
          companyId: Number(loggedComanyId),
          toCompanyIds: spCompanyIds,
          description: `👏 A buyer has posted an opportunity that matches your core services.
          <span>
            <a href="${process.env.XDS_FRONTEND_BASE_URL}/opportunity-details/${oppoId}"> See details
            </a>
          </span>`,
          timestamp: new Date().toISOString(),
        });
      }
    }
    return {success: true, data:companies};
  }
  catch (error) {
    // throw new HttpException('notifications', HttpStatus.FORBIDDEN, error);
    return {
      success: true,
      message: "My Opportunity Fetching Failed",
      data: companies,
      StatusCode: HttpStatus.NOT_FOUND,
      error: error,
    };
  }

  }

  async getAllOpportunites(){
    try {
      const data = await this.Prismaservice.opportunities.findMany({
        select:{
          id: true,
          name: true,
          oppStatus: true,
          updatedAt: true,
          isArchieve: true,
          expiryDate: true,
          company: {
            select:{
              id: true,
              name: true,
              user:{
                select:{
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          serviceProvidersIntrests: {
            select:{
              company:{
                select:{
                  id: true,
                  name: true,
                }
              },
            }
          },
        },
        orderBy:{
          id: 'desc',
        }
      })
      return {
        success: true,
        data: data,
        message: "My Opportunities Fetching SuccessFully",
      };
    }  catch (error) {
      return {
        success: false,
        message: "My Opportunity Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }

  }

}
