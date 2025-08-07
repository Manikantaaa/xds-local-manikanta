import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CronJobsRepository {

  constructor(private readonly prismaService: PrismaService){}

  async deleteOldNotifications(oldDate: string) {
    await this.prismaService.generalNotifications.deleteMany({
      where: {
        createdAt: {
          lte: new Date(oldDate + "T00:00:00Z")
        }
      }
    });
    await this.prismaService.followNotifications.deleteMany({
      where: {
        createdAt: {
          lte: new Date(oldDate + "T00:00:00Z")
        }
      }
    });
  }

  async sendMailForProfileCompletion() {
    return await this.prismaService.companies.findMany({
      where:{
        profileCompleted: false,
        NewUpdatedUsers: {
          none: {
            // No condition here means it checks for the absence of any record in NewUpdatedUsers for the company
          },
        },
        user:{
          userRoles:{
            some:{roleCode: 'service_provider'}
          },
          isPaidUser: true,
        }
      },
      select:{
        id: true,
        name: true,
        user:{
          select:{ 
          email: true,
          firstName: true,
          lastName: true,
            firstLoggedDate: true,
          }
        }
      },
    })
  }

  async sendMailForCompanyProfileCompletion() {
    return await this.prismaService.billingDetails.findMany({
      where:{
        message: "New subscription created",
        isActive: true,
        paymentStatus: 'succeeded',
        user:{
          companies:{
            some:{
              profileCompleted: false,
              NewUpdatedUsers: {
                none: {
                  // No condition here means it checks for the absence of any record in NewUpdatedUsers for the company
                },
              },}
          },
          userRoles:{
            some:{roleCode: 'service_provider'}
          },
          isPaidUser: true,
        }
      },
      select:{
        id: true,
        userId: true,
        message: true,
        createdAt: true,
        user:{
          select:{
            companies:{
              select:{
                id: true,
                name: true,
                profileCompleted: true,
              }
            },
            email: true,
            firstName: true,
            lastName: true,
            firstLoggedDate: true,
          }
        }
      },
      orderBy:{
        updatedAt: 'desc',
      }
    })
  }

  async findAllCompanyIds(){
    return await this.prismaService.companies.findMany({
      where:{
        isDelete: false,
        isArchieve: false,
        user:{
          userRoles: {
            some: {
              roleCode: "service_provider",
            },
          }
        }
      },
      select:{
        id: true,
      }
    })
  }
  async findDuplicateServices(companyId: number){
    const originalServ = await this.prismaService.servicesOpt.findMany({
      where:{
        companyId: companyId,
        serviceId:{
          not: null,
        },
        capabilityId: null,
      },
      select:{
        serviceId: true,
      }
    })

    if (originalServ.length > 0) {
      // const originalServIds = originalServ.map(serv => serv.serviceId != null && serv.serviceId);
      const originalServIds = originalServ
      .map(serv => serv.serviceId)
      .filter((id): id is number => id !== null); 
      const affectedCompanies = await this.prismaService.servicesOpt.findMany({
        where: {
          companyId: companyId,
          serviceId: { notIn: originalServIds },
          capabilityId: {
            not: null,
          },
        },
      });
      const affectedCompanyIds = affectedCompanies.map(serv => serv.companyId);
      const updateResult = await this.prismaService.servicesOpt.updateMany({
        where: {
          companyId: companyId,
          serviceId: { notIn: originalServIds },
          capabilityId: {
            not: null,
          },
        },
        data: {
          isDelete: true,
        },
      });
      
      // Return the affected company IDs if any records were updated
      if (updateResult.count > 0) {
        return affectedCompanyIds;
      }
    }
  }
}

