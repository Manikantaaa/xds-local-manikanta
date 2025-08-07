import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { APPROVAL_STATUS, ROLE_CODE } from "@prisma/client";
import { generateSlug } from "src/common/methods/common-methods";
import { PrismaService } from "src/prisma/prisma.service";
import { UserRequestSpark } from "./type";
import { Prisma } from '@prisma/client';


@Injectable()
export class SparkPlusRepository {
  constructor(private readonly prismaService: PrismaService,
  ){}
  async createWithRole(user: UserRequestSpark) {
  
      const slugcheck = await this.checkSlugExistAndUpdate(user.companyName);
  
      const createdUser = await this.prismaService.users.create({
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
          userType:user.userType,
          isSparkUser:true,          
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
    await this.prismaService.sparkPlusUsers.create({
    data: {
      buyerId: user.buyerId, 
      sparkUserId: createdUser.id,
    },
  });

    return createdUser;
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

      
async findSparkUsersByCompany(buyerId: number) {
try {
      // Step 1: Get spark user IDs
const sparkUserIds = await this.prismaService.sparkPlusUsers.findMany({
  where: {
    buyerId: buyerId,
    isDelete: false,
  },
  select: {
    sparkUserId: true,
  },
});

// Step 2: Extract IDs and fetch user details
const ids = sparkUserIds.map((item) => item.sparkUserId);

const sparkUsers = await this.prismaService.users.findMany({
  where: {
    id: { in: ids }, // ids = sparkUserIds from SparkPlusUsers table
  },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    isArchieve:true,
    userRoles: {
      select: {
        roleCode: true,
      },
    },
    companies: {
      select: {
        name: true,
        website: true,
      },
    },
    SparkPlusUsers:{
      select:{
        isArchieve:true,
        isDelete:true,
      }
    }
  },
});


    return sparkUsers;
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


generateURLDetail(userId: number, theToken: string) {
    return this.prismaService.generatedUrls.create({
      data: {
        userId: userId,
        theToken: theToken,
        urlGeneratedDate:new Date()
      }
    });
  }

getToken(token: string) {
    return this.prismaService.generatedUrls.findFirst({
      where: {
        theToken: token
      }
    });
  }

  
async updateIsArchieveToTrue(sparkUserId: number, buyerId: number) {
  try {
     await this.prismaService.users.update({
    where: { id: sparkUserId },
    data: { isArchieve: true },
  });

  await this.prismaService.sparkPlusUsers.updateMany({
    where: {
      sparkUserId: sparkUserId,
      buyerId: buyerId, 
    },
    data: { isArchieve: true },
  });

  return { message: 'Archived successfully' };

  } catch (error) {
    throw error;
  }
}

async updateIsArchieveToFalse(sparkUserId: number, buyerId: number) {
  try {
     await this.prismaService.users.update({
    where: { id: sparkUserId },
    data: { isArchieve: false },
  });

  await this.prismaService.sparkPlusUsers.updateMany({
    where: {
      sparkUserId: sparkUserId,
      buyerId: buyerId, 
    },
    data: { isArchieve: false },
  });

  return { message: 'UnArchived successfully' };

  } catch (error) {
    throw error;
  }
}


async delete(sparkUserId: number, buyerId: number) {
  try {
    
  await this.prismaService.sparkPlusUsers.updateMany({
    where: {
      sparkUserId: sparkUserId,
      buyerId: buyerId, 
    },
    data: { isDelete: true },
  });

  return { message: 'Deleted successfully' };

  } catch (error) {
    throw error;
  }
}

findAllDetailsByRegistrationId(id: number) {
    return this.prismaService.registrationRequests.findFirst({
      where: {
        userId: id,
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

  
}