import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  Put,
  Query,
  Res,
  UnauthorizedException,
  UseInterceptors,
  HttpException,
  ParseBoolPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiBody,
} from "@nestjs/swagger";
import { Prisma, ROLE_CODE, USER_TYPE, Users } from "@prisma/client";

import { UpdatePersonalSettingDto } from "./dtos/update-personal-setting.dto";
import { UsersOperation } from "./users.operation";
import { Roles } from "src/common/decorators/roles.decorator";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { UserResponseDto } from "./dtos/users.response.dto";
import { UsersService } from "./users.service";
import { Public } from "src/common/decorators/public.decorator";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { StripeService } from "src/services/stripe/stripe.service";
import Stripe from "stripe";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { Response } from "express";
import { Parser } from "json2csv";
import { checkSubscriptionChange, decodeEmail, formatDate, getMemberTypeString, getMonthsAndDaysBetweenTwoDates, getRoleString, getUserTypeString } from "src/common/methods/common-methods";
import { AdminNotifications, advertisement, advertisements, faqData } from "./type";
import { BackupPersonalContactsService } from "./backup-personal-contacts/backup-personal-contacts.service";

@ApiBearerAuth()
@ApiTags("users")
@Controller("users")
export class UsersController {
  firebaseService: any;
  constructor(
    private readonly logger: Logger,
    private readonly usersOps: UsersOperation,
    private readonly userService: UsersService,
    private readonly stripService: StripeService,
    private readonly backupContactsService: BackupPersonalContactsService
  ) { }

