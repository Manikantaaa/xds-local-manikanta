import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { TRIAL_PERIOD, USER_TYPE } from "@prisma/client";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import API_PERMISSIONS from "src/common/constants/restrictedapi.constant";
import { encodeMailcheckResponse, generateOtp, getMinutesBetweenTwoDates } from "src/common/methods/common-methods";
import { XdsContext } from "src/common/types/xds-context.type";
import { CompaniesService } from "src/companies/companies.service";
import { MailerService } from "src/mailer/mailer.service";
import { UserResponseDto } from "src/users/dtos/users.response.dto";
import { UserRequest } from "src/users/type";
import { UsersService } from "src/users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
    private readonly mailerService: MailerService
  ) { }

  async verifyFirebaseToken(token: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException("Invalid token");
    }
  }

  async register(xdsContext: XdsContext, user: UserRequest) {
    const existingUser = await this.usersService.findOneByEmail(user.email.toLowerCase());
    const existingSubUser = await this.usersService.findSubUserByEmail(user.email.toLowerCase());
    if (
      (user.firstName && user.firstName.length > 25) ||
      (user.lastName && user.lastName.length > 25) ||
      (user.companyName && user.companyName.length > 25)
    ) {
      const errorMessage = "Invalid input";
      this.logger.error(errorMessage, { xdsContext, email: user.email });
      throw new BadRequestException(errorMessage);
    }
    if (user.firstName) {
      const regex = /^(?!.*(?:https?|ftp):\/\/)(?!.*www\.)(?!.*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!.*\.)[\s\S]*$/;
      if (!regex.test(user.firstName) || !regex.test(user.lastName)) {
        const errorMessage = "Invalid input";
        this.logger.error(errorMessage, { xdsContext, email: user.email });
        throw new BadRequestException(errorMessage);
      }
    }
    if (existingUser || existingSubUser) {
      const errorMessage = "The email address cannot be used at this time. Please check the address and try again.";
      this.logger.error(errorMessage, { xdsContext, email: user.email });
      return 'email existed';
      // return encodeMailcheckResponse(false);
      // throw new BadRequestException(errorMessage);
    }
    return this.usersService.createWithRole(user);
  }

  async checkRegisterMail(email: string,) {
    const existingUser = await this.usersService.findOneByEmail(email.toLowerCase());
    const existingSubUser = await this.usersService.findSubUserByEmail(email.toLowerCase());
    if (existingUser || existingSubUser) {
      return encodeMailcheckResponse(true);
      // return "The email address cannot be used at this time. Please check the address and try again.";
      // this.logger.error(errorMessage, { email: email });
      // return new BadRequestException(errorMessage);
    } else if(!existingUser || !existingSubUser){
      return encodeMailcheckResponse(false);
    }
  }

  async verifyTokenAndReturnUser(
    xdsContext: XdsContext,
    idToken: string,
  ): Promise<UserResponseDto> {
    const decodedToken = await this.verifyFirebaseToken(idToken);
    const user = await this.usersService.findOneByEmailToLoginOrThrow(
      decodedToken?.email as string,
    );
    const company = await this.companiesService.findFirstByUserId(user.id);
    const companyId = company?.id;
    const slug = company?.slug || undefined;

        if (user && user.twoFactorDetails && user.twoFactorDetails.otp) {
      user.twoFactorDetails.otp = null;
    }
    if (user && user.twoFactorDetails && user.twoFactorDetails.otpCreatedAt) {
      user.twoFactorDetails.otpCreatedAt = null;
    }

    return { slug, companyId, ...user };
  }

  async loginAndReturnUser(
    idToken: string,
    checkTerms: boolean | undefined,
    checkedRemember2f: boolean,
    storedUserId: number | null | undefined,
    email: string | null | undefined
  ): Promise<UserResponseDto> {
    const decodedToken = await this.verifyFirebaseToken(idToken);
    if(email != decodedToken.email){
      throw new BadRequestException("Invalid user.");
    }
    let user = await this.usersService.findOneByEmailToLoginOrThrow(
      decodedToken?.email as string,
    );

    if(!user.isPaidUser && user.isCompanyUser) {
      throw new NotFoundException(`freeCompanyAdmin`);
    }
    if (user && user.isCompanyUser && !user.isLoggedInOnce) {
      await this.usersService.updateUserTermsAndConditions(user.CompanyAdminId);
    }
    let toCheckUserId = 0;
    if(user.isCompanyUser) {
      user.twoFactorDetails = await this.usersService.checkCompanySubUserOtp(user.CompanyAdminId);
      if(user.twoFactorDetails?.isActive && checkedRemember2f ){
          await this.usersService.update2fa(user.CompanyAdminId, true, true);
      }
      toCheckUserId = user.CompanyAdminId;
    } else {
      if(user.twoFactorDetails?.isActive && checkedRemember2f ){
        await this.usersService.update2fa(user.id, true, false);
      }
      toCheckUserId = user.id;
    }
    if(user && user.twoFactorDetails && user.twoFactorDetails.isActive) {
      if(!storedUserId) {
        const otpToken: string = generateOtp();
        if(user.isCompanyUser) {
          const isOtpUpdate = await this.usersService.saveOrUpdateOtp(user.CompanyAdminId , otpToken, new Date(), 0, checkedRemember2f);
          if(isOtpUpdate) {
            this.mailerService.sendOtpMail(user.CompanyAdminEmail, otpToken, user.companySubUserFirstname);
          }
        } else {
          const isOtpUpdate = await this.usersService.updateOtp(user.id, otpToken, new Date(), 0, checkedRemember2f);
          if(isOtpUpdate) {
            this.mailerService.sendOtpMail(user.email, otpToken, user.firstName);
          }
        }
      } else {
        if((!checkedRemember2f || (checkedRemember2f && toCheckUserId != storedUserId))) {
          const otpToken: string = generateOtp();
          if(user.isCompanyUser) {
            const isOtpUpdate = await this.usersService.saveOrUpdateOtp(user.CompanyAdminId , otpToken, new Date(), 0, false);
            if(isOtpUpdate) {
              this.mailerService.sendOtpMail(user.CompanyAdminEmail, otpToken, user.companySubUserFirstname);
            }
          } else {
            const isOtpUpdate = await this.usersService.updateOtp(user.id, otpToken, new Date(), 0, checkedRemember2f);
            if(isOtpUpdate) {
              this.mailerService.sendOtpMail(user.email, otpToken, user.firstName);
            }
          }
        }
      }
    }
    if (user && user.twoFactorDetails && user.twoFactorDetails.otp) {
      user.twoFactorDetails.otp = null;
    }
    if (user && user.twoFactorDetails && user.twoFactorDetails.otpCreatedAt) {
      user.twoFactorDetails.otpCreatedAt = null;
    }
    if (checkTerms) {
      await this.usersService.updateTermsAndConditions(user.id);
    }
    if (user.userType == USER_TYPE.trial && !user.accessExpirationDate) {
      const currentDate = new Date();
      let futureDate = new Date(currentDate);
      if (user.trialDuration && user.trialDuration == TRIAL_PERIOD.yearly) {
        const nextYear = currentDate.getFullYear() + 1;
        futureDate = new Date(nextYear, currentDate.getMonth(), currentDate.getDate());
      } else if (user.trialDuration && user.trialDuration == TRIAL_PERIOD.sixMonths) {
        futureDate.setMonth(futureDate.getMonth() + 6);
      } else {
        let nextMonth = currentDate.getMonth() + 1;
        if (nextMonth === 12) {
          nextMonth = 0;
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        futureDate = new Date(currentDate.getFullYear(), nextMonth, currentDate.getDate());
      }
      // futureDate.setDate(currentDate.getDate() + 30);
      await this.usersService.setTheAccessExpirationDate(user.id, futureDate);
      user = await this.usersService.findOneByEmailToLoginOrThrow(
        decodedToken?.email as string,
      );
    }
    if (!user.isLoggedOnce) {
      await this.usersService.updateIsLoggedOnce(user.id);
    }
    const applicationSettings = await this.usersService.getApplicationSettings();
    const company = await this.companiesService.findFirstByUserId(user.id);
    if (!user.isLoggedOnce && company?.id) {
      await this.companiesService.createCompanyGroups(company?.id);
    }
    if (user.isCompanyUser) {
      await this.usersService.addCompanyUserLoginLogs(user.CompanyAdminId, user.id)
      await this.usersService.updateCompanyUserLastLogin(user.CompanyAdminId);
    } else {
      await this.usersService.addLoginLogs(user.id);
      await this.usersService.updatelastLogin(user.id);
    }

    const companyId = company?.id;
    return { companyId, ...user, enable2Fa: applicationSettings?.enable2Fa };
  }

  async validateOtpAndReturnUser(otp: string, token: string, isCheked: boolean) {
    const decodedToken = await this.verifyFirebaseToken(token);
    const user = await this.usersService.findOneByEmailToLoginOrThrow(
      decodedToken?.email as string,
    );
    const company = await this.companiesService.findFirstByUserId(user.id);
    const companyId = company?.id;
    let checkedOtpDetails;
    if (user && user.isCompanyUser) {
      checkedOtpDetails = await this.usersService.checkCompanySubUserOtp(user.CompanyAdminId);
    } else {
      checkedOtpDetails = await this.usersService.checkAdminUserOtp(user.id);
    }
    if (user && user.twoFactorDetails && user.twoFactorDetails.otp) {
      user.twoFactorDetails.otp = null;
    }
    if (user && user.twoFactorDetails && user.twoFactorDetails.otpCreatedAt) {
      user.twoFactorDetails.otpCreatedAt = null;
    }
    if (otp == checkedOtpDetails?.otp && checkedOtpDetails?.otpCreatedAt) {
      if (getMinutesBetweenTwoDates(checkedOtpDetails?.otpCreatedAt, new Date()) < 15) {
        return { companyId, ...user }
      }
    }

  }

  async resentOtpForVarification(token: string) {
    const decodedToken = await this.verifyFirebaseToken(token);
    const theUserDetails = await this.usersService.findOneByEmailToLoginOrThrow(
      decodedToken?.email as string,
    );
    let userDetails;
    if (theUserDetails.isCompanyUser) {
      userDetails = await this.usersService.checkCompanySubUserOtp(theUserDetails.CompanyAdminId);
    } else {
      userDetails = await this.usersService.checkAdminUserOtp(theUserDetails.id);
    }
    if (userDetails) {
      const minuts = getMinutesBetweenTwoDates(userDetails && userDetails?.otpCreatedAt, new Date());
      const gapBetweenResend = getMinutesBetweenTwoDates(userDetails && userDetails?.updatedAt, new Date());
      if (gapBetweenResend < 2) {
        return false;
      }
      const newOtp = generateOtp();
      if (minuts > 15) {
        let isOtpUpdate;
        if (theUserDetails.isCompanyUser) {
          isOtpUpdate = await this.usersService.saveOrUpdateOtp(theUserDetails.CompanyAdminId, newOtp, new Date(), 0, false);
          if (isOtpUpdate) {
            this.mailerService.sendOtpMail(theUserDetails.CompanyAdminEmail, newOtp, theUserDetails.companySubUserFirstname);
          }
        } else {
          isOtpUpdate = await this.usersService.updateOtp(theUserDetails?.id, newOtp, new Date(), 0, false);
          if (isOtpUpdate) {
            this.mailerService.sendOtpMail(theUserDetails.email, newOtp, theUserDetails.firstName);
          }
        }
        return isOtpUpdate;
      } else {
        let isOtpUpdate;
        if (theUserDetails.isCompanyUser) {
          isOtpUpdate = await this.usersService.saveOrUpdateOtp(
            theUserDetails.CompanyAdminId,
            userDetails?.otp ? userDetails?.otp : newOtp,
            userDetails?.otpCreatedAt ? userDetails?.otpCreatedAt : new Date(),
            (userDetails?.mailSendCounts == undefined || userDetails?.mailSendCounts == null) ? 0 : userDetails?.mailSendCounts + 1,
            false
          );
          if (isOtpUpdate) {
            this.mailerService.sendOtpMail(theUserDetails.CompanyAdminEmail, (userDetails?.otp) ? userDetails?.otp : newOtp, theUserDetails.companySubUserFirstname);
          }
        } else {
          isOtpUpdate = await this.usersService.updateOtp(
            theUserDetails.id,
            userDetails?.otp ? userDetails?.otp : newOtp,
            userDetails?.otpCreatedAt ? userDetails?.otpCreatedAt : new Date(),
            (userDetails?.mailSendCounts == undefined || userDetails?.mailSendCounts == null) ? 0 : userDetails?.mailSendCounts + 1,
            false
          );
          if (isOtpUpdate) {
            this.mailerService.sendOtpMail(theUserDetails.email, (userDetails?.otp) ? userDetails?.otp : newOtp, theUserDetails.firstName);
          }
        }
        return isOtpUpdate;
      }
    } else {
      return false;
    }
  }

  async getUsersSecuritySettingDetails(userId: number) {
    return this.usersService.getUsersSecuritySettingDetails(userId);
  }

  async checkApiAccess(userId: number, apiurl: string) {

    let matchedPermission = Object.values(API_PERMISSIONS).find(permission => apiurl.includes(permission.url));

    if (!matchedPermission) {
      return true;
    } 

    for (const pageIds of matchedPermission.pageId) {
      const permission = await this.usersService.getUserPageAccess(pageIds, userId);
      if (!permission?.groups?.permissions?.[0]) {
        continue;
      }
      const { canRead, canWrite, canDelete } = permission.groups.permissions[0];
      const { type: ApiType } = matchedPermission;

      if ((ApiType === 'R' && canRead) || 
          (ApiType === 'D' && canDelete) || 
          (ApiType === 'W' && canWrite)) {
        return true;
      }
    } 
    return false;

    // const permission = await this.usersService.getUserPageAccess(pageId, userId);

    // if (!permission?.groups?.permissions?.[0]) {
    //   return false;
    // }

   // const { canRead, canWrite, canDelete } = permission.groups.permissions[0];

    // Check for specific access based on the ApiType
    // return (ApiType === 'R' && canRead) ||
    //   (ApiType === 'D' && canDelete) ||
    //   (ApiType === 'W' && canWrite);
  }

  async getSubUsersSecuritySettingDetails(subUserId: number) {
    return this.usersService.checkCompanySubUserOtp(subUserId);
  }

  async signOut(accessToken: string, userId: number, isCompanyUser: boolean) {
    if(isCompanyUser){
      await this.usersService.update2fa(userId, false, true);
    } else{
      await this.usersService.update2fa(userId, false, false);
    }

    // const decodedToken = await getAuth().verifyIdToken(accessToken, true);
    // const uid = decodedToken.uid;
    // return await getAuth().revokeRefreshTokens(uid);
    return;
  }

}
