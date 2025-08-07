import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { MailtrapService } from "../services/mailtrap.service";
import { TemplateType } from "./templates";
import { Options } from "nodemailer/lib/mailer";
import { EMAIL_TEMPLATE } from "src/common/constants/email.constant";
import { CompleteSetupAccountProps, PaymentFailureProps, SubscriptionNotificationProps } from "./type";
import { ConfigService } from "@nestjs/config";
import { XdsContext } from "src/common/types/xds-context.type";
import { formatDate } from "src/common/methods/common-methods";
import { ROLE_CODE } from "@prisma/client";

@Injectable()
export class MailerService {
  constructor(
    private readonly logger: Logger,
    private readonly mailtrapService: MailtrapService,
    private readonly configService: ConfigService,
  ) { }

  async send(mailDataRequired: Options, template: TemplateType) {
    try {
      return await this.mailtrapService.send(mailDataRequired, template);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e.message);
    }
  }

  async sendThankYou({ email, name }: { email: string; name: string }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "Thanks for your XDS Spark Registration" },
      {
        type: EMAIL_TEMPLATE.THANK_YOU,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async sendCompleteSetupAccount(
    xdsContext: XdsContext,
    { email, name, generatedToken }: CompleteSetupAccountProps,
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const res = await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - You are good to go!" },
      {
        type: EMAIL_TEMPLATE.COMPLETE_SETUP_ACCOUNT,
        context: {
          firstName: name.trim(),
          completeSetupAccountLink: `${this.configService.get(
            "XDS_FRONTEND_BASE_URL",
          )}/password?token=${generatedToken}`,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
    this.logger.log(
      "sent email asking user to complete setup account",
      xdsContext,
    );
    return res;
  }

  async sendRejectRegistrationRequest({
    email,
    name,
  }: CompleteSetupAccountProps) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "Registration request for XDS Spark was rejected" },
      {
        type: EMAIL_TEMPLATE.REJECT_REGISTRATION_REQUEST,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  // async sendPaymentFailureNotification({
  //   email,
  //   name,
  //   invoiceId,
  //   invoiceAmount,
  //   stripeCustomerPortalLink,
  // }: PaymentFailureProps) {
  //   const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
  //   const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
  //   return await this.mailtrapService.send(
  //     { to: email, subject: "XDS Spark - Billing Issue" },
  //     {
  //       type: EMAIL_TEMPLATE.PAYMENT_FAILURE_NOTIFICATION,
  //       context: {
  //         firstName: name.trim(),
  //         invoiceId,
  //         invoiceAmount,
  //         stripeCustomerPortalLink,
  //         websiteLogoUrl: websiteLogoUrl,
  //         websiteMailBgUrl: websiteMailBgUrl
  //       },
  //     },
  //   );
  // }

  async setNewPassword({
    email,
    password,
    name,
    userRole,
  }: {
    email: string;
    password: string;
    name: string;
    userRole: ROLE_CODE;
  }, type: string) {
    const websiteUrl = process.env.XDS_FRONTEND_BASE_URL;
    const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    let websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    if (type == "freeUser") {
      return this.completeFoundationalUserMail({name, email, password, userRole});
      // try {
      //   const mailresponse = await this.mailtrapService.send(
      //     { to: email, subject: "XDS Spark - Complimentary Access Available NOW!" },
      //     {
      //       type: EMAIL_TEMPLATE.SET_PASSWORD,
      //       context: {
      //         email: email,
      //         firstName: name.trim(),
      //         password: password,
      //         websiteUrl: websiteUrl,
      //         webSiteLoginUrl: websiteUrlLogin,
      //         websiteLogoUrl: websiteLogoUrl,
      //         websiteMailBgUrl: websiteMailBgUrl
      //       },
      //     },
      //   );
      //   console.log(mailresponse);
      //   return mailresponse;
      // } catch (error) {
      //   console.log(error);
      //   return error;
      // }
    } else if (type == "trialUserMonth") {
      try {
        return this.send30DayTrialMail({name, email, password, userRole});
      } catch (error) {
        console.log(error);
        return error;
      }
    } else if (type == "trialUserYear") {
      if (userRole == ROLE_CODE.buyer) {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "XDS Spark - Complimentary 1yr Premium Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_YEAR_BUYER,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      } else {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "XDS Spark - Complimentary 1yr Premium Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_YEAR_SP,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      }
    } else if (type == "trialUser8Week") {
      // websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mailtemplate.png';
      if (userRole == ROLE_CODE.buyer) {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "XDS Spark - Complimentary 8w Premium Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_8W_BYER,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      } else {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "XDS Spark - Complimentary 8w Premium Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_8W_SP,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      }
    } else if (type == "trialUser6months") {
      websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/Premium_trial_banner.png';
      if (userRole == ROLE_CODE.buyer) {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "Credentials for your Premium Spark Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_6M_BYER,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      } else {
        try {
          const mailresponse = await this.mailtrapService.send(
            { to: email, subject: "Credentials for your Premium Spark Membership" },
            {
              type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_6M_SP,
              context: {
                email: email,
                firstName: name.trim(),
                password: password,
                websiteUrl: websiteUrl,
                webSiteLoginUrl: websiteUrlLogin,
                websiteLogoUrl: websiteLogoUrl,
                websiteMailBgUrl: websiteMailBgUrl
              },
            },
          );
          return mailresponse;
        } catch (error) {
          console.log(error);
          return error;
        }
      }
    }

  }

  async sendPasswordtoCompanyUsers(
    { email,
      password,
      adminFirstName,
      adminLastName,
      userFirstName,
      userLastName }: {
        email: string;
        password: string;
        adminFirstName: string;
        adminLastName: string;
        userFirstName: string;
        userLastName: string;
      }
  ) {
    try {
      const websiteUrl = process.env.XDS_FRONTEND_BASE_URL || "";
      const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
      const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
      let websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
      const mailresponse = await this.mailtrapService.send(
        { to: email, subject: adminFirstName.trim()+" "+adminLastName.trim()+" has invited you to join XDS Spark"},
        {
          type: EMAIL_TEMPLATE.SET_COMPANY_USER_PASSWORD,
          context: {
            email: email,
            adminFirstName: adminFirstName.trim(),
            adminLastName: adminLastName.trim(),
            userFirstName: userFirstName.trim(),
            userLastName: userLastName.trim(),
            password: password,
            websiteUrl: websiteUrl,
            webSiteLoginUrl: websiteUrlLogin,
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl
          },
        },
      );
      return mailresponse;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async resetPassword({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) {
    const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "Your Password has been reset" },
      {
        type: EMAIL_TEMPLATE.RESET_PASSWORD,
        context: {
          firstName: name.trim(),
          password: password,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          websiteUrlLogin: websiteUrlLogin,
        },
      },
    );
  }

  async opportunityIntrested({
    name,
    url,
    email,
    opportunityName,
  }: {
    name: string;
    url: string;
    email: string;
    opportunityName: string,
  }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: `XDS Spark - Somebody is interested in your “${opportunityName}” opportunity` },
      {
        type: EMAIL_TEMPLATE.OPPORTUNITY_INTRESTED,
        context: {
          firstName: name.trim(),
          url: url,
          opportunityName: opportunityName,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async forgotPasswordMail(
    { email, name, generatedToken }: CompleteSetupAccountProps,
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Password Reset" },
      {
        type: EMAIL_TEMPLATE.FORGOT_PASSWORD,
        context: {
          firstName: name.trim(),
          forgotPasswordLink: `${this.configService.get(
            "XDS_FRONTEND_BASE_URL",
          )}/reset-password?token=${generatedToken}`,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async successForgotPassword(
    { email, name }: CompleteSetupAccountProps
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Password Reset Success" },
      {
        type: EMAIL_TEMPLATE.SUCCESS_FORGOT_PASSWORD,
        context: {
          firstName: name.trim(),
          forgotPasswordLink: `${this.configService.get("XDS_FRONTEND_BASE_URL")}`,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        }
      }
    )
  }

  async primaryEmailChanged(
    { email, name }: CompleteSetupAccountProps
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Your email has been changed." },
      {
        type: EMAIL_TEMPLATE.PRIMARY_EMAIL_CHANGED,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        }
      }
    )
  }

  async sendContactUsMail({ firstName, lastName, company, email, nature, message, UserId }: { firstName: string, lastName: string, company: string, email: string, nature: string, message: string, UserId?: number }, type: string = 'contactUs') {
    let toMail = (['local', 'staging'].includes(process.env.XDS_RUN_ENVIRONMENT as string)) ? 'ebharath@aapthitech.com' :  'info@xds-spark.com';
    if( type == 'consultation') {
      toMail = (['local', 'staging'].includes(process.env.XDS_RUN_ENVIRONMENT as string)) ? 'ebharath@aapthitech.com' :  'carla@xds-spark.com';
    }
    if (nature == 'Billing') {
      toMail = (['local', 'staging'].includes(process.env.XDS_RUN_ENVIRONMENT as string)) ? 'ebharath@aapthitech.com' :  'billing@xds-spark.com';
    }
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    let content = "A new inquiry has been received through the website's contact form.";
    if(type == 'consultation') {
      content = "A new inquiry has been received through Spark's business solutions.";
    }

    let subject = 'Website Contact Form Submission: XDS Spark';
    if(type == 'consultation') {
      subject = 'Consultation Request';
    }
    return await this.mailtrapService.send(
      { to: toMail, subject: subject },
      {
        type: EMAIL_TEMPLATE.CONTACT_US,
        context: {
          content,
          firstName,
          lastName,
          company,
          email,
          nature,
          message,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async sendSubscriptionNotificationMail(
    { email, name, date, userType }: SubscriptionNotificationProps
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const subscriptionLink = process.env.XDS_FRONTEND_BASE_URL + "/my-profile/subscriptions"

    if (userType === "buyer") {
      return await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - Don't Let Your Premium Membership Expire!" },
        {
          type: EMAIL_TEMPLATE.BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION,
          context: {
            firstName: name.trim(),
            date: formatDate(date),
            subscriptionLink: subscriptionLink,
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl
          }
        }
      )
    } else {
      return await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - Don't Let Your Premium Membership Expire!" },
        {
          type: EMAIL_TEMPLATE.SP_TRIAL_SUBSCRIPTION_NOTIFICATION,
          context: {
            firstName: name.trim(),
            date: formatDate(date),
            subscriptionLink: subscriptionLink,
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl
          }
        }
      )
    }
    // return await this.mailtrapService.send(
    //   { to: email, subject: "XDS Spark - Premium Trial Period Reminder"},
    //   {
    //     type: EMAIL_TEMPLATE.SUBSCRIPTION_NOTIFICATION,
    //     context: {
    //       firstName: name.trim(),
    //       date: formatDate(date),
    //       subscriptionLink: subscriptionLink,
    //       websiteLogoUrl: websiteLogoUrl,
    //       websiteMailBgUrl: websiteMailBgUrl
    //     }
    //   }
    // )

  }

  async subscriptionCancellationMail(
    { email, name, date }: SubscriptionNotificationProps
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const adminMailId = process.env.XDS_STRIPE_ADMIN_MAIL;
    return await this.mailtrapService.send(
      { to: email + `, ${adminMailId}`, subject: "XDS Spark - Subscription has been cancelled" },
      {
        type: EMAIL_TEMPLATE.SUBSCRIPTION_CANCELLATION,
        context: {
          firstName: name.trim(),
          date: formatDate(date),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        }
      }
    )
  }

  async subscriptionSuccessMail({ email, name, type, stripeDownloadUrl }: { email: string, name: string, type: ROLE_CODE, stripeDownloadUrl: string }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const stripeCustomerPortalLink = `https://billing.stripe.com/p/login/${process.env.XDS_STRIPE_CUSTOMER_PORTAL_LINK_TOKEN}`
    if(type == ROLE_CODE.service_provider) {
      return await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - Thanks for Upgrading to Premium!" },
        {
          type: EMAIL_TEMPLATE.PREMIUM_SP,
          context: {
            firstName: name.trim(),
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl,
            stripeDownloadUrl: stripeDownloadUrl,
            stripeCustomerPortalUrl: stripeCustomerPortalLink
          }
        }
      );
    } else {
      return await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - Thanks for Upgrading to Premium!" },
        {
          type: EMAIL_TEMPLATE.PREMIUM_BUYER,
          context: {
            firstName: name.trim(),
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl,
            stripeDownloadUrl: stripeDownloadUrl,
            stripeCustomerPortalUrl: stripeCustomerPortalLink
          }
        }
      );
    }

  }

  async passwordChangedSuccess({ email, name }: { email: string; name: string }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Successful Password Change" },
      {
        type: EMAIL_TEMPLATE.PASSWORD_CHANGED_SUCCESS,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async completeFoundationalUserMail({
    email,
    password,
    name,
    userRole,
  }: {
    email: string;
    password: string;
    name: string;
    userRole: ROLE_CODE;
  }) {
    const websiteUrl = process.env.XDS_FRONTEND_BASE_URL;
    const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    if (userRole == "buyer") {
      try {
        const mailresponse = await this.mailtrapService.send(
          { to: email, subject: "XDS Spark - Foundational Access Available NOW!" },
          {
            type: EMAIL_TEMPLATE.FOUNDATIONAL_BUYER_COMPLETE,
            context: {
              email: email,
              firstName: name.trim(),
              password: password,
              websiteUrl: websiteUrl,
              webSiteLoginUrl: websiteUrlLogin,
              websiteLogoUrl: websiteLogoUrl,
              websiteMailBgUrl: websiteMailBgUrl
            },
          },
        );
        return mailresponse;
      } catch (error) {
        console.log(error);
        return error;
      }
    } else if (userRole == "service_provider") {
      try {
        const mailresponse = await this.mailtrapService.send(
          { to: email, subject: "XDS Spark - Foundational Access Available NOW!" },
          {
            type: EMAIL_TEMPLATE.FOUNDATIONAL_SP_COMPLETE,
            context: {
              email: email,
              firstName: name.trim(),
              password: password,
              websiteUrl: websiteUrl,
              webSiteLoginUrl: websiteUrlLogin,
              websiteLogoUrl: websiteLogoUrl,
              websiteMailBgUrl: websiteMailBgUrl
            },
          },
        );
        return mailresponse;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  }

  async send30DayTrialMail({
    email,
    password,
    name,
    userRole,
  }: {
    email: string;
    password: string;
    name: string;
    userRole: ROLE_CODE;
  }) {
    const websiteUrl = process.env.XDS_FRONTEND_BASE_URL;
    const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    if (userRole == "buyer") {
      try {
        const mailresponse = await this.mailtrapService.send(
          { to: email, subject: "XDS Spark - 30 Day Trial Available NOW!" },
          {
            type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_MONTH_BUYER,
            context: {
              email: email,
              firstName: name.trim(),
              password: password,
              websiteUrl: websiteUrl,
              webSiteLoginUrl: websiteUrlLogin,
              websiteLogoUrl: websiteLogoUrl,
              websiteMailBgUrl: websiteMailBgUrl
            },
          },
        );
        return mailresponse;
      } catch (error) {
        console.log(error);
        return error;
      }
    } else if (userRole == "service_provider") {
      try {
        const mailresponse = await this.mailtrapService.send(
          { to: email, subject: "XDS Spark - 30 Day Trial Available NOW!" },
          {
            type: EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_MONTH_SP,
            context: {
              email: email,
              firstName: name.trim(),
              password: password,
              websiteUrl: websiteUrl,
              webSiteLoginUrl: websiteUrlLogin,
              websiteLogoUrl: websiteLogoUrl,
              websiteMailBgUrl: websiteMailBgUrl
            },
          },
        );
        return mailresponse;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  }

  async subscriptionRenewedMail({ email, name, stripeDownloadUrl }: { email: string; name: string, stripeDownloadUrl: string }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const stripeCustomerPortalLink = `https://billing.stripe.com/p/login/${process.env.XDS_STRIPE_CUSTOMER_PORTAL_LINK_TOKEN}`
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Successful Renewal" },
      {
        type: EMAIL_TEMPLATE.SUBSCRIPTION_RENEWED,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          stripeDownloadUrl: stripeDownloadUrl,
          stripeCustomerPortalUrl: stripeCustomerPortalLink
        },
      },
    );
  }

  async sendOtpMail(email: string, otp: string, firstName: string) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Two Factor Authentication Code" },
      {
        type: EMAIL_TEMPLATE.SEND_OTP,
        context: {
          firstName: firstName.trim(),
          otpString: otp,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async sendSubscriptionCancelledAfterAllAttempts({ email, name }: { email: string; name: string }) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const adminMailId = process.env.XDS_STRIPE_ADMIN_MAIL;
    return await this.mailtrapService.send(
      { to: email + `, ${adminMailId}`, subject: "XDS Spark - Subscription has been cancelled" },
      {
        type: EMAIL_TEMPLATE.SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS,
        context: {
          firstName: name.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl
        },
      },
    );
  }

  async sendCompanyUserRemovingMail(
    { email,
      firstName,
      lastName, }: {
        email: string;
        firstName: string;
        lastName: string;
      }
  ) {
    try {
      const websiteUrl = process.env.XDS_FRONTEND_BASE_URL || "";
      const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
      const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
      let websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
      const mailresponse = await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - Your accout has been removed"},
        {
          type: EMAIL_TEMPLATE.COMPANY_USER_REMOVE,
          context: {
            userFirstName: firstName.trim(),
            userLastName:  lastName.trim(),
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl
          },
        },
      );
      return mailresponse;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async companyUpdatesForFollowers({ data }: {data: any;}) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const companyLogo = process.env.XDS_FRONTEND_BASE_URL + '/circle-no-image-available.jpg';
    const companyUrl = process.env.XDS_FRONTEND_BASE_URL + '/serviceproviders';
    return await this.mailtrapService.send(
      { to: data[0].notifiedCompany.user.email, subject: "XDS Spark - Service Provider Updates" },
      // { to: 'dchakravarthy@aapthitech.com', subject: "XDS Spark - Service Provider Updates" },
      {
        type: EMAIL_TEMPLATE.COMPANY_UPDATES_TO_FOLLOWERS,
        context: {
          companyName: data[0].notifiedCompany.name.trim(),
          userName: data[0].notifiedCompany.user.firstName+" "+data[0].notifiedCompany.user.lastName,
          data: data,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          companyLogo: companyLogo,
          companyUrl: companyUrl,
        },
      },
    );
  }

  async userEditResetPassword({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) {
    const websiteUrlLogin = process.env.XDS_FRONTEND_BASE_URL + "/login";
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Your email & password has been changed" },
      {
        type: EMAIL_TEMPLATE.USER_EDIT_RESET_PASSWORD,
        context: {
          firstName: name.trim(),
          password: password,
          email: email,
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          websiteUrlLogin: websiteUrlLogin,
        },
      },
    );
  }

  async sentFollowMail(
     email: string, userName: string, companyName: string 
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const websiteRedirectUrl = process.env.XDS_FRONTEND_BASE_URL + '/company-profile/general-info';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - Congrats! A Buyers has followed your company profile" },
      {
        type: EMAIL_TEMPLATE.SENDING_FOLLOW_MAIL,
        context: {
          firstName: userName.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          websiteRedirectUrl: websiteRedirectUrl
        }
      }
    )
  }
  
  async companyProfileCompletion(
     email: string, userName: string, companyName: string 
  ) {
    const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
    const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
    const websiteRedirectUrl = process.env.XDS_FRONTEND_BASE_URL + '/company-profile/general-info';
    return await this.mailtrapService.send(
      { to: email, subject: "XDS Spark - You’re almost done!" },
      {
        type: EMAIL_TEMPLATE.COMPANY_PROFILE_COMPLETION,
        context: {
          firstName: userName.trim(),
          websiteLogoUrl: websiteLogoUrl,
          websiteMailBgUrl: websiteMailBgUrl,
          websiteRedirectUrl: websiteRedirectUrl
        }
      }
    )
  }

  async buyerNewOpportinityServicesMatchedCompanies(oppoId: number, email: string, userName: string ) {
    try {
      const websiteLogoUrl = process.env.XDS_FRONTEND_BASE_URL + '/xds-logo.png';
      const websiteMailBgUrl = process.env.XDS_FRONTEND_BASE_URL + '/mail-bg.png';
      const websiteRedirectUrl = process.env.XDS_FRONTEND_BASE_URL + '/opportunity-details/'+oppoId;
      return await this.mailtrapService.send(
        { to: email, subject: "XDS Spark - An XDS Spark opportunity for you!" },
        {
          type: EMAIL_TEMPLATE.BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS,
          context: {
            firstName: userName.trim(),
            websiteLogoUrl: websiteLogoUrl,
            websiteMailBgUrl: websiteMailBgUrl,
            websiteRedirectUrl: websiteRedirectUrl
          }
        }
      )
    } catch (error) {
      console.log(error);
      return error;
    }
  }

}
