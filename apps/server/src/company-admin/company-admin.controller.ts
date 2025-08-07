import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, ParseIntPipe, Put, BadRequestException, Res, Query } from '@nestjs/common';
import { CompanyAdminService } from './company-admin.service';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { LoggedInUser } from 'src/companies/dtos/login-user.dto';
import { encodeMailcheckResponse, formatDate, generateRandomPassword, getRoleString, getUserTypeString } from 'src/common/methods/common-methods';
import { MailerService } from 'src/mailer/mailer.service';
import { UpdateGroupPermissionDto } from './dto/group-permission.dto';
import admin from "firebase-admin";
import { Public } from 'src/common/decorators/public.decorator';
import { Parser } from "json2csv";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CustomResponse } from 'src/common/types/custom-response.dto';
import { $Enums, Prisma } from '@prisma/client';
import { sanitizeData } from 'src/common/utility/sanitizedata';

@ApiBearerAuth()
@ApiTags("Company Admin")
@Controller('company-admin')
export class CompanyAdminController {
  constructor(private readonly companyAdminService: CompanyAdminService,
    private readonly mailerService: MailerService,
  ) { }


  @Post('create-company-user')
  @ApiOperation({ summary: "Creating company user by company admin", description: 'This endpoint allows a company admin to create a new user within the company. The admin must provide the necessary details such as user information and roles in the request body. The created user will be associated with the company managed by the admin, and the response will include the newly created user\'s details. This is typically used to onboard new employees or team members under the company\'s management.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        LastName: { type: 'string' },
        email: { type: 'string' },
        teamandstudio: { type: 'string' },
        groupId: { type: 'string' },
      },
      required: ['firstName', 'LastName', 'email', 'groupId'],
    },
  })
  async createCompanyUser(@Body() PostData: any, @CurrentUser() User: LoggedInUser) {
    try {
      //check User Email Existance
      PostData = sanitizeData(PostData);
      const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      const mailFormatCheck = pattern.test(PostData.email);
      if (!mailFormatCheck) {
        throw new BadRequestException('Invalid email address');
      }
      const UserEmailCheck = await this.companyAdminService.checkUserEmail(PostData.email.trim().toLowerCase());
      if (UserEmailCheck > 0) {
        throw new BadRequestException('The email address cannot be used at this time. Please check the address and try again.');
      }

      // Create In Firebase
      const randomPassword = generateRandomPassword();
      await admin.auth().createUser({
        email: PostData.email.trim().toLowerCase(),
        password: randomPassword,
      });
      
      //Check FreeUser and Users Limit
      const ExistingUsers = await this.companyAdminService.checkUserLimit(User.companies[0].id)
      if ((User.isPaidUser && ExistingUsers.CompanyUsers > ExistingUsers.CompanyUsersLimit - 1) || !User.isPaidUser) {
        throw new BadRequestException('You have reached the maximum allocated number of accounts.');
      }
      const returnData = await this.companyAdminService.createCompanyUser(PostData, User.companies[0].id);

      await this.mailerService.sendPasswordtoCompanyUsers({
        email: PostData.email.trim().toLowerCase(),
        adminFirstName: User.firstName,
        adminLastName: User.lastName,
        userFirstName: PostData.firstName,
        userLastName: PostData.LastName,
        password: randomPassword,
      });
      return returnData;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message, err.status);
      }
    }
  }

  @Put('update-company-user/:userId')
  @ApiOperation({
    summary: 'Update an existing company user by the company admin',
    description: 'This endpoint allows a company admin to update the details of an existing user within the company. The admin can modify user information such as name, role, permissions, or other relevant details. The user to be updated is identified by their user ID, which should be provided in the URL or request body. Upon success, the updated user details will be returned in the response. This is used when an admin needs to manage or change the profile of company users.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teamandstudio: { type: 'string' },
        groupId: { type: 'string' },
      },
      required: ['groupId'],
    },
  })
  updateCompanyAdminUser(
    @Body() PostData: { teamandstudio: string; groupId: string },
    @Param('userId') userId: number,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      return this.companyAdminService.updateCompanyAdminUser(PostData, +userId, user.companies[0].id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @ApiExcludeEndpoint()
  @Get('check-user-email/:useremail')
  @ApiOperation({ summary: "Checking user email is existed or not" })
  async validateEmailExistance(@Param('useremail') useremail: string) {
    try{
      const isMail = await this.companyAdminService.checkUserEmail(useremail);
      return encodeMailcheckResponse(isMail > 0)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Get('/findCompanyUsers')
  @ApiOperation({
    summary: 'Retrieve all users within the company',
    description: 'This endpoint allows a company admin or an authorized user to retrieve a list of all users associated with the company. It returns detailed information about each user, such as their roles, permissions, and other relevant profile details. This can be useful for managing users, reviewing company-wide user information, or conducting audits of user access within the company.'
  })
  findCompanyUsers(@CurrentUser() user: LoggedInUser) {
    try {
    return this.companyAdminService.findCompanyUsers(user?.companies[0].id)
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }                                     
  }

  @Get('/findCompanyUser/:userId')
  @ApiOperation({
    summary: 'Retrieve details of a specific company user by their User ID',
    description: 'This endpoint allows a company admin or an authorized user to retrieve detailed information about a specific user within the company. The user is identified by their User ID, which is passed as a URL parameter. The response includes details such as the user\'s profile information, roles, and permissions. This can be useful for reviewing or managing a particular user\'s account and access within the company.'
  })
  findCompanyUser(@Param('userId') userId: number, @CurrentUser() user: LoggedInUser) {
    try{
    return this.companyAdminService.findCompanyUserById(userId, user.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }

  @Get('/findUserProfile/')
  @ApiOperation({
    summary: 'Retrieve profile details of the currently logged-in user',
    description: 'This endpoint allows the currently authenticated user to retrieve their own profile information. The user is identified based on the authentication token or session, and no additional parameters are required. The response includes details such as the user\'s profile information, roles, permissions, and other relevant data. This is useful for users who want to view or update their personal account details.'
  })
  findUserProfile(@CurrentUser() user: LoggedInUser) {
    try {
    return this.companyAdminService.findCompanyUserById(user.CompanyAdminId, user.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
}

  @Delete('delete-company-user/:userId')
  @ApiOperation({
    summary: 'Delete a specific company user by their User ID',
    description: 'This endpoint allows a company admin to delete a user from the company by specifying the user\'s ID in the URL. The user will be permanently removed from the system, along with their associated roles and permissions. This action should be used with caution, as it cannot be undone. The `userId` is passed as a URL parameter to identify the user to be deleted.'
  })
  async deleteCompanyUser(@Param() ParamData: { userId: number }, @CurrentUser() user: LoggedInUser) {
    try {
      const UserEmail = await this.findCompanyUser(ParamData.userId, user);
      if (UserEmail) {
        await this.companyAdminService.deleteCompanyUser(ParamData.userId, user.companies[0].id, UserEmail?.email);
        await this.mailerService.sendCompanyUserRemovingMail({
          email: UserEmail.email,
          firstName: UserEmail.firstName,
          lastName: UserEmail.LastName,
        });
        return {
          status: HttpStatus.OK,
          success: true,
          message: 'User deleted successfully',
        }
      }
      throw new HttpException("Email not found", HttpStatus.NOT_FOUND);
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Post('assign-userto-group/:groupId')
  @ApiOperation({
    summary: 'Assign a user to a specific group',
    description: 'This endpoint allows a company admin or an authorized user to assign a user to a specific group. The group is identified by the `groupId` passed as a URL parameter, and the user details are provided in the request body. The user will then be added to the specified group, granting them the group’s associated permissions and roles. This is commonly used for managing team structures or granting access to resources based on group membership.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
      },
      required: ['userId'],
    },
  })
  assignUsertoGroup(
    @Body('userId') userId: number[],
    @Param('groupId') groupId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
    return this.companyAdminService.assignUserToGroup(userId, groupId, user.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }



  @Get('remove-userfrom-group/:userId/:groupId')
  @ApiOperation({
    summary: 'Remove a user from a specific group',
    description: 'This endpoint allows a company admin or an authorized user to remove a user from a specified group. The user is identified by the `userId` and the group by the `groupId`, both of which are passed as URL parameters. Once the user is removed from the group, they will lose any permissions or roles associated with that group. This operation is useful for managing group memberships and revoking access to certain resources or permissions within the company.'
  })
  removeUserfromGroup(
    @Param('userId') userId: number,
    @Param('groupId') groupId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try{
    return this.companyAdminService.removeUserFromGroup(userId, groupId, user.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }



  @Post('group-permission/:groupId')
  @ApiBody({ type: [UpdateGroupPermissionDto] })
  @ApiOperation({
    summary: 'Assigning permissions to a group',
    description: 'This endpoint allows updating permissions (read, write, delete) for a specified group by providing an array of page-specific permissions.'
  })
  updateGroupPermissions(@Body() PostData: UpdateGroupPermissionDto[], @Param('groupId') groupId: number, @CurrentUser() user: LoggedInUser) {
    try{
      return this.companyAdminService.updateGroupPermissions(PostData, groupId, user.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Get('find-groups-permissions/:groupId')
  @ApiOperation({
    summary: 'Get group permissions by Group ID',
    description: 'This endpoint retrieves the permissions (read, write, delete) associated with a specific group. The group is identified by its ID, which should be passed as a URL parameter. The response will include the permissions for each page the group has access to, allowing clients to determine the group\'s level of access across different pages or resources.'
  })
  findGroupPermissions(@Param('groupId', ParseIntPipe) groupId: number, @CurrentUser() user: LoggedInUser,) {
    try{
      return this.companyAdminService.findGroupPermissions(groupId, user.companies[0].id, user.userRoles[0].roleCode);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  // @Get('findPages')
  // @ApiExcludeEndpoint()
  // findPages() {
  //   return this.companyAdminService.findAllPages();
  // }

  //group Crud
  @Post('create-group')
  @ApiOperation({
    summary: 'Create a new group within the company',
    description: 'This endpoint allows a company admin or an authorized user to create a new group within the company. The request body requires a `name` field, which specifies the name of the group to be created. Once the group is created, it can be used to manage users and assign permissions or roles. The response will return the details of the newly created group, including its ID and name.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Standard',
          description: 'The name of the group to be created'
        }
      },
      required: ['name'],
    }
  })
  createGroup(@Body() PostData: any, @CurrentUser() User: LoggedInUser) {
    try {
    return this.companyAdminService.createCompanyGroup(PostData, User?.companies[0]?.id)
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Get('find-admin-groups')
  @ApiOperation({
    summary: 'Retrieve groups for the logged-in company admin',
    description: 'This endpoint retrieves all groups associated with the currently logged-in company admin. The admin is identified based on the current user\'s session, and the company ID is derived from the user\'s profile. The response will include the list of groups that the admin is responsible for within the company.'
  })
  findCompanyAdmin(@CurrentUser() User: LoggedInUser) {
    try {
    return this.companyAdminService.findCompanyAdminGroups(User.companies[0].id)
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Put('update-group/:groupId')
  @ApiOperation({
    summary: 'Update group details by Group ID',
    description: 'This endpoint allows a company admin or authorized user to update the details of an existing group. The group is identified by the `groupId`, which is passed as a URL parameter. The request body should contain the updated group data, such as the name or other relevant details. The response will return the updated group details after the changes have been successfully applied.'
  })
  @ApiParam({ name: 'groupId', required: true, description: 'The ID of the group to be updated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Updated Group Name',
          description: 'The new name of the group'
        },
      },
      required: ['name'],
    }
  })
  updateGroup(@Body() PostData: any, @Param('groupId', ParseIntPipe) groupId: number, @CurrentUser() User: LoggedInUser) {
    try{
      return this.companyAdminService.updateGroup(PostData, groupId, User.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
}

  @Get('find-group-users/:groupId')
  @ApiOperation({
    summary: 'Retrieve all users associated with a specific group',
    description: 'This endpoint allows a company admin or authorized user to fetch a list of all users that belong to a specified group, identified by the `groupId` passed as a URL parameter. The response will include detailed information about each user, including their roles and permissions within the group.'
  })
  findGroupUser(@Param('groupId', ParseIntPipe) groupId: number, @CurrentUser() User: LoggedInUser) {
    try{
      return this.companyAdminService.findGroupUser(groupId, User.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Get('get-group-name/:groupId')
  @ApiOperation({
    summary: 'Retrieve the name of a specific group',
    description: 'This endpoint allows a company admin or authorized user to fetch the name of a group identified by the `groupId` passed as a URL parameter. The response will return the group’s name, enabling users to confirm group details or for use in other operations.'
  })
  async getGroupName(@Param('groupId') groupId: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try{
      return this.companyAdminService.getGroupName(+groupId, loggedUser.companies[0].id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Public()
  @Get('create-groups-forallusers')
  @ApiExcludeEndpoint()
  createGroupsfor() {

    return;
    return this.companyAdminService.createGroupsforAllUser();
  }

  @Public()
  @ApiExcludeEndpoint()
  @Get('create-permissions-forallusers')
  createPermissionsForall() {
    return;
    return this.companyAdminService.createPermissionsAllgroups();
  }

  @Public()
  @ApiExcludeEndpoint()
  @Get('newpage-permisisons-forallusers/:pageId')
  NewPagePermissionsForall(@Param('pageId') pageId: number) {
    return;
    // return this.companyAdminService.newPagePermissionsForall(Number(pageId));
  }



  // Admin API's
  //-------------------

  @Get('get-invitee-by-id/:id')
  @ApiOperation({
    summary: 'Retrieve invitee details by their ID',
    description: 'This endpoint allows an admin or authorized user to fetch the details of a specific invitee, identified by the `id` passed as a URL parameter. The response will include information about the invitee, such as their name, email, and status within the system.'
  })
  getInviteeById(@Param('id') id: number, @CurrentUser() User: LoggedInUser) {
   try{
    if (User.userRoles[0].roleCode != $Enums.ROLE_CODE.admin) {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
    }
    return this.companyAdminService.getInviteeById(+id);
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Get('update-arcive-status/:id')
  @ApiOperation({
    summary: 'Archive an invitee user by their ID',
    description: 'This endpoint allows an admin or authorized user to archive a specific invitee, identified by the `id` passed as a URL parameter. Archiving an invitee marks them as inactive, preventing further interactions or updates. The response confirms the updated archive status of the invitee.'
  })
  updateArchiveStatusAdminUser(@Param('id') id: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
    }
    return this.companyAdminService.updateArchiveStatusAdminUser(+id, 'update');
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
 }

  @Delete('delete-admin-user/:id')
  @ApiOperation({ 
    summary: 'Delete an admin user by their ID', 
    description: 'This endpoint allows a company admin or authorized user to permanently delete an admin user from the system. The admin user is identified by their `id`, which is passed as a URL parameter. Once deleted, the admin user will be removed from the system, and their access and permissions will be revoked.' 
  })
  async deleteAdminUser(@Param('id') id: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
      }
      const UserEmail = await this.companyAdminService.findCompanyUser(+id);
      if (UserEmail) {
        await this.companyAdminService.updateArchiveStatusAdminUser(+id, 'delete', UserEmail.email);
        await this.mailerService.sendCompanyUserRemovingMail({
          email: UserEmail.email,
          firstName: UserEmail.firstName,
          lastName: UserEmail.LastName,
        });
        return {
          status: HttpStatus.OK,
          success: true,
          message: 'User deleted successfully',
        }
      }
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }


  @Get("export-excel-data")
  @ApiExcludeEndpoint()
  async exportDataToCsv(
    @CurrentUser() loggedUser: LoggedInUser,
    @Res() res: Response,
    @Query("search") search: string,
    @Query("isLive") isLive: string,
    @Query("isArchive") isArchive: string,
    @Query("userRole") userRole: string,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
      }
      const filterObj = [];
      if (isLive && isLive == "live") {
        filterObj.push({ isArchieve: false });
      }
      if (isArchive && isArchive == "archive") {
        filterObj.push({ isArchieve: true });
      }

      const parser = new Parser({
        fields: [
          "Date Created",
          "Last login",
          "First Name",
          "Last Name",
          "Email",
          "Company",
          "Role",
          "Logged-In Status",
          "Status",
          "Company Website",
          "Type",
          "Created By",
          "Group",
          "Created Via"
        ],
      });
      const companyUsers = await this.companyAdminService.findUsers("", filterObj, userRole);
      const appendedCompanyUsers: any = companyUsers.map((item) => {
        return { ...item, isCompanyUser: true }
      })

      const regularUsers = await this.companyAdminService.findRegularUsers("", filterObj, userRole);
      const appendedRegularUsers: any = regularUsers.map((item) => {
        return { ...item, isCompanyUser: false }
      });
      const mergedUsers: any = [...appendedRegularUsers, ...appendedCompanyUsers];
      const finalResult: Array<{ [key: string]: string }> = [];
      if (mergedUsers.length > 0) {
        mergedUsers.forEach((item: any) => {
          const company = {
            "Date Created": formatDate(item.createdAt),
            "Last login": item.lastLoginDate ? formatDate(item.lastLoginDate) : '-',
            "First Name": item.firstName,
            "Last Name": item.isCompanyUser ? item.LastName : item.lastName,
            "Email": item.email,
            "Company": item.isCompanyUser ? item.companies?.name ? item.companies?.name : "-" : item.companies[0]?.name,
            "Role": item.isCompanyUser ? getRoleString(item.companies?.user.userRoles[0].roleCode ? item.companies?.user.userRoles[0].roleCode : "") : getRoleString(item.userRoles[0].roleCode),
            "Logged-In Status": item.isCompanyUser ? item.isLoggedInOnce ? "Yes" : "No" : item.isLoggedOnce ? "Yes" : "No",
            "Status":  item.isArchieve ? "Archive" : "Live",
            "Company Website": item.isCompanyUser ? "-" : item.companies[0]?.website,
            "Type": item.isCompanyUser ? "-" : getUserTypeString(item.userType, item.trialDuration),
            "Created By": item.isCompanyUser ? item.companies?.user.firstName + " " + item.companies?.user.lastName : "-" ,
            "Group": item.isCompanyUser ? item.groups?.name ? item.groups?.name : "" : "-",
            "Created Via": item.isCompanyUser ? "Via Company" : "Via Manual"
          };
          finalResult.push(company);
        });
      }
      if (finalResult.length > 0) {
        const csv = parser.parse(finalResult);
        if (!res) {
          throw new BadRequestException();
        }
        res.header("Content-Type", "text/csv");
        res.attachment("users.csv");
        return res.send(csv);
      } else {
        throw new BadRequestException("no records found")
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Get("")
  @ApiOperation({
    summary: "Get all invitees only for admin",
    description: "This endpoint allows an admin to retrieve a list of all invitees within the system. Only authorized admin users can access this data. The response includes details such as invitee names, emails, invitation status, and any other relevant information. This can be used to manage or monitor the invitee list for administrative purposes."
  })
  async getUserPerPage(
    @CurrentUser() loggedUser: LoggedInUser,
    @Query("search") search: string,
    @Query("isLive") isLive: string,
    @Query("isArchive") isArchive: string,
    @Query("userRole") userRole: string,
  ) {
    try {

      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
      }

      const filterObj = [];
      if (isLive && isLive == "live") {
        filterObj.push({ isArchieve: false });
      }
      if (isArchive && isArchive == "archive") {
        filterObj.push({ isArchieve: true });
      }

      const users = await this.companyAdminService.findUsers(search, filterObj, userRole);
      return new CustomResponse(HttpStatus.OK, true, {
        result: users,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  // @Post()
  // create(@Body() createCompanyAdminDto: CreateCompanyAdminDto) {
  //   return this.companyAdminService.create(createCompanyAdminDto);
  // }

  // @Get()
  // findAll() {
  //   return this.companyAdminService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.companyAdminService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCompanyAdminDto: UpdateCompanyAdminDto) {
  //   return this.companyAdminService.update(+id, updateCompanyAdminDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.companyAdminService.remove(+id);
  // }

  @Get('admin-company-users/:companyId')
  @ApiOperation({ 
    summary: 'Retrieve all users of a company by Company ID for admin', 
    description: 'This endpoint allows an admin to fetch a list of all users associated with a specific company, identified by the `companyId` passed as a URL parameter. The response includes detailed information about the company users, such as their profiles, roles, and permissions within the company. Only authorized admin users can access this data.' 
  })
  findCompanyUsersFromAdmin(@Param('companyId') companyId: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
    }
    return this.companyAdminService.findCompanyUsers(companyId, true);
  }catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }


  @Get('admin-company-groups/:companyId')
  @ApiOperation({ 
    summary: 'Retrieve all groups of a company by Company ID for admin', 
    description: 'This endpoint allows an admin to fetch a list of all groups associated with a specific company, identified by the `companyId` passed as a URL parameter. The response will include detailed information about each group, such as group names and associated roles. This data is accessible only to authorized admin users.' 
  })
  findCompanyGroupsFromAdmin(@Param('companyId') companyId: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.UNAUTHORIZED);
    }
    return this.companyAdminService.findCompanyAdminGroups(Number(companyId));
  }catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    }

  // @Get('check-permissions/:id') 
  //   checkPermissions(@Param('id', ParseIntPipe) id: number) {
  //     return this.companyAdminService.checkPermissions(id);
  //   }

  //

}
