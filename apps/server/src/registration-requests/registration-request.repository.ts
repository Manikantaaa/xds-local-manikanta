import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfirmRequest } from "./type";
import { Prisma } from "@prisma/client";

@Injectable()
export class RegistrationRequestsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  update(confirmRequest: ConfirmRequest) {
    return this.prismaService.registrationRequests.update({
      data: {
        approvalDate: new Date(),
        approvalStatus: confirmRequest.approvalStatus,
        completeSetupToken: confirmRequest.completeSetupToken,
        user: {
          update: {
            approvalStatus: confirmRequest.approvalStatus,
            adminApprovedAt: new Date(),
            passwordNeedToChange: confirmRequest.passwordNeedToChange ? confirmRequest.passwordNeedToChange : "init"
          },
        },
      },
      where: {
        id: confirmRequest.id,
      },
    });
  }

  findFirst(conditions: Prisma.RegistrationRequestsWhereInput) {
    return this.prismaService.registrationRequests.findFirst({
      where: {
        ...conditions,
      },
    });
  }

  async findAll() {
    return this.prismaService.registrationRequests.findMany({
      where: {
        NOT: {
          approvalStatus: "completed",
        },
      },
      include: {
        user: {
          include: {
            companies: true,
            userRoles: true,
          },
        },
      },
    });
  }

  async findAllByFilter(
    conditions: Prisma.RegistrationRequestsWhereInput[],
    searchString: string,
  ) {
    let whereClause: any;
    if (conditions.length > 0) {
      whereClause = {
        user: {
          isAddedFromCsv: false,
          isArchieve: false,
          isDelete: false
        },
        OR: conditions,
        AND: [
          { isDelete: false },
          {
            OR: [
              {
                user: {
                  firstName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  lastName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  email: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
            ],
          },
        ],
      };
    } else {
      whereClause = {
        user: {
          isAddedFromCsv: false,
          isArchieve: false,
          isDelete: false
        },
        AND: [
          { isDelete: false },
          {
            OR: [
              {
                user: {
                  firstName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  lastName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  email: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
            ],
          },
        ],
      };
    }

    if (searchString.includes(" ")) {
      const fullName = searchString.split(" ");
      const firstName = fullName[0];
      const lastName = fullName[1];
      if(whereClause && whereClause.AND && whereClause.AND[1]) {
        whereClause.AND[1].OR.push({
          AND: [
            {
              user: {
                firstName: {
                  mode: "insensitive",
                  contains: firstName,
                },
              },
            },
            {
              user: {
                lastName: {
                  mode: "insensitive",
                  contains: lastName,
                },
              },
            },
          ],
        })
      }
    }

    return this.prismaService.registrationRequests.findMany({
      where: whereClause,
      select: {
        id: true,
        submissionDate: true,
        approvalStatus: true,
        approvalDate: true,
        comment: true,
        isArchieve: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            linkedInUrl: true,
            userType: true,
            trialDuration: true,
            companies: {
              select: {
                id: true,
                name: true,
                website: true
              }
            }, 
            userRoles: {
              select: {
                roleCode: true
              }
            },
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });
  }
  async getreviewsCount(){
    const result1 = await this.prismaService.registrationRequests.count({
      where:{
        approvalStatus :'pending',
        isArchieve: false,
        isDelete: false,
        user:{
          isAddedFromCsv: false,
        }
      },
    });
    const result2 = await this.prismaService.registrationRequests.count({
      where:{
        approvalStatus :'underReview',
        isArchieve: false,
        isDelete: false,
        user:{
          isAddedFromCsv:false,
        }
       
      },
    });
    return {
        needsReview: result1,
        underReview: result2,
    }
  }

  getCountOfRegistrationByFilter(
    conditions: Prisma.RegistrationRequestsWhereInput[],
    searchString: string,
  ) {
    let whereClause: Prisma.RegistrationRequestsWhereInput;
    if (conditions.length > 0) {
      whereClause = {
        OR: conditions,
        AND: [
          {
            NOT: { approvalStatus: "completed" },
          },
          {
            isDelete: false,
          },
          {
            OR: [
              {
                user: {
                  firstName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  lastName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
            ],
          },
        ],
      };
    } else {
      whereClause = {
        NOT: { approvalStatus: "completed" },
        AND: [
          { isDelete: false },
          {
            OR: [
              {
                user: {
                  firstName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
              {
                user: {
                  lastName: {
                    mode: "insensitive",
                    contains: searchString,
                  },
                },
              },
            ],
          },
        ],
      };
    }
    return this.prismaService.registrationRequests.count({
      where: whereClause,
    });
  }

  deleteRegistration(id: number) {
    return this.prismaService.registrationRequests.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });
  }

  findAllDetailsByRegistrationId(id: number) {
    return this.prismaService.registrationRequests.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        user: {
          include: {
            companies: {
              select: {
                id: true,
              },
            },
            userRoles: {
              select: {
                roleCode: true
              }
            }
          },
        },
      },
    });
  }

  // findById(id: number) {
  //   return this.prismaService.registrationRequests.findUnique({
  //     where: {
  //       id: id
  //     },
  //   })
  // }

}
