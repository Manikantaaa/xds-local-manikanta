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
} from "@nestjs/swagger";
import { RegistrationRequestsService } from "./registration-requests.service";
import { MailerService } from "src/mailer/mailer.service";
import { APPROVAL_STATUS, Prisma, ROLE_CODE } from "@prisma/client";
import { UsersService } from "src/users/users.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { RegistrationRequestsResponse } from "./dtos/registration-request.response";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { Parser } from "json2csv";
import { formatDate, getRoleString } from "src/common/methods/common-methods";
import { Response } from "express";

@ApiTags("registration-requests")
@Controller("registration-requests")
export class RegistrationRequestController {
  constructor(
    private readonly requestService: RegistrationRequestsService,
    private readonly mailerService: MailerService,
    private readonly usersService: UsersService,
  ) {}

  @Get("filter")
  @ApiOperation({
    summary: "Get All Registration Requests with filter",
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  @Public()
  async getAllRegistrationsByFilter(
    @Query("page") page: string,
    @Query("per_page") perPage: string,
    @Query("needToReview") needToReview?: APPROVAL_STATUS,
    @Query("isApproved") isApproved?: APPROVAL_STATUS,
    @Query("isRejected") isRejected?: APPROVAL_STATUS,
  ): Promise<
    CustomResponse<{ count: number; result: RegistrationRequestsResponse[] }>
  > {
    const searchObj: Prisma.RegistrationRequestsWhereInput[] = [];
    if (needToReview && needToReview == APPROVAL_STATUS.pending) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pending });
    }
    if (isApproved && isApproved == APPROVAL_STATUS.approved) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.approved });
    }
    if (isRejected && isRejected == APPROVAL_STATUS.rejected) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.rejected });
    }
    try {
      const registrations =
        await this.requestService.getAllRegistrationsByFilter(
          +page,
          +perPage,
          searchObj,
        );
      const counts =
        await this.requestService.getCountOfRegistrationByFilter(searchObj);
      const dataTosent: RegistrationRequestsResponse[] = [];
      for (const item of registrations) {
        const registrationResponse = Object.assign(
          new RegistrationRequestsResponse(),
          item,
        );
        dataTosent.push(registrationResponse);
      }
      return new CustomResponse(HttpStatus.OK, true, {
        count: counts,
        result: dataTosent,
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
  @Public()
  async getRegistrationsCsv(
    @Res() res: Response,
    @Query("needToReview") needToReview?: APPROVAL_STATUS,
    @Query("isApproved") isApproved?: APPROVAL_STATUS,
    @Query("isRejected") isRejected?: APPROVAL_STATUS,
  ) {
    const searchObj: Prisma.RegistrationRequestsWhereInput[] = [];
    if (needToReview && needToReview == APPROVAL_STATUS.pending) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.pending });
    }
    if (isApproved && isApproved == APPROVAL_STATUS.approved) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.approved });
    }
    if (isRejected && isRejected == APPROVAL_STATUS.rejected) {
      searchObj.push({ approvalStatus: APPROVAL_STATUS.rejected });
    }
    try {
      const parser = new Parser({
        fields: [
          "Registration Date",
          "Status",
          "Name",
          "Company",
          "Type",
          "Website",
          "Email",
          "LinkedIn",
        ],
      });
      const registrations =
        await this.requestService.getAllRegistrationsByFilter(
          0,
          999999,
          searchObj,
        );
      const finalResult: Array<{ [key: string]: string }> = [];
      if (registrations.length > 0) {
        registrations.forEach((item) => {
          const company = {
            "Registration Date": formatDate(item.createdAt),
            Status: item.isArchieve ? "Archive" : "Live",
            Name: item.user.firstName + " " + item.user.lastName,
            Company: item.user.companies[0]?.name,
            Type: getRoleString(item.user.userRoles[0].roleCode),
            Website: item.user.companies[0]?.website,
            Email: item.user.email,
            LinkedIn: item.user.linkedInUrl,
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

  @Public() // temporary to test approve feature
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
  ) {
    try{
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
  @Public() // temporary to test approve feature
  @Put(":registrationRequestId/reject")
  @ApiOperation({
    summary: "Reject new registration request",
  })
  @ApiOkResponse()
  async rejectRequest(
    @Param("registrationRequestId", ParseIntPipe) registrationRequestId: number,
  ) {
    try{
      const request = await this.requestService.reject(registrationRequestId);

    const user = await this.usersService.findUnique(request.userId);
    await this.mailerService.sendRejectRegistrationRequest({
      email: user?.email as string,
      name: user?.firstName as string,
    });
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
      const user = await this.requestService.validateOrThrow(token);
    return user;
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

  @Get("")
  @ApiOperation({
    summary: "",
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  @Public()
  async getAllRegistrations(): Promise<RegistrationRequestsResponse[]> {
    try {
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
    summary: "Update status of Registration Requests",
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse()
  @Public()
  async deleteRegistration(
    @Param("id", ParseIntPipe) registrationRequestId: number,
  ): Promise<RegistrationRequestsResponse> {
    try {
      const registrations = await this.requestService.deleteRegistration(
        registrationRequestId,
      );
      const registrationResponse = Object.assign(
        new RegistrationRequestsResponse(),
        registrations,
      );
      return registrationResponse;
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
