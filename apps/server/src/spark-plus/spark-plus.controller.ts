import { BadRequestException, Body,Logger, Controller, HttpException, HttpStatus, Post, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SparkPlusService } from './spark-plus.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiCreatedResponse, ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import { GetXdsContext } from 'src/common/decorators/xdsContext.decorator';
import { XdsContext } from 'src/common/types/xds-context.type';
import { encodeMailcheckResponse, generateRandomPassword, getDaysBetweenTwoDates } from 'src/common/methods/common-methods';
import { Prisma } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import { RegisterDto } from './dtos/register-spark.dto';
import { UserResponseDto } from 'src/users/dtos/users.response.dto';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { LoggedInUser } from 'src/companies/dtos/login-user.dto';
import { CustomResponse } from 'src/common/types/custom-response.dto';
import { RegistrationRequestsService } from 'src/registration-requests/registration-requests.service';
import { PasswordsService } from 'src/auth/passwords/passwords.service';
import jwt from "jsonwebtoken";

@Controller('spark-plus')
export class SparkPlusController {
  constructor(private readonly sparkPlusService: SparkPlusService,
        private readonly mailerService: MailerService,
        private readonly logger: Logger,
        private readonly requestService: RegistrationRequestsService,
        private readonly passwordService: PasswordsService
        
        
  ) {}


    @Public()
    @Post("register")
    @ApiCreatedResponse({ type: UserResponseDto })
    @ApiOperation({
      summary: 'Request to create a new account. Admin will review this request before approval.',
      description: 'This endpoint allows a user to submit a request to create a new account. The registration details provided in the request will be reviewed by an admin before the account is officially created. The request should include necessary user information, and upon submission, the response will contain details of the submitted request. Final approval is required from an admin to activate the account.'
    })
    async register(
      @GetXdsContext() xdsContext: XdsContext,
      @Body() registerDto: RegisterDto,
      @Query("token") token: string
    ) {
      try{
      if (registerDto.userType !== "free" && registerDto.userType !== "init") {
        throw new BadRequestException("Invalid userType.");
      }
      const secret = process.env.XDS_JWT_KEY;
         if (!secret) {
          throw new Error('JWT secret key is not defined in environment variables');
          }
      const decoded = jwt.verify(token, secret);
      if (
            typeof decoded === 'object' &&
            'userId' in decoded &&
            decoded.userId !== registerDto.buyerId
          ) {
                return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
              }
      const user = await this.sparkPlusService.register(xdsContext, registerDto);
      if(user == "email existed"){
          return encodeMailcheckResponse(false);
      }
      xdsContext = {
        ...xdsContext,
        email: user.email,
        id: user.id,
      };
      xdsContext = Object.assign(xdsContext, { email: user.email, id: user.id });
      this.logger.log("new registration request", xdsContext);
  
      const registerationDetails = await this.sparkPlusService.getRegistrationById(user.id);
          if(registerationDetails) {
            const randomPassword = generateRandomPassword();
            const userCreatedInFirebase = await this.passwordService.updatePassword(registerationDetails.user?.email, randomPassword);
            if(userCreatedInFirebase.status) {
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
     
      return encodeMailcheckResponse(true);
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

   
  @Get('/findCompanySparkUsers/:userId')
  @ApiOperation({
    summary: 'Retrieve all Spark-users within the company',
    description: 'This endpoint allows a company admin or an authorized user to retrieve a list of all Spark-users associated with the company. It returns detailed information about each user, such as their roles, permissions, and other relevant profile details. This can be useful for managing users, reviewing company-wide user information, or conducting audits of user access within the company.'
  })
async findCompanySparkUsers(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUser() user: LoggedInUser) {
    try {
      if(user.userRoles[0].roleCode !=="buyer" || !user.isPaidUser ||user.id !==userId){
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
       }
       
      const res= await this.sparkPlusService.findCompanySparkUsers(userId);
       return {status:true, res: res};
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
    @ApiExcludeEndpoint()
    @Get("validate-register-token-spark")
    async Validate(@Query("token") token: string) {
      try {
        if (token && token != "") {
          const isToken = await this.sparkPlusService.getToken(token);
          if (isToken) {
            if (getDaysBetweenTwoDates(new Date(), isToken.urlGeneratedDate) < 29) {
              return new CustomResponse(HttpStatus.OK, true,isToken);
            } else {
              throw new BadRequestException("Link Expired");
            }
          } else {
            throw new BadRequestException("Unauthorized Access");
          }
        } else {
          throw new BadRequestException("Unauthorized Access");
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

  @Get("get-token-for-url/:userId")
  async prepareTheUrlToSend( 
            @Param('userId', ParseIntPipe) userId: number,
            @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode === "service_provider" || !user.isPaidUser  ||user.id !==userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      const token = await this.sparkPlusService.generateToken(user.id);
      if (token.theToken) {
        let frontEndUrl = process.env.XDS_FRONTEND_BASE_URL;
        const sharableUrl = `${frontEndUrl}/register-spark?token=${token.theToken}`
        return new CustomResponse(HttpStatus.OK, true, sharableUrl);
      } else {
        throw new BadRequestException("Unauthorized Access");
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


    @Get(":sparkUserId/archieve")
    @ApiOperation({
      summary: "Archive a spark-user by ID",
      description: "Marks a specific user, identified by their ID, as archived. This operation is typically used to deactivate or remove the user from active listings without permanently deleting their account."
    })
    async setIsArchieved(
      @Param("sparkUserId", ParseIntPipe) sparkUserId: number,
      @Query('buyerUserId',ParseIntPipe) buyerUserId: number,
      @CurrentUser() loggedUser: LoggedInUser
    ) {
      try {
        if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "buyer"&& !loggedUser.isPaidUser && loggedUser.id!==buyerUserId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
        }
        let user = await this.sparkPlusService.updateIsArchieveToTrue(sparkUserId,buyerUserId);
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
  
    @Get(":sparkUserId/un-archive")
    @ApiOperation({
      summary: "Unarchive a spark-user by ID",
      description: "Restores a previously archived user, identified by their ID, back to active status. This operation allows administrators to reactivate user accounts that were archived."
    })
    async unArchive(
      @Param("sparkUserId", ParseIntPipe) sparkUserId: number,
      @Query('buyerUserId',ParseIntPipe) buyerUserId: number,
      @CurrentUser() loggedUser: LoggedInUser
    ){
      try {
        if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "buyer" && !loggedUser.isPaidUser  && loggedUser.id!==buyerUserId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
        }
        let user = await this.sparkPlusService.updateIsArchieveToFalse(sparkUserId,buyerUserId);
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
  
    @Get(":sparkUserId/delete")
    @ApiOperation({
      summary: "Delete a spark-user by ID",
      description: "Permanently removes a user from the system, identified by their unique ID. This action cannot be undone and should be performed with caution."
    })
    async deleteUser(
      @Param("sparkUserId", ParseIntPipe) sparkUserId: number,
      @Query('buyerUserId',ParseIntPipe) buyerUserId: number,
      @CurrentUser() loggedUser: LoggedInUser
    ){
      try {
        if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "buyer"  && !loggedUser.isPaidUser  && loggedUser.id!==buyerUserId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
        }
        const isUserDeleted = await this.sparkPlusService.deleteUser(sparkUserId,buyerUserId);
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
  
  
}
