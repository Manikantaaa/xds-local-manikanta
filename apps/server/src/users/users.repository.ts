import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AdminNotifications, advertisement, advertisements, faqData, FollowNotification, UserRequest } from "./type";
import { APPROVAL_STATUS, Prisma, ROLE_CODE, TRIAL_PERIOD, USER_TYPE } from "@prisma/client";
import { ExcelUsers } from "src/common/types/common-interface";
import { BadRequestException, HttpException, NotFoundException } from "@nestjs/common/exceptions";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { capitalizeFirstLetter, generateSlug, getRegionName, toLocalISOString } from "src/common/methods/common-methods";


interface ContactWithUrl extends advertisements {
  signedImgUrl: string;
  mbSignedImgUrl: string;
  logoSignedImgUrl: string;
}
@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService,
    private readonly gcsService: GoogleCloudStorageService,) {
  }

  findAll() {
    return this.prismaService.users.findMany({
      where: {
        isArchieve: false,
      },
      include: {
        companies: true,
        userRoles: true,
      },
    });
  }

  findUsers(searchString: string = "", filterVal: Prisma.UsersWhereInput[], userRole: string) {

    let whereClaure: any = {
      isDelete: false,
      approvalStatus: APPROVAL_STATUS.completed,
      OR: [
        {
          firstName: {
            mode: "insensitive",
            contains: searchString,
          },
        },
        {
          lastName: {
            mode: "insensitive",
            contains: searchString,
          },
        },
        {
          email: {
            mode: "insensitive",
            contains: searchString
          }
        },
        {
          companies: {
            some: {
              name: {
                mode: "insensitive",
                contains: searchString,
              },
            },
          },
        },
      ],
      AND: {
        OR: filterVal,
        AND: {
          userRoles: { some: { roleCode: userRole as ROLE_CODE } }
        }
      },
    }

    if (searchString.includes(" ")) {
      const fullName = searchString.split(" ");
      const firstName = fullName[0];
      const lastName = fullName[1];
      whereClaure.OR.push({
        AND: [
          {
            firstName: {
              mode: "insensitive",
              contains: firstName,
            }
          },
          {
            lastName: {
              mode: "insensitive",
              contains: lastName,
            }
          }
        ]
      })
    }

    if (userRole == 'all') {
      delete (whereClaure?.AND?.AND);
    }

    return this.prismaService.users.findMany({
      where: whereClaure,
      include: {
        companies: true,
        userRoles: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  getUsersCount(searchString: string = "") {
    return this.prismaService.users.count({
      where: {
        isDelete: false,
        approvalStatus: APPROVAL_STATUS.completed,
        OR: [
          {
            firstName: {
              mode: "insensitive",
              contains: searchString,
            },
          },
          {
            lastName: {
              mode: "insensitive",
              contains: searchString,
            },
          },
        ],
      },
    });
  }

  async findOneByEmail(email: string) {
    const Company = await this.prismaService.users.findFirst({
      where: {
        email,
      },
      include: {
        userRoles: true,
      },
    });
    if (!Company) {
      const companyAdminUsers = await this.prismaService.companyAdminUserTokens.findFirst({
        where: {
          email,
        },
        select: {
          id: true,
          companyAdminUser: {
            select: {
              id: true,
              email: true,
            }
          }
        }
      })
      return companyAdminUsers
    }

    return { ...Company, companyAdminUsers: null };
  }

  findFirst(
    conditions: Prisma.UsersWhereInput,
    includeParams?: Prisma.UsersInclude,
  ) {
    return this.prismaService.users.findFirst({
      where: {
        ...conditions,
      },
      include: {
        ...includeParams,
        companies: {
          select: {
            name: true,
            isTourCompleted: true,
            id: true,
            addedAnnouncement: true,
            CompanyContacts: {
              select: {
                name: true,
              },
            },
          },
        },
        twoFactorDetails: {
          select: {
            isActive: true,
            otp: true,
            otpCreatedAt: true,
            isVerified:  true
          }
        }
      },
    });
  }

  //  async findFirstMultipleUser(email: string, includeParams?: Prisma.UsersInclude,) {
  //     const data =  await this.prismaService.multipleUsers.findFirst({
  //       where:{
  //         email: email,
  //       },
  //       select:{
  //         user:{
  //           include: {
  //             ...includeParams,
  //             companies: {
  //               select: {
  //                 name: true,
  //                 isTourCompleted:true,
  //                 id: true,
  //                 CompanyContacts: {
  //                   select: {
  //                     name: true,
  //                   },
  //                 },
  //               },
  //             },
  //             twoFactorDetails: {
  //               select: {
  //                 isActive: true,
  //                 otp: true,
  //                 otpCreatedAt: true
  //               }
  //             }
  //           },
  //         }
  //       }
  //     })
  //     return data;
  //   }

  findUserByEmailAndOtp(
    conditions: Prisma.UsersWhereInput,
    includeParams?: Prisma.UsersInclude,
  ) {
    return this.prismaService.users.findFirst({
      where: {
        ...conditions,
      },
      include: {
        ...includeParams,
        companies: {
          select: {
            name: true,
            isTourCompleted: true,
            id: true,
            CompanyContacts: {
              select: {
                name: true,
              },
            },
          },
        },
        twoFactorDetails: true
      },
    });
  }

  async createWithRole(user: UserRequest) {

    const slugcheck = await this.checkSlugExistAndUpdate(user.companyName);

    return this.prismaService.users.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email.trim().toLowerCase(),
        linkedInUrl: user.linkedInUrl,
        approvalStatus: APPROVAL_STATUS.pending,
        isArchieve: false,
        status: 2,
        createdAt: new Date(),
        checkedTerms: true,
        userType: user.userType,
        companies: {
          create: {
            name: user.companyName,
            website: user.companyWebUrl,
            slug: slugcheck
          },
        },
        userRoles: {
          create: {
            roleCode: user.role,
          },
        },
        registrationRequests: {
          create: {
            approvalStatus: APPROVAL_STATUS.pending,
            submissionDate: new Date(),
          },
        },
      },
    });
  }

  findUnique(id: number) {
    return this.prismaService.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaidUser: true,
        approvalStatus: true,
        userType: true,
        passwordNeedToChange: true,
        companies: {
          select: {
            name: true
          }
        },
        userRoles: {
          select: {
            roleCode: true,
          }
        },
      }
    });
  }

  findAdminuserId(loggedId: number) {
    return this.prismaService.companyAdminUser.findUnique({
      where: {
        id: loggedId,
      },
      select: {
        id: true,
        email: true,
        isPasswordChanged: true,
      }
    });
  }

  findFirstByUserId(id: number) {
    return this.prismaService.users.findUnique({
      where: {
        id,
      },
      include: {
        companies: true,
        userRoles: true,
      },
    });
  }

  async UpdateByUserId(id: number) {
    try {
      const checkCompany = await this.prismaService.flaggedUsers.findFirst({
        where: {
          id,
        },
      })
      if (checkCompany) {
        await this.prismaService.flaggedUsers.update({
          where: {
            id,
          },
          data: {
            isReportResolved: !checkCompany.isReportResolved,
          }
        });
        return {
          success: true,
        }
      }
    }
    catch (error) {
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }

  }

  async updateCompanyName(id: number, companyName: string) {
    try {
      return await this.prismaService.companies.updateMany({
        where: {
          userId: Number(id)
        },
        data: {
          name: companyName,
        }
      })
    } catch (e) {
      throw e;
    }
  }

  async update(id: number, updatedData: Prisma.UsersUpdateInput) {
    try {
      const updateEmail = await this.prismaService.users.update({
        where: {
          id,
        },
        data: {
          ...updatedData,
        },
      });

      return updateEmail;

    } catch (error) {
      throw error;
    }
    // return await this.prismaService.users.update({
    //   where: {
    //     id,
    //   },
    //   data: {
    //     ...updatedData,
    //   },
    // });
  }

  async adminUserupdate(id: number, updatedData: Prisma.CompanyAdminUserUpdateInput) {
    try {
      const updateEmail = await this.prismaService.companyAdminUser.update({
        where: {
          id,
        },
        data: {
          ...updatedData,
        },
      });

      return updateEmail;

    } catch (error) {
      throw error;
    }
  }

  async adminUserLoginUpdate(id: number) {
    try {
      const updateEmail = await this.prismaService.companyAdminUser.update({
        where: {
          id,
        },
        data: {
          isLoggedInOnce: true,
        },
      });

      return updateEmail;

    } catch (error) {
      throw error;
    }
  }

  async createCompanyFromExcel(user: ExcelUsers) {
    const slugcheck = await this.checkSlugExistAndUpdate(user.companyName);
    let aboutProfilePerc = 0;
    let servicesProfilePerc = 0;
    if (user.companyDescription !== "") {
      aboutProfilePerc = 16;
    }
    if (user.services.length > 0) {
      servicesProfilePerc = 16;
    }
    const addedCompanyAndUser = await this.prismaService.users.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email.trim().toLowerCase(),
        linkedInUrl: user.linkedInUrl,
        approvalStatus: APPROVAL_STATUS.completed,
        isArchieve: false,
        isAddedFromCsv: true,
        status: 1,
        createdAt: new Date(),
        companies: {
          create: {
            name: user.companyName,
            website: user.companyWebUrl,
            companySize: user.companySize,
            about: user.companyDescription,
            aboutProfilePerc: aboutProfilePerc,
            servicesProfilePerc: servicesProfilePerc,
            slug: slugcheck
          },
        },
        userRoles: {
          create: {
            roleCode: user.role,
          },
        },
        registrationRequests: {
          create: {
            approvalStatus: APPROVAL_STATUS.completed,
            submissionDate: new Date(),
          },
        },
      },
    });

    const companyDeatils = await this.prismaService.companies.findFirst({
      where: {
        userId: addedCompanyAndUser.id,
      },
    });

    let createService: {
      companyId: number;
      serviceId: number;
    }[] = [];

    if (companyDeatils) {
      createService = user.services.map((item) => {
        return {
          companyId: companyDeatils.id,
          serviceId: item,
        };
      });
    }

    await this.prismaService.servicesOpt.createMany({
      data: createService,
    });
  }

  async setTheUserAsUnpaid(userId: number) {
    await this.prismaService.users.update({
      where: {
        id: userId,
      },
      data: {
        isPaidUser: false,
        stripeSubscriptionId: null,
        userType: USER_TYPE.free,
        accessExpirationDate: null,
        adminApprovedAt: new Date(),
      },
    });
  }

  async setTheBillingTable(userId: number) {
    const theBillDetail = await this.prismaService.billingDetails.findFirst({
      where: {
        userId: userId,
        isActive: true
      }
    });
    if (theBillDetail && theBillDetail.id) {
      await this.prismaService.billingDetails.update({
        where: {
          id: theBillDetail.id
        },
        data: {
          cancellationDate: theBillDetail.cancellationDate ? theBillDetail.cancellationDate : new Date(),
          isSubscriptionCancelled: true
        }
      });
    }
    await this.prismaService.billingDetails.updateMany({
      where: {
        userId: userId,
      },
      data: {
        isActive: false,
        // isSubscriptionCancelled: true
      },
    });
  }

  async createBillDetail(
    userId: number,
    stripeCustomerId: string,
    subscriptionId: string,
    subscriptionType: string,
    expirationDate: Date,
    isAcive: boolean,
    message: string,
    amount: number,
    isRenewed: boolean,
    billing_reason: string,
    billingCountry: string | null,
    billingRegion: string | null,
    isCouponApplied: boolean
  ) {
    await this.prismaService.billingDetails.create({
      data: {
        userId: userId,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionType: subscriptionType,
        stripeExpireDate: expirationDate,
        message: message,
        isActive: isAcive,
        subscriptionAmount: amount,
        isRenewed: isRenewed,
        billingCountry: billingCountry,
        billingRegion: billingRegion,
        isCouponApplied: isCouponApplied
      },
    });
    if (billing_reason == "subscription_create") {
      await this.prismaService.users.update({
        where: {
          id: userId,
        },
        data: {
          adminApprovedAt: new Date(),
        }
      })
    }

  }

  async updateBillTable(userId: number) {
    await this.prismaService.billingDetails.updateMany({
      where: {
        userId: userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  getSubscriptionDetails(id: number) {
    return this.prismaService.billingDetails.findFirst({
      where: {
        userId: id,
        isActive: true,
      },
      select: {
        id: true,
        subscriptionType: true,
        subscriptionAmount: true,
        stripeExpireDate: true,
        isSubscriptionCancelled: true,
        paymentAttemptCount: true,
        firstPaymentFailDate: true,
        user: {
          select: {
            email: true,
            firstName: true
          }
        }
      }
    });
  }

  cancelSubscription(postData: { userId: number, cancellationReason: string, reasonDescription: string }) {
    return this.prismaService.billingDetails.updateMany({
      where: {
        userId: postData.userId,
        isActive: true,
      },
      data: {
        isSubscriptionCancelled: true,
        cancellationDate: new Date(),
        cancellationReason: (postData.cancellationReason && postData.cancellationReason != "") ? postData.cancellationReason : null,
        reasonDescription: (postData.reasonDescription && postData.reasonDescription != "") ? postData.reasonDescription : null
      }
    });
  }

  getBackupUserDetails(userId: number) {
    return this.prismaService.backupPersonalContacts.findFirst({
      where: {
        userId: userId
      }
    })
  }

  updateBackupContact(id: number, token: string | null) {
    return this.prismaService.backupPersonalContacts.update({
      where: {
        id: id
      },
      data: {
        passwordToken: token
      }
    })
  }

  createBackupContact(userId: number, token: string) {
    return this.prismaService.backupPersonalContacts.create({
      data: {
        userId: userId,
        passwordToken: token
      }
    });
  }
  createCompanyUserBackupContact(email: string, token: string) {
    return this.prismaService.companyAdminUserTokens.create({
      data: {
        email: email,
        token: token,
      }
    })
  }

  updateBackupContactPasswordTokenByUserId(userId: number, token: string | null) {
    return this.prismaService.backupPersonalContacts.updateMany({
      where: {
        userId: userId
      },
      data: {
        passwordToken: token
      }
    })
  }

  async updateAdminUserToken(email: string) {
    return await this.prismaService.companyAdminUserTokens.deleteMany({
      where: {
        email: email,
      }
    })
  }

  async getUserFromToken(token: string) {
    const Company = await this.prismaService.backupPersonalContacts.findFirst({
      where: {
        passwordToken: token
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!Company) {
      const companyAdminUser = await this.prismaService.companyAdminUserTokens.findFirst({
        where: {
          token,
        },
        select: {
          companyAdminUser: {
            select: {
              firstName: true,
              email: true,
            }
          }
        }
      });

      return {
        user: {
          firstName: companyAdminUser?.companyAdminUser.firstName,
          email: companyAdminUser?.companyAdminUser.email
        }
      };
    }
    return Company;
  }

  getFlaggedUsers() {
    return this.prismaService.flaggedUsers.findMany({
      where: {
        isDelete: false,
        status: 1
      },
      include: {
        company: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        reportedCompany: true,
      }
    });
  }

  async csvBuyersTrailEndToday() {
    const currentDate = new Date();
    const oneDayInMillis = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

    // Get two previous dates
    const twoDaysBefore = new Date(currentDate.getTime() - (2 * oneDayInMillis));
    return await this.prismaService.users.findMany({
      where: {
        isAddedFromCsv: true,
        isArchieve: false,
        isPaidUser: true,
        OR: [
          { stripeSubscriptionId: null },
          { stripeSubscriptionId: "" }
        ],
        AND: [
          { NOT: { accessExpirationDate: null } },
          { accessExpirationDate: { lt: currentDate } },
          { accessExpirationDate: { gt: twoDaysBefore } }
        ]
      }
    });
  }

  async findUsersWhere(startDate: string, endDate: string) {
    return this.prismaService.users.findMany({
      where: {
        isPaidUser: true,
        userType: 'trial',
        isDelete: false,
        isArchieve: false,
        AND: [
          { accessExpirationDate: { gte: new Date(startDate + "T00:00:00Z") } },
          { accessExpirationDate: { lt: new Date(endDate + "T00:00:00Z") } }
        ]
      },
      include: {
        userRoles: {
          select: {
            roleCode: true,
          }
        }
      }
    });
    // return this.prismaService.$queryRaw(Prisma.sql
    //   `SELECT * FROM  public."Users" 
    //   WHERE "isPaidUser" = true
    //   AND "userType" = 'trial'
    //   AND "isDelete" = false
    //   AND DATE("accessExpirationDate") = DATE(${date});`);
  }

  async getCancelledSubscriptionDetails(whereClause: any) {
    return await this.prismaService.billingDetails.findMany({
      where: whereClause,
      select: {
        id: true,
        cancellationDate: true,
        cancellationReason: true,
        reasonDescription: true,
        subscriptionType: true,
        billingCountry: true,
        paymentAttemptCount: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companies: {
              select: {
                id: true,
                name: true,
                CompanyAddress: {
                  select: {
                    id: true,
                    Country: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            },
            userRoles: {
              select: {
                roleCode: true
              }
            }
          }
        }
      }
    })
  }

  async getReSubscriptionDetails(whereClause: any) {

    const cancelleddata = await this.prismaService.users.findMany({
      where: whereClause,
      select: {
        id: true,
        _count: {
          select: {
            BillingDetails: {
              where: {
                isRenewed: false,
              }
            },
          }
        },
      },
      orderBy: {
        id: "desc"
      }
    });

    const rturnedArray = cancelleddata.filter((resSubs) => resSubs._count.BillingDetails > 1);
    const returnedUserIds = rturnedArray.map((returned) => returned.id);


    const billingWhereClause: any = {
      userId: {
        in: returnedUserIds
      },
      user: {
        isDelete: false,
      },
    };

    if (whereClause.BillingDetails && whereClause.BillingDetails.some.subscriptionType && whereClause.BillingDetails.some.subscriptionType != 'all') {
      billingWhereClause.subscriptionType = whereClause.BillingDetails.some.subscriptionType;
    }
    const userdata = await this.prismaService.billingDetails.findMany({
      where: billingWhereClause,
      distinct: ["userId"],
      select: {
        isActive: true,
        createdAt: true,
        cancellationDate: true,
        subscriptionType: true,
        billingCountry: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userRoles: {
              select: {
                roleCode: true,
              }
            },
            companies: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    const userDataWithCancelleddate = await this.prismaService.billingDetails.findMany({
      where: {
        userId: {
          in: returnedUserIds
        },
        user: {
          isDelete: false,
        },
        cancellationDate: {
          not: null,
        }
      },
      distinct: ["userId"],
      select: {
        userId: true,
        cancellationDate: true,
      },
      orderBy: {
        cancellationDate: "desc",
      }
    });

    const cancellationMap = new Map(
      userDataWithCancelleddate.map((item) => [item.userId, item.cancellationDate])
    );

    const mergedUserData = userdata.map((user) => ({
      ...user,
      cancellationDate: cancellationMap.get(user.user.id) || null, // Adds cancellationDate if available, otherwise null
    }));
    return mergedUserData;
  }

  async createFaq(question: string, answer: string, display: boolean) {
    try {
      const res = await this.prismaService.faqQuestions.create({
        data: {
          faqQuestion: question,
          faqAnswer: answer,
          isArchieve: display,
        }
      });
      return {
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }

  }

  async deleteFaq(id: number) {
    try {
      const res = await this.prismaService.faqQuestions.deleteMany({
        where: {
          id: id,
        },
      });
      return {
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }
  }

  async getByIdFaqQuestions(id: number) {
    try {
      const res = await this.prismaService.faqQuestions.findFirst({
        where: {
          id: id,
        },
      });
      return {
        data: res,
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }
  }

  async getAlleFaqQuestions() {
    try {
      const res = await this.prismaService.faqQuestions.findMany({
        where: {
          isDelete: false,
        },
        orderBy: {
          orderById: 'asc',
        }
      });
      return {
        data: res,
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return 'failed';
    }
  }

  async getUnHideFaqQuestions() {
    try {
      const res = await this.prismaService.faqQuestions.findMany({
        where: {
          isDelete: false,
          isArchieve: true,
        },
        orderBy: {
          orderById: 'asc',
        }
      });
      return {
        data: res,
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return 'failed';
    }
  }

  async hideFaqQuestions(id: number, postData: faqData) {
    try {
      postData.qsnData = sanitizeData(postData.qsnData);
      if (postData.type == "hide") {
        const existingList = await this.prismaService.faqQuestions.findUnique({
          where: {
            id: id,
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
        const res = await this.prismaService.faqQuestions.update({
          where: {
            id: id,
          },
          data: {
            isArchieve: updateIsArchive,
          },
        });
        return {
          data: res,
          success: true,
          message: "successfully updated",
        }
      }
      else {
        const res = await this.prismaService.faqQuestions.update({
          where: {
            id: +postData.qsnData.id,
          },
          data: {
            faqQuestion: postData.qsnData.question,
            faqAnswer: postData.qsnData.answer,
            isArchieve: postData.qsnData.isArchieve,
            orderById: postData.qsnData.orderById,
          },
        });
        return {
          data: res,
          success: true,
          message: "successfully updated",
        }
      }
    } catch (err) {
      return new BadRequestException();
    }

  }

  async createAdvertisement(postData: advertisement) {
    try {
      const advertisement = {
        companyName: postData.companyName,
        adImagePath: postData.adImagePath,
        mobileAdImagePath: postData.mobileAdImagePath,
        adURL: postData.adURL,
        adURLStaticPage: postData.adURLStaticPage,
        adPage: postData.adPage,
        startDate: new Date(toLocalISOString(postData.startDate)),
        endDate: new Date(toLocalISOString(postData.endDate)),
        isArchieve: postData.isArchieve,
        clicksReceived: postData.clicksReceived,
      }
      const newpostData: { postdata: advertisements } = { postdata: advertisement }
      const res = await this.prismaService.advertisements.create({
        data: {
          ...newpostData.postdata,
        }
      });
      if (res) {
        await this.prismaService.temporaryUploadedFiles.deleteMany({
          where: {
            formUniqueId: 'advertismentForm',
            OR: [
              { fileName: postData.adImagePath },
              { fileName: postData.mobileAdImagePath },
            ],
          },
        });
        const getDisplayOrder = await this.prismaService.latestArticles.aggregate({
          _max: {
            displayOrder: true,
          },
        });
        const currentDisplayOrder = getDisplayOrder._max.displayOrder ? getDisplayOrder._max.displayOrder : 0;
        if (postData.logoImagePath) {
          await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
              fileName: postData.logoImagePath,
              formUniqueId: "advertismentForm",
            }
          });
          if (postData.adPage == "home") {
            await this.prismaService.latestArticles.create({
              data: {
                categoryId: 3,
                logoPath: postData.logoImagePath,
                title: "Get to know " + postData.companyName,
                webUrl: postData.adURL,
                StartDate: new Date(toLocalISOString(postData.startDate)),
                EndDate: new Date(toLocalISOString(postData.endDate)),
                advtId: res.id,
                isActive: true,
                isArchieve: false,
                displayOrder: currentDisplayOrder + 1,
              }
            })
          }
        }
      }

      return {
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }
  }

  async getAdvertisements() {
    const data = await this.prismaService.advertisements.findMany({
      where: {
        isDelete: false,
      },
      include: {
        LatestArticles: {
          select: {
            logoPath: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc',
      }
    });
    const updatedContacts = await Promise.all(data.map(async (contact): Promise<ContactWithUrl> => {
      let signedImgUrl: string = "";
      if (contact.adImagePath) {
        signedImgUrl = await this.gcsService.getSignedUrl(contact.adImagePath);
      }
      let mbSignedImgUrl: string = "";
      if (contact.mobileAdImagePath) {
        mbSignedImgUrl = await this.gcsService.getSignedUrl(contact.mobileAdImagePath);
      }
      let logoSignedImgUrl: string = "";
      if (contact.LatestArticles.length > 0 && contact.LatestArticles[0].logoPath) {
        logoSignedImgUrl = await this.gcsService.getSignedUrl(contact.LatestArticles[0].logoPath);
      }
      return {
        ...contact,
        signedImgUrl,
        mbSignedImgUrl,
        logoSignedImgUrl,
      };
    }));
    return updatedContacts;
  }

  async getAdvtNames() {
    const data = await this.prismaService.advertisements.findMany({
      where: {
        isDelete: false,
      },
      select: {
        companyName: true,
        externalClicks: true,
      }
    });
    type CompanyNameCount = {
      [key: string]: number;
    };
    const companyNameCount = data.reduce((acc: CompanyNameCount, { companyName }) => {
      acc[companyName] = (acc[companyName] || 0) + 1;
      return acc;
    }, {});
    const duplicateCompanyNames = Object.keys(companyNameCount).filter(companyName => companyNameCount[companyName] > 2);
    const uniqueCompanyNames = [...new Set(data.map(item => item.companyName))];
    return { data: uniqueCompanyNames, dublicateNames: duplicateCompanyNames };
  }

  async companyClicksReport(postData: { companyname: string, startdate: string, endDate: string }) {
    const whereclouse: any = {
      isDelete: false,
      companyName: {
        mode: "insensitive",
        contains: postData.companyname,
      },
      AND: {
        startDate: {
          lte: new Date(postData.endDate),
        },
        endDate: {
          gte: new Date(postData.startdate),
        },
      }
    }
    if (postData.startdate == "" || postData.endDate == "") {
      delete (whereclouse?.AND);
    }
    const externalClicksCount = await this.prismaService.advertisements.findFirst({
      where: {
        isDelete: false,
        adPage: 'home',
        companyName: {
          mode: "insensitive",
          contains: postData.companyname,
        },
      },
      select: {
        externalClicks: true,
      }
    })
    let data = await this.prismaService.advertisements.findMany({
      where: whereclouse,
      select: {
        id: true,
        adPage: true,
        externalClicks: true,
        AdClicksByUser: {
          select: {
            clicksCount: true,
            createdAt: true,
            updatedAt: true,
            company: {
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
                        roleCode: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Create a map to accumulate clicksCount and track the most recent dates for each company
    const companyClicksMap = new Map();
    let externalClickCount = 0;
    data.forEach(ad => {
      ad.AdClicksByUser.forEach(click => {
        const companyName = click.company.name;
        if (companyClicksMap.has(companyName)) {
          const existingEntry = companyClicksMap.get(companyName);
          existingEntry.clicksCount += click.clicksCount;
          // Update createdAt and updatedAt if the current entry has more recent dates
          if (new Date(click.createdAt) > new Date(existingEntry.createdAt)) {
            existingEntry.createdAt = click.createdAt;
          }
          if (new Date(click.updatedAt) > new Date(existingEntry.updatedAt)) {
            existingEntry.updatedAt = click.updatedAt;
          }
        } else {
          companyClicksMap.set(companyName, {
            ...click,
            clicksCount: click.clicksCount,
            createdAt: click.createdAt,
            updatedAt: click.updatedAt,
          });
        }
      });
      if(ad.adPage == "home"){
        externalClickCount += ad.externalClicks;
      }
    });

    // Convert the map back to an array of unique companies with aggregated clicksCount and the most recent dates
    const uniqueCompanies = Array.from(companyClicksMap.values());

    return { uniqueCompanies: uniqueCompanies, externalClicksCount: externalClickCount };
  }

  async getAdvertisementById(id: number) {
    try {
      const res = await this.prismaService.advertisements.findFirst({
        where: {
          id: id,
          isArchieve: false,
          isDelete: false,
        }
      });
      return {
        data: res,
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }
  }

  async deleteAdvertisementById(id: number) {
    try {
      const existingData = await this.prismaService.advertisements.findUnique({
        where: {
          id: id,
        },
        include: {
          LatestArticles: true,
        }
      });

      if (existingData) {
        await this.prismaService.temporaryUploadedFiles.create({
          data: {
            formUniqueId: 'advertismentForm',
            fileName: existingData?.adImagePath,
          }
        });
        await this.prismaService.temporaryUploadedFiles.create({
          data: {
            formUniqueId: 'advertismentForm',
            fileName: existingData?.mobileAdImagePath
          }
        });
        if (existingData?.LatestArticles[0]) {
          await this.prismaService.temporaryUploadedFiles.create({
            data: {
              formUniqueId: 'advertismentForm',
              fileName: existingData?.LatestArticles[0].logoPath,
            }
          });

          await this.prismaService.latestArticles.deleteMany({
            where: {
              advtId: existingData?.LatestArticles[0].id,
            },
          });
        }
      }

      await this.prismaService.adClicksByUser.deleteMany({
        where: {
          adId: id,
        }
      })
      const res = await this.prismaService.advertisements.delete({
        where: {
          id: id,
        }
      });

      return {
        data: res,
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }
  }

  async updateAdvertisementById(id: number, postData: { type: string, postdata: advertisement }, loggedCompanyId: number) {
    try {
      if (postData.type && postData.type == "live") {
        const existingList = await this.prismaService.advertisements.findUnique({
          where: {
            id: id,
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
        const res = await this.prismaService.advertisements.update({
          where: {
            id: id,
          },
          data: {
            isArchieve: updateIsArchive,
          },
        });
        return {
          data: res,
          success: true,
          message: "successfully updated",
        }
      }
      if (postData.type && postData.type == "click") {
        const existingList = await this.prismaService.advertisements.findUnique({
          where: {
            id: id,
          },
        });
        const updateIsArchive = existingList?.clicksReceived ? existingList?.clicksReceived : 0;
        const res = await this.prismaService.advertisements.update({
          where: {
            id: id,
          },
          data: {
            clicksReceived: updateIsArchive + 1,
          },
        });
        const checkUser = await this.prismaService.adClicksByUser.findFirst({
          where: {
            companyId: loggedCompanyId,
            adId: id,
          },
          select: {
            id: true,
            clicksCount: true,
          }
        })
        if (checkUser) {
          await this.prismaService.adClicksByUser.update({
            where: {
              id: checkUser.id,
            },
            data: {
              clicksCount: checkUser.clicksCount + 1,
            }
          })
        } else {
          await this.prismaService.adClicksByUser.create({
            data: {
              companyId: loggedCompanyId,
              adId: id,
              clicksCount: 1,
              isDelete: false,
            }
          })
        }

        return {
          data: res,
          success: true,
          message: "successfully updated",
        }
      }
      else {
        const existingList = await this.prismaService.advertisements.findUnique({
          where: {
            id: id,
          },
          include: {
            LatestArticles: true,
          }
        });
        if (existingList) {
          if (postData.postdata.adImagePath != existingList.adImagePath) {
            await this.prismaService.temporaryUploadedFiles.create({
              data: {
                formUniqueId: 'advertismentForm',
                fileName: existingList?.adImagePath,
              }
            })
          }
          if (postData.postdata.mobileAdImagePath != existingList.mobileAdImagePath) {
            await this.prismaService.temporaryUploadedFiles.create({
              data: {
                formUniqueId: 'advertismentForm',
                fileName: existingList?.mobileAdImagePath,
              }
            })
          }
          if (postData.postdata.logoImagePath != "" && postData.postdata.logoImagePath != existingList.LatestArticles[0].logoPath) {
            await this.prismaService.temporaryUploadedFiles.create({
              data: {
                formUniqueId: 'advertismentForm',
                fileName: existingList?.mobileAdImagePath,
              }
            })
          }

        }
        const advertisement = {
          companyName: postData.postdata.companyName,
          adImagePath: postData.postdata.adImagePath,
          mobileAdImagePath: postData.postdata.mobileAdImagePath,
          adURL: postData.postdata.adURL,
          adURLStaticPage: postData.postdata.adURLStaticPage,
          adPage: postData.postdata.adPage,
          startDate: new Date(toLocalISOString(postData.postdata.startDate)),
          endDate: new Date(toLocalISOString(postData.postdata.endDate)),
          isArchieve: postData.postdata.isArchieve,
          clicksReceived: postData.postdata.clicksReceived,
        }
        const newpostData: advertisements = advertisement;
        const res = await this.prismaService.advertisements.update({
          where: {
            id: id,
          },
          data: {
            ...newpostData,
          },
        });
        if (res) {
          await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
              formUniqueId: 'advertismentForm',
              OR: [
                { fileName: newpostData.adImagePath },
                { fileName: newpostData.mobileAdImagePath },
              ],
            },
          });
        }
        if (postData.postdata.logoImagePath != "") {
          await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
              formUniqueId: 'advertismentForm',
              fileName: postData.postdata.logoImagePath,
            },
          });
          await this.prismaService.latestArticles.updateMany({
            where: {
              advtId: res.id,
            },
            data: {
              logoPath: postData.postdata.logoImagePath,
            },
          });
        }
        return {
          data: res,
          success: true,
          message: "successfully updated.",
        }
      }

    } catch (err) {
      return new BadRequestException();
    }
  }

  async checkAdBannerDates(id: number, page: string, startDaate: string, endDaate: string) {
    try {
      let start = new Date(startDaate);
      // start.setDate(start.getDate()-1);

      let end = new Date(endDaate);
      // end.setDate(end.getDate()-1);
      return await this.prismaService.advertisements.findMany({
        where: {
          id: { not: id },
          isArchieve: false,
          isDelete: false,
          adPage: page,
          startDate: {
            lte: end,
          },
          endDate: {
            gte: start,
          },
        },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status, { cause: new Error(err) });
    }
  }

  async getBannerAds(date: string, type: string) {
    try {
      let currentDate = new Date(toLocalISOString(date));
      const bannerAdImage = await this.prismaService.advertisements.findMany({
        where: {
          isArchieve: false,
          isDelete: false,
          adPage: type,
          startDate: {
            lte: currentDate,
          },
          endDate: {
            gte: currentDate,
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
      for (const provider of bannerAdImage) {
        if (provider.adImagePath) {
          const bannersignedUrl = await this.gcsService.getSignedUrl(
            provider.adImagePath,
          );
          provider.adImagePath = bannersignedUrl;
        }
        if (provider.mobileAdImagePath) {
          const mobileBannersignedUrl = await this.gcsService.getSignedUrl(
            provider.mobileAdImagePath,
          );
          provider.mobileAdImagePath = mobileBannersignedUrl;
        }
      }
      return bannerAdImage;
    } catch (err) {
      throw new HttpException(err.message, err.status, { cause: new Error(err) });
    }
  }

  getSubscriptions(whereClause: any) {
    return this.prismaService.billingDetails.findMany({
      where: whereClause,
      select: {
        id: true,
        subscriptionType: true,
        stripeExpireDate: true,
        isSubscriptionCancelled: true,
        cancellationDate: true,
        isActive: true,
        createdAt: true,
        firstPaymentFailDate: true,
        paymentAttemptCount: true,
        failureReason: true,
        billingCountry: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companies: {
              select: {
                id: true,
                name: true,
                CompanyAddress: {
                  select: {
                    id: true,
                    Country: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            },
            userRoles: {
              select: {
                roleCode: true
              }
            }
          }
        }
      }
    })
  }

  getUniqueSubscriptions() {
    return this.prismaService.billingDetails.groupBy({
      by: ['userId'],
      _min: {
        id: true,
        createdAt: true
      },
    });
  }

  updateOtp(userId: number, otp: string, otpCreatedDate: Date, sendCounts: number, checkedRemember2f: boolean) {
    return this.prismaService.twoFactorDetails.update({
      where: {
        userId: userId
      },
      data: {
        otp: otp,
        otpCreatedAt: otpCreatedDate,
        mailSendCounts: sendCounts,
        isVerified: checkedRemember2f
      }
    })
  }

async getSubUserOtpDetails(companySubUserId: number) {
    const twoFactorData = await this.prismaService.companySubUsersOtpDetails.findFirst({
      where: {
        subUserId: companySubUserId
      }
    });
    if(twoFactorData?.isActive && twoFactorData.id){
      await this.prismaService.companySubUsersOtpDetails.update({
        where: {
          id: twoFactorData.id,
          isActive: true
        },
        data:{
          isVerified: true
        }
      })
    }
    return twoFactorData;
  }

  getUsersSecuritySettingDetails(userId: number) {
    return this.prismaService.twoFactorDetails.findUnique({
      where: {
        userId: userId
      },
      select: {
        id: true,
        isActive: true
      }
    })
  }

  getApplicationSettings() {
    return this.prismaService.applicationSettings.findFirst({
      where: {
        isActive: true
      }
    });
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

  subscriptionPaymentFailed(id: number, count: number, firstPaymentFailDate: Date | null, failureReason: any) {
    return this.prismaService.billingDetails.update({
      where: {
        id: id
      },
      data: {
        paymentStatus: "failed",
        paymentAttemptCount: count + 1,
        firstPaymentFailDate: (count == 0) ? new Date() : firstPaymentFailDate,
        failureReason: failureReason
      }
    })
  }

  async getSubscribedUsers() {
    const users = await this.prismaService.billingDetails.findMany({
      where: {
        billingCountry: {
          not: null,
        }
      },
      select: {
        id: true,
        billingCountry: true,
      }
    });

    for (const user of users) {
      if (user && user.billingCountry) {
        const billingRegions: string = getRegionName(user.billingCountry)
        await this.prismaService.billingDetails.update({
          data: {
            billingRegion: billingRegions,
          },
          where: {
            id: user.id,
          }
        })
      }
    }

    await this.prismaService.billingDetails.updateMany({
      where: {
        billingCountry: null,
      },
      data: {
        billingRegion: "Other",
      }
    })



  }

  updateCustomerBillingCountry(userId: number, billingCountry: string | null) {
    return this.prismaService.billingDetails.updateMany({
      where: {
        userId: userId
      },
      data: {
        billingCountry: billingCountry
      }
    })
  }
  async findCompanyAdminUser(email: string) {
    const User = await this.prismaService.companyAdminUser.findFirst({
      where: {
        email: email,
        isDelete: false,
      },
      include:{
        CompanySubUsersOtpDetails: {
          select:{
            isActive: true,
            isVerified: true,
            otpCreatedAt: true,
            otp: true
          }
        },
      }
    });

    if (User && User.companyId) {
      const Company = await this.prismaService.companies.findFirst({
        where: {
          id: Number(User.companyId),
        },
        select: {
          user: {
            select: {
              email: true,
            }
          }
        }
      })

      const returndata = { ...Company, CompanyAdminUser: User }
      return returndata
    } else {
      throw new NotFoundException(`Cannot find user with email ${email}`);
    }
  }

  async checkEmailExist(email: string) {
    const User = await this.prismaService.companyAdminUser.count({
      where: {
        email: email,
        isDelete: false,
      }
    });

    if (!User) {
      const Company = await this.prismaService.companies.count({
        where: {
          user: {
            email: email,
            isDelete: false,
          }
        }
      });

      const returndata = Company
      return returndata
    }
    return User;
  }

  async findCompanyAdminUserById(id: number) {
    const User = await this.prismaService.companyAdminUser.findFirst({
      where: {
        id: Number(id),
        isDelete: false,
      }
    });
    if (User && User.companyId) {

      const returndata = { email: User.email, firstName: User.firstName }
      return returndata
    } else {
      throw new BadRequestException();
    }
  }

  async findPagePermissionsByGroup(groupId: number) {
    return await this.prismaService.groupPermission.findMany({
      where: {
        groupId,
      },
      orderBy: {
        pageId: 'asc',
      }
    })
  }

  async updateAdminUser(userdata: { firstName: string; LastName: string; email: string }, userId: number) {
    try {
      await this.prismaService.companyAdminUser.update({
        where: {
          id: userId,
        },
        data: userdata,
      });

      return {
        success: true,
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
    }
  }

  async updateCompanyUsersLimit(userLimit: number, userId: number) {
    try {
      await this.prismaService.users.update({
        where: {
          id: userId,
        },
        data: {
          companyUsersLimit: userLimit,
        },
      });

      return {
        success: true,
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
    }
  }


  updateSubUserOtp(id: number, otp: string, otpCreatedDate: Date, sendCounts: number, checkedRemember2f: boolean) {
    return this.prismaService.companySubUsersOtpDetails.update({
      where: {
        id: id
      },
      data: {
        otp: otp,
        otpCreatedAt: otpCreatedDate,
        mailSendCounts: sendCounts,
        isVerified: checkedRemember2f
      }
    })
  }


  async findUserPageAccess(pageId: number, userId: number) {

    return await this.prismaService.companyAdminUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        groups: {
          select: {
            permissions: {
              where: {
                pageId: pageId
              },
              select: {
                canDelete: true,
                canRead: true,
                canWrite: true,
              }
            }
          }
        }
      }
    })
  }

  createSubUserOtp(subUserId: number, otp: string, otpCreatedDate: Date, sendCounts: number) {
    return this.prismaService.companySubUsersOtpDetails.create({
      data: {
        subUserId: subUserId,
        otp: otp,
        otpCreatedAt: otpCreatedDate,
        mailSendCounts: sendCounts,
        isVerified: false
      }
    })
  }

async checkAdminUserOtp(userId: number) {
    const twoFactorData = await this.prismaService.twoFactorDetails.findFirst({
      where: {
        userId: userId
      }
    });
    if(twoFactorData?.isActive && twoFactorData.id){
      await this.prismaService.twoFactorDetails.update({
        where: {
          id: twoFactorData.id,
          isActive: true
        },
        data:{
          isVerified: true
        }
      })
    }
    return twoFactorData;
  }

  getSubUsersCountCreatedBySp() {
    return this.prismaService.companyAdminUser.count({
      where: {
        companies: {
          user: {
            isDelete: false,
            isArchieve: false,
            userRoles: {
              some: {
                roleCode: 'service_provider'
              }
            }
          }
        }
      }
    });
  }

  getSubUsersCountCreatedByBuyer() {
    return this.prismaService.companyAdminUser.count({
      where: {
        companies: {
          user: {
            isArchieve: false,
            isDelete: false,
            userRoles: {
              some: {
                roleCode: 'buyer'
              }
            }
          }
        }
      }
    });
  }

  findUniqueInvitee(id: number) {
    return this.prismaService.companyAdminUser.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
      }
    });
  }

  async updateInvitee(id: number, updatedData: Prisma.CompanyAdminUserUpdateInput) {
    try {
      const updateEmail = await this.prismaService.companyAdminUser.update({
        where: {
          id,
        },
        data: {
          ...updatedData,
        },
      });

      return updateEmail;

    } catch (error) {
      throw error;
    }
  }

  async findUniquInBillingDetails(whereClause: Prisma.BillingDetailsWhereInput) {
    return await this.prismaService.billingDetails.findFirst({
      where: whereClause
    });
  }

  async updateBillingTable(id: number, data: Prisma.BillingDetailsUpdateInput) {
    const activeSubscription = await this.prismaService.billingDetails.update({
      where: {
        id: id
      },
      data: data
    });
    if (activeSubscription && activeSubscription.id) {

    }
  }

  async updateExternalClicks(id: number) {
    const existingList = await this.prismaService.advertisements.findUnique({
      where: {
        id: id,
      },
    });
    const updateExternalClicks = existingList?.externalClicks ? existingList?.externalClicks : 0;
    const res = await this.prismaService.advertisements.update({
      where: {
        id: id,
      },
      data: {
        externalClicks: updateExternalClicks + 1,
      },
    });
  }

  async getFollowNotifications() {

    const followerUpdates = await this.prismaService.followNotifications.findMany({
      where: {
        isMailSent: false,
        updatedSection: {
          not: ''
        }
      },
      select: {
        notificationById: true,
        notificationToId: true,
        notificationDescription: true,
        type: true,
        notifyingCompany: {
          select: {
            name: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                assets: {
                  take: 1,
                  select: {
                    url: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  }
                }
              }
            }
          }
        },
        notifiedCompany: {
          select: {
            name: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });
    for (const followers of followerUpdates) {
      if (followers.notifyingCompany.user.assets.length > 0) {
        const signedUrl = await this.gcsService.getSignedUrl(
          followers.notifyingCompany.user.assets[0].url,
        );
        followers.notifyingCompany.user.assets[0].url = signedUrl;
      }
    }

    for (const announcementData of followerUpdates) {
      if (announcementData.type == 7 && announcementData.notifyingCompany.name ) {
          announcementData.notificationDescription = "Has posted an Announcement: " + announcementData.notificationDescription+".";
      }
    }
    const groupedByNotification = followerUpdates.reduce<Record<number, any[]>>((acc, notification) => {
      const { notificationToId, notificationById, notificationDescription } = notification;

      const existingNotification = acc[notificationToId]?.find(
        (n) => n.notificationById === notificationById
      );

      if (existingNotification) {
        existingNotification.notificationDescriptions.push(capitalizeFirstLetter(notificationDescription));
      } else {
        if (!acc[notificationToId]) {
          acc[notificationToId] = [];
        }
        acc[notificationToId].push({
          ...notification,
          notificationDescriptions: [capitalizeFirstLetter(notificationDescription)],
        });
      }

      return acc;
    }, {});
    return groupedByNotification;
  }
  async updateMailSent() {
    await this.prismaService.followNotifications.updateMany({
      where: {
        isMailSent: false,
      }, data: {
        isMailSent: true,
      }
    })
  }

  async updateUserDetails(userId: number, postData: { firstName: string, lastName: string, email: string }) {
    try {
      await this.prismaService.users.update({
        where: {
          id: userId,
        },
        data: postData,
      });
      return {
        success: true,
      }
    }
    catch (error) {
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }
  }

  async updateExpiredService() {
    return await this.prismaService.sponseredServices.updateMany({
      where: {
        endDate: {
          lte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        sponseredImg: {
          not: null,
        }
      },
      data: {
        sponseredImg: null,
        serviceTitle: "",
        companyId: null,
      }
    })
  }

  async insertLogInLogs(userId: number) {
    return await this.prismaService.userLogins.create({
      data: {
        userId: userId,
      }
    })
  }
  async insertInviteeLogInLogs(userId: number, companymainUserId: number) {
    return await this.prismaService.inviteeUserLogins.create({
      data: {
        userId: userId,
        adminUserId: companymainUserId,
      }
    })
  }

  async createAdminNotification(postData: AdminNotifications) {
    try {
      const lastNotification = await this.prismaService.adminNotifications.findFirst({
        orderBy: {
          notificationId: 'desc',
        },
        select: {
          notificationId: true,
        },
      });
      const companies = await this.getCompanyIds();
      if (companies.length > 0) {
        companies.map(async (companyIds: { id: number }) => {
          const createData = {
            notificationId: lastNotification ? lastNotification.notificationId + 1 : 1,
            notificationCompanyId: companyIds.id,
            notificationDescription: postData.notificationDescription,
            isDisplay: postData.isDisplay,
            isRead: false,
            isDelete: false,
            startDate: postData.startDate && postData.startDate != '' ? new Date(toLocalISOString(postData.startDate)) : null,
            endDate: postData.endDate && postData.endDate != '' ? new Date(toLocalISOString(postData.endDate)) : null,
          }
          await this.prismaService.adminNotifications.create({
            data: createData,
          });

        })
      }

      return {
        success: true,
        message: "successfully created",
      }
    } catch (err) {
      return new BadRequestException();
    }

  }

  async getCompanyIds() {
    return await this.prismaService.companies.findMany({
      where: {
        isDelete: false,
      }
    })
  }

  async getAdminNotifications() {
    try {
      return await this.prismaService.adminNotifications.findMany({
        where: {
          isDelete: false,
        },
        orderBy: {
          notificationId: 'desc',
        },
        distinct: ['notificationId'],
      });
    } catch (err) {
      return new BadRequestException();
    }
  }

  async getByIdNotifications(id: number) {
    try {
      return await this.prismaService.adminNotifications.findFirst({
        where: {
          notificationId: id,
          isDelete: false,
        },
      })
    } catch (err) {
      return new BadRequestException();
    }
  }

  async adminNotificationsUpdate(id: number, postData: AdminNotifications) {
    try {
      const updateData = {
        notificationDescription: postData.notificationDescription,
        isDisplay: postData.isDisplay,
        isDelete: false,
        startDate: postData.startDate && postData.startDate != '' ? new Date(toLocalISOString(postData.startDate)) : null,
        endDate: postData.endDate && postData.endDate != '' ? new Date(toLocalISOString(postData.endDate)) : null,
      }
      return await this.prismaService.adminNotifications.updateMany({
        where: {
          notificationId: id,
        },
        data: updateData,
      })
    } catch (err) {
      return new BadRequestException();
    }
  }

  async adminNotifiDelete(id: number) {
    try {
      return await this.prismaService.adminNotifications.deleteMany({
        where: {
          notificationId: id,
        },
      })
    } catch (err) {
      return new BadRequestException();
    }
  }

  async notificationHideAndShow(id: number) {
    try {
      const existed = await this.prismaService.adminNotifications.findFirst({
        where: {
          notificationId: id,
        },
      });
      if (existed) {
        await this.prismaService.adminNotifications.updateMany({
          where: {
            notificationId: id,
          },
          data: {
            isDisplay: !existed.isDisplay,
          }
        })
      }
      return {
        success: true,
        messege: 'Updated SuccessFully',
      }

    } catch (err) {
      return new BadRequestException();
    }
  }

  async findManualPaidUsers(startDate: string, endDate: string) {
    return this.prismaService.users.findMany({
      where: {
        isPaidUser: true,
        userType: 'paid',
        isDelete: false,
        stripeSubscriptionId: null,
        AND: [
          { accessExpirationDate: { gte: new Date(startDate) } },
          { accessExpirationDate: { lt: new Date(endDate) } }
        ],
      }
    });
  }

  async findAllUsersByEmail(emails: string[]) {
    return this.prismaService.users.findMany({
      where: {
        email: {
          in: emails
        }
      },
      select: {
        id: true,
        email: true,
        approvalStatus: true,
        userType: true
      }
    })
  }

  findFirstSubUser(
    conditions: Prisma.CompanyAdminUserWhereInput,
    selectParams?: Prisma.CompanyAdminUserSelect
  ) {
    return this.prismaService.companyAdminUser.findFirst({
      where: {
        ...conditions,
      },
      select: {
        ...selectParams
      },
    });
  }

  findCompanyUsers(searchString: string = "", filterVal: Prisma.CompanyAdminUserWhereInput[], userRole: string) {
    let whereClaure: any = {
      isDelete: false,
      OR: [
        {
          firstName: {
            mode: "insensitive",
            contains: searchString,
          },
        },
        {
          LastName: {
            mode: "insensitive",
            contains: searchString,
          },
        },
        {
          email: {
            mode: "insensitive",
            contains: searchString
          }
        },
        {
          companies: {
              name: {
                mode: "insensitive",
                contains: searchString,
              },
          },
        },
      ],
      AND: {
        OR: filterVal,
        AND: {
          companies: {
            user: {
              userRoles: {
                some: {
                  roleCode: userRole as ROLE_CODE
                }
              }
            }
          }
        }
      },
    };
  
    if (searchString.includes(" ")) {
      const fullName = searchString.split(" ");
      const firstName = fullName[0];
      const LastName = fullName[1];
      whereClaure.OR.push({
        AND: [
          {
            firstName: {
              mode: "insensitive",
              contains: firstName,
            }
          },
          {
            lastName: {
              mode: "insensitive",
              contains: LastName,
            }
          }
        ]
      });
    }

    if (userRole == 'all') {
      delete (whereClaure?.AND?.AND);
    }

    return this.prismaService.companyAdminUser.findMany({
      where: whereClaure,
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userRoles: true,
              }
            }
          }
        },
        groups: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findSixMonthTrialUsers() {
    return this.prismaService.users.findMany({
      where: {
        isPaidUser: true,
        userType: 'trial',
        isDelete: false,
        isArchieve: false,
        trialDuration: TRIAL_PERIOD.sixMonths
      },
      include: {
        userRoles: {
          select: {
            roleCode: true,
          }
        }
      }
    });
  }

  async isUserCancelledSubscriptionBefore(userId: number) {
    const cancelledSubscription = await this.prismaService.billingDetails.findFirst({
      where: {
        userId: userId,
        isSubscriptionCancelled: true,
        isActive: false,
      }
    });
    return cancelledSubscription;
  }

  async deletedUsers() {
    return await this.prismaService.users.findMany({
      where: {
        isDelete: true
      }
    })
  }

  async getOnlyNewSubscribedUsers() {
    return await this.prismaService.billingDetails.groupBy({
      by: ['userId'],
      having: {
        userId: {
          _count: {
            equals: 1,
          },
        },
      },
    });
  }

  findOneByEmailInCompanyUsers(email: string) {
    return this.prismaService.companyAdminUser.findFirst({
      where: {
        email: email
      }
    });
  }

  async checkUsersSusbscriptionAlteration(userId: number, subscriptionType: string) {
    const cancelledSubscription = await this.prismaService.billingDetails.findFirst({
      where: {
        userId: userId,
        NOT: {
          subscriptionType: subscriptionType,
        },
        isActive: false,
      }
    });
    return cancelledSubscription;
  }

  async userdCancelledThereSubscriptions(userIds: number[]) {
    const cancelledSubscription = await this.prismaService.billingDetails.findMany({
      where: {
        userId: {
          in: userIds
        },
        isSubscriptionCancelled: true,
        isActive: false,
      },
      select: {
        id: true,
        userId: true,
      }
    });
    return cancelledSubscription;
  }
async update2fa(userId: number, status: boolean, companyUser: boolean) {
  if(companyUser){
    const twoFA = await this.prismaService.companySubUsersOtpDetails.findFirst({
      where:{
          subUserId: userId,
      },
    })
    if(twoFA){
      return await this.prismaService.companySubUsersOtpDetails.update({
        where:{
            subUserId: userId,
        },
        data:{
          isVerified: status
        }
      });
    }
  } else {
    const twoFA = await this.prismaService.twoFactorDetails.findFirst({
      where:{
          userId: userId,
      },
    })
    if(twoFA){
      return await this.prismaService.twoFactorDetails.update({
        where:{
          userId: userId
        },
        data:{
          isVerified: status
        }
      });
    }
  }
  }
}
