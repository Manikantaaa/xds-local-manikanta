import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMylistDto } from "./dto/create-mylist.dto";
import { UpdateMylistDto } from "./dto/update-mylist.dto";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { $Enums, ROLE_CODE } from "@prisma/client";
import admin from "firebase-admin";

@Injectable()
export class MylistRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) { }

  async CreateMyList(createMylistDto: CreateMylistDto, companyId: number, role: string = "") {
    try {
      const insertdata = {
        name: createMylistDto.name,
        description: createMylistDto.description,
        userId: createMylistDto.userId,
      };
      const insertedData = await this.prismaService.myLists.create({
        data: insertdata,
      });

      if (
        insertedData.id &&
        createMylistDto.companies &&
        createMylistDto.companies?.length > 0
      ) {

        // add buyer stat
        const isBuyerStatExist = await this.prismaService.buyersStats.findFirst({
          where: {
            buyerCompanyId: companyId
          }
        });
        if(!isBuyerStatExist && role && role == ROLE_CODE.buyer) {
          await this.prismaService.buyersStats.create({
            data: {
              buyerCompanyId: companyId,
              visitCounts: 0
            }
          })
        }

        const slectedcompaniesdata: { listId: number; companyId: number }[] =
          [];
        createMylistDto.companies.forEach((usercompanyId) => {
          const company = {
            listId: insertedData.id,
            companyId: Number(usercompanyId),
          };
          slectedcompaniesdata.push(company);
        });
        await this.prismaService.intrestedInMyLists.createMany({
          data: slectedcompaniesdata,
        });
        const notificationArr: {notificationById: number, notificationToId: number, notificationDescription: string, type: number}[] = []
        slectedcompaniesdata.forEach((item) => {
          const notification = {
            notificationById: companyId,
            notificationToId: item.companyId,
            notificationDescription: "You have been added to a list.",
            type: 2
          }
          notificationArr.push(notification);
        });
        if(notificationArr.length > 0) {
          await this.prismaService.generalNotifications.createMany({
            data: notificationArr
          });
          const spCompanyIds = notificationArr.map(item => item.notificationToId);
          if(spCompanyIds.length > 0) {
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
      return {
        success: true,
        message: "My list Created successfully",
        data: insertedData,
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list Creating Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }
  }
  async findAllMyLists(userId: number) {
    try {
      const data = await this.prismaService.myLists.findMany({
        where: {
          userId: userId,
          isDelete: false,
          isArchieve: false,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      return {
        success: true,
        message: "My list Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async findMylistIntrests(id: number, userId: number, type?: string) {
    try {
      const data = await this.prismaService.intrestedInMyLists.findMany({
        where: {
          listId: Number(id),
          isDelete: false,
          list: {
            userId: userId,
          },
          company: {
            isArchieve: false,
            isDelete: false,
          }
        },
        select: {
          id: true,
          list: {
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
              // user: {
              //   include: {
              //     assets: {
              //       select: {
              //         url: true,
              //       },
              //     },
              //     userRoles: {
              //       select: {
              //         roleCode: true,
              //       },
              //     },
              //   },
              // },
              ServicesOpt: {
                where: {
                  serviceId: {
                    not: null,
                  }
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
                  title: true,
                }
              }
            },
          },
        },
      });

      if (data && type != "exportlist") {
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

            // if (dataimages.company.user.assets) {
            //   await Promise.all(
            //     dataimages.company.user.assets.map(async (asseturls) => {
            //       try {
            //         const signedAssetUrl = await this.gcsService.getSignedUrl(
            //           asseturls.url,
            //         );
            //         asseturls.url = signedAssetUrl;
            //       } catch (error) {
            //         console.error(
            //           "Error fetching signed URL for user asset:",
            //           error,
            //         );
            //       }
            //     }),
            //   );
            // }

            if (dataimages.company.ServicesOpt) {
              const uniqueServices = new Set();
              const uniqueServicesOpt = dataimages.company.ServicesOpt.filter(serviceOpt => {
                const serviceKey = `${serviceOpt.service?.serviceName}-${serviceOpt.service?.groupId}`;
                if (!uniqueServices.has(serviceKey)) {
                  uniqueServices.add(serviceKey);
                  return true;
                }
                return false;
              });

              dataimages.company.ServicesOpt = uniqueServicesOpt;
            }
          }),
        );
      }
      return {
        success: true,
        message: "My Intrested list Fetching successfully sss",
        data: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Intrested list Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async archivemylist(id: number, userId: number) {
    try {

      const existingList = await this.prismaService.myLists.findUnique({
        where: {
          id: id,
          userId: Number(userId),
        },
      });
      if (!existingList) {
        return {
          success: false,
          message: "My list update Failed List Not Found",
          StatusCode: HttpStatus.NOT_FOUND,
        };
      }
      const updateIsArchive = !existingList.isArchieve;
      await this.prismaService.myLists.update({
        where: {
          id: id,
        },
        data: {
          isArchieve: updateIsArchive,
        },
      });
      return {
        success: true,
        message: "My list update successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async deletemylist(id: number, userId: number) {
    try {
      await this.prismaService.intrestedInMyLists.deleteMany({
        where: {
          listId: id,
          list: {
            userId: userId,
          },
        },
      });
      await this.prismaService.myIntrestedProjectsList.deleteMany({
        where: {
          listId: id,
          list: {
            userId: userId,
          }
        },
      });
      await this.prismaService.myLists.deleteMany({
        where: {
          id: id,
          userId: userId,
        },
      });
      return {
        success: true,
        message: "My list Deleted successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list Delete Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async removefrommylist(id: number, mylistId: number, userId: number) {
    try {
      const data = await this.prismaService.intrestedInMyLists.update({
        where: {
          id: mylistId,
          companyId: id,
          list: {
            userId: userId,
          }
        },
        data: {
          isDelete: true,
        },
      });
      return {
        success: true,
        message: "Deleted from My list successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Deleted from My list Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async getarchivedMyList(id: number) {
    try {
      const data = await this.prismaService.myLists.findMany({
        where: {
          userId: id,
          isDelete: false,
          isArchieve: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      return {
        success: true,
        message: "Archived My list Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Archived My list Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async findMylist(id: number, userId: number) {
    try {
      const data = await this.prismaService.myLists.findMany({
        where: {
          id: id,
          userId: userId,
          isDelete: false,

        },
        include: {
          IntrestedInMyLists: {
            where: {
              isDelete: false,
              company: {
                isArchieve: false,
                isDelete: false,
              }
            },
            select: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      return {
        success: true,
        message: "My list By Id Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list By Id Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async updateMyList(id: number, updateMylistDto: UpdateMylistDto, userId: number, companyId: number) {
    try {
      const updatedata = {
        name: updateMylistDto.name,
        description: updateMylistDto.description,
        userId: updateMylistDto.userId,
      };
      await this.prismaService.myLists.update({
        where: {
          id: id,
          userId: userId,
        },
        data: updatedata,
      });

      const existingCompaniesInList = await this.prismaService.intrestedInMyLists.findMany({
        where: {
          listId: id
        },
        select: {
          companyId: true
        }
      });
      
      await this.prismaService.intrestedInMyLists.deleteMany({
        where: {
          listId: id,
        },
      });

      const newlyAddedCompanies = updateMylistDto.companies?.filter((item) => {
        return !existingCompaniesInList.some(el => el.companyId == +item)
      });

      if (updateMylistDto.companies && updateMylistDto.companies?.length > 0) {
        const slectedcompaniesdata: { listId: number; companyId: number }[] =
          [];
        updateMylistDto.companies.forEach((usercompanyId) => {
          const company = {
            listId: id,
            companyId: Number(usercompanyId),
          };
          slectedcompaniesdata.push(company);
        });
        await this.prismaService.intrestedInMyLists.createMany({
          data: slectedcompaniesdata,
        });
      }

      // insert notification and send in app notification
      if(newlyAddedCompanies && newlyAddedCompanies?.length > 0) {
        const notificationArr: {notificationById: number, notificationToId: number, notificationDescription: string, type: number}[] = []
        newlyAddedCompanies.forEach((item) => {
          const notification = {
            notificationById: companyId,
            notificationToId: +item,
            notificationDescription: "You have been added to a list.",
            type: 2
          };
          notificationArr.push(notification);
        });
        if(notificationArr.length > 0) {
          await this.prismaService.generalNotifications.createMany({
            data: notificationArr
          });
          const spCompanyIds = notificationArr.map(item => item.notificationToId);
          if(spCompanyIds.length > 0) {
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
      

      return {
        success: true,
        message: "My list Updated successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "My list Updating Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }
  }

  async getListById(listId: number) {
    return this.prismaService.myLists.findUnique({
      where: {
        id: listId
      }
    });
  }

  createListSharingDetail(listId: number, theToken: string) {
    return this.prismaService.listSharingDetails.create({
      data: {
        listId: listId,
        theToken: theToken
      }
    });
  }

  getListIdByToken(token: string) {
    return this.prismaService.listSharingDetails.findFirst({
      where: {
        theToken: token
      }
    });
  }

  getCompaniesPresentInList(listId: number) {
    return this.prismaService.intrestedInMyLists.findMany({
      where: {
        isDelete: false,
        listId: listId,
        company: {
          isArchieve: false,
          isDelete: false,
        }
      },
      select: {
        id: true,
        list: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        company: {
          select: {
            id: true,
            slug: true,
            name: true,
            website: true,
            bannerAsset: {
              select: {
                id: true,
                url: true,
              },
            },
            CompanyAddress: {
              select: {
                id: true,
                location_name: true,
                Country: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            portfolioAlbum: {
              orderBy: { reOrderingId: "asc" },
              select: {
                id: true,
                albumName: true,
                portfolioAlbumFiles: {
                  select: {
                    id: true,
                    fileUrl: true,
                    thumbnail: true,
                    type: true,
                    fileName: true
                  },
                  orderBy: { id: "asc" },
                },
              }
            },
            ServicesOpt: {
              where: {
                capabilityId: null,
              },
              select: {
                id: true,
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
        }
      }
    });
  }

  async createExportReport(companyId: number, type: string, message: string, exportType: $Enums.EXPORT_TYPE) {
    return await this.prismaService.exportExceedReport.create({
      data: {
        companyId: Number(companyId),
        exportType: exportType,
        type: type,
        message: message,
      }
    });
  }

  async createExportCount(companyId: number, companyCount: number, listCount: number, exportType: $Enums.EXPORT_TYPE) {

    const exportedDate = new Date();
    const startOfDay = new Date(exportedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(exportedDate.setHours(23, 59, 59, 999));
    const getExistingTodayCount = await this.prismaService.exportListCount.findFirst({
      where: {
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        exportType: exportType,
      }
    });

    if (getExistingTodayCount) {
      return await this.prismaService.exportListCount.update({
        where: {
          id: getExistingTodayCount?.id
        },
        data: {
          exportedListCount: { increment: listCount },
          exportedCompaniesCount: { increment: companyCount }
        }
      })
    }

    return await this.prismaService.exportListCount.create({
      data: {
        companyId: companyId,
        exportedListCount: listCount,
        exportedCompaniesCount: companyCount,
        exportedDate: new Date(),
        exportType: exportType,
      }
    })
  }

  async findListToadyLimit(companyId: number, exportType: $Enums.EXPORT_TYPE) {
    return this.prismaService.exportListCount.findFirst({
      where: {
        companyId: companyId,
        exportType: exportType,
        exportedDate: new Date()
      }
    })

  }
  async findListIdByToken(token:string){
    return this.prismaService.listSharingDetails.findFirst({
      where: {
        theToken: token
      },
      select:{
        listId: true,
        theTokenUpdatedDate: true
      }
    })
  }
  
}
