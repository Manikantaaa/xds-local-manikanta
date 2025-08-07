import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { $Enums, APPROVAL_STATUS, ASSET_TYPE, FollowDetails, FollowNotifications, Prisma } from "@prisma/client";
import { CertificateAndDiligence, CompanyAddresses, CompanyPlatforms, Contacts, GameEngines } from "./types";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { portfolioAlbumDto } from "./dtos/portfolio-album-dto";
import { generateSlug, toLocalISOString } from "src/common/methods/common-methods";
import admin from "firebase-admin";


type newPortfolioColumns = {
  id: number;
  albumId: number;
  fileUrl: string;
  thumbnail: string | null;
  type: string | null;
  fileName: string | null;
  fileIndex: string | null;
  isSelected: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  signedfileUrl?: string;
}

@Injectable()
export class CompaniesRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,
  ) { }

  async findFirst(
    conditions: Prisma.CompaniesWhereInput,
    includeParams?: Prisma.CompaniesInclude,
  ) {
    return await this.prismaService.companies.findFirst({
      where: {
        ...conditions,
      },
      include: {
        ...includeParams,
      },
    });
  }

  async justJoined(companyId: number, categoryType: number) {
    const getLoggedDate = await this.prismaService.companies.findFirst({
      where: {
        id: companyId,
        user: {
          isLoggedOnce: true,
        },
      },
      select: {
        user: {
          select: {
            firstLoggedDate: true,
          }
        }
      }
    });
    const currentDate = new Date();
    if (getLoggedDate && getLoggedDate?.user.firstLoggedDate) {
      const loggedDate = new Date(getLoggedDate?.user.firstLoggedDate);
      const checkLoggedDate = currentDate.getTime() - loggedDate.getTime();
      const diffDays = Math.floor(checkLoggedDate / (1000 * 60 * 60 * 24));
      if (diffDays <= 20 && categoryType == 1) {
        const checkCompanyId = await this.prismaService.newUpdatedUsers.findMany({
          where: {
            companyId: companyId,
            categoryType: 1,
          },
          select: {
            displayDate: true,
          }
        })
        const checkSundayDate = checkCompanyId.filter((display) => display.displayDate?.getDay() !== 0);
        const checkSatDate = checkSundayDate.filter((display) => display.displayDate?.getDay() !== 6);
        if (checkSatDate.length > 2) {
          return;
        }

        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let dateIs = await this.checkDisplayJionedUserdate(companyId, nextDay, 'just joined');

        while (!dateIs) {
          nextDay.setDate(nextDay.getDate() + 1);
          dateIs = await this.checkDisplayJionedUserdate(companyId, nextDay, 'just joined');
        }

        if (dateIs) {
          await this.prismaService.newUpdatedUsers.createMany({
            data: {
              companyId: companyId,
              userCategory: 'just joined',
              categoryType: categoryType,
              isActive: true,
              isDelete: false,
              updatedAt: new Date(),
              displayDate: toLocalISOString(nextDay.toDateString()),
            }
          })
        }
      } else if (diffDays > 20 && categoryType != 1) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const getDisplayOrder = await this.prismaService.newUpdatedUsers.aggregate({
          where: {
            companyId: companyId,
            categoryType: categoryType,
          },
          _max: {
            displayDate: true,
          },
        });
        let checkDays = 11;
        if (getDisplayOrder._max.displayDate) {
          const checkDisplayDate = new Date(getDisplayOrder._max.displayDate);
          const checkDate = new Date().getTime() - checkDisplayDate.getTime();
          checkDays = Math.floor(checkDate / (1000 * 60 * 60 * 24));
        }

        if (checkDays > 10) {
          let dateIs = await this.checkDisplayUpdatedUserdate(companyId, nextDay, 'fresh and updated');
          while (!dateIs) {
            nextDay.setDate(nextDay.getDate() + 1);
            dateIs = await this.checkDisplayUpdatedUserdate(companyId, nextDay, 'fresh and updated');
          }

          if (dateIs) {
            let workingDaysCount = 0;
            while (true) {
              const isWeekend = nextDay.getDay() === 0 || nextDay.getDay() === 6;

              // Stop if we've already stored 3 weekdays AND the next day is a weekend
              if (workingDaysCount >= 3 && isWeekend) {
                break;
              }

              await this.prismaService.newUpdatedUsers.create({
                data: {
                  companyId: companyId,
                  userCategory: 'fresh and updated',
                  categoryType: categoryType,
                  isActive: true,
                  isDelete: false,
                  updatedAt: new Date(),
                  displayDate: toLocalISOString(nextDay.toDateString()),
                }
              });

              if (!isWeekend) {
                workingDaysCount++;
                if (workingDaysCount === 3) {
                  break; // We've got our 3 weekdays, stop immediately
                }
              }

              nextDay.setDate(nextDay.getDate() + 1);
            }
          }
        }

      }
    } else if (categoryType !== 1) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const getDisplayOrder = await this.prismaService.newUpdatedUsers.aggregate({
        where: {
          companyId: companyId,
          categoryType: categoryType,
        },
        _max: {
          displayDate: true,
        },
      });
      let checkDays = 11;
      if (getDisplayOrder._max.displayDate) {
        const checkDisplayDate = new Date(getDisplayOrder._max.displayDate);
        const checkDate = new Date().getTime() - checkDisplayDate.getTime();
        checkDays = Math.floor(checkDate / (1000 * 60 * 60 * 24));
      }

      if (checkDays > 10) {
        let dateIs = await this.checkDisplayUpdatedUserdate(companyId, nextDay, 'fresh and updated');
        while (!dateIs) {
          nextDay.setDate(nextDay.getDate() + 1);
          dateIs = await this.checkDisplayUpdatedUserdate(companyId, nextDay, 'fresh and updated');
        }

        if (dateIs) {
          await this.prismaService.newUpdatedUsers.create({
            data: {
              companyId: companyId,
              userCategory: 'fresh and updated',
              categoryType: categoryType,
              isActive: true,
              isDelete: false,
              updatedAt: new Date(),
              displayDate: toLocalISOString(nextDay.toDateString()),
            }
          })
        }
      }
    }
  }

  async checkDisplayJionedUserdate(companyId: number, nextDay: Date, category: string) {
    // if (nextDay.getDay() == 6 || nextDay.getDay() == 0) {
    //   return false;
    // }
    const displayedDatecounts = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        userCategory: category,
        displayDate: nextDay,
      }
    })
    if (displayedDatecounts && displayedDatecounts.length > 1) {
      return false;
    }
    const displayedDateCheck = await this.prismaService.newUpdatedUsers.findMany({
      where: {
        companyId: companyId,
        userCategory: category,
        displayDate: nextDay,
      },
    });
    if (displayedDateCheck && displayedDateCheck.length > 0) {
      return false;
    } else {
      return true;
    }
  }

  async checkDisplayUpdatedUserdate(companyId: number, nextDay: Date, category: string) {
    const displayedDatecounts = await this.prismaService.newUpdatedUsers.groupBy({
      by: ["companyId", "categoryType"],
      where: {
        userCategory: category,
        displayDate: nextDay,
      },
    });

    if (displayedDatecounts && displayedDatecounts.length > 0) {

      // If only one categoryType per company and less than 2 records, return true
      const uniqueCompanyIds = [...new Set(displayedDatecounts.map(item => item.companyId))];
      const isCompanyId3Present = uniqueCompanyIds.includes(companyId);
      if (isCompanyId3Present) {
        return true;
      }
      if (uniqueCompanyIds.length < 3) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  async updateProfileStatus(companyId: number, status: boolean) {

    if (status === true) {
      const checkCompanyId = await this.prismaService.newUpdatedUsers.findMany({
        where: {
          companyId: companyId,
          categoryType: 1,
        }
      })
      if (checkCompanyId.length < 5) {
        for (let i = 0; i < 5; i++) {
          await this.justJoined(companyId, 1);
        }
        // const response = await this.justJoined(companyId, 1);
      }
    }

    return await this.prismaService.companies.update({
      where: {
        id: companyId,
      },
      data: {
        profileCompleted: status,
      }
    })
  }

  update(
    id: number,
    updatedData:
      | Prisma.CompaniesUpdateInput
      | Prisma.CompaniesUncheckedUpdateInput,
  ) {
    return this.prismaService.companies.update({
      where: {
        id,
      },
      data: {
        ...updatedData,
      },
    });
  }

  async findAll(companies: { CompanyName: string }[]) {

    const matchedData = await this.prismaService.companies.findMany({
      where: {
        isArchieve: false,
        isDelete: false,
        name: {
          in: companies.map(company => company.CompanyName),
        }
      },
      select: {
        id: true,
        name: true,
      }
    });
    return matchedData;
  }

  findCompaniesByEmail(email: string) {
    return this.prismaService.users.findMany({
        where: {
          email: email,
          userType: {
            in: ["free", "trial", "init"],
          },
          userRoles: {
            some: {
              roleCode: $Enums.ROLE_CODE.buyer,
            },
          },
          isArchieve: false,
          isDelete: false,
        },
        select:{
          id: true,
        }
    });
  }

  findUsers(searchVal: string = "") {
    let whereClause: any = {
      isDelete: false,
      user: {
        approvalStatus: APPROVAL_STATUS.completed
      },
      OR: [
        {
          name: {
            mode: "insensitive",
            contains: searchVal,
          },
        },
        {
          user: {
            firstName: {
              mode: "insensitive",
              contains: searchVal,
            },
          },
        },
        {
          user: {
            lastName: {
              mode: "insensitive",
              contains: searchVal,
            },
          },
        },
        {
          user: {
            email: {
              mode: "insensitive",
              contains: searchVal,
            },
          },
        },
      ],
    };

    if (searchVal.includes(" ")) {
      const fullName = searchVal.split(" ");
      const firstName = fullName[0];
      const lastName = fullName[1];
      whereClause.OR.push({
        AND: [
          {
            user: {
              firstName: {
                mode: "insensitive",
                contains: firstName,
              }
            }
          },
          {
            user: {
              lastName: {
                mode: "insensitive",
                contains: lastName,
              }
            }
          }
        ]
      })
    }

    return this.prismaService.companies.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findById(id: number) {
    const companydata = await this.prismaService.companies.findUnique({
      where: {
        id: id,
        isFlagged: false
      },
      include: {
        user: {
          include: {
            userRoles: true,
          },
        },
      },
    });
    if (companydata) {
      if (await companydata.profilePdfPath && companydata.profilePdfPath != null) {
        const signedUrl = await this.gcsService.getSignedUrl(
          companydata.profilePdfPath,
        );
        companydata.profilePdfPath = signedUrl;
      }
    }
    return companydata;
  }

  async findSingleCompanyById(id: number) {
    const companydata = await this.prismaService.companies.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
        website: true,
        createdAt: true,
        userId: true,
        id: true,
        isArchieve: true,
        isFoundingSponcer: true,
        user: {
          select: {
            email: true,
            userRoles: {
              select: {
                roleCode: true,
              }
            },
          },
        },
      },
    });
    return companydata;
  }

  async getCompanyAboutById(id: number) {
    const companydata = await this.prismaService.companies.findUnique({
      where: {
        id: id,
      },
      select: {
        about: true,
        profilePdfPath: true,
        profilePdfName: true
      }
    });
    if (companydata) {
      if (await companydata.profilePdfPath && companydata.profilePdfPath != null) {
        const signedUrl = await this.gcsService.getSignedUrl(
          companydata.profilePdfPath,
        );
        companydata.profilePdfPath = signedUrl;
      }
    }
    return companydata;
  }

  async findCompanyProfileStatus(id: number) {
    const companydata = await this.prismaService.companies.findUnique({
      where: {
        id: id,
      },
      select: {
        generalInfoProfilePerc: true,
        aboutProfilePerc: true,
        ourWorkAlbumsProfilePerc: true,
        ourWorkProjectProfilePerc: true,
        servicesProfilePerc: true,
        certificationsProfilePerc: true,
        contactsProfilePerc: true,
        profileCompleted: true,
        bannerAssetId: true,
        CertificationAndDiligence: {
          select: {
            certifications: true,
            tools: true,
            Security: true,
          }
        },
        CompanyContacts: {
          select: {
            profilePic: true,
          }
        }
      },
    });
    return companydata;
  }

  deleteById(id: number) {
    return this.prismaService.companies.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });
  }

  getTopViewedProfiles() {
    return this.prismaService.companyCounts.findMany({
      take: 20,
      where: {
        pageViewedCount: {
          not: 0,
        },
      },
      select: {
        id: true,
        pageViewedCount: true,
        companyId: true,
        status: true,
        company: {
          select: {
            name: true,
            website: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                userRoles: {
                  select: {
                    id: true,
                    roleCode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          pageViewedCount: "desc",
        },
        {
          updatedAt: "asc",
        },
      ],
    });
  }

  getMostActiveBuyers() {
    return this.prismaService.companyCounts.findMany({
      where: {
        company: {
          user: {
            userRoles: {
              some: {
                roleCode: $Enums.ROLE_CODE.buyer,
              },
            },
          },
        },
        pageVisitedCount: {
          gte: 5,
        },
      },
      select: {
        id: true,
        pageVisitedCount: true,
        companyId: true,
        status: true,
        company: {
          select: {
            name: true,
            website: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                // userRoles: {
                //   select: {
                //     id: true,
                //     roleCode: true
                //   }
                // }
              },
            },
          },
        },
      },
      orderBy: [
        {
          pageVisitedCount: "desc",
        },
        {
          updatedAt: "asc",
        },
      ],
    });
  }

  getTopViewedSponsersProfiles() {
    return this.prismaService.companyCounts.findMany({
      take: 6,
      where: {
        company: {
          isFoundingSponcer: true,
          user: {
            userRoles: {
              some: {
                roleCode: $Enums.ROLE_CODE.service_provider,
              },
            },
          },
        },
      },
      select: {
        id: true,
        pageViewedCount: true,
        companyId: true,
        status: true,
        company: {
          select: {
            name: true,
            website: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                userRoles: {
                  select: {
                    id: true,
                    roleCode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          pageViewedCount: "desc",
        },
        {
          updatedAt: "asc",
        },
      ],
    });
  }

  findAllUsersByMail(emails: string[]) {
    return this.prismaService.users.findMany({
      where: {
        email: {
          in: emails,
        },
      },
    });
  }

  findCompaniesBySearch(searchString: string) {
    return this.prismaService.companies.findMany({
      where: {
        isDelete: false,
        // name: {
        //   mode: "insensitive",
        //   contains: searchString,
        // },
        user: {
          approvalStatus: APPROVAL_STATUS.completed,
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        isArchieve: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            accessExpirationDate: true,
            userType: true,
            trialDuration: true,
            userRoles: {
              select: {
                roleCode: true,
              },
            },
          },
        },
      },
    });
  }

  getCountOfFoundingSponcers() {
    return this.prismaService.companies.count({
      where: {
        isFoundingSponcer: true,
      },
    });
  }

  addCompanyFileUrls(
    dataToSave: {
      companyId: number;
      type: ASSET_TYPE;
      fileUrl: string;
      idSelect: boolean;
    }[],
  ) {
    return this.prismaService.fileUploads.createMany({
      data: dataToSave,
    });
  }

  addSponcersFileUrls(
    dataToSave: {
      fileUrl: string;
      fileName: string;
      fileIndex: string;
      isSelected: boolean;
      fileType: $Enums.PartnerFilesTypes,
      companyWebsiteUrl?: string,
    }[],
  ) {
    return this.prismaService.sponsoredPartners.createMany({
      data: dataToSave,
    });
  }

  addPortfolioProjectFileUrls(
    dataToSave: {
      portfolioProjectId: number;
      type: ASSET_TYPE;
      fileUrl: string;
      thumbnail: string,
    }[],
  ) {
    return this.prismaService.fileUploads.createMany({
      data: dataToSave,
    });
  }

  addPlatformsOptedForProject(
    dataToSave: { platformId: number; portfolioProjectId: number }[],
  ) {
    return this.prismaService.platformsOpt.createMany({
      data: dataToSave,
    });
  }

  deletePreviousFiles(id: number, type: number) {
    let condition: Prisma.FileUploadsWhereInput = {};
    if (type == 1) {
      condition = { companyId: id };
    } else if (type == 2) {
      condition = { portfolioProjectId: id };
    } else if (type == 3) {
      condition = { opportunityId: id };
    }
    return this.prismaService.fileUploads.deleteMany({
      where: condition,
    });
  }

  deleteSlogoFiles(type: $Enums.PartnerFilesTypes) {
    return this.prismaService.sponsoredPartners.deleteMany({
      where: {
        fileType: type,
      }
      // where: {
      //   id: id,
      // }
    });
  }

  deletePortfolioProjectById(id: number) {
    return this.prismaService.portfolioProjects.deleteMany({
      where: {
        companyId: id,
      },
    });
  }

  deleteSingleProjectById(id: number) {
    return this.prismaService.portfolioProjects.deleteMany({
      where: {
        id: id,
      },
    });
  }

  deletePlatformsOpted(id: number) {
    return this.prismaService.platformsOpt.deleteMany({
      where: {
        portfolioProjectId: id,
      },
    });
  }

  async deleteCompanyLocations(id: number) {
    const locationsCount = await this.prismaService.companyAddress.findMany({
      where: {
        company_id: id,
      }
    })
    await this.prismaService.companyAddress.deleteMany({
      where: {
        company_id: id,
      },
    });
    await this.prismaService.companyGameEngines.deleteMany({
      where: {
        companyId: id,
      }
    })

    return locationsCount;
  }

  async addProject(dataToSave: {
    companyId: number;
    name: string;
    completionDate: Date;
    description: string;
    testimonial_name?: string;
    testimonial_company?: string;
    testimonial_title?: string;
    testimonial_feedback?: string;
  }) {
    const projects = await this.prismaService.portfolioProjects.findMany({
      where: {
        companyId: dataToSave.companyId,
      }
    });

    let lastreorderId = 0;
    if (projects && projects.length > 0) {
      const lastId = projects.length - 1;
      lastreorderId = projects[lastId].reOrderingId;
    }
    const data = await this.prismaService.portfolioProjects.create({
      data: {
        companyId: dataToSave.companyId,
        name: dataToSave.name,
        completionDate: dataToSave.completionDate,
        description: dataToSave.description,
        reOrderingId: lastreorderId + 1,
        testimonial_name: dataToSave.testimonial_name,
        testimonial_company: dataToSave.testimonial_company,
        testimonial_title: dataToSave.testimonial_title,
        testimonial_feedback: dataToSave.testimonial_feedback,
      },
    });
    if (data) {
      await this.justJoined(dataToSave.companyId, 3);
      await this.prismaService.companies.update({
        where: {
          id: dataToSave.companyId,
        },
        data: {
          ourWorkAlbumsProfilePerc: 8,
          ourWorkProjectProfilePerc: 8,
        }
      });
    }
    return data;
  }

  updateProject(dataToSave: {
    companyId: number;
    name: string;
    id: number;
    completionDate: Date;
    description: string;
    testimonial_name?: string;
    testimonial_company?: string;
    testimonial_title?: string;
    testimonial_feedback?: string;
  }) {
    const response = this.prismaService.portfolioProjects.update({
      where: {
        id: dataToSave.id,
        companyId: dataToSave.companyId,
      },
      data: {
        companyId: dataToSave.companyId,
        name: dataToSave.name,
        completionDate: dataToSave.completionDate, // here need clearification for date save
        description: dataToSave.description,
        testimonial_name: dataToSave.testimonial_name,
        testimonial_company: dataToSave.testimonial_company,
        testimonial_title: dataToSave.testimonial_title,
        testimonial_feedback: dataToSave.testimonial_feedback,
      },
    });

    this.justJoined(dataToSave.companyId, 3);

    return response;
  }

  addCompanyLocations(locations: CompanyAddresses[]) {
    return this.prismaService.companyAddress.createMany({
      data: locations,
    });
  }

  addCertificateAndDiligence(certificateInfo: CertificateAndDiligence) {
    return this.prismaService.certificationAndDiligence.create({
      data: certificateInfo,
    });
  }

  async addCompanyPlatforms(companyPlatforms: CompanyPlatforms[], companyId: number) {
    // try {
    await this.prismaService.companyPlatformExperience.deleteMany({
      where: {
        companyId: companyId,
      }
    })
    return this.prismaService.companyPlatformExperience.createMany({
      data: companyPlatforms,
    })
    // } catch(err) {

    // }
  }

  updateSaveStatus(companyId: number) {
    return this.prismaService.companies.update({
      where: {
        id: companyId,
      },
      data: { servicesProfilePerc: 16 },
    });
  }

  async addCapabilities(capabilities: { companyId: number; capabilityId: number, serviceId: number }[]) {
    return await this.prismaService.servicesOpt.createMany({
      data: capabilities,
    });
  }

  addServices(services: { companyId: number; serviceId: number }[]) {
    return this.prismaService.servicesOpt.createMany({
      data: services,
    });
  }

  async addContacts(contacts: Contacts[]) {
    const data = await this.prismaService.companyContacts.createMany({
      data: contacts,
    });
    if (data) {
      // if ((contacts[0] && contacts[0].profilePic == "") || (contacts[1] && contacts[1].profilePic == "") || (contacts[2] && contacts[2].profilePic == "")) {
      //   await this.updateProfileStatus(contacts[0].companyId, false);
      // }
      await this.prismaService.companies.update({
        where: {
          id: contacts[0].companyId,
        },
        data: {
          contactsProfilePerc: 16,
        }
      })
    }
    return data;
  }

  updateCertificateAndDiligence(
    certificateInfo: CertificateAndDiligence,
    id: number,
  ) {
    return this.prismaService.certificationAndDiligence.update({
      where: {
        id: id,
      },
      data: certificateInfo,
    });
  }

  getAllPortfolioProjectsIdByCompanyId(id: number) {
    return this.prismaService.portfolioProjects.findMany({
      where: {
        companyId: id,
      },
      select: {
        id: true,
      },
    });
  }

  deleteCapabilitiesByCompanyId(id: number) {
    return this.prismaService.servicesOpt.deleteMany({
      where: {
        companyId: id,
      },
    });
  }

  async deleteContactsByCompanyId(id: number) {
    const response = await this.getAllContacts(id);
    for (const contacts of response) {
      if (contacts.profilePic != '') {
        await this.prismaService.temporaryUploadedFiles.create({
          data: {
            fileName: contacts.profilePic,
            formUniqueId: "Contactprofileimages",
          }
        });
      }
    }
    return await this.prismaService.companyContacts.deleteMany({
      where: {
        companyId: id,
      },
    });
  }
  async getServiceByCapability(id: number) {
    const Data = await this.prismaService.capabilities.findFirst({
      where: {
        id: id,
      },
      select: {
        serviceId: true,
      }
    });

    return Data?.serviceId
  }
  getAllContacts(id: number) {
    return this.prismaService.companyContacts.findMany({
      where: {
        companyId: id,
      },
    });
  }

  getDiligenceAndSecurity(id: number) {
    const res = this.prismaService.certificationAndDiligence.findFirst({
      where: {
        companyId: id,
      },
      include: {
        company: {
          select: {
            CompanyAddress: {
              include: {
                Country: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            CompanyPlatformExperience: {
              select: {
                platformId: true,
              }
            },
            CompanyGameEngines: {
              select: {
                gameEngineName: true,
                isChecked: true,
              },
              orderBy: {
                id: 'asc',
              }
            }
          },
        },
      },
    });
    return res;
  }

  async getServiceAndCapabilities() {
    try {
      let services = await this.prismaService.services.findMany({
        include: {
          capabilities: {
            select: {
              id: true,
              capabilityName: true,
            },
          },
          serviceCategories: {
            select: {
              name: true,
            }
          }
        },
      });
      if (services) {
        services.sort((a, b) => {
          // Compare groupId first
          if (a.groupId !== b.groupId) {
            return a.groupId - b.groupId;
          }
          // If groupId is the same, compare serviceName
          return a.serviceName.localeCompare(b.serviceName);
        });
      }
      return services;
    }
    catch (error) {
      return error;
    }
  }

  async getPortfolioProjectDetails(id: number) {
    const response = await this.prismaService.portfolioProjects.findMany({
      where: {
        companyId: id,
      },
      include: {
        PlatformsOpt: {
          select: {
            platforms: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        FileUploads: true,
      },
      orderBy: {
        reOrderingId: "asc",
      },
    });

    const data = await this.prismaService.portfolioAlbum.findMany({
      where: {
        companyId: Number(id)
      },
    });

    if (response) {
      for (const project of response) {
        if (project.FileUploads) {
          for (const fileUpload of project.FileUploads) {
            if (fileUpload.thumbnail) {
              const signedUrl = await this.gcsService.getSignedUrl(
                fileUpload.thumbnail,
              );
              fileUpload.thumbnail = signedUrl;
            } else {
              const signedUrl = await this.gcsService.getSignedUrl(
                fileUpload.fileUrl,
              );
              fileUpload.fileUrl = signedUrl;
            }
          }
        }
      }
    }

    return { response: response, data: data.length };
  }

  async getSinglePortfolioProjectDetails(id: number, companyId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkUserAccess = await this.checkUserPortfolioAccess(id, companyId)
    if (checkUserAccess.length <= 0 || !checkUserAccess) {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    const response: any = await this.prismaService.portfolioProjects.findMany({
      where: {
        id: id,
        companyId: companyId,
      },
      include: {
        PlatformsOpt: {
          select: {
            platforms: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        FileUploads: true,
      },
    });

    if (response) {
      for (const project of response) {
        if (project.FileUploads) {
          for (const fileUpload of project.FileUploads) {
            const fileName = fileUpload.fileUrl;
            if (fileUpload.type === "image") {
              const signedUrl = await this.gcsService.getSignedUrl(
                fileUpload.fileUrl,
              );
              fileUpload.fileUrl = signedUrl;
              fileUpload.fileName = fileName;
            } else {
              if (fileUpload.thumbnail && !fileUpload.thumbnail.startsWith('https')) {
                const VideosignedUrl = await this.gcsService.getSignedUrl(
                  fileUpload.thumbnail,
                );
                fileUpload.fileUrl = VideosignedUrl;
              } else {
                fileUpload.fileUrl = fileUpload.thumbnail;
              }
            }

            fileUpload.fileName = fileName;
          }
        }
      }
    }

    return response;
  }

  getCapabilities(id: number) {
    return this.prismaService.servicesOpt.findMany({
      where: {
        companyId: id,
        capabilityId:{
          not: null,
        }
      },
      select: {
        capabilityId: true,
      },
    });
  }
  async getOpportunityCapabilities(id: number, companyId: number) {
    const capabilities = await this.prismaService.servicesOpt.findMany({
      where: {
        opportunityId: id,
        // companyId: companyId,
        NOT: {
          capabilityId: null,
        },
      },
      select: {
        capabilityId: true,
      },
    });
    const services = await this.prismaService.servicesOpt.findMany({
      where: {
        opportunityId: id,
        capabilityId: null,
      },
      select: {
        serviceId: true,
      },
    });

    return {
      capabilities,
      services,
    };
  }

  getServices(id: number) {
    return this.prismaService.servicesOpt.findMany({
      where: {
        companyId: id,
      },
      select: {
        serviceId: true,
      },
    });
  }

  getCompanyPortfolio(id: number) {
    return this.prismaService.fileUploads.findMany({
      where: {
        companyId: id,
        isDelete: false,
      },
      select: {
        id: true,
        fileUrl: true,
        type: true,
        idSelect: true,
      },
    });
  }

  removeProfileFile(fileName: string) {
    this.prismaService.fileUploads.deleteMany({
      where: {
        fileUrl: fileName,
      },
    });

    this.prismaService.assets.deleteMany({
      where: {
        url: fileName,
      },
    });

    return;
  }

  async addvisitingCount(loggedId: number) {
    return await this.prismaService.companyCounts.create({
      data: {
        companyId: loggedId,
        pageVisitedCount: 1,
      },
    });
  }

  async updateVisitedCount(loggedId: number, visitedCount: number) {
    return await this.prismaService.companyCounts.update({
      where: {
        companyId: loggedId,
      },
      data: {
        pageVisitedCount: visitedCount + 1,
      },
    });
  }

  async addViewedCount(viewedId: number) {
    return await this.prismaService.companyCounts.create({
      data: {
        companyId: viewedId,
        pageViewedCount: 1,
      },
    });
  }

  async updateViewedCount(viewedId: number, viewedCount: number) {
    return await this.prismaService.companyCounts.update({
      where: {
        companyId: viewedId,
      },
      data: {
        pageViewedCount: viewedCount + 1,
      },
    });
  }

  async checkUserExistOrNot(companyId: number) {
    return this.prismaService.companyCounts.findUnique({
      where: {
        companyId: companyId,
      },
    });
  }

  async recentViewedProfiles(loggedId: number, companyId: number) {
    return await this.prismaService.recentlyViewedProfiles.create({
      data: {
        visitorCompanyId: loggedId,
        companyId: companyId,
      },
    });
  }

  async addFlaggedUsersDetails(data: { loggedCompanyId: number, reportedCompanyId: number, description: string }) {
    const checkFlag = await this.prismaService.flaggedUsers.findFirst({
      where:{
        companyId: data.loggedCompanyId,
        reportedCompanyId: data.reportedCompanyId
      },
    })
    if(checkFlag){
      return "You have already reported earlier.";
    }
    return this.prismaService.flaggedUsers.create({

      data: {
        companyId: data.loggedCompanyId,
        reportedCompanyId: data.reportedCompanyId,
        details: data.description
      }
    });
  }

  async addCountryToCompanyTable(CompanyId: number, countryIds: string) {


    const countryIdArray: number[] = countryIds.split(',').map(Number);
    const getCountryNames = await this.prismaService.country.findMany({
      where: {
        id: {
          in: countryIdArray,
        },
      },
      select: {
        name: true,
      }
    });
    const countryNames = getCountryNames.map(country => country.name).join(',');
    return await this.prismaService.companies.update({
      where: {
        id: CompanyId,
      },
      data: {
        countryNames: countryNames,
        certificationsProfilePerc: 16,
      }
    });
  }

  async getsponcersLogos(type: $Enums.PartnerFilesTypes) {
    return await this.prismaService.sponsoredPartners.findMany(
      {
        where: {
          fileType: type,
        },
        select: {
          fileUrl: true,
          fileName: true,
          fileIndex: true,
          isSelected: true,
          companyWebsiteUrl: true,
        }
      });
  }

  async updateTourStatus(companyId: number) {
    try {
      await this.prismaService.companies.update({
        where: {
          id: companyId,
        },
        data: {
          isTourCompleted: true,
        }
      });
      return {
        success: true,
        message: "Tour Updated",
        StatusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: "Tour Update Failed",
        StatusCode: HttpStatus.NOT_FOUND,
        error: error,
      };
    }
  }

  async deleteTempFiles(fileUrls: string[] | string, formId: string, delType: 'AddDeletedFiles' | 'DeleteSavedFiles' | undefined = 'DeleteSavedFiles') {
    // const fileNames = fileUrls.map(file => file.name);
    if (typeof fileUrls === 'string') {
      fileUrls = [fileUrls]
    }
    if (delType == 'DeleteSavedFiles') {
      return await this.prismaService.temporaryUploadedFiles.deleteMany({
        where: {
          formUniqueId: formId,
          fileName: {
            in: fileUrls,
          }
        }
      });
    } else if (delType == 'AddDeletedFiles') {
      const newfiles: { fileName: string, formUniqueId: string }[] = [];
      fileUrls.forEach((fileUrl) => {
        const singleFile = { fileName: fileUrl, formUniqueId: formId };
        newfiles.push(singleFile);
      });
      return await this.prismaService.temporaryUploadedFiles.createMany({
        data: newfiles
      });
    }

  }

  async getTempFiles() {
    const data = await this.prismaService.temporaryUploadedFiles.findMany({
      where: {
        isUploaded: false,
      }
    });
    return data;
  }

  async createNewPortfolioAlbum(postData: portfolioAlbumDto) {
    try {
      if (!postData.companyId) {
        postData.companyId = 1;
      }
      let albumId = '0';
      if (postData.albumId && postData.albumId != '0') {

        albumId = postData.albumId;

        const albumsCount = await this.prismaService.portfolioAlbumFiles.findMany({
          where: {
            albumId: +albumId,
          }
        });

        const sortedAlbumFilesNames = albumsCount.map(item => item.fileUrl).sort((a, b) => a.localeCompare(b));
        const sortedPostAlbumFilesNames = postData.albumFiles.map((item: any) => item.signedUrl).sort((a, b) => a.localeCompare(b));
        if (sortedPostAlbumFilesNames.length > sortedAlbumFilesNames.length) {
          await this.checkNotificationAndSend(postData.companyId, "Albums");
        } else {
          if (sortedPostAlbumFilesNames.length == sortedAlbumFilesNames.length) {
            for (let i = 0; i < sortedPostAlbumFilesNames.length; i++) {
              if (sortedAlbumFilesNames[i] != sortedPostAlbumFilesNames[i]) {
                await this.checkNotificationAndSend(postData.companyId, "Albums");
                break;
              }
            }
          }
        }

        if (albumsCount.length < postData.albumFiles.length) {
          await this.justJoined(postData.companyId, 2);
        }

        await this.prismaService.portfolioAlbum.update({
          where: {
            id: Number(albumId),
            companyId: postData.companyId,
          },
          data: {
            albumName: postData.albumName,
          }
        });

        await this.prismaService.portfolioAlbumFiles.deleteMany({
          where: {
            albumId: Number(albumId)
          }
        });
        if (postData.albumFiles) {
          postData.albumFiles.forEach((files) => {
            !files.signedUrl.startsWith('https') && this.deleteTempFiles(files.signedUrl, postData.formid, "DeleteSavedFiles");
          })
        }

        this.deleteTempFiles(postData.deletedFilePaths, postData.formid, "AddDeletedFiles");

      } else {
        this.deleteTempFiles(postData.deletedFilePaths, postData.formid, "DeleteSavedFiles");

        if (postData.albumFiles) {
          postData.albumFiles.forEach((files) => {
            !files.signedUrl.startsWith('https') && this.deleteTempFiles(files.signedUrl, postData.formid, "DeleteSavedFiles");
          })
        }
        await this.justJoined(postData.companyId, 2);
        const getDisplayOrder = await this.prismaService.portfolioAlbum.aggregate({
          _max: {
            reOrderingId: true,
          },
        });
        const currentDisplayOrder = getDisplayOrder._max.reOrderingId ? getDisplayOrder._max.reOrderingId : 0;
        const addedalbumId = await this.prismaService.portfolioAlbum.create({
          data: { "albumName": postData.albumName, "companyId": postData.companyId, "reOrderingId": currentDisplayOrder + 1 }
        });
        albumId = addedalbumId.id.toString();
        if (albumId) {
          await this.checkNotificationAndSend(postData.companyId, "Albums");
        }
      }
      const albums: {
        thumbnail: string,
        albumId: number,
        fileUrl: string,
        fileName: string;
        isSelected: boolean;
        type: string;
      }[] = [];

      postData.albumFiles.map((albumfile) => {
        const type = (albumfile.filename) ? 'image' : 'video'
        const newfile = {
          albumId: Number(albumId),
          fileUrl: albumfile.signedUrl,
          fileName: albumfile.filename,
          isSelected: albumfile.selectedFile,
          type: type,
          thumbnail: albumfile.thumnnail,
        }
        albums.push(newfile);
      });
      if (albums.length > 0) {
        await this.prismaService.portfolioAlbumFiles.createMany({
          data: albums
        });
        await this.prismaService.companies.update({
          where: {
            id: postData.companyId,
          },
          data: {
            ourWorkAlbumsProfilePerc: 8,
            ourWorkProjectProfilePerc: 8,
          }
        })
      }
      return {
        success: true,
        message: "Album created",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Album Insert Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }
  }

  async getPortfolioAlbumDetails(companyId: number) {

    try {
      const data = await this.prismaService.portfolioAlbum.findMany({
        where: {
          companyId: Number(companyId)
        },
        include: {
          portfolioAlbumFiles: {
            // take: 10,
            where: {
              status: 1
            },
          },

        },
        orderBy: {
          reOrderingId: "asc",
        }

      });

      const response = await this.prismaService.portfolioProjects.findMany({
        where: {
          companyId: Number(companyId),
        },
      });

      if (data) {
        for (const album of data) {
          if (album.portfolioAlbumFiles) {
            for (const fileUpload of album.portfolioAlbumFiles) {
              if (fileUpload.thumbnail) {
                let fileName = fileUpload.thumbnail;
                if (fileUpload.thumbnail.startsWith("https")) {
                  const queryString = decodeURIComponent(fileUpload.thumbnail.split("?")[1]);
                  const queryParams = new URLSearchParams(queryString);
                  const expirationTime = queryParams.get("X-Goog-Expires");

                  // if (expirationTime && parseInt(expirationTime)/(60*60*24) <= 0) {
                  const urlObj = new URL(fileUpload.thumbnail);
                  const pathname = decodeURIComponent(urlObj.pathname);
                  // Extract file name from the pathname
                  fileName = pathname.split('/').slice(2).join('/');
                }

                const signedUrl = await this.gcsService.getPublicSignedUrl(
                  fileName,
                );
                fileUpload.thumbnail = signedUrl;
                // }else{
                //   fileUpload.fileUrl =  fileUpload.thumbnail;
                // }

              } else if (fileUpload.fileUrl.startsWith('https') && fileUpload.type === "video" && fileUpload.thumbnail) {
                fileUpload.fileUrl = fileUpload.thumbnail;
              }
            }
          }
        }
      }

      return {
        success: true,
        data,
        responseLength: response.length,
        message: "Album Fecting success",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Album Fetching Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }

  }

  async updatePortfolioAlbumsDetails(companyId: number, postData: { id: number, reOrderingId: number }) {
    try {
      const res = await this.prismaService.portfolioAlbum.update({
        where: {
          id: postData.id,
          companyId: companyId,
        },
        data: {
          reOrderingId: +postData.reOrderingId,
        },
      });
      return {
        data: res,
        success: true,
        message: "successfully updated",
      }
    } catch (err) {
      throw new HttpException(err.message, err.status, { cause: new Error(err) });
    }
  }

  async updatePortfolioProjectsDetails(companyId: number, postData: { id: number, reOrderingId: number }) {
    try {
      const res = await this.prismaService.portfolioProjects.update({
        where: {
          id: postData.id,
          companyId: companyId,
        },
        data: {
          reOrderingId: +postData.reOrderingId,
        },
      });
      return {
        data: res,
        success: true,
        message: "successfully updated",
      }
    } catch (err) {
      throw new HttpException(err.message, err.status, { cause: new Error(err) });
    }
  }

  async getPortfolioAlbumDetailsByAlbumId(albumId: number, companyId: number) {

    try {

      const checkUserAccess = await this.prismaService.portfolioAlbum.findMany({
        where: {
          companyId: Number(companyId),
          id: Number(albumId)
        },
        select: {
          id: true,
        }
      });
      if (checkUserAccess.length <= 0 || !checkUserAccess) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const data = await this.prismaService.portfolioAlbum.findMany({
        where: {
          companyId: Number(companyId),
          id: Number(albumId)
        },
        include: {
          portfolioAlbumFiles: {
            where: {
              status: 1
            },
          },

        },

      });
      for (const album of data) {
        if (album.portfolioAlbumFiles) {
          for (const fileUpload of album.portfolioAlbumFiles) {
            if (fileUpload.thumbnail) {
              let fileName = fileUpload.thumbnail;
              if (fileUpload.thumbnail.startsWith("https")) {
                const queryString = decodeURIComponent(fileUpload.thumbnail.split("?")[1]);
                const queryParams = new URLSearchParams(queryString);
                const urlObj = new URL(fileUpload.thumbnail);
                const pathname = decodeURIComponent(urlObj.pathname);
                // Extract file name from the pathname
                fileName = pathname.split('/').slice(2).join('/');
              }

              const signedUrl = await this.gcsService.getSignedUrl(
                fileName,
              );
              (fileUpload as newPortfolioColumns).signedfileUrl = signedUrl;
            }
          }
        }
      }

      return {
        success: true,
        data,
        message: "Album Fecting success",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Album Fetching Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }

  }

  async updateIsSavedOurworkFlag(companyId: number) {

    const getPortfolioAlbums = await this.prismaService.portfolioAlbum.findMany({
      where: {
        companyId: Number(companyId),
      }
    });

    const getPortfolioProjects = await this.prismaService.portfolioProjects.findMany({
      where: {
        companyId: Number(companyId),
      }
    });

    if (getPortfolioAlbums.length === 0 && getPortfolioProjects.length === 0) {
      await this.prismaService.companies.update({
        where: {
          id: companyId,
        },
        data: {
          ourWorkAlbumsProfilePerc: 0,
          ourWorkProjectProfilePerc: 0,
          profileCompleted: false,
        }
      })
    }
    // if (getPortfolioProjects.length === 0) {
    //   await this.prismaService.companies.update({
    //     where: {
    //       id: companyId,
    //     },
    //     data: {
    //       ourWorkProjectProfilePerc: 0,
    //       profileCompleted: false,
    //     }
    //   })
    // }
  }

  async deleteAlbumByRepo(albumId: number, companyId: number) {
    try {

      const checkUserAccess = await this.prismaService.portfolioAlbum.findFirst({
        where: {
          id: Number(albumId),
          companyId: Number(companyId),
        }
      });

      if (!checkUserAccess) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
        // return {
        //   success: false,
        //   message: "Access Denied",
        //   StatusCode: HttpStatus.NOT_ACCEPTABLE,
        // }
      }

      await this.prismaService.portfolioAlbumFiles.deleteMany(
        {
          where: {
            albumId: Number(albumId),
          }
        }
      );

      await this.prismaService.portfolioAlbum.delete(
        {
          where: {
            id: Number(albumId),
            companyId: Number(companyId),
          }
        }
      )

      await this.updateIsSavedOurworkFlag(Number(companyId));

      return {
        success: true,
        message: "Album Deleting success",
        StatusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      return {
        success: false,
        message: "Album Fetching Failed",
        StatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      };
    }
  }

  async getuserscount() {
    let userTypeArr = [];
    const getFreusers = await this.prismaService.users.count({
      where: {
        isDelete: false,
        approvalStatus: 'completed',
        userType: 'free',
        isPaidUser: false,
        isArchieve: false,
      },
    })
    const getOneYeartrialUsers = await this.prismaService.users.count({
      where: {
        isPaidUser: true,
        userType: 'trial',
        trialDuration: 'yearly',
        approvalStatus: 'completed',
        isDelete: false,
        isArchieve: false,
      },
    })
    const getMonthlyTrialUsers = await this.prismaService.users.count({
      where: {
        isPaidUser: true,
        userType: 'trial',
        trialDuration: 'monthly',
        approvalStatus: 'completed',
        isDelete: false,
        isArchieve: false,
      },
    })
    const getPaidUsers = await this.prismaService.billingDetails.count({
      where: {
        isActive: true,
        user: {
          isDelete: false,
          isArchieve: false,
        }
      },
    })
    const getPaidYearlyUsers = await this.prismaService.billingDetails.count({
      where: {
        isActive: true,
        subscriptionType: 'year',
        user: {
          isDelete: false,
          isArchieve: false,
        }
      },
    })
    const getPaidMonthlyUsers = await this.prismaService.billingDetails.count({
      where: {
        isActive: true,
        subscriptionType: 'month',
        user: {
          isDelete: false,
          isArchieve: false,
        }
      },
    })
    userTypeArr = [{ 'freeUsers': getFreusers, 'oneYearUsers': getOneYeartrialUsers, 'monthlyUsers': getMonthlyTrialUsers, 'paidusers': getPaidUsers, 'paidyearlyusers': getPaidYearlyUsers, 'paidmonthlyusers': getPaidMonthlyUsers }];
    return {
      data: userTypeArr,
    }
  }

  async getLineChartUsers(pastDate: Date, currentDate: Date) {
    let userTypeArr = [];
    const allUsers = await this.prismaService.users.findMany({
      where: {
        approvalStatus: 'completed',
        isArchieve: false,
        isDelete: false,
        adminApprovedAt: {
          gte: pastDate,
          lte: currentDate,
        },
      },
      select: {
        id: true,
        trialDuration: true,
        userType: true,
        isPaidUser: true,
        stripeCustomerId: true,
        BillingDetails: {
          where: {
            status: 1,
          },
          select: {
            subscriptionType: true,
            isSubscriptionCancelled: true,
            isActive: true,
          }
        }
      }
    });

    const cancelUsers = await this.prismaService.users.findMany({
      where: {
        approvalStatus: 'completed',
        isArchieve: false,
        isDelete: false,
      },
      select: {
        id: true,
        trialDuration: true,
        userType: true,
        isPaidUser: true,
        stripeCustomerId: true,
        BillingDetails: {
          where: {
            cancellationDate: {
              gte: pastDate,
              lte: currentDate,
            },
          },
          select: {
            subscriptionType: true,
            isSubscriptionCancelled: true,
            isActive: true,
          }
        }
      }
    });

    const getFreusers = allUsers.filter((user) => user.userType === 'free' && !user.isPaidUser)

    const getOneYearTrialUsers = allUsers.filter((user) => user.trialDuration == 'yearly' && user.userType === 'trial')

    const getMonthlyTrialUsers = allUsers.filter((user) => user.trialDuration == 'monthly' && user.userType === 'trial')

    const getPaidUsers = allUsers.filter((user) => user.userType === 'paid')

    const getPaidYearlyUsers = allUsers.filter((user) => user.userType === 'paid' && user.BillingDetails[0] && user.BillingDetails[0].subscriptionType === 'year' && user.BillingDetails[0].isActive)

    const getPaidMonthlyUsers = allUsers.filter((user) => user.userType === 'paid' && user.BillingDetails[0] && user.BillingDetails[0].subscriptionType === 'month' && user.BillingDetails[0].isActive)

    const getSubscriptionCanceledUsers = cancelUsers.filter((user) => user.BillingDetails[0] && user.BillingDetails[0].isSubscriptionCancelled)

    userTypeArr = [{ 'freeUsers': getFreusers, 'oneYearUsers': getOneYearTrialUsers, 'monthlyUsers': getMonthlyTrialUsers, 'paidusers': getPaidUsers, 'paidyearlyusers': getPaidYearlyUsers, 'paidmonthlyusers': getPaidMonthlyUsers, "canceledUsers": getSubscriptionCanceledUsers }];
    return {
      data: userTypeArr,
    }
  }

  async checkBuyerStatExist(buyerId: number, providerId: number) {
    return await this.prismaService.buyersStats.findFirst({
      where: {
        buyerCompanyId: buyerId,
        providerCompanyId: providerId
      }
    })
  }

  async addBuyerStat(buyerId: number, providerId: number) {
    return await this.prismaService.buyersStats.create({
      data: {
        buyerCompanyId: buyerId,
        providerCompanyId: providerId
      }
    })
  }

  async addBuyerStatContact(buyerId: number, providerId: number) {
    return await this.prismaService.buyersStats.create({
      data: {
        buyerCompanyId: buyerId,
        providerCompanyId: providerId,
        visitCounts: 0,
        isContacted: true,
        contactedAt: new Date()
      }
    })
  }

  async updateStatById(statId: number, visitedCounts: number) {
    return await this.prismaService.buyersStats.update({
      where: {
        id: statId
      },
      data: {
        visitCounts: visitedCounts + 1
      }
    });
  }

  async getserviceProviderCompanies() {
    return await this.prismaService.userRoles.findMany({
      where: {
        roleCode: 'service_provider',
        user: {
          isDelete: false,
          isArchieve: false,
        }
      },
      select: {
        roleCode: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
            trialDuration: true,
            isPaidUser:true,
            companies: {
              select: {
                id: true,
                name: true,
                slug: true,
                website: true,
                generalInfoProfilePerc: true,
                ourWorkAlbumsProfilePerc: true,
                ourWorkProjectProfilePerc: true,
                aboutProfilePerc: true,
                certificationsProfilePerc: true,
                servicesProfilePerc: true,
                contactsProfilePerc: true,
                createdAt: true,
                CompanyContacts: {
                  select: {
                    name: true,
                  }
                }
              },
            }
          },
        },
      },
    })
  }

  async buyerContactedProvider(buyerCompanyId: number, providerCompanyId: number) {
    return await this.prismaService.buyersStats.updateMany({
      where: {
        buyerCompanyId: buyerCompanyId,
        providerCompanyId: providerCompanyId
      },
      data: {
        isContacted: true,
        contactedAt: new Date()
      }
    });
  }

  async checkUserPortfolioAccess(portfolioId: number, companyId: number) {
    return await this.prismaService.portfolioProjects.findMany({
      where: {
        id: portfolioId,
        companyId: companyId,
      },
      select: {
        id: true,
      }
    });

  }

  async checkExistanceOfContactStat(spCompanyId: number, contactingCompanyId: number) {
    return this.prismaService.companyContactStats.findFirst({
      where: {
        providingCompanyId: spCompanyId,
        contactingCompanyId: contactingCompanyId
      }
    });
  }

  async addNewCompanyContactStat(spCompanyId: number, contactingCompanyId: number, type: string) {
    if(type == "meetingLink") {
      return this.prismaService.companyContactStats.create({
        data: {
          providingCompanyId: spCompanyId,
          contactingCompanyId: contactingCompanyId,
          meetingClickCounts: 1
        }
      });
    }
    else {
      return this.prismaService.companyContactStats.create({
        data: {
          providingCompanyId: spCompanyId,
          contactingCompanyId: contactingCompanyId,
          clickCounts: 1
        }
      });
    }
  }

  async updateCompanyContactStat(id: number, previousCount: number, previousMeetLinkClicks: number, type: string) {
    if(type == "meetingLink") {
      return this.prismaService.companyContactStats.update({
        where: {
          id: id
        },
        data: {
          meetingClickCounts: previousMeetLinkClicks + 1
        }
      });

    } else {
      return this.prismaService.companyContactStats.update({
        where: {
          id: id
        },
        data: {
          clickCounts: previousCount + 1
        }
      });
    }

  }

  async getCompanyContactStats() {
    return this.prismaService.companyContactStats.findMany({
      select: {
        id: true,
        clickCounts: true,
        meetingClickCounts: true,
        createdAt: true,
        updatedAt: true,
        providingCompany: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        contactingCompany: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userRoles: {
                  select: {
                    roleCode: true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        status: 1
      }
    });
  }

  async getActiveEventsCount() {
    try {
      return this.prismaService.events.count({
        where: {
          isArchieve: false,
          isDelete: false,
        }
      })
    } catch (e) {
      throw new HttpException(e.message, e.status, { cause: new Error(e) });
    }
  }

  async imagePublicMigration(table: string, startId: number, endId: number) {
    try {
      if (table == 'Assets') {
        const response = this.prismaService.assets.findMany({
          skip: startId,
          take: endId,
          select: {
            id: true,
            url: true,
          },
        });
        if (response) {
          for (const project of await response) {
            if (project.url) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.url,
              );
            }
          }
        }
        return 'Assets table urls Updated.';
      } else if (table == 'Companies') {
        const response = this.prismaService.companies.findMany({
          skip: startId,
          take: endId,
          select: {
            profilePdfPath: true,
          }
        });
        if (response) {
          for (const project of await response) {
            if (project.profilePdfPath) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.profilePdfPath,
              );
            }
          }
        }
        return 'Companies table ProfilePdfPath Updated.'
      } else if (table == 'Events') {
        const response = this.prismaService.events.findMany({
          skip: startId,
          take: endId,
          select: {
            eventLogo: true,
          }
        });
        if (response) {
          for (const project of await response) {
            if (project.eventLogo) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.eventLogo,
              );
            }
          }
        }
        return 'events table eventLogo Updated.'
      } else if (table == 'FileUploads') {
        const response = this.prismaService.fileUploads.findMany({
          skip: startId,
          take: endId,
          select: {
            fileUrl: true,
            thumbnail: true,
          }
        });
        if (response) {
          for (const project of await response) {
            if (project.fileUrl) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.fileUrl,
              );
            }
            if (project.thumbnail) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.thumbnail,
              );
            }
          }
        }
        return 'fileUploads table fileUrl, thumbnail Updated.'
      } else if (table == 'Advertisements') {
        const response = this.prismaService.advertisements.findMany({
          skip: startId,
          take: endId,
          select: {
            adImagePath: true,
            mobileAdImagePath: true,
          }
        });
        if (response) {
          for (const project of await response) {
            if (project.adImagePath) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.adImagePath,
              );
            }
            if (project.mobileAdImagePath) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.mobileAdImagePath,
              );
            }
          }
        }
        return 'advertisements table adImagePath, mobileAdImagePath Updated.'
      } else if (table == 'PortfolioAlbumFiles') {
        const response = this.prismaService.portfolioAlbumFiles.findMany({
          skip: startId,
          take: endId,
          select: {
            fileUrl: true,
            thumbnail: true,
          }
        });
        if (response) {
          for (const fileUpload of await response) {
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
                const signedUrl = await this.gcsService.makeImageAsPublic(
                  fileUpload.thumbnail,
                );
              }
            }
          }
        }
        return 'portfolioAlbumFiles table fileUrl Updated.'
      } else if (table == 'CompanyContacts') {
        const response = this.prismaService.companyContacts.findMany({
          skip: startId,
          take: endId,
          select: {
            profilePic: true,
          }
        });
        if (response) {
          for (const project of await response) {
            if (project.profilePic) {
              const signedUrl = await this.gcsService.makeImageAsPublic(
                project.profilePic,
              );
            }
          }
        }
        return 'companyContacts table profilePic Updated.'
      }
      //  else {
      //   const response = ['user_images/user_1/ArticleLogos/BBI-1721867399461.jpg', 'user_images/user_1/ArticleLogos/XDS-1721867611526.jpg','user_images/user_1/ArticleLogos/Webinar_for_platform_-1721778436870.png', 'user_images/user_1/ArticleLogos/riot-1721434282806.jpg', 'user_images/user_1/ArticleLogos/mascot-1721875398686.jpg', 'user_images/user_1/ArticleLogos/NewSparkFeature-1721122768735.jpg', 'user_images/user_1/ArticleLogos/GDS-1721432437827.jpg', 'user_images/user_1/ArticleLogos/SIG-1721867182699.jpg'];
      //   let result = [];
      //   for (const project of await response) {
      //     if (project) {
      //       const signedUrl = await this.gcsService.makeImageAsPublic(
      //         project,
      //       );
      //       result.push(signedUrl);
      //     }
      //   }
      //   return result;
      // }
    } catch (e) {
      throw new HttpException(e.message, e.status, { cause: new Error(e) });
    }
  }
  async findListExportExceedUsers(exportType: $Enums.EXPORT_TYPE) {
    const Data = await this.prismaService.exportExceedReport.findMany({
      where: {
        exportType: exportType,
      },
      include: {
        Companies: {
          select: {
            name: true,
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                userRoles: {
                  select: {
                    role: {
                      select: {
                        name: true,
                      }
                    },
                  }
                }
              }
            }
          }
        }
      }
    });
    return {
      success: true,
      data: Data,
      message: "fetchign successfull"
    }
  }

  async findCompanyBySlug(slug: string) {
    const data = await this.prismaService.companies.findUnique({
      where: {
        slug: slug,
        isDelete: false,
        isArchieve: false,
      },
      select: {
        id: true,
      }
    })

    if (!data) {
      const oldSlugData = await this.prismaService.oldslugs.findFirst({
        where: {
          slug: slug,
        },
        select: {
          companyId: true,
        },
      });
      return oldSlugData ? { id: oldSlugData.companyId } : null;
    }

    return data;
  }
  async findCompanySlugById(id: number) {
    return this.prismaService.companies.findUnique({
      where: {
        id: id,
        isDelete: false,
        isArchieve: false,
      },
      select: {
        slug: true,
      }
    })
  }

  async addGameEngines(data: GameEngines[]) {
    return this.prismaService.companyGameEngines.createMany({
      data: data,
    })
  }

  async checkSlugExistAndUpdate(comapnyName: string) {
    //check user slug duplicate
    let slugcheck = comapnyName;
    let Originalslugcheck = comapnyName;
    let FinalSlug = "";
    let counter = 1
    while (true) {
      const slugToCheck = generateSlug(slugcheck);
      const getSlug = await this.prismaService.companies.count({
        where: {
          slug: slugToCheck
        }
      });
      if (getSlug != 0) {
        slugcheck = Originalslugcheck + '' + counter;
      } else {
        slugcheck = slugToCheck
        break
      }
      counter++;
    }

    return slugcheck;
  }

  async insertOldSlug(companyId: number, oldSlug: string) {
    return await this.prismaService.oldslugs.create(
      {
        data: {
          companyId,
          slug: oldSlug,
        }
      }
    )
  }

  async createCompanyGroups(companyId: number) {
    try {
      const findComapnygroups = await this.prismaService.companyAdminGroups.findFirst(
        {
          where: {
            companyId: companyId,
          }
        }
      )
      if (findComapnygroups) {
        return;
      }
      // const result = [
      //   { name: 'Admin', companyId: companyId },
      //   { name: 'Standard', companyId: companyId },
      // ];
      const adminGroupId = await this.prismaService.companyAdminGroups.create({
        data: {
          name: 'Admin',
          companyId: companyId,
        }
      });
      if (adminGroupId.id) {
        const data = [
          { groupId: +adminGroupId.id, pageId: 12, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 13, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 14, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 15, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 16, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 17, canRead: true, canWrite: true, canDelete: true },
          { groupId: +adminGroupId.id, pageId: 19, canRead: true, canWrite: true, canDelete: true },
        ]
        await this.prismaService.groupPermission.createMany({
          data: data,
        })
      }
      const standardGroupId = await this.prismaService.companyAdminGroups.create({
        data: {
          name: 'Standard',
          companyId: companyId,
        }
      });
      if (standardGroupId.id) {
        const data = [
          { groupId: +standardGroupId.id, pageId: 12, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 13, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 14, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 15, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 16, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 17, canRead: false, canWrite: false, canDelete: false },
          { groupId: +standardGroupId.id, pageId: 19, canRead: false, canWrite: false, canDelete: false },
        ]
        await this.prismaService.groupPermission.createMany({
          data: data,
        })
      }
      return "successfully created groups and permissions";

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
    }
  }

  isFollowDetailsExist(companyId: number, followCompanyId: number) {
    return this.prismaService.followDetails.findFirst({
      where: {
        companyId: companyId,
        followedCompanyId: followCompanyId
      }
    });
  }

  createFollowDetails(companyId: number, followCompanyId: number) {
    return this.prismaService.followDetails.create({
      data: {
        companyId: companyId,
        followedCompanyId: followCompanyId
      }
    });
  }

  updateFollowDetails(id: number, data: Prisma.FollowDetailsUpdateInput) {
    return this.prismaService.followDetails.update({
      where: {
        id: id
      },
      data: data
    });
  }

  getBuyerFollowingDetails() {
    return this.prismaService.companies.findMany({
      where: {
        user: {
          userRoles: {
            some: {
              roleCode: 'buyer'
            }
          }
        },
        followingCompanies: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        followingCompanies: {
          select: {
            followedCompany: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            followingCompanies: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  getSpFollowingDetails() {
    return this.prismaService.companies.findMany({
      where: {
        user: {
          userRoles: {
            some: {
              roleCode: 'service_provider'
            }
          }
        },
        followedCompanies: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            followedCompanies: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async getFollowNotifications(id: number) {
    const res = await this.prismaService.followNotifications.findMany({
      where: {
        notificationToId: id,
        status: 1
        // isRead: false
      },
      include: {
        notifyingCompany: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: {
              select: {
                assets: {
                  select: {
                    url: true,
                  },
                  orderBy: {
                    id: 'asc',
                  }
                }
              }
            }
          }
        }
      }
    })
    if (res) {
      for (const logoUpdate of res) {
        if (logoUpdate.notifyingCompany.user.assets.length > 0) {
          const signedUrl = await this.gcsService.getSignedUrl(
            logoUpdate.notifyingCompany.user.assets[0].url,
          );
          logoUpdate.notifyingCompany.user.assets[0].url = signedUrl;
        }
      }
    };
    return res;
  }

  async getGeneralNotifications(id: number) {
    const res = await this.prismaService.generalNotifications.findMany({
      where: {
        notificationToId: id,
        notifiedCompany: {
          // user: {
          //   isPaidUser: true,
          // }
        },
        status: 1
        // isRead: false
      },
      select: {
        id: true,
        // notificationById: true,
        notificationToId: true,
        notificationDescription: true,
        opportunityId: true,
        isRead: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return res;
  }

  async adminNotifications(companyId: number, date: string) {
    const localDate = new Date(date).toLocaleDateString('en-US');
    return await this.prismaService.adminNotifications.findMany({
      where: {
        notificationCompanyId: companyId,
        isDisplay: true,
        OR: [
          {
            AND: [
              { startDate: { lte: toLocalISOString(localDate) } },
            ],
          },
          {
            startDate: null,
          },
          {
            endDate: null,
          },
        ],
      },
      select: {
        id: true,
        isRead: true,
        notificationDescription: true,
        notificationId: true,
        type: true,
        createdAt: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

  }

  getFollowerCompanies(companyId: number) {
    return this.prismaService.followDetails.findMany({
      where: {
        followedCompanyId: companyId
      }
    });
  }

  addFollowNotification(data: any) {
    try {
      return this.prismaService.followNotifications.create({
        data: data
      });
    } catch (e) {
      throw new HttpException(e.message, e.status, { cause: new Error(e) });
    }
  }

  addGeneralNotification(data: any) {
    return this.prismaService.generalNotifications.create({
      data: data
    });
  }

  updateFollowNotifications(whereClause: Prisma.FollowNotificationsWhereInput, data: Prisma.FollowNotificationsUpdateInput) {
    return this.prismaService.followNotifications.updateMany({
      where: whereClause,
      data: data
    });
  }

  updateGeneralNotifications(whereClause: Prisma.GeneralNotificationsWhereInput, data: Prisma.GeneralNotificationsUpdateInput) {
    return this.prismaService.generalNotifications.updateMany({
      where: {
        notifiedCompany: {
          // user: {
          //   isPaidUser: true,
          // }
        },
        AND: whereClause,
      },
      data: data
    });
  }

  updateAdminNotifications(whereClause: Prisma.AdminNotificationsWhereInput, data: Prisma.AdminNotificationsUpdateInput) {
    return this.prismaService.adminNotifications.updateMany({
      where: whereClause,
      data: data
    });
  }

  async checkNotificationAndSend(companyId: number, section: string = "", description: string = "") {
    const expiryEndDate = new Date();
    expiryEndDate.setUTCHours(0, 0, 0, 0);
    expiryEndDate.setUTCDate(expiryEndDate.getUTCDate() + 1);
    let year = expiryEndDate.getUTCFullYear();
    let month = String(expiryEndDate.getUTCMonth() + 1).padStart(2, '0');
    let day = String(expiryEndDate.getUTCDate()).padStart(2, '0');
    const expiryEndDateString = `${year}-${month}-${day}`;

    const expiryStartDate = new Date(expiryEndDate);
    expiryStartDate.setUTCDate(expiryStartDate.getUTCDate() - 7);
    year = expiryStartDate.getUTCFullYear();
    month = String(expiryStartDate.getUTCMonth() + 1).padStart(2, '0');
    day = String(expiryStartDate.getUTCDate()).padStart(2, '0');
    const expiryStartDateString = `${year}-${month}-${day}`;

    const notifications = await this.prismaService.followNotifications.findFirst({
      where: {
        notificationById: companyId,
        type: 1,
        status: 1,
        AND: [
          { createdAt: { gte: new Date(expiryStartDateString) } },
          { createdAt: { lt: new Date(expiryEndDateString) } }
        ]
      }
    });

    const specificNotification = await this.prismaService.followNotifications.findFirst({
      where: {
        notificationById: companyId,
        updatedSection: section,
        type: 1,
        AND: [
          { createdAt: { gte: new Date(expiryStartDateString) } },
          { createdAt: { lt: new Date(expiryEndDateString) } }
        ]
      }
    });

    if (!notifications || !specificNotification) {
      const followedCompanies = await this.getFollowerCompanies(companyId);
      const followedCompaniesIds = followedCompanies.map((item) => {
        return item.companyId
      });
      if (followedCompaniesIds.length > 0) {
        if (section == "Diligence") {
          description = "has updated their Due Diligence.";
        } else if (section == "Albums") {
          description = "has updated their Portfolio.";
        } else if (section == "Projects") {
          description = "has updated their Project Highlights.";
        } else if (section == "Contacts") {
          description = "has updated their Contacts.";
        } else if (section == "Services") {
          description = "has updated their Services.";
        } else if (section == "Events") {
          description = "has updated their Events."
        } else if (section == "About") {
          description = "has updated their About."
        } else if (section == "size") {
          description = "has updated their Company Size."
        } else if(section == "Announcement") {
          if(description == ""){
            description = "has updated their Announcements."
          }
        }

        if (!specificNotification) {
          const notificationArr: { notificationById: number, notificationToId: number, notificationDescription: string, updatedSection: string, isRead: boolean, isMailSent: boolean, type:number }[] = [];
          followedCompaniesIds.forEach((item) => {
            const notification = {
              notificationById: companyId,
              notificationToId: item,
              notificationDescription: description,
              updatedSection: section,
              isRead: false,
              isMailSent: false,
              status: notifications ? 2 : 1,
              type: section == "Announcement" ? 7 : 1
            }
            notificationArr.push(notification);
          });
          await this.prismaService.followNotifications.createMany({
            data: notificationArr
          });
        }

        if (!notifications) {
          let theUrl = "";
          theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/followNotification`;
          const notificationRef = admin.database().ref(theUrl).push();
          await notificationRef.set({
            companyId: companyId,
            toCompanyIds: followedCompaniesIds,
            descirption: description,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

  }

  getOptedPlatforms(companyId: number) {
    return this.prismaService.companyPlatformExperience.findMany({
      where: {
        companyId: companyId
      }
    });
  }

  getGameEngines(companyId: number) {
    return this.prismaService.companyGameEngines.findMany({
      where: {
        companyId: companyId,
      }
    })
  }

  getCompaniesAddresses(companyId: number) {
    return this.prismaService.companyAddress.findMany({
      where: {
        company_id: companyId
      }
    })
  }

  getOptedServiceAndCapabilities(companyId: number) {
    return this.prismaService.servicesOpt.findMany({
      where: {
        companyId: companyId
      }
    });
  }

  getAboutDoc(companyId: number) {
    return this.prismaService.companies.findFirst({
      where: {
        id: companyId
      },
      select: {
        id: true,
        profilePdfPath: true
      }
    })
  }

  getPortfolioProjectFiles(projectId: number) {
    return this.prismaService.fileUploads.findMany({
      where: {
        portfolioProjectId: projectId
      }
    });
  }

  getFollowNotificationWithingWeek(whereClause: Prisma.GeneralNotificationsWhereInput) {
    return this.prismaService.generalNotifications.findFirst({
      where: whereClause
    });
  }

  async addProfileCount(spId: number, loggedUserId: number) {
    return await this.prismaService.profileViews.create({
      data: {
        viewedProfileUserId: Number(spId),
        viewerUserId: Number(loggedUserId),
      }
    })
  }

  findAllSubUsersByMail(emails: string[]) {
    return this.prismaService.companyAdminUser.findMany({
      where: {
        email: {
          in: emails,
        },
      },
    });
  }

  async checkBuyerStatById(buyerId: number) {
    return await this.prismaService.buyersStats.findFirst({
      where: {
        buyerCompanyId: buyerId,
        providerCompanyId: {
          equals: null
        }
      }
    })
  }

  async updateBuyerStatById(statId: number, providerId: number) {
    return await this.prismaService.buyersStats.update({
      where: {
        id: statId
      },
      data: {
        visitCounts: 1,
        providerCompanyId: providerId
      }
    });
  }

}
