import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMyprojectDto } from "./dto/create-myproject.dto";
import { UpdateMyprojectDto } from "./dto/update-myproject.dto";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { $Enums } from "@prisma/client";
import admin from "firebase-admin";
import { distinct } from "rxjs";

@Injectable()
export class MyProjectRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) { }

  async CreateMyProject(createMyprojectDto: CreateMyprojectDto, companyId: number, role: string = "") {
    try {
      const savedata = {
        name: createMyprojectDto.name,
        description: createMyprojectDto.description,
        userId: createMyprojectDto.userId,
      };
      const projectId = await this.prismaService.myProjects.create({
        data: savedata,
      });
      if (
        projectId.id &&
        createMyprojectDto.companies &&
        createMyprojectDto.companies?.length > 0
      ) {

        const isBuyerStatExist = await this.prismaService.buyersStats.findFirst({
          where: {
            buyerCompanyId: companyId
          }
        });
        if(!isBuyerStatExist && role && role == $Enums.ROLE_CODE.buyer) {
          await this.prismaService.buyersStats.create({
            data: {
              buyerCompanyId: companyId,
              visitCounts: 0
            }
          })
        }

        const slectedcompaniesdata: { projectId: number; listId: number }[] = [];
        const listIdsArr: number [] = []
        createMyprojectDto.companies.forEach((usercompanyId) => {
          const company = {
            projectId: projectId.id,
            listId: Number(usercompanyId),
          };
          slectedcompaniesdata.push(company);
          listIdsArr.push(+usercompanyId);
        });
        await this.prismaService.myIntrestedProjectsList.createMany({
          data: slectedcompaniesdata,
        });

        // send notifications for adding company in project
        const existingCompaniesInList = await this.prismaService.intrestedInMyLists.findMany({
          where: {
            listId: {
              in: listIdsArr
            }
          },
          select: {
            companyId: true
          }
        });
        const existingCompaniesIds = existingCompaniesInList.map(item => item.companyId);
        const notificationArr: {notificationById: number, notificationToId: number, notificationDescription: string, type: number}[] = []
        existingCompaniesIds.forEach((item) => {
          const notification = {
            notificationById: companyId,
            notificationToId: item,
            notificationDescription: "You have been added to a project",
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
              descirption: "You have been added to a project",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
      return {
        success: true,
        data: projectId.id,
        message: "My Project Created successfully",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Project Creating Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }
  }

  async findAllMyProjects(userId: number) {
    try {
      const data = await this.prismaService.myProjects.findMany({
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
        message: "My Projects Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Projects Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async findMylistIntrests(id: number) {
    try {
      const data = await this.prismaService.intrestedInMyLists.findMany({
        where: {
          listId: Number(id),
          isDelete: false,
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
              id: true,
              name: true,
              website: true,
              isArchieve: true,
              logoAsset: {
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
                  name:true,
                  email:true,
                  title:true,
                }
              }
            },
          },
        },
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
  
  async findMyprojectIntrests(id: number, userId: number) {
    try {
      const data = await this.prismaService.myIntrestedProjectsList.findMany({
        where: {
          projectId: Number(id),
          isDelete: false,
          list: {
            isDelete: false,
            isArchieve: false,
            userId: userId,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          project: {
            select: {
              name: true,
            },
          },
          // company: {
          //   select: {
          //     userId: true,
          //     id: true,
          //     name: true,
          //     isArchieve: true,
          //     website: true,
          //     logoAsset: {
          //       select: {
          //         url: true,
          //       },
          //     },
          //     bannerAsset: {
          //       select: {
          //         url: true,
          //       },
          //     },
          //     user: {
          //       include: {
          //         assets: {
          //           select: {
          //             url: true,
          //           },
          //         },
          //         userRoles: {
          //           select: {
          //             roleCode: true,
          //           },
          //         },
          //       },
          //     },
          //     ServicesOpt: {
          //       select: {
          //         service: {
          //           select: {
          //             serviceName: true,
          //             groupId: true,
          //           },
          //         },
          //       },
          //     },
          //     companySizes: {
          //       select: {
          //         size: true,
          //       },
          //     },
          //     CompanyAddress: {
          //       select: {
          //         location_name: true,
          //         Country: {
          //           select: {
          //             name: true,
          //           },
          //         },
          //       },
          //     },
          //     CompanyContacts: {
          //       select: {
          //         name: true,
          //         email: true,
          //         title: true,
          //       }
          //     }
          //   },
          // },
          list: {
            select : {
              id: true,
              name: true,
              description: true,
              updatedAt: true,
            }
          },
        },
      });

      // if (data) {
      //   await Promise.all(
      //     data.map(async (dataimages) => {
      //       if (dataimages.company.logoAsset) {
      //         try {
      //           const signedLogoUrl = await this.gcsService.getSignedUrl(
      //             dataimages.company.logoAsset.url,
      //           );
      //           dataimages.company.logoAsset.url = signedLogoUrl;
      //         } catch (error) {
      //           console.error(
      //             "Error fetching signed URL for logoAsset:",
      //             error,
      //           );
      //         }
      //       }

      //       if (dataimages.company.bannerAsset) {
      //         try {
      //           const signedBannerUrl = await this.gcsService.getSignedUrl(
      //             dataimages.company.bannerAsset.url,
      //           );
      //           dataimages.company.bannerAsset.url = signedBannerUrl;
      //         } catch (error) {
      //           console.error(
      //             "Error fetching signed URL for bannerAsset:",
      //             error,
      //           );
      //         }
      //       }

      //       if (dataimages.company.user.assets) {
      //         await Promise.all(
      //           dataimages.company.user.assets.map(async (asseturls) => {
      //             try {
      //               const signedAssetUrl = await this.gcsService.getSignedUrl(
      //                 asseturls.url,
      //               );
      //               asseturls.url = signedAssetUrl;
      //             } catch (error) {
      //               console.error(
      //                 "Error fetching signed URL for user asset:",
      //                 error,
      //               );
      //             }
      //           }),
      //         );
      //       }
      //     }),
      //   );
      // }

      return {
        success: true,
        message: "My Intrested Project Fetching successfully",
        data: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Intrested Project Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async archivemyproject(id: number, userId: number) {
    try {
      const existingList = await this.prismaService.myProjects.findUnique({
        where: {
          id: id,
          userId: userId,
          isDelete: false,
        },
      });
      if (!existingList) {
        return {
          success: false,
          message: "My Project update Failed List Not Found",
          StatusCode: HttpStatus.NOT_FOUND,
        };
      }
      const updateIsArchive = !existingList.isArchieve;
      await this.prismaService.myProjects.update({
        where: {
          id: id,
        },
        data: {
          isArchieve: updateIsArchive,
        },
      });
      return {
        success: true,
        message: "My Project update successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Project update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async shortlistmyproject(id: number) {
    try {
      const existingList =
        await this.prismaService.intrestedInMyProjects.findUnique({
          where: {
            id: id,
            isDelete: false,
          },
        });
      if (!existingList) {
        return {
          success: false,
          message: "My Project update Failed List Not Found",
          StatusCode: HttpStatus.NOT_FOUND,
        };
      }
      const updateIsArchive = !existingList.isshortlisted;
      await this.prismaService.intrestedInMyProjects.update({
        where: {
          id: id,
        },
        data: {
          isshortlisted: updateIsArchive,
        },
      });
      return {
        success: true,
        message: "My Project update successfully",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Project update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }
  async deletemyProject(id: number, userId: number) {
    try {
      const data = await this.prismaService.myProjects.update({
        where: {
          id: id,
          userId: userId,
        },
        data: {
          isDelete: true,
        },
      });
      return {
        success: true,
        message: "My Project Deleted successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "My Project Delete Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async removeCompanyFromMyProject(id: number, myProjectId: number, userId: number) {
    try {
      const data = await this.prismaService.myIntrestedProjectsList.updateMany({
        where: {
          projectId: myProjectId,
          listId: id,
          isDelete: false,
          project:{
            userId: userId,
          }
        },
        data: {
          isDelete: true,
        },
      });
      return {
        success: true,
        message: "Deleted from My Project successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Deleted from My Project Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async getarchivedMyProjects(userId: number) {
    try {
      const data = await this.prismaService.myProjects.findMany({
        where: {
          userId: userId,
          isDelete: false,
          isArchieve: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      return {
        success: true,
        message: "Archived My Project Fetching successfully",
        list: data,
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Archived My Project Fetching Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async findMyProject(id: number, userId: number) {
    try {
      const data = await this.prismaService.myProjects.findMany({
        where: {
          id: id,
          isDelete: false, 
          userId: userId,
        },
        include: {
        MyIntrestedProjectsList: {
          where: {
            isDelete: false,
            list: {
              isDelete: false,
              isArchieve: false,
              userId: userId,
            },
          },
          select: {
            list: {
              select: {
                id: true,
                name: true,
                description:true,
              },
            },
          },
        },
      },
      });
    return {
      success: true,
      message: "My Project By Id Fetching successfully",
      list: data,
      StatusCode: HttpStatus.OK,
    };
  } catch(error) {
    return {
      success: false,
      message: "My Project By Id Fetching Failed",
      StatusCode: HttpStatus.NOT_FOUND,
      error: error,
    };
  }
}

  async updateMyProject(id: number, updateMyprojectDto: UpdateMyprojectDto, companyId: number) {
  try {
    const updatedata = {
      description: updateMyprojectDto.description,
      name: updateMyprojectDto.name,
      userId: updateMyprojectDto.userId,
    };
    await this.prismaService.myProjects.update({
      where: {
        id: id,
      },
      data: updatedata,
    });

    const existingListsInPoject = await this.prismaService.myIntrestedProjectsList.groupBy({
      by: ['listId'],
      where: {
        projectId: id,
        isDelete: false
      }
    });

    await this.prismaService.myIntrestedProjectsList.deleteMany({
      where: {
        projectId: id,
      },
    });

    if (
      updateMyprojectDto.companies &&
      updateMyprojectDto.companies.length > 0
    ) {
      const slectedcompaniesdata: { projectId: number; listId: number }[] =
        [];
      updateMyprojectDto.companies.forEach((usercompanyId) => {
        const company = {
          projectId: id,
          listId: Number(usercompanyId),
        };
        slectedcompaniesdata.push(company);
      });
      await this.prismaService.myIntrestedProjectsList.createMany({
        data: slectedcompaniesdata,
      });
    }

    const newlyAddedLists = updateMyprojectDto.companies?.filter((item) => {
      return !existingListsInPoject.some(el => el.listId == +item)
    }).map(item => +item);

    if(newlyAddedLists && newlyAddedLists.length > 0) {
      const companiesInList = await this.prismaService.intrestedInMyLists.findMany({
        where: {
          listId: {
            in: newlyAddedLists
          }
        },
        select: {
          companyId: true
        }
      });
      // insert notification and send in app notification
      if(companiesInList && companiesInList?.length > 0) {
        const notificationArr: {notificationById: number, notificationToId: number, notificationDescription: string, type: number}[] = []
        companiesInList.forEach((item) => {
          const notification = {
            notificationById: companyId,
            notificationToId: item.companyId,
            notificationDescription: "You have been added to a project",
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
              descirption: "You have been added to a project",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return {
      success: true,
      message: "My Project Updated successfully",
      StatusCode: HttpStatus.CREATED,
    };
  } catch (error) {
    return {
      success: false,
      message: "My Project Updating Failed",
      StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: error,
    };
  }
}

async getSeachCompany(seachValue: string) {
  try {
    const users = await this.prismaService.companies.findMany({
      where: {
        isDelete: false,
        isArchieve: false,
        name: {
          contains: seachValue,
          mode: "insensitive",
        },
        user: {
          approvalStatus:'completed',
          userRoles: {
            some: {
              roleCode: $Enums.ROLE_CODE.service_provider,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    return {
      success: true,
      message: "Fetching successfully",
      data: users,
      StatusCode: HttpStatus.OK,
    };
  } catch (error) {
    return {
      success: false,
      message: "Fetching Failed",
      StatusCode: HttpStatus.NOT_FOUND,
      error: error,
    };
  }
}
async getSearchLists(seachValue: string, userId: number) {
  try {
    let users;
    if ( seachValue =="0") {
      users = await this.prismaService.myLists.findMany({
        where: {
          isDelete: false,
          isArchieve: false,
          userId: userId,
          // user: {
          //   approvalStatus:'completed',
          //   userRoles: {
          //     some: {
          //       roleCode: $Enums.ROLE_CODE.service_provider,
          //     },
          //   },
          // },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }
    else {
      users = await this.prismaService.myLists.findMany({
        where: {
          isDelete: false,
          isArchieve: false,
          userId: userId,
          name: {
            contains: seachValue,
            mode: "insensitive",
          },
          // user: {
          //   userRoles: {
          //     some: {
          //       roleCode: $Enums.ROLE_CODE.service_provider,
          //     },
          //   },
          // },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }
    return {
      success: true,
      message: "Fetching successfully",
      data: users,
      StatusCode: HttpStatus.OK,
    };
  } catch (error) {
    return {
      success: false,
      message: "Fetching Failed",
      StatusCode: HttpStatus.NOT_FOUND,
      error: error,
    };
  }
}

  async getProjectById(projectId: number) {
    return this.prismaService.myProjects.findUnique({
      where: {
        id: projectId
      }
    });
  }

  async createProjectsharingDetail(projectId: number, theToken: string) {
    return this.prismaService.projectSharingDetails.create({
      data: {
        projectId: projectId,
        theToken: theToken
      }
    });
  }

  getProjectIdByToken(token: string) {
    return this.prismaService.projectSharingDetails.findFirst({
      where: {
        theToken: token
      }
    });
  }

  checkTokenAndList(token: string, listId: number) {
    return this.prismaService.projectSharingDetails.findFirst({
      where: {
        theToken: token,
        myProjects: {
          MyIntrestedProjectsList: {
            some: {
              listId: listId
            }
          }
        }
      },
      include: {
        myProjects: {
          select: {
            id: true,
            isDelete: true
          }
        }
      }
    });
  }

  getListsInProject(projectId: number) {
    return this.prismaService.myProjects.findFirst({
      where: {
        id: projectId,
        isDelete: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        MyIntrestedProjectsList: {
          where: {
            list: {
              isDelete: false,
              isArchieve: false
            }
          },
          select: {
            list: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });
  }

}
