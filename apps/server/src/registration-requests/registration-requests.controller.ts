import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { RegistrationRequestsService } from "./registration-requests.service";
import { MailerService } from "src/mailer/mailer.service";
import { APPROVAL_STATUS, Prisma, ROLE_CODE } from "@prisma/client";
import { UsersService } from "src/users/users.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { CompaniesService } from "src/companies/companies.service";
import { RegistrationRequestsResponse } from "./dtos/registration-request.response";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { Parser } from "json2csv";
import { formatDate, generateRandomPassword, getRoleString, getTypeString, getUserTypeString } from "src/common/methods/common-methods";
import { Response } from "express";
import { PasswordsService } from "src/auth/passwords/passwords.service";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { User } from "mailtrap/dist/types/api/accounts";

@ApiTags("registration-requests")
@Controller("registration-requests")
export class RegistrationRequestController {
  constructor(
    private readonly requestService: RegistrationRequestsService,
    private readonly mailerService: MailerService,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordsService
  ) {}

  @Roles(ROLE_CODE.admin)
  @Put(":registrationRequestId/approve")
  @ApiOperation({
    summary:
      "Approve new registration request so that system can send email to user to complete creating account",
  })
  @ApiOkResponse()
  async approveRequest(
    @GetXdsContext() xdsContext: XdsContext,
    @Param("registrationRequestId", ParseIntPipe) registrationRequestId: number,
    @CurrentUser() loggedUser: LoggedInUser
  ) {
   try{
    if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
    }
    const generatedToken = this.requestService.generateCompleteSetupToken();

    const request = await this.requestService.approve(
      registrationRequestId,
      generatedToken,
    );

    const user = await this.usersService.findUnique(request.userId);
    await this.mailerService.sendCompleteSetupAccount(xdsContext, {
      email: user?.email as string,
      name: user?.firstName as string,
      generatedToken,
    });
    return new CustomResponse(HttpStatus.OK, true, "success");
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
  @Put(":registrationRequestId/complete-foundational-request")
  @ApiOperation({
    summary: "Approve new Foundational users request to make them login to the system",
  })
  @ApiOkResponse()
  async completeFoundationalUsersRequest(
    @Param("registrationRequestId", ParseIntPipe) registrationRequestId: number,
    @CurrentUser() loggedUser:LoggedInUser,
  ) {
    try{
    if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
    }

    const registerationDetails = await this.requestService.getRegistrationById(registrationRequestId);
    if(registerationDetails) {
      const randomPassword = generateRandomPassword();
      const userCreatedInFirebase = await this.passwordService.updatePassword(registerationDetails.user?.email, randomPassword);
      if(userCreatedInFirebase.status) {
        // await this.usersService.updateUsersPasswordAdminSet(registerationDetails.user?.id);
        const mailSendSuccess = this.mailerService.completeFoundationalUserMail({
          email: registerationDetails.user?.email,
          name: registerationDetails.user?.firstName,
          password: randomPassword,
          userRole: registerationDetails.user?.userRoles[0]?.roleCode,
        });
        await this.requestService.completeFoundationalUser(registerationDetails.id);
      }
    } else {
      throw new BadRequestException("Error in approving")
    }
    return new CustomResponse(HttpStatus.OK, true, "success");
    // const request = await this.requestService.completeFoundationalUser(registrationRequestId);
    // const user = await this.usersService.findUnique(request.userId);
    // if(user){
    //   const randomPassword = generateRandomPassword();
    //   const mailSendSuccess = await this.mailerService.completeFoundationalUserMail({
    //     email: user.email,
    //     name: user.firstName,
    //     password: randomPassword,
    //     userRole: user.userRoles[0]?.roleCode,
    //   });
    //   if(mailSendSuccess.response) {
    //     
    //   }
    // }
    // 
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
  @Put(":registrationRequestId/reject")
  @ApiOperation({
    summary: "Reject new registration request",
  })
  @ApiOkResponse()
  async rejectRequest(
    @Param("registrationRequestId", ParseIntPipe) registrationRequestId: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
  try{
    if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
    }
    const request = await this.requestService.reject(registrationRequestId);

    const user = await this.usersService.findUnique(request.userId);
    await this.mailerService.sendRejectRegistrationRequest({
      email: user?.email as string,
      name: user?.firstName as string,
    });
    return new CustomResponse(HttpStatus.OK, true, "success");
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
  @Get("validate")
  @ApiOperation({
    summary:
      "Validate token in approval email to make sure that this request comes from XDS system",
  })
  @ApiOkResponse()
  @ApiBadRequestResponse({ description: "Invalid token" })
  async validate(@Query("token") token: string) {
    try{
      if(token && token != ""){
      const user = await this.requestService.validateOrThrow(token);
      return user;
    }
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

  @Get("filter")
  @ApiOperation({
    summary: 'Get all registration requests with filter options',
    description: 'This endpoint allows an admin or authorized user to retrieve a list of all registration requests, with the ability to apply various filters to narrow down the results. The filters can include parameters such as request status, submission date, or user role. This operation is useful for efficiently managing and reviewing registration requests in large systems. The response will include the filtered list of requests along with relevant details for each request.'
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  async getAllRegistrationsByFilter(
    @CurrentUser() loggedUser:LoggedInUser,
    @Query("search") searchString: string,
    @Query("needToReview") needToReview?: APPROVAL_STATUS,
    @Query("isApproved") isApproved?: APPROVAL_STATUS,
    @Query("isRejected") isRejected?: APPROVAL_STATUS,
    @Query("underReview") underReview?: APPROVAL_STATUS,
  ): Promise<
    CustomResponse<{ result: RegistrationRequestsResponse[] }>
  > {
    const searchObj: Prisma.RegistrationRequestsWhereInput[] = [];
    if (needToReview && needToReview == APPROVAL_STATUS.pending) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pending });
    }
    if (isApproved && isApproved == APPROVAL_STATUS.approved) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.approved });
      searchObj.push({ approvalStatus: APPROVAL_STATUS.completed });
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pwdCreated });
    }
    if (isRejected && isRejected == APPROVAL_STATUS.rejected) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.rejected });
    }
    if (underReview && underReview == APPROVAL_STATUS.underReview) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.underReview });
    }
    try {
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const registrations =
        await this.requestService.getAllRegistrationsByFilter(
          searchObj,
          searchString,
        );
      // const counts = await this.requestService.getCountOfRegistrationByFilter(
      //   searchObj,
      //   searchString,
      // );
      const dataTosent: RegistrationRequestsResponse[] = [];
      for (const item of registrations) {
        const registrationResponse = Object.assign(
          new RegistrationRequestsResponse(),
          item,
        );
        dataTosent.push(registrationResponse);
      }
      const reviews = await this.requestService.getreviewsCount();
      return new CustomResponse(HttpStatus.OK, true, {
        result: dataTosent,
        reviewsCount: reviews,
      });
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

  @Get("export-excel-data")
  @ApiExcludeEndpoint()
  async getRegistrationsCsv(
    @CurrentUser() loggedUser:LoggedInUser,
    @Res() res: Response,
    @Query("searchVal") searchString: string,
    @Query("needToReview") needToReview?: APPROVAL_STATUS,
    @Query("isApproved") isApproved?: APPROVAL_STATUS,
    @Query("isRejected") isRejected?: APPROVAL_STATUS,
    @Query("underReview") underReview?: APPROVAL_STATUS,
  ) {
    const searchObj: Prisma.RegistrationRequestsWhereInput[] = [];
    if (needToReview && needToReview == APPROVAL_STATUS.pending) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pending });
    }
    if (isApproved && isApproved == APPROVAL_STATUS.approved) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.approved });
      searchObj.push({ approvalStatus: APPROVAL_STATUS.completed });
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pwdCreated });
    }
    if (isRejected && isRejected == APPROVAL_STATUS.rejected) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.rejected });
    }
    if (underReview && underReview == APPROVAL_STATUS.underReview) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.underReview });
    }
    try {
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const parser = new Parser({
        fields: [
          "Registration Date",
          "Name",
          "Company",
          "Role",
          "Current Type",
          "Status",
          "Website",
          "Email",
          "LinkedIn",
          "Subscribed",
        ],
      });
      const registrations =
        await this.requestService.getAllRegistrationsByFilter(
          searchObj,
          searchString,
        );
      const finalResult: Array<{ [key: string]: string }> = [];
      if (registrations.length > 0) {
        registrations.forEach((item) => {
          const company = {
            "Registration Date": formatDate(item.createdAt),
            Name: item.user.firstName + " " + item.user.lastName,
            Company: item.user.companies[0]?.name,
            Role: getRoleString(item.user.userRoles[0].roleCode),
            "Current Type": getUserTypeString(item.user.userType, item.user.trialDuration, 'register'),
            Status: item.approvalStatus.charAt(0).toUpperCase() + item.approvalStatus.slice(1),
            Website: item.user.companies[0]?.website,
            Email: item.user.email,
            LinkedIn: item.user.linkedInUrl,
            Subscribed:( item.user.userType == "paid" || item.user.userType == "init" )? (item.approvalStatus == "completed" ? "Yes" : "No") : "NA",
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
        res.attachment("registrations.csv");
        return res.send(csv);
      } else {
        throw new BadRequestException();
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
    summary: 'Retrieve all registration requests',
    description: 'This endpoint allows an admin or authorized user to retrieve a list of all registration requests in the system. It provides a complete overview of all users who have applied for registration, including their details, status, and any other relevant information. This operation is typically used for managing and reviewing new user registrations. The response will return all registration requests along with their associated data.'
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  async getAllRegistrations(@CurrentUser() loggedUser:LoggedInUser): Promise<RegistrationRequestsResponse[]> {
    try {
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const registrations = await this.requestService.getAllRegistrations();
      const dataTosent: RegistrationRequestsResponse[] = [];
      for (const item of registrations) {
        const registrationResponse = Object.assign(
          new RegistrationRequestsResponse(),
          item,
        );
        dataTosent.push(registrationResponse);
      }
      return dataTosent;
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

  // @Roles(ROLE_CODE.admin)
  @Get(":id/delete")
  @ApiOperation({
    summary: 'Update the status of a registration request',
    description: 'This endpoint allows an admin or authorized user to update the status of a specific registration request, identified by its `id`. Typically, this is used to mark a registration request as deleted or to change its current status. The operation is useful for managing the registration process and keeping the list of active registration requests up to date. The response will confirm the successful update of the registration request status.'
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  async deleteRegistration(
    @Param("id", ParseIntPipe) registrationRequestId: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      await this.requestService.deleteRegistration(registrationRequestId);
      return new CustomResponse(HttpStatus.OK, true, "Successfully deleted")
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

  @Get(":id/under-review")
  @ApiOperation({
    summary: 'Mark a registration request as under review',
    description: 'This endpoint allows an admin or authorized user to update the status of a specific registration request, identified by its `id`, and mark it as "under review." This is useful for tracking the progress of registration requests and indicating that a particular request is being actively reviewed by the admin team. The response will confirm the status update to "under review."'
  })
  async makeUnderReview(@Param("id", ParseIntPipe) userId: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      await this.usersService.updateStatusToUnderReview(+userId);
      return new CustomResponse(HttpStatus.OK, true, "updated success");
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

}
