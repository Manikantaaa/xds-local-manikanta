import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Param,
  ParseIntPipe,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
  Res,
  HttpException,
  UploadedFile
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { PasswordsService } from "./passwords.service";
import { Public } from "src/common/decorators/public.decorator";
import { UsersService } from "src/users/users.service";
import { CompaniesService } from "src/companies/companies.service";
import { CreatePasswordDto } from "./dtos/create-password.dto";
import { RegistrationRequestsService } from "src/registration-requests/registration-requests.service";
import { MailerService } from "src/mailer/mailer.service";
import { generateRandomPassword } from "src/common/methods/common-methods";
import { CompanyInformationForAdmin } from "src/companies/dtos/company-info-admin.response.dto";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { ROLE_CODE, USER_TYPE, Users,Prisma } from "@prisma/client";
import { Roles } from "src/common/decorators/roles.decorator";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { Parser } from "json2csv";
import { Response } from "express";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { FirebaseService } from "src/services/firebase/firebase.service";
import { FileInterceptor } from "@nestjs/platform-express";
// import { FirebaseService } from "src/services/firebase/firebase.service";

@ApiBearerAuth()
@ApiTags("auth")
@Controller("passwords")
export class PasswordsController {

  constructor(
    private readonly passwordsService: PasswordsService,
    private readonly requestService: RegistrationRequestsService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly firebaseService: FirebaseService,
    private readonly companiesService: CompaniesService,
  ) { }

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create a new password for the user account',
    description: 'This endpoint allows a user to set a new password for their account using a provided token. The token is used to verify the user’s identity and ensure that the password reset request is valid. If the token is invalid, a bad request response will be returned. Upon successfully creating the new password, the user will receive a confirmation of the update.'
  })
  @ApiOkResponse()
  @ApiBadRequestResponse({ description: "Invalid token" })
  async createPassword(@Body() createPasswordDto: CreatePasswordDto) {
    try{
      const { token, password } = createPasswordDto;

    const user = await this.requestService.validateOrThrow(token);

    if (user) {
      await this.passwordsService.setupPassword(user.email, password);

      await this.usersService.updateApprovalStatusToPwdCreated(
        user?.id as number,
      );
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

  @Public()
  @Post("recreate-user")
  @ApiOperation({
    summary: 'Recreate a user account',
    description: 'This endpoint allows a user to recreate their account after it has been deactivated or deleted. The user must provide necessary information to verify their identity and complete the recreation process. If successful, a new user account will be established, and relevant details will be returned in the response.'
  })
  async updateEmailAndCreateUser(@Body() createPasswordDto: CreatePasswordDto) {
    try{
      const { token, password } = createPasswordDto;
    const user = await this.requestService.validateOrThrow(token);
    if (user) {
      await this.firebaseService.updateEmail(
        user.email,
        `deleted-${user.id}-` + user.email,
      );
      await this.passwordsService.setupPassword(user.email, password);
      await this.usersService.updateApprovalStatusToPwdCreated(
        user?.id as number,
      );
    } else {
      throw new BadRequestException("Invalid token")
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

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/reset-password/:type")
  @ApiOperation({
    summary: 'Reset a user’s password',
    description: 'This endpoint allows an admin or authorized user to reset the password for a specific user identified by their `id`. Upon triggering this operation, an email notification will be sent to the user with instructions to create a new password. This action is typically used for account recovery or security purposes. The response will confirm that the password reset request has been successfully initiated.'
  })
  @ApiOkResponse()
  async resetUsersPassword(@Param("id", ParseIntPipe) userId: number, @Param("type") type: string, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const user = await this.usersService.findUnique(userId);
      const randomPassword = generateRandomPassword();
      if (user) {
        await this.passwordsService.updatePassword(user.email, randomPassword);
        await this.usersService.updateUsersPasswordAdminSet(user.id);
        if(type == "resetPasswordMail") {
          await this.mailerService.resetPassword({
            email: user.email,
            name: user.firstName,
            password: randomPassword,
          });
        } else if(type == "userEditMail"){
          await this.mailerService.userEditResetPassword({
            email: user.email,
            name: user.firstName,
            password: randomPassword,
          });
        }

        return new CustomResponse(HttpStatus.OK, true, {
          message: "Password reset successfully",
        });
      } else {
        throw new BadRequestException("User not found");
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

  @Get(":id/send-password/:type")
  @ApiOperation({
    summary: 'Send a welcome email to the user',
    description: 'This endpoint allows an admin or authorized user to send a welcome email to a specific user identified by their `id`. The `type` parameter specifies the format or content of the welcome email being sent. This operation is typically used to provide new users with important account information, instructions for getting started, or other relevant details. The response will confirm that the welcome email has been successfully dispatched.'
  })
  async sendWelcomeMail(@Param("id", ParseIntPipe) id: number, @Param("type") type: string, @CurrentUser() loggedUser: LoggedInUser,): Promise<CustomResponse<string>> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const user = await this.usersService.findUnique(id);
      if (user) {
        await this.usersService.updateUserType(id, type);
        const randomPassword = generateRandomPassword();
        if (user && user.email) {
          await this.passwordsService.updatePassword(
            user.email,
            randomPassword,
          );
          // console.log(randomPassword);
          await this.mailerService.setNewPassword({
            email: user.email,
            name: user.firstName,
            password: randomPassword,
            userRole: user.userRoles[0]?.roleCode
          }, type);
          if (type == "trialUser8Week") {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (8 * 7));
            await this.usersService.setTheAccessExpirationDate(user.id, futureDate);
          } else if(type == "trialUser6months") {
            const futureDate = new Date("2025-10-31");
            await this.usersService.setTheAccessExpirationDate(user.id, futureDate);
          }
        }
        return new CustomResponse(HttpStatus.OK, true, "Successfully sent mail");
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

  // Bulk service providers sending 30days trail welcome mails by csv.
  @Post("send-free-sp-mail")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes('multipart/form-data')
  async sendDataFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() loggedUser: LoggedInUser
  ) {
    if (!file) {
      throw new BadRequestException("File not Supported");
    }
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const result = await this.companiesService.parseCsvBuffer(file.buffer, '');
      const userIds: number[] = [];
      for (const data of result) {
        const userId = await this.companiesService.findCompaniesByEmail(data.Email.trim().toLowerCase());
        if (userId && userId[0]) {
          userIds.push(userId[0].id);
        }
      };
      const response = await this.sendMultipleWelcomeMail(
        { companyIds: userIds, type: 'trialUser6months' },
        loggedUser
      );
      // const isInsertionSucces =
      //   await this.companiesService.importCsvData(result);
      // if (!isInsertionSucces) {
      //   throw new BadRequestException("File is not in correct format");
      // }
      return new CustomResponse(HttpStatus.OK, true, {
        status: response,
        message: "Importing success",
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

  @Post("send-multiple-password")
  @ApiOperation({
    summary: 'Send welcome emails to multiple users',
    description: 'This endpoint allows an admin or authorized user to send welcome emails to multiple users at once. The request should include an array of user identifiers (e.g., user IDs or email addresses) to whom the welcome emails will be sent. This operation is useful for onboarding multiple users simultaneously, providing them with important account information and instructions for getting started. The response will confirm the successful dispatch of welcome emails to the specified users.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of company IDs whose users will receive welcome emails'
        },
        type: {
          type: 'string',
          description: 'Type of welcome email to be sent',
          example: 'standard'  // Example value
        }
      },
      required: ['companyIds', 'type'],
    }
  })
  async sendMultipleWelcomeMail(
    @Body() postData: { companyIds: number[], type: string },
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (postData.companyIds) {
        const failedMail = [];
        const successMails = [];
        const allMails = [];
        for (const item of postData.companyIds) {
          const user = await this.usersService.findUnique(item);
          if (user) {
            if (user && postData.type == "trialUser6months" && (user.userType == USER_TYPE.init || user.userType == USER_TYPE.free || user.userType == USER_TYPE.trial)) {
              const randomPassword = generateRandomPassword();
              if (user && user.email) {
                // const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
                const mailFormatCheck = pattern.test(user.email);
                if (mailFormatCheck) {
                  const response = await this.mailerService.setNewPassword({
                    email: user.email,
                    name: user.firstName,
                    password: randomPassword,
                    userRole: user.userRoles[0]?.roleCode,
                  }, postData.type);
                  if (response.response) {
                    await this.usersService.updateUserType(user.id, postData.type);
                    await this.passwordsService.updatePassword(
                      user.email,
                      randomPassword,
                    );
                    if (postData.type == "trialUser6months") {
                      const futureDate = new Date('2025-10-31');
                      // futureDate.setDate(futureDate.getDate());
                      await this.usersService.setTheAccessExpirationDate(user.id, futureDate);
                    }
                    successMails.push(response.accepted);
                  } else {
                    failedMail.push(user.email);
                  }
                } else {
                  failedMail.push(user.email);
                }

              }
            }
            else if (user && (user.userType == USER_TYPE.init || user.userType == USER_TYPE.free)) {
              const randomPassword = generateRandomPassword();
              if (user && user.email) {
                // const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
                const mailFormatCheck = pattern.test(user.email);
                if (mailFormatCheck) {
                  const response = await this.mailerService.setNewPassword({
                    email: user.email,
                    name: user.firstName,
                    password: randomPassword,
                    userRole: user.userRoles[0]?.roleCode,
                  }, postData.type);
                  if (response.response) {
                    await this.usersService.updateUserType(user.id, postData.type);
                    await this.passwordsService.updatePassword(
                      user.email,
                      randomPassword,
                    );
                    if (postData.type == "trialUser8Week") {
                      const futureDate = new Date();
                      futureDate.setDate(futureDate.getDate() + (8 * 7));
                      await this.usersService.setTheAccessExpirationDate(user.id, futureDate);
                    }
                    successMails.push(response.accepted);
                  } else {
                    failedMail.push(user.email);
                  }
                } else {
                  failedMail.push(user.email);
                }

              }
            }
          }
        }
        allMails.push({ failedMail, successMails });
        return allMails;
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

  // @Post("send-multiple-password")
  // @ApiOperation({ summary: "Send Multiple Welcome Mail" })
  // async sendMultipleWelcomeMail(
  //   @Res() res: Response,
  //   @Body() postData: { companies: number[] },
  // ) {
  //   try {
  //     const parser = new Parser({
  //       fields: [
  //         "First Name",
  //         "Last Name",
  //         "Email",
  //         "Password"
  //       ],
  //     });
  //     const emailAndPasswordArray: Array<{ [key: string]: string }> = [];
  //     if (postData.companies) {
  //       for (const item of postData.companies) {
  //         const user = await this.usersService.findUnique(item);
  //         if (user) {
  //           const randomPassword = generateRandomPassword();
  //           if (user && user.email) {
  //             const updatedFirebaseUser = await this.passwordsService.updatePassword(
  //               user.email,
  //               randomPassword,
  //             );
  //             if(updatedFirebaseUser) {
  //               emailAndPasswordArray.push({Email: user.email, Password: randomPassword, "First Name": user.firstName, "Last Name": user.lastName});
  //             }
  //           }
  //         }
  //       }
  //     }
  //     if(emailAndPasswordArray.length > 0) {
  //       const csv = parser.parse(emailAndPasswordArray);
  //       if (!res) {
  //         throw new BadRequestException();
  //       }
  //       res.header("Content-Type", "text/csv");
  //       res.attachment("emal_and_Passwords");
  //       return res.send(csv);
  //     } else {
  //       throw new BadRequestException();
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     throw new BadRequestException();
  //   }
  // }

  @Post("change-password")
  @ApiOperation({
    summary: 'Change the user’s password',
    description: 'This endpoint allows a user with the roles of service provider or buyer to change their account password. The request must include the current password for verification and the new password to be set. This operation enhances account security by enabling users to update their passwords as needed. Upon successful completion, a confirmation response will be provided to indicate that the password has been changed successfully.'
  })
  @Roles(ROLE_CODE.service_provider, ROLE_CODE.buyer)
  async changePassword(
    @CurrentUser() user: LoggedInUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() postData: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<CustomResponse<string>> {
    try {
      postData = sanitizeData(postData);

      if ((postData.isCompanyUser && user.CompanyAdminId != postData.id) && (!postData.isCompanyUser && postData.id != user.id)) {
        throw new ForbiddenException("Access Denied");
      }
      // const isValid = await this.firebaseService.verifyPassword(user.email, postData.oledPassword);
      // if (!isValid) {
      //   throw new BadRequestException("User not found");
      // } 


      if (postData.isCompanyUser) {
        const userDetails = await this.usersService.findFirstByCompanyAdminUserId(
          postData.id,
        );
        if (userDetails && userDetails.email) {
          await this.mailerService.passwordChangedSuccess({ email: userDetails.email, name: userDetails.firstName });
        } else {
          throw new BadRequestException("User not found");
        }
      } else {
        const userDetails = await this.usersService.findFirstByUserId(
          postData.id,
        );
        if (userDetails && userDetails.email) {
          await this.mailerService.passwordChangedSuccess({ email: userDetails.email, name: userDetails.firstName });
        } else {
          throw new BadRequestException("User not found");
        }
      }


      // const passwordChanged = await this.passwordsService.changePassword(
      //   user.email,
      //   postData.newPassword,
      // );

      return new CustomResponse(
        HttpStatus.OK,
        true,
        "password changed successfully",
      );

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

  @Post("password-change")
  @ApiOperation({
    summary: 'Admin changes a user’s password',
    description: 'This endpoint allows an admin user to change the password of another user. The request must include the target user’s identifier (e.g., user ID or email) and the new password to be set. This operation is typically used for account recovery, security management, or when users are unable to reset their passwords themselves. Upon successful completion, a confirmation response will indicate that the password has been changed successfully.'
  })
  async passwordChange(@CurrentUser() loggedUser: LoggedInUser, @Body() postData: any,) {
    try {
      const user = await this.usersService.findAdminuserId(loggedUser.CompanyAdminId);
      if (user && user.email && user.id && !user.isPasswordChanged) {
        const passwordChanged = await this.passwordsService.changePassword(
          user.email,
          postData.newPassword,
        );
        if(passwordChanged && passwordChanged.uid) {
          await this.usersService.updateAdminUserPasswordChangeStatus(user.id);
        } else {
          throw new BadRequestException("User not found");
        }
        return new CustomResponse(HttpStatus.OK, true, "password changed successfully");
      } else {
        const user = await this.usersService.findUnique(loggedUser.id);
        if (user && user.email && user.id && user.passwordNeedToChange == 'adChanged') {
          const passwordChanged = await this.passwordsService.changePassword(
            user.email,
            postData.newPassword,
          );
          if (passwordChanged && passwordChanged.uid) {
            await this.usersService.updateUsersPasswordChangeStatus(user.id);
          } else {
            throw new BadRequestException("User not found");
          }
          return new CustomResponse(HttpStatus.OK, true, "password changed successfully");
        } else {
          throw new BadRequestException("User not found");
        }
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

  // @Post('verify-password')
  // async verifyPassword(@Body() body: { email: string; password: string }) {
  //   const { email, password } = body;
  //   const isValid = await this.firebaseService.verifyPassword(email, password);
  //   return { isValid };
  // }

  @Post("send-reset-password-link")
  @Public()
  async sendResetPasswordUrl(@Body() postData: { email: string }) {
    try {
      let email = "";
      if (postData && postData.email && postData.email != '') {
        email = postData.email;
        const checkTheUserInFirebase = await this.passwordsService.checkUserExistInFirebase(email);
        if (!checkTheUserInFirebase) {
          return 'If this email address exists, you will receive an email with a password reset link from XDS Spark.';
        }
      }
      const theUser = await this.usersService.findOneByEmailOrThrow(email);
      if (theUser && theUser.id) {
        const generatedToken = this.requestService.generateCompleteSetupToken();
        let theBackupUser;
        if (theUser.isCompanyUser && theUser.email != postData.email) {
          //company added Users
          theBackupUser = await this.usersService.saveTheCompanyUserTokenInBackup(postData.email, generatedToken);
        } else {
          //company
          theBackupUser = await this.usersService.saveTheTokenInBackup(theUser.id, generatedToken);
        }

        if (theBackupUser && theBackupUser.id) {
          // send the url
          await this.mailerService.forgotPasswordMail({
            email: postData.email,
            name: theUser.firstName,
            generatedToken: generatedToken,
          });
        }
        return 'If this email address exists, you will receive an email with a password reset link from XDS Spark';
      } else {
        return 'If this email address exists, you will receive an email with a password reset link from XDS Spark';
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

  @Public()
  @Post("reset-new-password")
  async resetNewPassword(@Body() postData: { token: string, password: string }): Promise<CustomResponse<string>> {
    try {
      if (postData) {
        const theUserFromToken = await this.usersService.getUserFromToken(postData.token);
        if (theUserFromToken && theUserFromToken.user.email && theUserFromToken.user.firstName) {
          const updatePassword = await this.passwordsService.changePassword(theUserFromToken.user.email, postData.password);
          if (updatePassword) {
            await this.usersService.removeThePasswordToken(theUserFromToken.user.email);
            await this.mailerService.successForgotPassword({
              email: theUserFromToken.user.email,
              name: theUserFromToken.user.firstName,
            });
            return new CustomResponse(HttpStatus.OK, true, "password changes successfully");
          } else {
            throw new BadRequestException("password not updated");
          }
        } else {
          throw new BadRequestException("email not found");
        }

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

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/reset-invitee-password")
  @ApiOperation({
    summary: 'Reset an invitee’s password',
    description: 'This endpoint allows an admin or authorized user to reset the password of an invitee, identified by their `id`. This operation is typically used when the invitee needs assistance resetting their password or if they are unable to do it themselves. Upon execution, the system will trigger a password reset process for the invitee, and a notification or email will be sent with instructions for setting a new password.'
  })
  @ApiOkResponse({
    description: 'The password reset process for the invitee has been successfully initiated.'
  })
  async resetInviteePassword(@Param("id", ParseIntPipe) userId: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const user = await this.usersService.findUniqueInvitee(userId);
      const randomPassword = generateRandomPassword();
      if (user) {
        await this.passwordsService.updatePassword(user.email, randomPassword);
        await this.usersService.updateInviteePasswordAdminSet(user.id);
        await this.mailerService.resetPassword({
          email: user.email,
          name: user.firstName,
          password: randomPassword,
        });
        return new CustomResponse(HttpStatus.OK, true, {
          message: "Password reset successfully",
        });
      } else {
        throw new BadRequestException("User not found");
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
}
