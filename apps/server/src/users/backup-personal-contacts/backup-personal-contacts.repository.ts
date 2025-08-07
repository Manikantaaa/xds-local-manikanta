import { HttpException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class BackupPersonalContactsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: Prisma.BackupPersonalContactsCreateManyInput) {
    return this.prismaService.backupPersonalContacts.create({
      data: {
        ...data,
      },
    });
  }

  findFirstByUserId(userId: number) {
    return this.prismaService.backupPersonalContacts.findFirst({
      where: {
        userId,
      }
    });
  }

  async findFirstByToken(token: string) {
    const Company =  await this.prismaService.backupPersonalContacts.findFirst({
      where: {
        passwordToken: token
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if(!Company){
      const CompanyUsers = await this.prismaService.companyAdminUserTokens.findFirst({
        where:{
          token:token
        },
        select:{
          companyAdminUser:{
            select:{
              email: true,
            }
          }
        }
      })
      return CompanyUsers;
    }
    return Company;
  }

  update(
    backupPersonalContactId: number,
    data: Prisma.BackupPersonalContactsUpdateInput,
  ) {
    return this.prismaService.backupPersonalContacts.update({
      data: {
        ...data,
      },
      where: {
        id: backupPersonalContactId,
      },
    });
  }

  async saveOldEmailRepo(userId: number, oldEmail:string, updatedEmail: string){
    try{
      await this.prismaService.oldPrimaryEmail.create({
        data:{
          userId: Number(userId),
          updatedEmail: updatedEmail,
          oldEmail: oldEmail,
        }
      })
    }catch(error){
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }
  }

  findAuthDetailsOfUserById(userId: number) {
    return this.prismaService.twoFactorDetails.findUnique({
      where: {
        userId: userId
      }
    })
  }

  createAuthDetailsForUser(userId: number, isAllowed: boolean) {
    return this.prismaService.twoFactorDetails.create({
      data: {
        userId: userId,
        isActive: isAllowed,
        isVerified: isAllowed
      }
    })
  }

  updateTwoFactorDetails(userId: number, isAllowed: boolean) {
    return this.prismaService.twoFactorDetails.update({
      where: {
        userId: userId
      },
      data: {
        userId: userId,
        isActive: isAllowed,
        isVerified: isAllowed
      }
    })
  }

  getSubUser2FADetails(companySubUserId: number) {
    return this.prismaService.companySubUsersOtpDetails.findFirst({
      where: {
        subUserId: companySubUserId
      }
    });
  }

  createSubUserOtp(subUserId: number, isAllowed: boolean) {
    return this.prismaService.companySubUsersOtpDetails.create({
      data: {
        subUserId: subUserId,
        isActive: isAllowed,
        isVerified: isAllowed
      }
    })
  }

  updateSubUserOtp(subUserId: number, isAllowed: boolean) {
    return this.prismaService.companySubUsersOtpDetails.update({
      where: {
        subUserId: subUserId
      },
      data: {
        isActive: isAllowed,
        isVerified: isAllowed
      }
    })
  }

}
