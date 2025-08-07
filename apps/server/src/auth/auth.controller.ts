import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  BadRequestException,
  HttpStatus,
  ParseIntPipe,
  HttpException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiBody,
} from "@nestjs/swagger";
import { RegisterDto } from "./dtos/register.dto";
import { MailerService } from "src/mailer/mailer.service";
import { Public } from "src/common/decorators/public.decorator";
import { UserResponseDto } from "src/users/dtos/users.response.dto";
import { XdsContext } from "src/common/types/xds-context.type";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { VerifyTokenResponseDto } from "./dtos/verify-token.response.dto";
import { TokenDto } from "./dtos/token.dto";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";

import { decodeEmail, decryptRememberMeToken, encodeMailcheckResponse, verifyAuthenticationJwtToken } from "src/common/methods/common-methods";
import {Prisma} from "@prisma/client";
@ApiBearerAuth()
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) { }

  @UseInterceptors(ClassSerializerInterceptor)
  @Public()
  @Post("login")
  @ApiOperation({
    summary: "Mainly for tracking login purpose. Receive and verify idToken from client side",
    description: "This endpoint is used for login tracking and authentication. It receives an ID token from the client-side, verifies its validity, and authenticates the user. The token is passed in the request body as part of the `tokenDto`, and additional context is provided via `xdsContext`. If successful, the response returns the user's details, including authentication status, encapsulated in the `UserResponseDto`."
  })
  @ApiOkResponse({ type: UserResponseDto })
  async login(
    @GetXdsContext() xdsContext: XdsContext,
    @Body() tokenDto: TokenDto,
  ): Promise<UserResponseDto> {
    try{
    const { idToken } = tokenDto;
    const checkedRemember2f = tokenDto.checkedRemember2f || "";
    const storedUserId = tokenDto.storedUserId;
    const rememberChecked = decryptRememberMeToken(checkedRemember2f);
    const rememberCheckedBool = rememberChecked?.isChecked === 'true';
    const user = await this.authService.loginAndReturnUser(
      idToken,
      false,
      rememberCheckedBool,
      storedUserId,
      rememberChecked?.email
    );
    this.logger.log("user logged in", {
      xdsContext,
      email: user.email,
      id: user.id,
    });

    return new UserResponseDto(user);
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
  @Public()
  @Post("login-with-terms")
  @ApiOperation({
    summary: "Mainly for tracking login purpose. Receive and verify idToken from client side",
    description: "This endpoint handles login authentication along with tracking acceptance of terms and conditions. It receives an ID token from the client side, verifies the token for authentication purposes, and checks if the user has accepted the latest terms and conditions. The request includes the ID token and any necessary data related to terms acceptance. If successful, the response will return the user's details along with their acceptance status for the terms."
  })
  @ApiOkResponse({ type: UserResponseDto })
  async loginWihtTerms(
    @GetXdsContext() xdsContext: XdsContext,
    @Body() tokenDto: TokenDto,
  ): Promise<UserResponseDto> {
    try{
      const { idToken } = tokenDto;
    const checkTerms = tokenDto.checkedTerms;
    const checkedRemember2f = tokenDto.checkedRemember2f || "";
    const storedUserId = tokenDto.storedUserId;
    const rememberChecked = decryptRememberMeToken(checkedRemember2f);
    const rememberCheckedBool = rememberChecked?.isChecked === 'true';
    const user = await this.authService.loginAndReturnUser(
      idToken,
      checkTerms,
      rememberCheckedBool,
      storedUserId,
      rememberChecked?.email
    );
    this.logger.log("user logged in", {
      xdsContext,
      email: user.email,
      id: user.id,
    });

    return new UserResponseDto(user);
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

  @Get("get-security-settings")
  @ApiOperation({
    summary: 'Retrieve security settings for the current user',
    description: 'This endpoint allows the logged-in user to retrieve their security settings, including the status of two-factor authentication (2FA). The response will provide details on whether 2FA is enabled, along with any other relevant security configurations associated with the user’s account.'
  })
  async getSecurityDetails(@CurrentUser() user: LoggedInUser) {
    try {
      let securityDetails;
      if (user.isCompanyUser) {
        securityDetails = await this.authService.getSubUsersSecuritySettingDetails(user.CompanyAdminId);
      } else {
        securityDetails = await this.authService.getUsersSecuritySettingDetails(user.id);
      }
      if (securityDetails) {
        return new CustomResponse(HttpStatus.OK, true, securityDetails)
      } else {
        return new CustomResponse(HttpStatus.OK, true, "success")
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
  @ApiExcludeEndpoint()
  @Get("/mailCheck/:email")
  async mailCheck(@Param("email") email: string) {
    try{
      return await this.authService.checkRegisterMail(email);
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
  @Post("register")
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiOperation({
    summary: 'Request to create a new account. Admin will review this request before approval.',
    description: 'This endpoint allows a user to submit a request to create a new account. The registration details provided in the request will be reviewed by an admin before the account is officially created. The request should include necessary user information, and upon submission, the response will contain details of the submitted request. Final approval is required from an admin to activate the account.'
  })
  async register(
    @GetXdsContext() xdsContext: XdsContext,
    @Body() registerDto: RegisterDto,
  ) {
    // if(registerDto.token) {
    //   const verifyToken = verifyAuthenticationJwtToken(registerDto.token);
    //   if(verifyToken == 'Expired'){
    //     throw new BadRequestException("Token expired");
    //   }
    //   registerDto = sanitizeData(registerDto);
    //   if(!registerDto.checkedTerms) {
    //     throw new BadRequestException("Terms and services not checked");
    //   }
    try{
    if (registerDto.userType !== "free" && registerDto.userType !== "init") {
      throw new BadRequestException("Invalid userType.");
    }
    const user = await this.authService.register(xdsContext, registerDto);
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

    await this.mailerService.sendThankYou({
      email: user.email,
      name: user.firstName,
    });
    this.logger.log("sent thankyou email", xdsContext);

    return encodeMailcheckResponse(true);

    // } else {
    //   throw new BadRequestException("Authentication token not found");
    // }
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
  @Public()
  @Post("verify-token")
  @ApiOperation({
    summary: 'Verify token and return user details if the token is valid',
    description: 'This endpoint verifies the validity of an authentication token provided by the client. If the token is valid, the associated user’s details are returned in the response. It is typically used for validating user sessions or confirming authorization. The response includes the user data and any other relevant information, wrapped in the `VerifyTokenResponseDto`.'
  })
  @ApiOkResponse({ type: VerifyTokenResponseDto })
  async verifyToken(
    @GetXdsContext() xdsContext: XdsContext,
    @Body() tokenDto: TokenDto,
  ): Promise<UserResponseDto> {
    try{
      const { idToken } = tokenDto;

    const user = await this.authService.verifyTokenAndReturnUser(
      xdsContext,
      idToken,
    );
    return new UserResponseDto(user);
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
  @Post("two-factor-auth")
  @ApiOperation({
    summary: 'Verify two-factor authentication (2FA) using OTP',
    description: 'This endpoint allows a user to verify two-factor authentication (2FA) by providing a one-time password (OTP) along with an access token. The user can also specify if they want to extend the session by checking the `isCheckedDuration` option. If the OTP is valid, the 2FA process is completed, and the user is authenticated.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        theOtp: { type: "string" },
        accessToken: { type: "string" },
        isCheckedDuration: { type: "boolean" }
      }
    }
  })
  async twoFactorAuth(@Body() postData: { theOtp: string, accessToken: string, isCheckedDuration: boolean }) {
    try {
      postData = sanitizeData(postData);
      const user = await this.authService.validateOtpAndReturnUser(postData.theOtp, postData.accessToken, postData.isCheckedDuration)
      if (user && user.id) {
        return user;
      } else {
        throw new BadRequestException("unauthorized user");
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
  @Post("resend-otp")
  @ApiOperation({
    summary: 'Resend a one-time password (OTP) to the user',
    description: 'This endpoint allows a user to request a new one-time password (OTP) to be sent to their registered contact method (e.g., email or phone number). This can be useful if the user did not receive the original OTP or if the OTP has expired. Upon successful request, the system will resend the OTP and provide a confirmation response.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { accessToken: {type : "string" }}
    }
  })
  async resendOtp(@Body() postData: { accessToken: string }) {
    try {
      const isOtpUpdate = await this.authService.resentOtpForVarification(postData.accessToken);
      if (isOtpUpdate) {
        return new CustomResponse(HttpStatus.OK, true, "otp resend successfully");
      } else {
        throw new BadRequestException("Bad request");
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

  @Post("signingOut")
  @ApiOperation({
    summary: 'Resend a one-time password (OTP) to the user',
    description: 'This endpoint allows a user to request a new one-time password (OTP) to be sent to their registered contact method (e.g., email or phone number). This can be useful if the user did not receive the original OTP or if the OTP has expired. Upon successful request, the system will resend the OTP and provide a confirmation response.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { accessToken: {type : "string" }}
    }
  })
  async signOut(@Body() postData: { accessToken: string }, @CurrentUser() user: LoggedInUser) {
    try {
         await this.authService.signOut(postData.accessToken, user.CompanyAdminId, user.isCompanyUser );
          return new CustomResponse(HttpStatus.OK, true, "Successfully logged out.");

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