  @Public()
  @ApiExcludeEndpoint()
  @Get("get-stripe-products")
  async getStripeProducts(): Promise<
    CustomResponse<Stripe.Response<Stripe.ApiList<Stripe.Price>>>
  > {
    try {
      const stripeProducts = await this.userService.getStripeProducts();
      return new CustomResponse(HttpStatus.OK, true, stripeProducts);
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

  @Public()
  @Get("/get-checkout-form")
  @ApiExcludeEndpoint()
  async getCheckoutForm(
    @Query("productId") productId: string,
    @Query("userEmail") userEmail: string,
    @Query("token") token: string,
    @Query("checkMail") checkMail: string,
  ): Promise<CustomResponse<string>> {
    try {
      const secretKey = process.env.EMAIL_SECRET_KEY;
      const email = decodeEmail(checkMail, secretKey);
      if (email != userEmail) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (productId != "" && userEmail != "") {
        const theCheckoutForm = await this.stripService.getCheckoutForm(
          productId,
          userEmail,
          token,
        );
        return new CustomResponse(
          HttpStatus.OK,
          true,
          theCheckoutForm.url as string,
        );
      } else {
        throw new HttpException('Invalid parameters', HttpStatus.FORBIDDEN);
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

  // @Public()
  // @Get("get-single-checkout-form")
  // async getSingleProductCheckoutPage() {
  //   try {
  //     const theCheckoutForm = await this.stripService.getSingleProductCheckoutPage();
  //     const theURL = theCheckoutForm.url;
  //     return new CustomResponse(
  //       HttpStatus.OK,
  //       true,
  //       theCheckoutForm.url as string,
  //     );
  //   } catch (err) {
  //     console.log(err);
  //     throw new HttpException (err.message, err.status, { cause: new Error (err) });
  //   }
  // }

  @Get("export-excel-data")
  @ApiExcludeEndpoint()
  async exportDataToCsv(
    @CurrentUser() loggedUser: LoggedInUser,
    @Res() res: Response,
    @Query("search") search: string,
    @Query("isLive") isLive: string,
    @Query("isArchive") isArchive: string,
    @Query("isPaid") isPaid: string,
    @Query("isFree") isFree: string,
    @Query("isFlagged") isFlagged: string,
    @Query("isTrail") isTrail: string,
    @Query("userRole") userRole: string,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const filterObj = [];
      if (isLive && isLive == "live") {
        filterObj.push({ isArchieve: false });
      }
      if (isArchive && isArchive == "archive") {
        filterObj.push({ isArchieve: true });
      }
      if (isFree && isFree == "free") {
        filterObj.push({ AND: [ { isPaidUser: false }, { userType: USER_TYPE.free }, { isArchieve: false } ] });
      }
      if (isPaid && isPaid == "paid") {
        filterObj.push({
          AND: [{ userType: USER_TYPE.paid }, { isPaidUser: true }, { isArchieve: false }]
        })
      }
      if (isTrail && isTrail == "trail") {
        filterObj.push({
          AND: [{ userType: USER_TYPE.trial }, { isPaidUser: true }, { isArchieve: false }]
        })
      }
      // need to update this
      if (isFlagged && isFlagged == "flagged") {
        const parser = new Parser({
          fields: [
            "Date",
            "Reported Company",
            "Reporting Name",
            "Reporting Company",
            "Details"
          ],
        });
        const users = await this.userService.getFlaggesUsers();
        const finalResult: Array<{ [key: string]: string }> = [];
        if (users.length > 0) {
          users.forEach((item) => {
            const company = {
              "Date": formatDate(item.createdAt),
              "Reported Company": item.reportedCompany.name,
              "Reporting Name": item.company?.user?.firstName,
              "Reporting Company": item.company?.name,
              "Details": item.details
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
      } else {
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
        const users = await this.userService.findUsers("", filterObj, userRole);
        const appendedUsers: any = users.map((item) => {
          return { ...item, isCompanyUser: false }
        });

        const companyFilterObj = [];
        if (isLive && isLive == "live") {
          companyFilterObj.push({ isArchieve: false });
        }
        if (isArchive && isArchive == "archive") {
          companyFilterObj.push({ isArchieve: true });
        }
        const companyUsers = await this.userService.findCompanyUsers("", companyFilterObj, userRole);
        const appendedCompanyUsers: any = companyUsers.map((item) => {
          return { ...item, isCompanyUser: true }
        })
        const mergedUsers: any = [...appendedUsers, ...appendedCompanyUsers];
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
        if(finalResult.length > 0) {
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
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(error.message, error.status, { cause: new Error(error) });
      }
    }
  }

  @Public()
  @Get("check-user-and-logout")
  @ApiExcludeEndpoint()
  async checkUsersAndAutoLogout() {
    try {
      this.userService.csvBuyersTrailEndToday();
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

  @Post("cancel-subscription")
  @ApiOperation({
    summary: "Cancel user subscription",
    description: "Allows a user to cancel their subscription by providing their user ID, a cancellation reason, and a detailed description of the reason. This endpoint ensures that the cancellation process is documented for future reference."
  })
  @ApiBody({
    description: 'Request body for cancelling a subscription',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'The ID of the user whose subscription is being cancelled',
        },
        cancellationReason: {
          type: 'string',
          description: 'The reason for cancelling the subscription',
        },
        reasonDescription: {
          type: 'string',
          description: 'A detailed description of the cancellation reason',
        },
      },
    }
  })
  async cancelSubscription(@Body() postData: { userId: number, cancellationReason: string, reasonDescription: string }, @CurrentUser() user: LoggedInUser,): Promise<CustomResponse<string>> {
    try {
      if (user?.id !== +postData.userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      const isCanccelled = await this.userService.cancelSubscription(postData);
      if (isCanccelled) {
        return new CustomResponse(
          HttpStatus.OK,
          true,
          "Subscription Deleted Successfully",
        );
      } else {
        throw new BadRequestException("Some issue");
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

  @Get("save-security-settings")
  @ApiOperation({
    summary: "Save user's security settings",
    description: "This endpoint allows users to save their security settings, such as enabling or disabling specific features, based on the provided parameters."
  })
  async saveSecuritySettings(@Query("isChecked", ParseBoolPipe) isChecked: boolean, @CurrentUser() user: LoggedInUser) {
    try {
      if (user && user.isCompanyUser) {
        await this.backupContactsService.saveOrUpdateSubUser2FA(user.CompanyAdminId, isChecked);
        return new CustomResponse(HttpStatus.OK, true, 'updated successfully');
      } else {
        const getUsersAuthDetails = await this.backupContactsService.findAuthDetailsOfUserById(user.id);
        if (getUsersAuthDetails && getUsersAuthDetails.userId) {
          await this.backupContactsService.updateTwoFactorDetails(user.id, isChecked);
          return new CustomResponse(HttpStatus.OK, true, 'updated successfully');
        } else {
          await this.backupContactsService.addTwoFactorDetails(user.id, isChecked);
          return new CustomResponse(HttpStatus.OK, true, 'updated successfully');
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-bannerAds/:day/:mon/:year")
  @ApiOperation({
    summary: "Retrieve banner ads by date",
    description: "This endpoint retrieves banner ads for a specified day, month, and year. It can be used to fetch ads that were displayed or are scheduled for that particular date."
  })
  async getBannerAds(
    @Param("day") day: string,
    @Param("mon") mon: string,
    @Param("year") year: string,
  ) {
    try {
      const date = day + '/' + mon + '/' + year;
      return this.userService.getBannerAds(date, 'serviceProvider');
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-homePage-bannerAds/:day/:mon/:year")
  @ApiOperation({
    summary: "Retrieve homepage banner ads by date",
    description: "Fetches homepage banner ads for a specified day, month, and year. This allows users to see which banner ads were or will be displayed on the homepage for the given date."
  })
  async getHomeBannerAds(
    @Param("day") day: string,
    @Param("mon") mon: string,
    @Param("year") year: string,
  ) {
    try {
      const date = day + '/' + mon + '/' + year;
      return this.userService.getBannerAds(date, 'home');
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-flagged-users")
  @ApiOperation({
    summary: "Retrieve flagged users",
    description: "Fetches a list of users who have been flagged for review or violation of platform policies. This helps administrators manage and review users with reported or suspicious activity."
  })
  async getFlaggedUsers(@CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const flaggedUsers = await this.userService.getFlaggesUsers();
      return new CustomResponse(HttpStatus.OK, true, flaggedUsers);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-sub-users-counts")
  @ApiOperation({
    summary: "Retrieve invited sub-users count",
    description: "Fetches the count of sub-users who have been invited by the main user. This helps in tracking the total number of users associated with an account or organization."
  })
  async getSubUsersCreationCounts(@CurrentUser() loggedUser: LoggedInUser) {
    try{
        if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
          throw new HttpException('access denied', HttpStatus.FORBIDDEN);
        }
        const subUsersCounts = await this.userService.getSubUsersCounts();
        return new CustomResponse(HttpStatus.OK, true, subUsersCounts);
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
            throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
          } else if (err instanceof Prisma.PrismaClientValidationError) {
            throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
          } else {
              throw new HttpException(err.message, err.status, { cause: new Error(err) });
          }
    }
  }
  // @Public()
  // @Get("/migration-for-delete-users")
  // async deleteUsers() {
  //   try {
  //     this.userService.deleteUsersFromList();
  //   } catch(err) {
  //     throw new BadRequestException(err.message);
  //   }
  //   return new CustomResponse(HttpStatus.OK, true, "deleted successfully");
  // }

  @Public()
  @Get('deleted-firebase-existing-users/:token')
  async getTheDeletedButFirebaseExistEmails(@Param('token') token: string) {
    try {
      let currentToken = process.env.XDS_CRON_TOKEN;
      if (currentToken === token) {
        const firebaseExistingUser = await this.userService.getTheDeletedButFirebaseExistEmails();
        return firebaseExistingUser
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST);
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get(":userId/get-subscriptions")
  @ApiOperation({
    summary: "Retrieve user's subscriptions and pricing details",
    description: "Fetches the list of subscriptions and their corresponding pricing details for a specific user, identified by the user ID. This helps in managing and reviewing the user's active and available subscription plans."
  })
  async getSubscriptionsAndPrices(
    @Param("userId", ParseIntPipe) userId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user?.id !== +userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      const subscriptionDetails =
        await this.userService.getSubscriptionDetails(userId);
      return new CustomResponse(HttpStatus.OK, true, {
        subscriptionDetails
      });
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put('update-company-user')
  @ApiOperation({
    summary: 'Update company user details',
    description: 'This endpoint allows the updating of user details for a company user. The request must include the user’s first name, last name, and email address.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'First name of the user' },
        LastName: { type: 'string', description: 'Last name of the user' },
        email: { type: 'string', format: 'email', description: 'Email address of the user' },
      },
      required: ['firstName', 'LastName', 'email'],
    },
  })
  updateCompanyAdminUser(
    @Body() updatePersonalSettingDto: { firstName: string; LastName: string; email: string },
    @CurrentUser() user: LoggedInUser,
  ) {
    return this.usersOps.updateCompanyAdminUser(updatePersonalSettingDto, user?.CompanyAdminId, user?.CompanyAdminEmail);
  }

  @Put('update-company-user-limit/:userId')
  @ApiOperation({
    summary: 'Update company user limit',
    description: 'This endpoint allows an administrator to update the user limit for a specified company user. The request requires the user ID as a path parameter and a request body containing the new user limit value. Successful execution will result in updating the specified user’s limit and returning a confirmation response.',
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userLimit: {
          type: 'number',
          description: 'The userLimit',
        },
      }
    }
  })
  updateCompanyUsersLimit(
    @Param("userId", ParseIntPipe) userId: number,
    @Body() postData: { userLimit: number },
    @CurrentUser() user: LoggedInUser,
  ) {
    try{
      if (user?.userRoles[0] && user?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (+postData.userLimit > 200) {
        throw new HttpException('Users limit crossed.', HttpStatus.FORBIDDEN);
      }
      return this.userService.updateCompanyUsersLimit(+postData.userLimit, +userId);
    } catch (err){
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Roles(ROLE_CODE.service_provider)
  @Put(":userId/personal-settings")
  @ApiOperation({
    summary: 'Update personal settings',
    description: 'This endpoint allows users to update their personal settings, including information such as name, email, and other relevant preferences.',
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  async updatePersonalSetting(
    @GetXdsContext() xdsContext: XdsContext,
    @Param("userId", ParseIntPipe) userId: number,
    @Body() updatePersonalSettingDto: UpdatePersonalSettingDto,
    @CurrentUser() user: Users,
  ) {
    if (userId !== user.id) {
      this.logger.error("Access Denied", xdsContext);
      throw new ForbiddenException("Access Denied");
    }
    try {
      if (updatePersonalSettingDto.email != user.email) {
        const checkMail = await this.userService.getuserDetails();
        for (const users of checkMail) {
          if (users.email == updatePersonalSettingDto.email) {
            return 'Mail is already existed.';
          }
        }
      }
      const update = await this.usersOps.updatePersonalSetting(
        xdsContext,
        user,
        // updatePersonalSettingDto,
        sanitizeData(updatePersonalSettingDto),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
          throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // @Roles(ROLE_CODE.admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get("")
  @ApiOperation({
    summary: "Retrieve all users for admin",
    description: "Fetches a list of all users in the system, accessible only to administrators. This allows admins to manage, review, and monitor user activity and profiles."
  })
  async getUserPerPage(
    @CurrentUser() loggedUser: LoggedInUser,
    @Query("search") search: string,
    @Query("isLive") isLive: string,
    @Query("isArchive") isArchive: string,
    @Query("isPaid") isPaid: string,
    @Query("isFree") isFree: string,
    @Query("isFlagged") isFlagged: string,
    @Query("isTrail") isTrail: string,
    @Query("userRole") userRole: string,
  ): Promise<CustomResponse<{ result: UserResponseDto[]; flaggedUsers: any[] }>> {
    try {

      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }

      const filterObj = [];
      if (isLive && isLive == "live") {
        filterObj.push({ isArchieve: false });
      }
      if (isArchive && isArchive == "archive") {
        filterObj.push({ isArchieve: true });
      }
      if (isFree && isFree == "free") {
        filterObj.push({ AND: [{ isPaidUser: false }, { userType: USER_TYPE.free }, { isArchieve: false }] });
      }
      if (isPaid && isPaid == "paid") {
        filterObj.push({
          AND: [{ userType: USER_TYPE.paid }, { isPaidUser: true }, { isArchieve: false }]
        })
      }
      if (isTrail && isTrail == "trail") {
        filterObj.push({
          AND: [{ userType: USER_TYPE.trial }, { isPaidUser: true }, { isArchieve: false }]
        })
      }

      const users = await this.userService.findUsers(search, filterObj, userRole);
      const usersToSend: UserResponseDto[] = [];
      users.forEach((item) => {
        const user = new UserResponseDto(item);
        usersToSend.push(user);
      });

      // const flaggedUsers = await this.userService.getFlaggesUsers();
      const flaggedUsers: any[] = [];

      return new CustomResponse(HttpStatus.OK, true, {
        result: usersToSend,
        flaggedUsers: flaggedUsers
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put(":id")
  @ApiOperation({
    summary: 'Update flagged status of a user by ID',
    description: 'This endpoint allows an admin to update the flagged status of a user identified by their unique ID.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async updateUserById(@Param("id", ParseIntPipe) userId: number) {
    try {
      return await this.userService.UpdateByUserId(userId);

    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }


  // @Roles(ROLE_CODE.admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id")
  @ApiOperation({
    summary: "Retrieve user by ID",
    description: "Fetches detailed information of a specific user, identified by their unique ID. This allows admins or authorized users to review and manage individual user profiles."
  })
  @ApiOkResponse({ type: UserResponseDto })
  async getUserById(@Param("id", ParseIntPipe) userId: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const user = await this.userService.findFirstByUserId(userId);
      let respUser: UserResponseDto;
      if (user) {
        respUser = new UserResponseDto(user);
        return respUser;
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // @Roles(ROLE_CODE.admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/archieve")
  @ApiOperation({
    summary: "Archive a user by ID",
    description: "Marks a specific user, identified by their ID, as archived. This operation is typically used to deactivate or remove the user from active listings without permanently deleting their account."
  })
  async setIsArchieved(
    @Param("id", ParseIntPipe) userId: number,
    @CurrentUser() loggedUser: LoggedInUser
  ): Promise<UserResponseDto> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      let user = await this.userService.updateIsArchieveToTrue(userId);
      user = new UserResponseDto(user);
      return user;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // @Roles(ROLE_CODE.admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/un-archive")
  @ApiOperation({
    summary: "Unarchive a user by ID",
    description: "Restores a previously archived user, identified by their ID, back to active status. This operation allows administrators to reactivate user accounts that were archived."
  })
  // @ApiOkResponse({ type: UserResponseDto })
  async unArchive(
    @Param("id", ParseIntPipe) userId: number,
    @CurrentUser() loggedUser: LoggedInUser
  ): Promise<UserResponseDto> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      let user = await this.userService.updateIsArchieveToFalse(userId);
      user = new UserResponseDto(user);
      return user;
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/delete")
  @ApiOperation({
    summary: "Delete a user by ID",
    description: "Permanently removes a user from the system, identified by their unique ID. This action cannot be undone and should be performed with caution."
  })
  async deleteUser(
    @Param("id", ParseIntPipe) id: number, @CurrentUser() loggedUser: LoggedInUser
  ): Promise<CustomResponse<string>> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const isUserDeleted = await this.userService.deleteUser(id);
      if (isUserDeleted) {
        return new CustomResponse(HttpStatus.OK, true, "succesfully deleted a user");
      } else {
        throw new BadRequestException("Error in deleting a user");
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // Added FAQ questions Api's

  @Post("faq")
  @ApiOperation({
    summary: "Add FAQ questions",
    description: "This endpoint allows the admin to create new Frequently Asked Questions (FAQ) by providing a question, an answer, and a visibility status. The newly added FAQ will be stored in the system and can be retrieved or updated as needed."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
        display: { type: 'boolean' },
      },
      required: ['question', 'answer', 'display'],
    },
  })
  async createFaqQuestions(
    @Body("question") question: string,
    @Body("answer") answer: string,
    @Body("display") display: boolean,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.createFaq(question, answer, display);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Delete("faq/:id")
  @ApiOperation({
    summary: "Delete FAQ questions",
    description: "This endpoint allows an admin to delete a specific Frequently Asked Question (FAQ) by its unique identifier."
  })
  async deleteFaqQuestions(@Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.deleteFaq(+id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("faq/getAll")
  @ApiOperation({
    summary: "Retrieve all FAQ questions",
    description: "Fetches a list of all frequently asked questions (FAQs) available in the system. This provides users with easy access to common inquiries and their corresponding answers."
  })
  async getAlleFaqQuestions(@CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getAlleFaqQuestions();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("faq/getUnHideFaqs")
  @ApiOperation({
    summary: "Retrieve all visible FAQ questions",
    description: "Fetches a list of all FAQ questions that are currently visible to users. This endpoint helps users access the frequently asked questions that have not been hidden."
  })
  async getUnHideFaqQuestions() {
    try {
      return await this.userService.getUnHideFaqQuestions();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("faq/:id")
  @ApiOperation({
    summary: "Retrieve FAQ question by ID",
    description: "Fetches a specific frequently asked question (FAQ) based on its unique identifier. This allows users to view detailed information about a particular FAQ."
  })
  async getByIdFaqQuestions(@Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getByIdFaqQuestions(+id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put("faq/:id")
  @ApiOperation({ summary: "updating faq questions" })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          qsnData: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              question: { type: 'string' },
              answer: { type: 'string' },
              isArchieve: { type: 'boolean' },
              orderById: { type: 'number', nullable: true },
            },
          },
        },
      },
    },
  })
  async hideFaqQuestions(
    @Param('id') id: number,
    @Body() postData: faqData[],
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (postData && postData.length > 0) {
        if (+id === 0) {
          postData.forEach(async (item) => {
            item.qsnData = sanitizeData(item.qsnData);
            await this.userService.createFaq(item.qsnData.question, item.qsnData.answer, item.qsnData.isArchieve);
          })
          return {
            success: true,
            message: "successfully Created",
          }
        } else {
          postData.forEach(async (item) => {
            await this.userService.hideFaqQuestions(+id, item);
          });
          return {
            success: true,
            message: "successfully Updated",
          }
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // Adding advertisement data 
  @Post("advt")
  @ApiOperation({ summary: "adding faq questions" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        adImagePath: { type: 'string' },
        mobileAdImagePath: { type: 'string' },
        logoImagePath: { type: 'string', nullable: true },
        adURL: { type: 'string' },
        adPage: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        isArchieve: { type: 'boolean' },
        clicksReceived: { type: 'integer' }
      },
      required: ['companyName', 'adImagePath', 'mobileAdImagePath', 'adURL', 'adPage', 'startDate', 'endDate', 'isArchieve', 'clicksReceived'],
    },
  })
  async createAdvertisement(
    @Body() postData: advertisements,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      // postData.startDate= new Date(postData.startDate);
      // postData.endDate = new Date(postData.endDate);
      return await this.userService.createAdvertisement(sanitizeData(postData));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("advt/getAllAdvt")
  @ApiOperation({
    summary: "Retrieve all advertisements",
    description: "Fetches a list of all advertisements available in the system. This endpoint provides users with access to current promotional materials and ads."
  })
  async getAdvertisements(@CurrentUser() loggedUser: LoggedInUser,): Promise<any[]> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getAdvertisements();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("advt/getAdvtNames")
  @ApiOperation({
    summary: "Retrieve names of all advertisements",
    description: "Fetches a list of advertisement names available in the system. This endpoint allows users to see all the advertisement titles without retrieving full advertisement details."
  })
  async getAdvtNames(@CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getAdvtNames();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put("advt/companyClicksReport")
  @ApiOperation({ summary: "adding faq questions" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
      },
      required: ['companyName', 'startDate', 'endDate'],
    },
  })
  async companyClicksReport(@Body() postData: { companyname: string, startdate: string, endDate: string }, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.companyClicksReport(postData);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("advt/:id")
  @ApiOperation({
    summary: "Retrieve advertisement by ID",
    description: "Fetches detailed information about a specific advertisement identified by its unique ID. This allows users to view the content and details of a particular advertisement."
  })
  async getAdvertisementById(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getAdvertisementById(+id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Delete("advt/:id")
  @ApiOperation({
    summary: "Delete advertisement by ID",
    description: "Permanently removes a specific advertisement from the system, identified by its unique ID. This action cannot be undone and should be performed with caution."
  })
  async deleteAdvertisementById(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.deleteAdvertisementById(+id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put("advt/:id")
  @ApiOperation({ summary: "adding faq questions" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        postdata: {
          type: 'object',
          properties: {
            companyName: { type: 'string' },
            adImagePath: { type: 'string' },
            mobileAdImagePath: { type: 'string' },
            logoImagePath: { type: 'string', nullable: true },
            adURL: { type: 'string' },
            adURLStaticPage: { type: 'string', nullable: true },
            adPage: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isArchieve: { type: 'boolean' },
            clicksReceived: { type: 'number' },
          },
          required: [
            'companyName',
            'adImagePath',
            'mobileAdImagePath',
            'adURL',
            'adPage',
            'startDate',
            'endDate',
            'isArchieve',
            'clicksReceived',
          ],
        },
      },
      required: ['type', 'postdata'],
    },
  })
  async updateAdvertisementById(
    @Param('id') id: number,
    @Body() postData: { type: string, postdata: advertisement },
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      // if (postData.postdata?.startDate && postData.postdata.endDate) {
      //   postData.postdata.startDate = new Date(postData.postdata.startDate);
      //   postData.postdata.endDate = new Date(postData.postdata.endDate);
      // }
      if (postData.type !== "click" && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.updateAdvertisementById(+id, sanitizeData(postData), loggedUser.companies[0].id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("cancelled-subscription-details")
  @ApiOperation({
    summary: "Retrieve cancelled subscription details",
    description: "This endpoint allows users to retrieve details about cancelled subscriptions within a specified duration and type. It accepts the duration, type, and timeline values to filter the subscription data."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for which to retrieve cancelled subscriptions (e.g., 30 days, 6 months).' },
        type: { type: 'string', description: 'Type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'Specific timeline value for further filtering (e.g., custom date or period).' },
      },
      required: ['duration', 'type', 'timeLineVal'],
    }
  })
  async getCancelledSubscriptionDetails(@CurrentUser() loggedUser: LoggedInUser, @Body() postData: { duration: string, type: string, timeLineVal: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const cancelledSubscriptionDetails = await this.userService.getCancelledSubscriptionDetails(postData.duration, postData.type, postData.timeLineVal);
      return new CustomResponse(HttpStatus.OK, true, cancelledSubscriptionDetails);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  } 

  @Post("get-cancelled-subscription-csv")
  @ApiOperation({
    summary: "Download CSV of cancelled subscription details",
    description: "This endpoint generates a CSV file containing details of cancelled subscriptions within the specified duration, type, and timeline."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for which to retrieve cancelled subscriptions (e.g., 30 days, 6 months).' },
        type: { type: 'string', description: 'Type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'Specific timeline value for further filtering (e.g., custom date or period).' },
      },
      required: ['duration', 'type', 'timeLineVal'],
    }
  })
  async downloadCancelledSubscriptionCsv(@Res() res: Response, @CurrentUser() loggedUser: LoggedInUser, @Body() postData: { duration: string, type: string, timeLineVal: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const cancelledSubscriptionDetails = await this.userService.getCancelledSubscriptionDetails(postData.duration, postData.type, postData.timeLineVal);
      if (cancelledSubscriptionDetails.length > 0) {
        const parser = new Parser({
          fields: [
            "Cancelled Date",
            "User Name",
            "Company Name",
            "Email",
            "Role",
            "Member Type",
            "Country",
            "Reason",
            "Comments",
            "Active Duration"
          ],
        });
        const finalResult: Array<{ [key: string]: string }> = [];
        if (cancelledSubscriptionDetails.length > 0) {
          cancelledSubscriptionDetails.forEach((item: any) => {
            const company = {
              "Cancelled Date": formatDate(item.cancellationDate),
              "User Name": item.user.firstName + " " + item.user.lastName,
              "Company Name": item.user?.companies[0]?.name,
              "Email": item.user.email,
              "Role": getRoleString(item.user?.userRoles[0]?.roleCode),
              "Member Type": getMemberTypeString(item.subscriptionType),
              "Country": item.billingCountry ? item.billingCountry : "",
              "Reason": item.cancellationReason ? this.userService.getActualCancellationReason(item.cancellationReason) : "-",
              "Comments": item.reasonDescription,
              "Active Duration": getMonthsAndDaysBetweenTwoDates(item.veryStartingDate, item.cancellationDate),
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
          res.attachment("Active_Subscriptions.csv");
          return res.send(csv);
        } else {
          throw new BadRequestException("no records found")
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("re-subscription-details")
  @ApiOperation({
    summary: "Retrieve Re subscription details",
    description: "This endpoint allows users to retrieve details about Re subscriptions within a specified duration and type. It accepts the duration, type, and timeline values to filter the subscription data."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for which to retrieve cancelled subscriptions (e.g., 30 days, 6 months).' },
        type: { type: 'string', description: 'Type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'Specific timeline value for further filtering (e.g., custom date or period).' },
      },
      required: ['duration', 'type', 'timeLineVal'],
    }
  })
  async getReSubscriptionDetails(@CurrentUser() loggedUser: LoggedInUser, @Body() postData: { duration: string, type: string, timeLineVal: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const cancelledSubscriptionDetails = await this.userService.getReSubscriptionDetails(postData.duration, postData.type, postData.timeLineVal);
      return new CustomResponse(HttpStatus.OK, true, cancelledSubscriptionDetails);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("get-re-subscription-csv")
  @ApiOperation({
    summary: "Download CSV of Re subscription details",
    description: "This endpoint generates a CSV file containing details of Re subscriptions within the specified duration, type, and timeline."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for which to retrieve cancelled subscriptions (e.g., 30 days, 6 months).' },
        type: { type: 'string', description: 'Type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'Specific timeline value for further filtering (e.g., custom date or period).' },
      },
      required: ['duration', 'type', 'timeLineVal'],
    }
  })
  async downloadReSubscriptionsCsv(@Res() res: Response, @CurrentUser() loggedUser: LoggedInUser, @Body() postData: { duration: string, type: string, timeLineVal: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const cancelledSubscriptionDetails = await this.userService.getReSubscriptionDetails(postData.duration, postData.type, postData.timeLineVal);
      if (cancelledSubscriptionDetails.length > 0) {
        const parser = new Parser({
          fields: [
            "Resubscribed Date",
            "Cancelled Date",
            "User Name",
            "Company Name",
            "Email",
            "Role",
            "Member Type",
          ],
        });
        const finalResult: Array<{ [key: string]: string }> = [];
        if (cancelledSubscriptionDetails.length > 0) {
          cancelledSubscriptionDetails.forEach((item: any) => {
            const company = {
              "Resubscribed Date": formatDate(item.createdAt),
              "Cancelled Date": formatDate(item.cancellationDate),
              "User Name": item.user.firstName + " " + item.user.lastName,
              "Company Name": item.user?.companies[0]?.name,
              "Email": item.user.email,
              "Role": getRoleString(item.user?.userRoles[0]?.roleCode),
              "Member Type": getMemberTypeString(item.subscriptionType),
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
          res.attachment("Active_Subscriptions.csv");
          return res.send(csv);
        } else {
          throw new BadRequestException("no records found")
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("get-active-subscriptions")
  @ApiOperation({
    summary: "Retrieve active subscription details",
    description: "This endpoint fetches details of active subscriptions based on the provided duration, type, timeline, and start date (from)."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for which to retrieve active subscriptions (e.g., last 30 days, last 6 months).' },
        type: { type: 'string', description: 'The type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'A specific timeline value for further filtering (e.g., a custom period).' },
        from: { type: 'string', description: 'Start date for filtering the subscriptions data (e.g., YYYY-MM-DD).' },
      },
      required: ['duration', 'type', 'timeLineVal', 'from'],
    }
  })
  async getActiveSubscriptions(@CurrentUser() loggedUser: LoggedInUser, @Body() postData: { duration: string, type: string, timeLineVal: string, from: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const subscriptions = await this.userService.getSubscriptions(postData.duration, postData.type, postData.timeLineVal, postData.from);
      return new CustomResponse(HttpStatus.OK, true, subscriptions);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("get-subscription-csvs")
  @ApiOperation({
    summary: "Download subscription details as CSV",
    description: "This endpoint allows users to download subscription data as a CSV file. The data can be filtered by duration, type, timeline, and a specific start date."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', description: 'The duration for filtering subscription data (e.g., last month, last year).' },
        type: { type: 'string', description: 'Type of subscription (e.g., monthly, yearly).' },
        timeLineVal: { type: 'string', description: 'A specific timeline value to refine the results.' },
        from: { type: 'string', description: 'Start date for filtering data (e.g., YYYY-MM-DD).' },
      },
      required: ['duration', 'type', 'timeLineVal', 'from'],
    }
  })
  async downloadSubscriptionsCsv(@CurrentUser() loggedUser: LoggedInUser, @Res() res: Response, @Body() postData: { duration: string, type: string, timeLineVal: string, from: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const subscriptions = await this.userService.getSubscriptions(postData.duration, postData.type, postData.timeLineVal, postData.from);
      if (subscriptions.length > 0) {
        if (postData.from == "active") {
          const parser = new Parser({
            fields: [
              "Subscr/Renewed Date",
              "User Name",
              "Company Name",
              "Email",
              "Role",
              "Member Type",
              "Sub Change",
              "Country",
              "Active Duration"
            ],
          });
          const finalResult: Array<{ [key: string]: string }> = [];
          if (subscriptions.length > 0) {
            subscriptions.forEach((item: any) => {
              const company = {
                "Subscr/Renewed Date": formatDate(item.createdAt),
                "User Name": item.user.firstName + " " + item.user.lastName,
                "Company Name": item.user?.companies[0]?.name,
                "Email": item.user.email,
                "Role": getRoleString(item.user?.userRoles[0]?.roleCode),
                "Member Type": getMemberTypeString(item.subscriptionType),
                "Sub Change": checkSubscriptionChange(item.isPreviouslyCancelled, item.isSubscriptionChanged, item.subscriptionType),
                "Country": item.billingCountry ? item.billingCountry : "",
                "Active Duration": getMonthsAndDaysBetweenTwoDates(item.veryStartingDate, new Date()),
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
            res.attachment("Active_Subscriptions.csv");
            return res.send(csv);
          } else {
            throw new BadRequestException("no records found")
          }
        } else if (postData.from == "failed") {
          const parser = new Parser({
            fields: [
              "First Failed Date",
              "Failed Attempts",
              "User Name",
              "Company Name",
              "Email",
              "Role",
              "Member Type",
              "Reason"
            ],
          });
          const finalResult: Array<{ [key: string]: string }> = [];
          if (subscriptions.length > 0) {
            subscriptions.forEach((item: any) => {
              const company = {
                "First Failed Date": formatDate(item.firstPaymentFailDate),
                "Failed Attempts": item.paymentAttemptCount,
                "User Name": item.user.firstName + " " + item.user.lastName,
                "Company Name": item.user?.companies[0]?.name,
                "Email": item.user.email,
                "Role": getRoleString(item.user?.userRoles[0]?.roleCode),
                "Member Type": getMemberTypeString(item.subscriptionType),
                "Reason": item.failureReason
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
            res.attachment("Failed_transaction_reports.csv");
            return res.send(csv);
          } else {
            throw new BadRequestException("no records found")
          }
        } else {
          let fields = ["Renewal Date", "User Name", "Company Name", "Email", "Role", "Member Type", "Country"];
          if(postData.from == "new") {
            // fields = ["Renewal Date", "User Name", "Company Name", "Email", "Role", "Member Type", "Country", "Returning"];
            fields = ["Renewal Date", "User Name", "Company Name", "Email", "Role", "Member Type", "Country"];
          }
          if (postData.from == "new" || postData.from == "failed") {
            fields[0] = "Subscribed Date"
          }
          const parser = new Parser({ fields });
          const finalResult: Array<{ [key: string]: string }> = [];
          if (subscriptions.length > 0) {
            subscriptions.forEach((item: any) => {
              const company: any = {
                "Renewal Date": formatDate(this.userService.getRenewalDate(item.stripeExpireDate)),
                "User Name": item.user.firstName + " " + item.user.lastName,
                "Company Name": item.user?.companies[0]?.name,
                "Email": item.user.email,
                "Role": getRoleString(item.user?.userRoles[0]?.roleCode),
                "Member Type": getMemberTypeString(item.subscriptionType),
                "Country": item.billingCountry ? item.billingCountry : "",
                // "Returning": item.isPreviouslyCancelled ? "Yes" : "No"
              };
              if (postData.from == "new" || postData.from == "failed") {
                delete company["Renewal Date"];
                company["Subscribed Date"] = formatDate(item.createdAt)
              }
              // if(postData.from != "new") {
              //   delete company["Returning"];
              // }
              finalResult.push(company);
            });
          }
          if (finalResult.length > 0) {
            const csv = parser.parse(finalResult);
            if (!res) {
              throw new BadRequestException();
            }
            res.header("Content-Type", "text/csv");
            res.attachment("subscriptions.csv");
            return res.send(csv);
          } else {
            throw new BadRequestException("no records found")
          }
        }
      } else {
        throw new BadRequestException("No records found");
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("advt/companyClicksReport-csv")
  @ApiOperation({
    summary: "Download advertisement company clicks report as CSV",
    description: "This endpoint allows users to download a CSV report of the clicks received by companies' advertisements within a specified date range. The data can be filtered by company name and a date range (start and end dates)."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyname: { type: 'string', description: 'The name of the company for which the advertisement clicks report is needed.' },
        startdate: { type: 'string', format: 'date', description: 'The start date for filtering the report (e.g., YYYY-MM-DD).' },
        endDate: { type: 'string', format: 'date', description: 'The end date for filtering the report (e.g., YYYY-MM-DD).' },
      },
      required: ['companyname', 'startdate', 'endDate'],
    }
  })
  async downloadAdvtCompaniesCsv(@CurrentUser() loggedUser: LoggedInUser, @Res() res: Response, @Body() postData: { companyname: string, startdate: string, endDate: string }) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const adClickiedCompanies = await this.userService.companyClicksReport(postData);
      if (adClickiedCompanies.uniqueCompanies.length > 0) {
        const parser = new Parser({
          fields: [
            "First Clicked",
            "Last Clicked",
            "User Name",
            "Company Name",
            "# Clicks",
            "Type",
          ],
        });
        const finalResult: Array<{ [key: string]: string }> = [];
        if (adClickiedCompanies.uniqueCompanies.length > 0) {
          adClickiedCompanies.uniqueCompanies.forEach((item: any) => {
            const company: any = {
              "First Clicked": formatDate(item.createdAt),
              "Last Clicked": formatDate(item.updatedAt),
              "User Name": item.company.user.firstName + " " + item.company.user.lastName,
              "Company Name": item.company.name,
              "# Clicks": item.clicksCount,
              "Type": getRoleString(item.company.user?.userRoles[0]?.roleCode),
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
          res.attachment("adClicksByCompanies.csv");
          return res.send(csv);
        } else {
          throw new BadRequestException("no records found")
        }
      } else {
        throw new BadRequestException("No records found");
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Public()
  @Put("advt/externalClicks/:id")
  @ApiOperation({ summary: "adding faq questions" })
  async updateExternalClicks(
    @Param('id') id: number,
  ) {
    try {
      return await this.userService.updateExternalClicks(+id,);
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

  @Roles(ROLE_CODE.admin)
  @Put("/admin/:userId/edit-user-details")
  @ApiOperation({
    summary: 'Update user details from super admin',
    description: 'This endpoint allows users to update their details, including information such as name, email, and other relevant preferences.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['firstName', 'lastName', 'email'],
    },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  async updateUserDetails(
    @Param("userId", ParseIntPipe) userId: number,
    @Body() postData: { firstName: string, lastName: string, email: string },
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user?.userRoles[0] && user?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.usersOps.updateUserDetails(
        userId,
        sanitizeData(postData),
      );
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // Adding super admin notifications

  // @Post("admin/notifications")
  // @ApiOperation({
  //   summary: "Add notifications to send all users",
  //   description: "This endpoint allows the admin to create new Frequently Asked Questions (FAQ) by providing a question, an answer, and a visibility status. The newly added FAQ will be stored in the system and can be retrieved or updated as needed."
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       notificationDisc: { type: 'string' },
  //       display: { type: 'boolean' },
  //     },
  //     required: ['notificationDisc', 'display'],
  //   },
  // })
  // async createAdminNotification(
  //   @Body() postData: AdminNotifications,
  //   @CurrentUser() loggedUser: LoggedInUser,
  // ) {
  //   try {
  //     if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
  //       throw new HttpException('access denied', HttpStatus.FORBIDDEN);
  //     }
  //     return await this.userService.createAdminNotification(postData);
  //   } catch (err) {
  //     throw new HttpException(err.message, err.status, { cause: new Error(err) });
  //   }
  // }

  @Get("admin-notifications/getAll")
  @ApiOperation({
    summary: "Retrieve all admin notifications",
    description: "Fetches a list of all admin notifications available in the system."
  })
  async getAdminNotifications(@CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getAdminNotifications();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("admin-notifications/:id")
  @ApiOperation({
    summary: "Retrieve admin notification by ID",
    description: "Fetches a specific admin notification based on its unique identifier. This allows users to view detailed information about a particular notification."
  })
  async getByIdNotifications(@Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.userService.getByIdNotifications(+id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put("admin-notificationUpdate/:id")
  @ApiOperation({
    summary: 'Create or update a notification based on ID',
    description: 'If ID is 0, creates a new notification. Otherwise, updates the existing notification with the given ID.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notificationDescription: { type: 'string' },
        isDisplay: { type: 'boolean' },
        isDelete: { type: 'boolean' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      required: ['notificationDescription', 'isDisplay'],
    },
  })
  async adminNotificationsUpdate(
    @Param('id') id: number,
    @Body() postData: AdminNotifications,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      postData = sanitizeData(postData);
      if (id == 0) {
        await this.userService.createAdminNotification(postData);
        return {
          success: true,
          message: "successfully Created",
        }
      } else {
        await this.userService.adminNotificationsUpdate(+id, postData);
        return {
          success: true,
          message: "successfully Updated",
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("admin-notificationHideAndShow/:id")
  @ApiOperation({
    summary: "Toggle visibility of an admin notification",
    description: "This endpoint hides or shows an admin notification based on its ID. If the notification is currently visible, it will be hidden, and if it's hidden, it will be made visible."
  })
  async notificationHideAndShow(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.userService.notificationHideAndShow(+id);
      return {
        success: true,
        message: "successfully Updated",
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Delete("admin-notificationDelete/:id")
  @ApiOperation({
    summary: "Delete an admin notification",
    description: "Deletes an admin notification based on its ID. This action is permanent and will remove the notification from the system entirely."
  })
  async adminNotifiDelete(@Param('id') id: number, @CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.userService.adminNotifiDelete(+id);
      return {
        success: true,
        message: "successfully Deleted",
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }

  }

}
