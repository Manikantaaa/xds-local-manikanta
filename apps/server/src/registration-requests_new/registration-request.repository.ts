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
    start: number,
    limit: number,
    conditions: Prisma.RegistrationRequestsWhereInput[],
  ) {
    let whereClause: Prisma.RegistrationRequestsWhereInput;
    if (conditions.length > 0) {
      whereClause = {
        OR: conditions,
        AND: [{ NOT: { approvalStatus: "completed" } }, { isDelete: false }],
      };
    } else {
      whereClause = {
        NOT: { approvalStatus: "completed" },
        AND: [{ isDelete: false }],
      };
    }

    return this.prismaService.registrationRequests.findMany({
      where: whereClause,
      skip: start,
      take: limit,
      include: {
        user: {
          include: {
            companies: true,
            userRoles: true,
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

  getCountOfRegistrationByFilter(
    conditions: Prisma.RegistrationRequestsWhereInput[],
  ) {
    let whereClause: Prisma.RegistrationRequestsWhereInput;
    if (conditions.length > 0) {
      whereClause = {
        OR: conditions,
        AND: [{ NOT: { approvalStatus: "completed" } }, { isDelete: false }],
      };
    } else {
      whereClause = {
        NOT: { approvalStatus: "completed" },
        AND: [{ isDelete: false }],
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
        user: {
          include: {
            companies: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }
}
