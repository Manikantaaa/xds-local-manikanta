import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { APPROVAL_STATUS, PAYMENT_STATUS, Prisma, TRIAL_PERIOD, USER_TYPE, Users } from "@prisma/client";
import { AdminNotifications, advertisement, faqData, UpdatePersonalSettingsProps, UserRequest } from "./type";
import { ExcelUsers } from "src/common/types/common-interface";
import { StripeService } from "src/services/stripe/stripe.service";
import admin from "firebase-admin";
import { MailerService } from "src/mailer/mailer.service";
import { formatDateIntoString, getFirstDayOfCurrentMonth, getFirstDayOfCurrentWeek, getFirstDayOfCurrentYear, getLastDayOfCurrentMonth, getLastDayOfCurrentWeek, getLastDayOfCurrentYear, getNextDayDate, stripeCancelOpts, toLocalISOString, extractOriginalEmail } from "src/common/methods/common-methods";
import { Exception } from "handlebars";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly stripeService: StripeService,
    private readonly mailerService: MailerService
  ) { }

  findAll() {
    return this.usersRepository.findAll();
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findFirst({ email }, { userRoles: true });
  }

  findSubUserByEmail(email: string) {
    return this.usersRepository.findFirstSubUser({ email }, { email: true });
  }

  async findOneByEmailOrThrow(email: string) {
    const Mainuser = await this.usersRepository.findFirst(
      { email: email, isArchieve: false },
      { userRoles: true },
    );

    let user = Mainuser;
    let isCompanyUser = false;
    let CompanyAdminId: number = 0;
    let CompanyAdminEmail: string = "";
    if (!Mainuser) {
      const CompanyUser = await this.usersRepository.findCompanyAdminUser(email);
      if (CompanyUser && CompanyUser.user && CompanyUser.user.email) {
        user = await this.usersRepository.findFirst(
          { email: CompanyUser.user.email, isArchieve: false },
          { userRoles: true },
        )
        CompanyAdminId = CompanyUser?.CompanyAdminUser.id;
        CompanyAdminEmail = CompanyUser?.CompanyAdminUser.email;
        if(user?.twoFactorDetails){
          user.twoFactorDetails = CompanyUser?.CompanyAdminUser.CompanySubUsersOtpDetails;
        }
        isCompanyUser = true;
      }

    }

    if (!user)
      throw new NotFoundException(`Cannot find user with email ${email}`);
    return { ...user, isCompanyUser, CompanyAdminId, CompanyAdminEmail };
  }

  async findOneByEmailToLoginOrThrow(email: string) {
    let Mainuser = await this.usersRepository.findFirst(
      { email: email, isArchieve: false },
      { userRoles: true },
    );
    let user = Mainuser;
    let isCompanyUser = false;
    let isLoggedInOnce = false;
    let isPasswordChanged = false;
    let CompanyAdminId: number = 0;
    let CompanyAdminEmail: string = "";
    let pagePermissions;
    let companySubUserFirstname = "";
    if (!Mainuser) {
      const CompanyUser = await this.usersRepository.findCompanyAdminUser(email);
      if (CompanyUser && CompanyUser.user && CompanyUser.user.email && CompanyUser.CompanyAdminUser.groupId) {
        user = await this.usersRepository.findFirst(
          { email: CompanyUser.user.email, isArchieve: false },
          { userRoles: true },
        )
        const Pages = await this.usersRepository.findPagePermissionsByGroup(CompanyUser.CompanyAdminUser.groupId);
        pagePermissions = Pages;
        CompanyAdminId = CompanyUser?.CompanyAdminUser.id;
        CompanyAdminEmail = CompanyUser?.CompanyAdminUser.email;
        isCompanyUser = true;
        isLoggedInOnce = CompanyUser?.CompanyAdminUser.isLoggedInOnce,
          isPasswordChanged = CompanyUser?.CompanyAdminUser.isPasswordChanged,
          companySubUserFirstname = CompanyUser?.CompanyAdminUser.firstName
      } else {
        throw new NotFoundException(`Cannot find user with email ${email}`);
      }

    }

    if (!user) {
      throw new NotFoundException(`Cannot find user with email ${email}`);
    } else {
      if (user.status && user.status == 2 && user.approvalStatus != "completed") {
        throw new NotFoundException(`Cannot find user with email ${email}`);
      } else {
        return { ...user, isCompanyUser, CompanyAdminId, pagePermissions, CompanyAdminEmail, isLoggedInOnce, isPasswordChanged, companySubUserFirstname };
      }
    }
  }

  async findUserByEmailAndOtp(email: string) {
    const user = await this.usersRepository.findUserByEmailAndOtp({ email: email, isArchieve: false, isDelete: false, approvalStatus: "completed" }, { userRoles: true });
    if (!user) {
      throw new NotFoundException(`Cannot find user with email ${email}`);
    } else {
      return user;
    }
  }

  findUnique(id: number) {
    return this.usersRepository.findUnique(id);
  }

  findAdminuserId(loggedId: number) {
    return this.usersRepository.findAdminuserId(loggedId);
  }

  findFirstByUserId(id: number) {
    return this.usersRepository.findFirstByUserId(id);
  }

  findFirstByCompanyAdminUserId(id: number) {
    return this.usersRepository.findCompanyAdminUserById(id)
  }

  UpdateByUserId(id: number) {
    return this.usersRepository.UpdateByUserId(id);
  }

  getSubscriptionDetails(id: number) {
    return this.usersRepository.getSubscriptionDetails(id);
  }

  updateStripeCustomerIdById(id: number, stripeCustomerId: string, approvalStatus: APPROVAL_STATUS) {
    return this.usersRepository.update(id, {
      stripeCustomerId,
      approvalStatus: approvalStatus,
      status: 1,
      registrationRequests: {
        updateMany: {
          where: {
            userId: id,
          },
          data: {
            approvalStatus: approvalStatus,
          },
        },
      },
    });
  }

  updateApprovalStatusToPwdCreated(id: number) {
    return this.usersRepository.update(id, {
      approvalStatus: APPROVAL_STATUS.pwdCreated,
      registrationRequests: {
        updateMany: {
          where: {
            userId: id,
          },
          data: {
            approvalStatus: APPROVAL_STATUS.pwdCreated,
          },
        },
      },
    });
  }

  updateStatusToUnderReview(id: number) {
    return this.usersRepository.update(id, {
      approvalStatus: APPROVAL_STATUS.underReview,
      registrationRequests: {
        updateMany: {
          where: {
            userId: id,
          },
          data: {
            approvalStatus: APPROVAL_STATUS.underReview,
          },
        },
      },
    });
  }

  updateAccessExpirationDate(
    id: number,
    stripeSubscriptionId: string | null,
    expirationDate: Date,
    isPaid: boolean,
  ) {
    return this.usersRepository.update(id, {
      stripeSubscriptionId: stripeSubscriptionId,
      accessExpirationDate: expirationDate,
      isPaidUser: isPaid,
      userType: USER_TYPE.paid
    });
  }

  createWithRole(user: UserRequest) {
    return this.usersRepository.createWithRole(user);
  }

  updatePersonalSetting(id: number, updatedData: UpdatePersonalSettingsProps) {
    return this.usersRepository.update(id, updatedData);
  }

  updateCompanyName(id: number, companyname: string) {
    return this.usersRepository.updateCompanyName(id, companyname)
  }
  async updateIsArchieveToTrue(id: number) {
    return await this.usersRepository.update(id, {
      isArchieve: true,
      companies: {
        updateMany: {
          where: {
            userId: id
          },
          data: {
            isArchieve: true
          }
        }
      }
    });
  }

  updateIsArchieveToFalse(id: number) {
    return this.usersRepository.update(id, {
      isArchieve: false,
      companies: {
        updateMany: {
          where: {
            userId: id
          },
          data: {
            isArchieve: false
          }
        }
      }
    });
  }

  findUsers(search: string, filterVal: Prisma.UsersWhereInput[], userRole: string) {
    const users = this.usersRepository.findUsers(search, filterVal, userRole);
    return users;
  }

  getUsersCount(search: string) {
    const users = this.usersRepository.getUsersCount(search);
    return users;
  }

  getFlaggesUsers() {
    return this.usersRepository.getFlaggedUsers();
  }

  async deleteUser(id: number) {
    const theUser = await this.usersRepository.findFirstByUserId(id);
    if (theUser != null) {
      await this.deleteUserFromUsersCompanies(id, theUser.email);
      try {
        const currentUser = await admin.auth().getUserByEmail(theUser.email);
        if (currentUser && currentUser.uid) {
          await admin.auth().deleteUser(currentUser.uid);
          const updateUserEmail = this.deleteUserFromUsersCompanies(id, theUser.email);
          return updateUserEmail;
        }
      } catch(err) {
        if (err.code === 'auth/user-not-found') {
          console.log("Email not exist in firebase, Email: " + theUser.email);
        }
      }
    } else {
      throw new BadRequestException("User not found");
    }
  }

  createCompanyFromExcel(user: ExcelUsers) {
    return this.usersRepository.createCompanyFromExcel(user);
  }

  getStripeProducts() {
    return this.stripeService.getProducts();
  }

  async makeTheUserUnPaid(customerId: string) {
    try {
      const theUser = await this.usersRepository.findFirst({
        stripeCustomerId: customerId,
      });
      if (theUser) {
        await this.usersRepository.setTheUserAsUnpaid(theUser.id);
        await this.usersRepository.setTheBillingTable(theUser.id);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async addBillingDetail(
    userId: number,
    stripeCustomerId: string,
    subscriptionId: string,
    subscriptionType: string,
    expirationDate: Date,
    isAcive: boolean,
    message: string,
    amount: number,
    isRenewed: boolean,
    billing_reason: string,
    billingCountry: string | null,
    billingRegion: string | null,
    isCouponApplied: boolean
  ) {
    await this.usersRepository.updateBillTable(userId);
    this.usersRepository.createBillDetail(
      userId,
      stripeCustomerId,
      subscriptionId,
      subscriptionType,
      expirationDate,
      isAcive,
      message,
      amount,
      isRenewed,
      billing_reason,
      billingCountry,
      billingRegion,
      isCouponApplied
    );
  }

  async saveTheTokenInBackup(userId: number, token: string) {
    const theBackupUser = await this.usersRepository.getBackupUserDetails(userId);
    if (theBackupUser && theBackupUser.id) {
      return await this.usersRepository.updateBackupContact(theBackupUser.id, token);
    } else {
      return await this.usersRepository.createBackupContact(userId, token);
    }
  }
  async saveTheCompanyUserTokenInBackup(email: string, token: string) {
    return await this.usersRepository.createCompanyUserBackupContact(email, token);
  }

  async removeThePasswordToken(email: string) {
    try {
      const theBackupUser: any = await this.usersRepository.findOneByEmail(email);

      if (theBackupUser && theBackupUser.id || (theBackupUser && theBackupUser.companyAdminUser && theBackupUser.companyAdminUser.email)) {
        if (theBackupUser && theBackupUser.companyAdminUser && theBackupUser.companyAdminUser.email) {
          return this.usersRepository.updateAdminUserToken(theBackupUser.companyAdminUser.email);
        }
        return await this.usersRepository.updateBackupContactPasswordTokenByUserId(theBackupUser.id, null);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async cancelSubscription(postData: { userId: number, cancellationReason: string, reasonDescription: string }) {
    try {
      if (postData && postData.userId) {
        const user = await this.findFirstByUserId(postData.userId);
        if (user && user.id && user.stripeSubscriptionId) {
          const isCancelledInStripe = await this.stripeService.cancelSubscription(user.stripeSubscriptionId);
          if (isCancelledInStripe) {
            const isSubscriptionCancelled = await this.usersRepository.cancelSubscription(postData);
            if (isSubscriptionCancelled && isSubscriptionCancelled.count && user.accessExpirationDate) {
              this.mailerService.subscriptionCancellationMail({ email: user.email, name: user.firstName, date: user.accessExpirationDate });
              return true;
            } else {
              throw new BadRequestException("our DB cancellation issue");
            }
          } else {
            throw new BadRequestException("stripe cancellation issue");
          }
        } else {
          throw new BadRequestException("user not found");
        }
      } else {
        throw new BadRequestException("postdata issue");
      }
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async setTheUserToFlagged(id: number) {
    return this.usersRepository.update(id, { isFlagged: true })
  }

  async getUserFromToken(token: string) {
    return this.usersRepository.getUserFromToken(token);
  }

  async setTheAccessExpirationDate(id: number, accessExpirationDate: Date) {
    try {
      return await this.usersRepository.update(id, { accessExpirationDate });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async csvBuyersTrailEndToday() {
    const theUsers = await this.usersRepository.csvBuyersTrailEndToday();
    if (theUsers.length > 0) {
      for (const user of theUsers) {
        if (!user.stripeCustomerId || user.stripeCustomerId == "") {
          this.usersRepository.update(user.id, {
            isPaidUser: false,
            accessExpirationDate: null,
            userType: USER_TYPE.free,
            trialDuration: TRIAL_PERIOD.weekly
          });
        }
      }
    }
  }

  async updateUserType(userId: number, type: string) {
    try {
      let userType: USER_TYPE = USER_TYPE.free;
      let trialPeriod: TRIAL_PERIOD = "weekly";
      if (type == "freeUser") {
        userType = USER_TYPE.free;
      } else if (type == "trialUserMonth") {
        userType = USER_TYPE.trial;
        trialPeriod = TRIAL_PERIOD.monthly;
      } else if (type == "trialUserYear") {
        userType = USER_TYPE.trial;
        trialPeriod = TRIAL_PERIOD.yearly;
      } else if (type == "trialUser8Week") {
        userType = USER_TYPE.trial;
        trialPeriod = TRIAL_PERIOD.eightWeeks;
      } else if (type == "trialUser6months") {
        userType = USER_TYPE.trial;
        trialPeriod = TRIAL_PERIOD.sixMonths;
      }
      const theUser = await this.usersRepository.update(userId, {
        userType: userType,
        trialDuration: trialPeriod,
        isPaidUser: (userType == USER_TYPE.free) ? false : true,
        accessExpirationDate: null,
        adminApprovedAt: new Date(),
        passwordNeedToChange: "adChanged"
      });

      return theUser
    } catch (err) {
      throw new BadRequestException();
    }

  }

  async findUsersWhere() {
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    const expiryDate = new Date(currentDate.getTime() + (6 * oneDayInMillis));
    let year = expiryDate.getUTCFullYear();
    let month = String(expiryDate.getUTCMonth() + 1).padStart(2, '0');
    let day = String(expiryDate.getUTCDate()).padStart(2, '0');
    const expiryStartDateString = `${year}-${month}-${day}`;

    const expiryEndDate = new Date(expiryDate);
    expiryEndDate.setUTCDate(expiryEndDate.getUTCDate() + 1);
    year = expiryEndDate.getUTCFullYear();
    month = String(expiryEndDate.getUTCMonth() + 1).padStart(2, '0');
    day = String(expiryEndDate.getUTCDate()).padStart(2, '0');
    const expiryEndDateString = `${year}-${month}-${day}`;
    const matchedUsers = await this.findUsersBasedOnDates(expiryStartDateString, expiryEndDateString);
    return matchedUsers;
  }

  async findUsersBasedOnDates(startDate: string, endDate: string) {
    return await this.usersRepository.findUsersWhere(startDate, endDate);
  }

  async getuserDetails() {
    return await this.usersRepository.findAll();
  }

  updateTermsAndConditions(userId: number) {
    return this.usersRepository.update(userId, {
      checkedTerms: true,
      isLoggedOnce: true,
      firstLoggedDate: new Date(),
    })
  }

  updateUserTermsAndConditions(userId: number) {
    return this.usersRepository.adminUserLoginUpdate(userId);
  }

  updateIsLoggedOnce(userId: number) {
    return this.usersRepository.update(userId, {
      isLoggedOnce: true,
      firstLoggedDate: new Date(),
    })
  }

  updatelastLogin(userId: number) {
    return this.usersRepository.update(userId, {
      lastLoginDate: new Date(),
    })
  }

  updateCompanyUserLastLogin(userId: number) {
    return this.usersRepository.adminUserupdate(userId, {
      lastLoginDate: new Date(),
    })
  }

  async getCancelledSubscriptionDetails(duration: string, type: string, timeLineVal: string) {
    let whereClause: any = {}
    whereClause = {
      isSubscriptionCancelled: true
    }
    if (duration != "all") {
      whereClause.subscriptionType = duration
    }
    if (type != "all") {
      whereClause.user = {
        userRoles: {
          some: {
            roleCode: type
          }
        }
      }
    }
    const cancelledSubscriptions: any = await this.usersRepository.getCancelledSubscriptionDetails(whereClause);
    const uniquFields = await this.usersRepository.getUniqueSubscriptions();
    for (let item of cancelledSubscriptions) {
      for (let subItem of uniquFields) {
        if (item.user.id == subItem.userId) {
          item.veryStartingDate = subItem._min.createdAt;
        }
      }
    }
    let startDate = new Date();
    const currentDateString = formatDateIntoString(startDate);
    const currentDate = new Date(currentDateString);
    if (timeLineVal == "thisWeek") {
      startDate = getFirstDayOfCurrentWeek();
      const filteredResult = cancelledSubscriptions.filter((item: any) => {
        if (item.cancellationDate && item.cancellationDate >= startDate && item.cancellationDate <= currentDate) {
          return true;
        }
      });
      return filteredResult;
    } else if (timeLineVal == "thisMonth") {
      startDate = getFirstDayOfCurrentMonth();
      const filteredResult = cancelledSubscriptions.filter((item: any) => {
        if (item.cancellationDate && item.cancellationDate >= startDate && item.cancellationDate <= currentDate) {
          return true;
        }
      });
      return filteredResult;
    } else if (timeLineVal == "thisYear") {
      startDate = getFirstDayOfCurrentYear();
      const filteredResult = cancelledSubscriptions.filter((item: any) => {
        if (item.cancellationDate && item.cancellationDate >= startDate && item.cancellationDate <= currentDate) {
          return true;
        }
      });
      return filteredResult;
    }
    return cancelledSubscriptions;
  }
  async getReSubscriptionDetails(duration: string, type: string, timeLineVal: string) {
    let whereClause: any = {}
    whereClause = {
      BillingDetails: {
        some: {
          isRenewed: false,
        }
      },
      isDelete: false,
    }
    if (duration != "all") {
      whereClause.BillingDetails.some.subscriptionType = duration
    }
    if (type != "all") {
      whereClause.userRoles = {}
      whereClause.userRoles = {
        some: {
          roleCode: type,
        }
      }
    }

    if (timeLineVal == "thisWeek") {
      const startDate = getFirstDayOfCurrentWeek();
      whereClause.BillingDetails.some.createdAt = {
        gte: startDate,
      }
    }else if(timeLineVal == "thisMonth"){
      const startDate = getFirstDayOfCurrentMonth();
      whereClause.BillingDetails.some.createdAt = {
        gte: startDate,
      }
    }
    const cancelledSubscriptions: any = await this.usersRepository.getReSubscriptionDetails(whereClause);

    let startDate = new Date();
    const currentDateString = formatDateIntoString(startDate);
    const currentDate = new Date(currentDateString);
    return cancelledSubscriptions;
  }

  async createFaq(question: string, answer: string, display: boolean) {
    return await this.usersRepository.createFaq(question, answer, display);
  }

  async deleteFaq(id: number) {
    return await this.usersRepository.deleteFaq(id);
  }
  async getByIdFaqQuestions(id: number) {
    return await this.usersRepository.getByIdFaqQuestions(id);
  }

  async hideFaqQuestions(id: number, postData: faqData) {
    return await this.usersRepository.hideFaqQuestions(id, postData);
  }

  async getAlleFaqQuestions() {
    return await this.usersRepository.getAlleFaqQuestions();
  }

  async getUnHideFaqQuestions() {
    return await this.usersRepository.getUnHideFaqQuestions();
  }

  async createAdvertisement(createAdvtData: advertisement) {
    let checkDate;
    if (createAdvtData != undefined) {
      const id = 0;
      checkDate = await this.usersRepository.checkAdBannerDates(id, createAdvtData.adPage, createAdvtData.startDate, createAdvtData.endDate);
    }
    if (checkDate && checkDate.length > 3) {
      return {
        data: 'Already Banner existed those dates.',
        success: false,
        message: "successfully updated.",
      }
    } else
      return await this.usersRepository.createAdvertisement(createAdvtData);
  }

  async getAdvertisements(): Promise<any[]> {
    return await this.usersRepository.getAdvertisements();
  }
  async getAdvtNames() {
    return await this.usersRepository.getAdvtNames();
  }

  async companyClicksReport(postData: { companyname: string, startdate: string, endDate: string }) {
    return await this.usersRepository.companyClicksReport(postData);
  }

  async getAdvertisementById(id: number) {
    return await this.usersRepository.getAdvertisementById(id);
  }

  async deleteAdvertisementById(id: number) {
    return await this.usersRepository.deleteAdvertisementById(id);
  }

  async updateAdvertisementById(id: number, postData: { type: string, postdata: advertisement }, loggedCompanyId: number) {
    let checkDate;
    if (postData.postdata != undefined) {
      checkDate = await this.usersRepository.checkAdBannerDates(id, postData.postdata?.adPage, postData.postdata?.startDate, postData.postdata?.endDate);
    }
    if (checkDate && checkDate.length > 3) {
      return {
        data: 'An Ad exists on the selected dates.',
        success: false,
      }
    } else {
      return await this.usersRepository.updateAdvertisementById(id, postData, loggedCompanyId);
    }
  }


  async deleteUserFromUsersCompanies(id: number, email: string) {
    return await this.usersRepository.update(id, {
      email: `deleted-${id}-` + email,
      isDelete: true,
      companies: {
        updateMany: {
          where: {
            userId: id
          },
          data: {
            isDelete: true
          }
        }
      }
    });
  }

  async getBannerAds(date: string, type: string) {
    return this.usersRepository.getBannerAds(date, type);
  }

  async getSubscriptions(duration: string, type: string, timeLineVal: string, from: string) {
    let whereClause: any = {}
    whereClause = {
      isActive: true,
      user: {
        isDelete: false
      }
    }
    if (duration != "all") {
      whereClause.subscriptionType = duration
    }
    if (type != "all") {
      whereClause.user = {
        userRoles: {
          some: {
            roleCode: type
          }
        }
      }
    }
    if (from == "new") {
      // const newSubscribedUsers = await this.usersRepository.getOnlyNewSubscribedUsers();
      // const userIds = newSubscribedUsers.map((item: any) => item.userId);
      // whereClause.userId = {
      //   in: userIds
      // };
      whereClause.isRenewed = false;
      delete (whereClause.isActive);
    } else if (from == "renew") {
      whereClause.isSubscriptionCancelled = false;
    } else if (from == "failed") {
      whereClause.paymentStatus = PAYMENT_STATUS.failed;
    }
    const subscriptions: any = await this.usersRepository.getSubscriptions(whereClause);
    if (from == "active") {
      const uniquFields = await this.usersRepository.getUniqueSubscriptions();
      for (let item of subscriptions) {
        for (let subItem of uniquFields) {
          if (item.user.id == subItem.userId) {
            item.veryStartingDate = subItem._min.createdAt;
          }
        }
        const test = await this.checkUserCanceledSubscriptionPreviously(item.user.id);
        if(test) {
          item.isPreviouslyCancelled = true;
        }
        const isSubscriptionAltered = await this.usersRepository.checkUsersSusbscriptionAlteration(item.user.id, item.subscriptionType);
        if(isSubscriptionAltered) {
          item.isSubscriptionChanged = true;
        }
      }
    }
    let startDate = new Date();
    if (from != "active" && from != "failed") {
      const currentDateString = formatDateIntoString(startDate);
      const currentDate = new Date(currentDateString);
      if (timeLineVal == "thisWeek") {
        startDate = getFirstDayOfCurrentWeek();
        if (from == "renew") {
          startDate = getLastDayOfCurrentWeek();
        }
        let filteredResult = subscriptions.filter((item: any) => {
          if (from == "renew") {
            if (this.getRenewalDate(item.stripeExpireDate) >= currentDate && this.getRenewalDate(item.stripeExpireDate) < getNextDayDate(startDate)) {
              return true;
            }
          } else {
            if (item.createdAt >= startDate && item.createdAt < getNextDayDate(currentDate)) {
              return true;
            }
          }
        }).sort((a: any, b: any) => { return a.id - b.id });
        if(from == "new") {
          const seenIds = new Set<number>();
          filteredResult = filteredResult.filter((item: any) => {
            if (seenIds.has(item.user.id)) return false;
            seenIds.add(item.user.id);
            return true;
          });
        }
        return filteredResult;
      } else if (timeLineVal == "thisMonth") {
        startDate = getFirstDayOfCurrentMonth();
        if (from == "renew") {
          startDate = getLastDayOfCurrentMonth();
        }
        let filteredResult = subscriptions.filter((item: any) => {
          if (from == "renew") {
            if (this.getRenewalDate(item.stripeExpireDate) >= currentDate && this.getRenewalDate(item.stripeExpireDate) < getNextDayDate(startDate)) {
              return true;
            }
          } else {
            if (item.createdAt >= startDate && item.createdAt < getNextDayDate(currentDate)) {
              return true;
            }
          }
        }).sort((a: any, b: any) => { return a.id - b.id });
        if(from == "new") {
          const seenIds = new Set<number>();
          filteredResult = filteredResult.filter((item: any) => {
            if (seenIds.has(item.user.id)) return false;
            seenIds.add(item.user.id);
            return true;
          });
        }
        return filteredResult;
      } else if (timeLineVal == "thisYear") {
        startDate = getFirstDayOfCurrentYear();
        if (from == "renew") {
          startDate = getLastDayOfCurrentYear();
        }
        let filteredResult = subscriptions.filter((item: any) => {
          if (from == "renew") {
            if (this.getRenewalDate(item.stripeExpireDate) >= currentDate && this.getRenewalDate(item.stripeExpireDate) < getNextDayDate(startDate)) {
              return true;
            }
          } else {
            if (item.createdAt >= startDate && item.createdAt < getNextDayDate(currentDate)) {
              return true;
            }
          }
        }).sort((a: any, b: any) => { return a.id - b.id });
        if(from == "new") {
          const seenIds = new Set<number>();
          filteredResult = filteredResult.filter((item: any) => {
            if (seenIds.has(item.user.id)) return false;
            seenIds.add(item.user.id);
            return true;
          });
        }
        return filteredResult;
      } else if (timeLineVal == "allTime" && from == "new") {
        let filteredResult = subscriptions.sort((a: any, b: any) => { return  a.id - b.id });
        const seenIds = new Set<number>();
        filteredResult = filteredResult.filter((item: any) => {
          if (seenIds.has(item.user.id)) return false;
          seenIds.add(item.user.id);
          return true;
        });
        return filteredResult;
      }
    }

    return subscriptions;
  }

  getActualCancellationReason(reason: string) {
    let resultString = ""
    switch (reason) {
      case "cost": {
        resultString = "Cost - Subscription fee is too high";
        break;
      }
      case "lack": {
        resultString = "Lack of Value - Does not meet your expectations";
        break;
      }
      case "better": {
        resultString = "Better Alternatives - Switching to competitor";
        break;
      }
      case "support": {
        resultString = "Customer Support - Inadequate customer support";
        break;
      }
      case "performance": {
        resultString = "Performance Issues - Bugs, downtime, or slow performance";
        break;
      }
      case "security": {
        resultString = "Security - Data privacy and security concerns";
        break;
      }
      case "temperory": {
        resultString = "I'm pausing my membership for now";
        break;
      }
      case "better_fit": {
        resultString = "I've chosen a different platform that better fits my needs";
        break;
      }
      case "high_cost": {
        resultString = "The cost doesn't feel justifiable for my needs";
        break;
      }
      case "not_required": {
        resultString = "I no longer need Spark for my business";
        break;
      }
      case "payment_issue": {
        resultString = "I had billing or payment issues";
        break;
      }
      case "others": {
        resultString = "Others";
        break;
      }
      default: {
        resultString = "";
      }
    }
    return resultString;
  }

  updateOtp(userId: number, otp: string, otpCreatedDate: Date, sendCounts: number, checkedRemember2f: boolean) {
    return this.usersRepository.updateOtp(userId, otp, otpCreatedDate, sendCounts, checkedRemember2f);
  }

  async saveOrUpdateOtp(companySubUserId: number, otp: string, otpCreatedDate: Date, sendCounts: number, checkedRemember2f: boolean) {
    const subUsersOtpDetails = await this.usersRepository.getSubUserOtpDetails(companySubUserId);
    if (subUsersOtpDetails && subUsersOtpDetails.id) {
      if(subUsersOtpDetails.isActive && checkedRemember2f){
        return this.usersRepository.updateSubUserOtp(subUsersOtpDetails.id, otp, otpCreatedDate, sendCounts, checkedRemember2f);
      } else {
        return this.usersRepository.updateSubUserOtp(subUsersOtpDetails.id, otp, otpCreatedDate, sendCounts, checkedRemember2f);
      }
    } else {
      return this.usersRepository.createSubUserOtp(companySubUserId, otp, otpCreatedDate, sendCounts)
    }
  }

  getRenewalDate = (theDate: Date): Date => {
    const renewalDate = new Date(theDate);
    renewalDate.setDate(renewalDate.getDate() - 1);
    const renewalDateString = formatDateIntoString(renewalDate);
    return new Date(renewalDateString);
  }

  getUsersSecuritySettingDetails(userId: number) {
    return this.usersRepository.getUsersSecuritySettingDetails(userId);
  }

  getApplicationSettings() {
    return this.usersRepository.getApplicationSettings();
  }

  updateUsersPasswordChangeStatus(id: number) {
    return this.usersRepository.update(id, {
      passwordNeedToChange: 'pwChanged'
    })
  }

  updateAdminUserPasswordChangeStatus(id: number) {
    return this.usersRepository.adminUserupdate(id, {
      isPasswordChanged: true,
    })
  }

  updateUsersPasswordAdminSet(id: number) {
    return this.usersRepository.update(id, {
      passwordNeedToChange: 'adChanged'
    })
  }

  async makeEightWeekTrialUsersExpire() {

    const expiryStartDate = new Date();
    expiryStartDate.setUTCHours(0, 0, 0, 0);

    let year = expiryStartDate.getUTCFullYear();
    let month = String(expiryStartDate.getUTCMonth() + 1).padStart(2, '0');
    let day = String(expiryStartDate.getUTCDate()).padStart(2, '0');
    const expiryStartDateString = `${year}-${month}-${day}`;

    // Directly add 1 day to expiryStartDate for expiryEndDate
    const expiryEndDate = new Date(expiryStartDate);
    expiryEndDate.setUTCDate(expiryEndDate.getUTCDate() + 1);

    year = expiryEndDate.getUTCFullYear();
    month = String(expiryEndDate.getUTCMonth() + 1).padStart(2, '0');
    day = String(expiryEndDate.getUTCDate()).padStart(2, '0');
    const expiryEndDateString = `${year}-${month}-${day}`;

    const matchedUsers = await this.findUsersBasedOnDates(expiryStartDateString, expiryEndDateString);
    if (matchedUsers.length > 0) {
      for (const user of matchedUsers) {
        if (!user.stripeCustomerId || user.stripeCustomerId == "") {
          this.usersRepository.update(user.id, {
            isPaidUser: false,
            accessExpirationDate: null,
            userType: USER_TYPE.free,
            trialDuration: TRIAL_PERIOD.weekly
          });
        }
      }
    }

    const manualPaidUsers = await this.usersRepository.findManualPaidUsers(expiryStartDateString, expiryEndDateString);
    if (manualPaidUsers.length > 0) {
      for (const user of manualPaidUsers) {
        if (!user.stripeSubscriptionId || user.stripeSubscriptionId == "") {
          this.usersRepository.update(user.id, {
            isPaidUser: false,
            accessExpirationDate: null,
            userType: USER_TYPE.free,
            trialDuration: TRIAL_PERIOD.weekly
          });
        }
      }
    }
  }

  async paymentFailed(userId: number, chargeId: any) {
    const activeSubscription = await this.usersRepository.getSubscriptionDetails(userId);
    let failureReason: any = null;
    if (chargeId && chargeId != "") {
      const transactionFailureDetails = await this.stripeService.getFailureReason(chargeId);
      if (transactionFailureDetails && transactionFailureDetails.failure_code && transactionFailureDetails.failure_message) {
        failureReason = transactionFailureDetails.failure_message;
      }
    }
    if (activeSubscription && activeSubscription.id) {
      if (activeSubscription.paymentAttemptCount && activeSubscription.paymentAttemptCount == 4) {
        this.mailerService.sendSubscriptionCancelledAfterAllAttempts({ email: activeSubscription.user.email, name: activeSubscription.user.firstName })
      }
      await this.usersRepository.subscriptionPaymentFailed(activeSubscription.id, activeSubscription.paymentAttemptCount, activeSubscription.firstPaymentFailDate, failureReason);
    }
  }

  async getSubscribedUsers() {
    return this.usersRepository.getSubscribedUsers();
  }

  async updateCountries(userId: number, billingCountry: string | null) {
    await this.usersRepository.updateCustomerBillingCountry(userId, billingCountry);
  }

  async updateCompanyAdminUser(userdata: { firstName: string; LastName: string; email: string }, userId: number) {
    return await this.usersRepository.updateAdminUser(userdata, userId);
  }

  async updateCompanyUsersLimit(userLimit: number, userId: number) {
    return await this.usersRepository.updateCompanyUsersLimit(userLimit, userId);
  }
  async checkEmailExist(email: string) {
    return this.usersRepository.checkEmailExist(email);
  }

  async checkAdminUserOtp(usersId: number) {
    return await this.usersRepository.checkAdminUserOtp(usersId);
  }

  async checkCompanySubUserOtp(subUserId: number) {
    return await this.usersRepository.getSubUserOtpDetails(subUserId);
  }
  getUserPageAccess(pageId: number, userId: number) {
    return this.usersRepository.findUserPageAccess(pageId, userId);
  }

  async getSubUsersCounts() {
    const subUsersCreatedBySp = await this.usersRepository.getSubUsersCountCreatedBySp();
    const subUsersCreatedByBuyer = await this.usersRepository.getSubUsersCountCreatedByBuyer();
    return { subUsersCreatedBySp, subUsersCreatedByBuyer };
  }

  findUniqueInvitee(id: number) {
    return this.usersRepository.findUniqueInvitee(id);
  }

  updateInviteePasswordAdminSet(id: number) {
    return this.usersRepository.updateInvitee(id, {
      isPasswordChanged: false,
    })
  }

  async updateCancellationStatus(customerId: string) {
    const theBillDetail = await this.usersRepository.findUniquInBillingDetails({
      isActive: true,
      stripeCustomerId: customerId
    });
    if (theBillDetail && theBillDetail.id) {
      await this.usersRepository.updateBillingTable(theBillDetail.id, {
        isSubscriptionCancelled: false
      });
    }
  }

  async updateExternalClicks(id: number) {
    return await this.usersRepository.updateExternalClicks(id);
  }

  async updateSubscriptionToCancelled(customerId: string, feedback: string | null = null, comment: string | null = null) {
    const theBillDetail = await this.usersRepository.findUniquInBillingDetails({
      isActive: true,
      stripeCustomerId: customerId
    });
    if (theBillDetail && theBillDetail.id) {
      let theDescription: string | null = "";
      if (feedback && feedback != "") {
        theDescription = "Reason:- " + stripeCancelOpts[feedback];
      }
      if (comment && comment != "") {
        theDescription = theDescription + "\nDescription:- " + comment;
      }
      theDescription = theDescription && theDescription != "" ? theDescription : null;
      const updateData = {
        isSubscriptionCancelled: true,
        reasonDescription: theDescription,
        cancellationDate: new Date()
      }
      await this.usersRepository.updateBillingTable(theBillDetail.id, updateData);
    }
  }

  async sendFollowNotifications() {
    const mailsData = await this.usersRepository.getFollowNotifications();
    if (mailsData && Object.keys(mailsData).length > 0) {
      for (const [notificationToId, notifications] of Object.entries(mailsData)) {
        this.mailerService.companyUpdatesForFollowers({
          data: notifications,
        });
      }
    }
    if (Object.keys(mailsData).length) {
      await this.usersRepository.updateMailSent();
    }
    return 'Success';
  }

  async updateUserDetails(userId: number, postData: { firstName: string, lastName: string, email: string }) {
    return await this.usersRepository.updateUserDetails(userId, postData);
  }

  async updateExpiredService() {
    return await this.usersRepository.updateExpiredService();
  }

  async addLoginLogs(UserId: number) {
    return await this.usersRepository.insertLogInLogs(UserId);
  }
  async addCompanyUserLoginLogs(UserId: number, compayUserId: number) {
    return await this.usersRepository.insertInviteeLogInLogs(UserId, compayUserId);
  }

  async createAdminNotification(postData: AdminNotifications) {
    const res = await this.usersRepository.createAdminNotification(postData);
    const companiesIds = await this.usersRepository.getCompanyIds();
    let notificationArr: number[] = [];
    companiesIds.forEach((item) => {
      const notification = {
        notificationToId: item.id,
      }
      notificationArr.push(notification.notificationToId);
    });

    let theUrl = "";
    theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/adminNotification`;
    const notificationRef = admin.database().ref(theUrl).push();
    await notificationRef.set({
      companyId: 0,
      toCompanyIds: notificationArr,
      descirption: postData.notificationDescription,
      timestamp: new Date().toISOString(),
    });
    return res;
  }

  async getAdminNotifications() {
    return await this.usersRepository.getAdminNotifications();
  }

  async getByIdNotifications(id: number) {
    return await this.usersRepository.getByIdNotifications(id);
  }

  async adminNotificationsUpdate(id: number, postData: AdminNotifications) {
    return await this.usersRepository.adminNotificationsUpdate(id, postData);
  }
  async adminNotifiDelete(id: number) {
    return await this.usersRepository.adminNotifiDelete(id);
  }
  async notificationHideAndShow(id: number) {
    return await this.usersRepository.notificationHideAndShow(id);
  }

  async deleteUsersFromList() {
    const usersEmailArr = ['amartel@3mindgames.com', 'david@agora.studio', 'dmartindale@alphacrc.com', 'partnerships@altagram.com', 'dyanwill@amazon.com', 'mohit@anantagames.com', 'clangmuir@anemonehug.com', 'grzegorz.dymek@ansharstudios.com', 'joan.rubiralta@antidote.gg', 'nando@bigfire.id', 'dengwei@blackstream.cn', 'matt@devbot.com', 'conor.kilpatrick@ddmagency.com', 'max.murray@facewaretech.com', 'andre@gameplan.games', 'lm@gridly.com', 'sydney.federman@insightglobal.com', 'sean@ism-agency.com', 'andi@luminestudio.com', 'eduardo.saffer@mainleaf.com', 'mattditton@mightygamesgroup.com', 'tj@playsidestudios.com', 'marcus.carbone@skymap.com', 'antonio@sqetch.studio', 'ashtin@supernovagames.com', 'kristoffer@tempofilmes.com.br', 'julia@halpnet.com', 'jamesnicholas@mpg.io', 'william@tintash.com', 'davis.kurzenski@unity3d.com', 'abrown@usspeaking.com', 'heather.kinal@framestore.com', 'mark@lostboysinteractive.com', 'nicola@nativeprime.com', 'accounts@hertzian.co.uk', 'tiya@yuanjinggame.com', 'a.cannata@stormindgames.com', 'baslak@storymode.pro', 'ander.bergstrom@stretchsense.com', 'kelly@supersecretplana.com', 'jason@superseedstudios.com', 'mike@thedigimonsters.com', 'joakim@valkent.com', 'charlesspeyer@trickgs.com', 'argentgangargent@intec.gg', 'mehdi.benkirane@i3d.net', 'adil@adorasoft.net', 'afrezell@apexsystems.com', 'visualdevelopment@artphoton.studio', 'rajeev.kar@ascendion.com', 'ben@climaxstudios.com', 'm.marchenko@furylion.net', 'bruce@ggoa.net', 'john@nexod.us', 'anton.fokin@gmail.com', 'kumi@pivot-motion.com', 'andrew@prometheanai.com', 'elizaveta.petruchuk@seepia.com', 'julia@soundinwords.com', 'jrh.lo@taktylstudios.com', 'eric@transportedaudio.com', 'ryan@tripunk.com', 'hnakagomi@wizcorp.jp', 'cristina.lourenco@acolad.com', 'frederique.dusault@bhvr.com', 'tscott@fastspring.com', 'nchambers@fx-chamber.com', 'shane@gamedriver.io', 'will.hendrickson@happyfinish.com', 'philip@hypothetic.art', 'cassie@nexus.gg', 'shaw@nxastudios.com', 'john@pickfu.com', 'joel.benton@playtropic.com', 'adam@resilio.com', 'jaime@ridiculousgaming.net', 'tj@evolve-pr.com', 'fabian@solidstatenetworks.com', 'lukas@floating-rock.com', 'katya@redhillgames.com', 'h.freitas@program-ace.com', 'rayl@ecinnovations.com', 'gaurav@spoilz.studio', 'diwu@artphoton.studio', 'alberto@treeinteractivecr.com'];
    const usersFromOurDb = await this.usersRepository.findAllUsersByEmail(usersEmailArr);
    for (const item of usersFromOurDb) {
      await this.deleteUserFromUsersCompanies(item.id, item.email);
      if ((item.approvalStatus == 'completed' || item.approvalStatus == 'pwdCreated') && item.userType != 'init') {
        try {
          const currentUser = await admin.auth().getUserByEmail(item.email);
          if (currentUser && currentUser.uid) {
            await admin.auth().deleteUser(currentUser.uid);
          }
        } catch (err) {
          throw new Exception("User with email " + item.email + " is not found in firebase");
        }
      }
    }
  }

  async findCompanyUsers(search: string, filterVal: Prisma.CompanyAdminUserWhereInput[], userRole: string) {
    const users = await this.usersRepository.findCompanyUsers(search, filterVal, userRole);
    return users;
  }

  async sixMonthTrialUsers() {
    const trialUsers = await this.usersRepository.findSixMonthTrialUsers();
    return trialUsers;
  }

  async checkUserCanceledSubscriptionPreviously(userId: number) {
    const cancelledSubscription = await this.usersRepository.isUserCancelledSubscriptionBefore(userId);
    if(cancelledSubscription && cancelledSubscription.id) {
      return true;
    }
    return false;
  }

  async getTheDeletedButFirebaseExistEmails() {
    const deletedUsers = await this.usersRepository.deletedUsers();
    const firebaseExistingDeletedEmails: any = [];
    const firebaseNonExistingDeletedEmails: any = [];
    const repeatedLiveEmails: any = [];
    const needToDeleteMails: any = [];
    for(const item of deletedUsers) {
      try {
        const theEmail = extractOriginalEmail(item.email);
        const currentUser = await admin.auth().getUserByEmail(theEmail);
        if(currentUser && currentUser.uid) {
          firebaseExistingDeletedEmails.push(item.email);
        }
        const emailExist = await this.usersRepository.findOneByEmail(theEmail);
        const emailExistInCompanyUsers = await this.usersRepository.findOneByEmailInCompanyUsers(theEmail);
        if(emailExist || emailExistInCompanyUsers) {
          repeatedLiveEmails.push(theEmail);
        } else {
          needToDeleteMails.push(theEmail);
        }
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          firebaseNonExistingDeletedEmails.push(item.email);
        }
      }
    }
    return { firebaseExistingDeletedEmails, firebaseNonExistingDeletedEmails, repeatedLiveEmails, needToDeleteMails };
  }

  async update2fa(userId: number, status: boolean, companyUser: boolean) {
    return await this.usersRepository.update2fa(userId, status, companyUser);
  }

}
