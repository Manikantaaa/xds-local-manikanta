import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateGroupPermissionDto } from "./dto/group-permission.dto";
import { APPROVAL_STATUS, Prisma, ROLE_CODE } from "@prisma/client";
@Injectable()
export class CompaniesAdminRepository {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async creatCompanyUser(PostData: any, CompanyId: number) {
        try {
            await this.prismaService.companyAdminUser.create({
                data: { ...PostData, email: (PostData.email || '').trim().toLowerCase(), groupId: Number(PostData.groupId), companyId: CompanyId },
            });
            return {
                success: true,
            }
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    async updateCompanyAdminUser(PostData: {teamandstudio: string; groupId: string}, userId: number, companyId: number) {
        try {
            await this.prismaService.companyAdminUser.update({
                where:{
                    id: userId,
                    companyId: companyId,
                },
                data: {teamandstudio: PostData.teamandstudio, groupId: Number(PostData.groupId)},
            });
            return {
                success: true,
            }
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    async checkCompanyUserLimit(CompanyId: number) {
        try {
            const CompanyUsers = await this.prismaService.companyAdminUser.count({
                where: {
                    companyId: CompanyId,
                }
            });
            const CompanyUsersLimit = await this.prismaService.companyAdminUser.findFirst({
                where: {
                    companyId: CompanyId,
                }, 
                select:{
                    companies:{
                        select:{
                            user:{
                                select:{
                                    companyUsersLimit: true,
                                }
                            }
                        }
                    }
                }
            });
            return {CompanyUsers: CompanyUsers, CompanyUsersLimit: CompanyUsersLimit?.companies?.user.companyUsersLimit || 4};
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
    async checkCompanyUserEmail(email: string) {
        try {
            const CompanyUsers = await this.prismaService.companyAdminUser.count({
                where: {
                    email: email,
                    isDelete: false,
                }
            });
            if (CompanyUsers > 0) {
                return CompanyUsers;
            }
            const checkInCompanies = await this.prismaService.users.count({
                where: {
                    email: email,
                    isDelete: false,
                }
            });
            return checkInCompanies;

        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    async deletCompanyUser(userId: number, companyId: number, email: string = "") {
        try {
            email && email != "" && await this.prismaService.companyAdminUserTokens.deleteMany({
              where: {
                email: email,
              }
            });
            await this.prismaService.companyAdminUser.delete({
                where: {
                    id: Number(userId),
                    companyId: companyId,
                },
            });
            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, error.StatusCode)
        }
    }

    async assignUserToGroup(userId: number[], groupId: number, companyId: number) {
        try {
            await this.prismaService.companyAdminUser.updateMany({

                where: {
                    id: { in: userId },
                    companyId: Number(companyId),
                },
                data: {
                    groupId: Number(groupId),
                }
            });

            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, error.StatusCode)
        }
    }
    async removeUserFromGroup(userId: number, groupId: number, companyId: number) {
        try {
            await this.prismaService.companyAdminUser.update({
                where: {
                    id: Number(userId),
                    companyId: Number(companyId),
                },
                data: {
                    groupId: null,
                }
            });

            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, error.StatusCode)
        }
    }

    async updateGroupPermission(PostData: UpdateGroupPermissionDto[], groupId: number, companyId: number) {
        try {
            const groupPermissionId = await this.prismaService.groupPermission.findFirst({
                where: {
                    groupId: Number(groupId),
                    group:{
                        companyId: companyId,
                    }
                },
                select:{
                    groupId: true,
                }
            });

            if(!groupPermissionId) {
                throw new HttpException('Unauthenticated user', HttpStatus.BAD_GATEWAY)
            }
            await this.prismaService.groupPermission.deleteMany({
                where: {
                    groupId: Number(groupId),
                    group:{
                        companyId: companyId,
                    }
                }
            });
             
            const InsertData = PostData.map((page) => ({
                ...page,
                groupId: Number(groupId)
            }));
            await this.prismaService.groupPermission.createMany({
                data: InsertData,
            });
            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async findGroupPersmissions(groupId: number, companyId: number, usertype: string) {
        try {
            const checkGroup = await this.prismaService.companyAdminGroups.findFirst({
                where:{
                    id: groupId,
                    companyId: companyId,
                }
            })
            if(usertype == "admin" || checkGroup) {
                const pagePermissions = await this.prismaService.pages.findMany({
                    where: {
                        id: {
                            gt: 11,
                        },
                    },
                    include: {
                        permissions: {
                            where: {
                                groupId
                            },
                            select: {
                                canDelete: true,
                                canRead: true,
                                canWrite: true,
                                pageId: true,
                            }
                        }
                    },
                    orderBy:{
                        pageViewOrder: "asc",
                    }
                });
                return pagePermissions;
            } else {
                throw new HttpException('Permissions not found by gruop', HttpStatus.BAD_GATEWAY)
            }
            //    return await this.prismaService.groupPermission.findMany({
            //         where:{
            //             groupId: groupId,
            //         },
            //         include:{
            //             page:{
            //                 select:{
            //                     name: true,
            //                 }
            //             }
            //         }
            //     });
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async findAllPages() {
        try {
            return await this.prismaService.pages.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy:{
                    pageViewOrder: "asc"
                }
            })
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    //Group
    createCompanyGroup(PostData: any, CompanyId: number) {
        try {
            this.prismaService.companyAdminGroups.create({
                data: {
                    name: PostData.name,
                    companyId: CompanyId,
                }
            });
            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async updateCompanyGroup(PostData: any, groupId: number, CompanyId: number) {
        try {
            await this.prismaService.companyAdminGroups.update({
                where: {
                    id: groupId,
                    companyId: CompanyId,
                },
                data: {
                    name: PostData.name,
                }
            })
            return {
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async findGroupByCompany(companyId: number) {
        try {
            return await this.prismaService.companyAdminGroups.findMany({
                where: {
                    companyId,
                },
                select: {
                    isDefault: true,
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            companyadminuser: true
                        }
                    }
                },
                orderBy: {
                    id: "asc"
                }
            })
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }

    }

    async findGroupUser(groupId: number, companyId: number) {
        try {
            return await this.prismaService.companyAdminUser.findMany({
                where: {
                    groupId,
                    companyId,
                    isDelete: false,
                },
                include: {
                    groups: {
                        select: {
                            name: true,
                        }
                    }
                }
            })
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }
    async findUsersByCompany(companyId: number, isAdmin: boolean) {
        try {
            const data = await this.prismaService.companyAdminUser.findMany({
                where: {
                    companyId: Number(companyId)
                },
                select: {
                    createdAt: true,
                    firstName: true,
                    LastName: true,
                    email: true,
                    id: true,
                    teamandstudio: true,
                    groupId: true,
                    groups: {
                        select: {
                            name: true,
                        }
                    },
                    companies:{
                        select:{
                            id: true,
                            user:{
                                select:{
                                    userRoles:{
                                        select:{
                                            roleCode: true,
                                        }
                                    },
                                    firstName: true,
                                    lastName: true,
                                    companyUsersLimit: true,
                                    id: true,
                                }
                            }
                        }
                    }
                }
            });
            const userCount = await this.prismaService.companyAdminUser.count({
                where:{
                    companyId: Number(companyId)
                }
            });
            const userLimit = await this.prismaService.companies.findFirst({
                where:{
                    id: Number(companyId),
                },
                select:{
                    user:{
                        select:{
                            id: true,
                            companyUsersLimit: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            createdAt: true,
                        }
                    }
                }
            })
            return {data, userCount: userCount, userLimit: userLimit?.user}
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async findCompanyUserById(userId: number, companyId: number) {
        try {
            return this.prismaService.companyAdminUser.findFirst({
                where: {
                    id: Number(userId),
                    companyId: Number(companyId),
                },
                select: {
                    id: true,
                    firstName: true,
                    LastName: true,
                    groupId: true,
                    teamandstudio: true,
                    email: true,
                }
            })
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    async createGroupsforAllUser() {
        const AllCompanies = await this.prismaService.companies.findMany({
            where: {
                isArchieve: false,
                isDelete: false,
            },
            select: {
                id: true,
            }
        });
        const result = AllCompanies.flatMap((company) => [
            { name: 'Admin', companyId: company.id },
            { name: 'Standard', companyId: company.id },
        ]);

        await this.prismaService.companyAdminGroups.createMany({ data: result });

        return {
            success: true,
        }
    }

    async createPermissionsForall() {
        const groupsData = await this.prismaService.companyAdminGroups.findMany({
            select: {
                id: true,
                name: true,
            }
        });

        const permissionData = groupsData.flatMap((page) => {
            const boolenaValue = true;
            return [
                { groupId: page.id, pageId: 12, canRead: boolenaValue, canWrite: boolenaValue, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 13, canRead: boolenaValue, canWrite: boolenaValue, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 14, canRead: boolenaValue, canWrite: boolenaValue, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 15, canRead: boolenaValue, canWrite: boolenaValue, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 16, canRead: page.name == "Admin" ? boolenaValue : false, canWrite: page.name == "Admin" ? boolenaValue : false, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 17, canRead: page.name == "Admin" ? boolenaValue : false, canWrite: page.name == "Admin" ? boolenaValue : false, canDelete: page.name == "Admin" ? boolenaValue : false },
                { groupId: page.id, pageId: 18, canRead: boolenaValue, canWrite: boolenaValue, canDelete: page.name == "Admin" ? boolenaValue : false }
            ];
        });

        await this.prismaService.groupPermission.createMany({
            data: permissionData
        });

        return {
            success: true
        }
    }
    async NewPagePermissionsForall(pageId: number) {
        const groupsData = await this.prismaService.companyAdminGroups.findMany({
            select: {
                id: true,
                name: true,
            }
        });

        const permissionData = groupsData.flatMap((page) => {
            const boolenaValue = page.name == "Admin" ? true : false;
            return [
                { groupId: page.id, pageId: pageId, canRead: boolenaValue, canWrite: boolenaValue, canDelete: boolenaValue }];
        });

        await this.prismaService.groupPermission.createMany({
            data: permissionData
        });

        return {
            success: true
        }
    }

    async getGroupName(id: number, companyId: number) {
        try {
            return await this.prismaService.companyAdminGroups.findFirst({
                where: {
                    id: id,
                    companyId: companyId,
                },
                select: {
                    name: true,
                }
            });
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    // async checkPermissions(id: number) {
    //     try {
    //         const groupIds = await this.prismaService.companyAdminGroups.findMany({
    //             where: {
    //                 companyId: id,
    //             },
    //             select: {
    //                 id: true,
    //             },
    //         });

    //         let checkPer = false;
    //         if (groupIds) {
    //             for (const group of groupIds) {
    //                 const checking = await this.prismaService.groupPermission.findFirst({
    //                     where: {
    //                         groupId: group.id,
    //                     },
    //                 });

    //                 if (!checking) {
    //                     checkPer = true;
    //                     break;
    //                 }
    //             }

    //             return checkPer;
    //         } else {
    //             return checkPer;
    //         }
    //     } catch (error) {
    //         throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
    //     }
    // }

    async getInviteeById(id: number) {
        try {
            const result = await this.prismaService.companyAdminUser.findFirst({
                where: {
                    isDelete: false,
                    id: id
                },
                select: {
                    id: true,
                    firstName: true,
                    LastName: true,
                    email: true,
                    createdAt: true,
                    isArchieve: true,
                    companies: {
                        select: {
                            id: true,
                            name: true,
                            website: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    userRoles: {
                                        select: {
                                            roleCode: true,
                                        }
                                    }
                                }
                            },
                            CompanyAdminGroups: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            },
                        }
                    },
                    groups: {
                        select: {
                            name: true,
                        }
                    }
                }
            })
            return {
                data: result,
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }
    async updateArchiveStatusAdminUser(id: number, type: string, email: string = "") {
        try {
            if (type == 'delete') {
                email && email != "" && await this.prismaService.companyAdminUserTokens.deleteMany({
                  where: {
                    email: email,
                  }
                });
                await this.prismaService.companyAdminUser.delete({
                    where: {
                        id,
                    }
                });
                return {
                    data: 'Deleted Successfully',
                    success: true,
                }
            } else {
                const result = await this.prismaService.companyAdminUser.findFirst({
                    where: {
                        id: id,
                    },
                });
                if (result) {
                    await this.prismaService.companyAdminUser.update({
                        where: {
                            id,
                        },
                        data: {
                            isArchieve: !result.isArchieve,
                        }
                    })
                }
                return {
                    data: 'Updated Successfully',
                    success: true,
                }
            }

        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }


    findUsers(searchString: string = "", filterVal: Prisma.CompanyAdminUserWhereInput[], userRole: string) {

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
        }

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
            })
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

    async findCompanyUser(userId: Number) {
        try {
            return this.prismaService.companyAdminUser.findFirst({
                where: {
                    id: Number(userId),
                },
                select: {
                    id: true,
                    firstName: true,
                    LastName: true,
                    groupId: true,
                    teamandstudio: true,
                    email: true,
                }
            })
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY)
        }
    }

    findRegularUsers(searchString: string = "", filterVal: Prisma.UsersWhereInput[], userRole: string) {
    
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
}