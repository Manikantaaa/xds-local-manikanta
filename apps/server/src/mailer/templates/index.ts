import { readFileSync } from "fs";
import path from "path";
import Handlebars from "handlebars";
import { EMAIL_TEMPLATE } from "src/common/constants/email.constant";

/**
 * How to add a new template:
 * 1. Create .hbs template file
 * 2. Create type for context
 * 3. Add type for template
 * 4. Create HandlebarsTemplateDelegate object by compiling the .hbs file in step 1
 * 5. Create html by calling the HandlebarsTemplateDelegate with corresponding context
 */

// 1. Create .hbs template file

// 2. Create type for context (which data to inject to the .hbs file)
type ThankYouContext = {
  firstName: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
  stripeDownloadUrl?: string;
  stripeCustomerPortalUrl?: string;
};
type ContactUsContext = {
  content: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  nature: string;
  message: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};
type CompleteSignupContext = {
  firstName: string;
  completeSetupAccountLink: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type ForgotPasswordContext = {
  firstName: string;
  forgotPasswordLink: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
}

type RejectRegistrationRequestContext = {
  firstName: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type PaymentFailureNotificationContext = {
  firstName: string;
  invoiceId: string;
  invoiceAmount: number;
  stripeCustomerPortalLink: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type ResetPasswordContext = {
  email: string;
  firstName: string;
  password: string;
  websiteUrl: string;
  webSiteLoginUrl: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
  websiteUrlLogin: string;
};

type opportunityIntrested = {
  email: string;
  firstName: string;
  url: string;
  opportunityName: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type SubscriptionNotificationContext = {
  email: string;
  firstName: string;
  date: string;
  subscriptionLink: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type SendOtpContext = {
  firstName: string;
  otpString: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type SubscriptionRenewalContext = {
  firstName: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
  stripeDownloadUrl: string;
  stripeCustomerPortalUrl?: string;
};

type SetUserPasswordContext = {
  email: string;
  adminFirstName: string;
  adminLastName: string;
  userFirstName: string;
  userLastName: string;
  password: string;
  websiteUrl: string;
  webSiteLoginUrl: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type CompanyUserRemove = {
  userFirstName: string;
  userLastName: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
};

type SendingFollowEmail = {
  firstName: string;
  email: string;
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
  websiteRedirectUrl: string;
};

type CompanyUpdatesToFollowers = {
  companyName: string;
  userName: string;
  data: [{
    notificationById: number,
    notificationToId: number,
    notificationDescription: string,
    notifyingCompany: { 
      name: string, 
      user: { 
        firstName: string,
        lastName: string,
        email: string,
        assets:[{
            url: true,
          }],
      }
     },
    notifiedCompany: { 
    name: string, 
    user: { 
      firstName: string,
      lastName: string,
      email: string
    }
   },
  }];
  websiteLogoUrl: string;
  websiteMailBgUrl: string;
  companyLogo: string;
  companyUrl: string;
};

// 3. Add type for template
export type TemplateType =
  | {
      type: string;
      context: ThankYouContext; // <-- context that the template needs
    }
  | { type: string; context: CompleteSignupContext }
  | { type: string; context: RejectRegistrationRequestContext }
  | {
      type: string;
      context: PaymentFailureNotificationContext;
    }
  | {
      type: string;
      context: ResetPasswordContext;
    }
  | {
      type: string;
      context: opportunityIntrested;
    }
  | {
      type: string;
      context: ForgotPasswordContext
    }
  | {
    type: string;
    context: ContactUsContext
    }
  | {
    type: string;
    context: SubscriptionNotificationContext
  }
  | {
    type: string;
    context: SendOtpContext
  }
  | {
    type: string;
    context: SubscriptionRenewalContext
  }
  | {
    type: string;
    context: SetUserPasswordContext
  }
  | {
    type: string;
    context: CompanyUserRemove
  }
  | {
    type: string;
    context: CompanyUpdatesToFollowers
  }
  | {
    type: string;
    context: SendingFollowEmail
  }

// 4. Create HandlebarsTemplateDelegate object by compiling the .hbs file in step 1
const getFilePath = (fileName: string) => {
  const TEMPLATE_PATH = path.join(process.cwd(), "/src/mailer/templates");
  return readFileSync(path.join(TEMPLATE_PATH, `/${fileName}`), "utf8");
};
const THANK_YOU_TEMPLATE_PATH = getFilePath("thank-you.hbs");
const COMPLETE_SETUP_ACCOUNT_TEMPLATE_PATH = getFilePath(
  "complete-setup-account.hbs",
);
const REJECT_REGISTRATION_REQUEST_TEMPLATE_PATH = getFilePath(
  "reject-registration-request.hbs",
);
const PAYMENT_FAILURE_NOTIFICATION_TEMPLATE_PATH = getFilePath(
  "payment-failure-notification.hbs",
);
const RESET_PASSWORD_TEMPLATE_PATH = getFilePath("reset-password.hbs");
const USER_EDIT_RESET_PASSWORD_TEMPLATE_PATH = getFilePath("user-edit-reset-password.hbs");
const SET_PASSWORD_PATH = getFilePath("setPasswordByAdmin.hbs");

const FORGOT_PASSWORD_PATH = getFilePath("forgot-password.hbs");
const SUCCESS_FORGOT_PASSWORD_PATH = getFilePath("forgot-password-success.hbs");

const SEND_OPPORTUNITY_INTRESTED = getFilePath("intrestedin-opportunity.hbs");
const PRIMARY_EMAIL_CHANGED_PATH = getFilePath("primary-email-changed.hbs");
const CONTACT_US_PATH = getFilePath("contactus.hbs");
const SUBSCRIPTION_NOTIFICATION_MAIL_PATH = getFilePath("subscription-notification.hbs");
const SUBSCRIPTION_CANCELLATION_PATH = getFilePath("subscription-cancellation.hbs");
const PREMIUM_SP_PATH = getFilePath("premium-sp.hbs");
const PREMIUM_BUYER_PATH = getFilePath("premium-buyer.hbs");
const WELCOME_SET_PASSWORD_MONTH_BUYER_PATH = getFilePath("welcome-set-password-month_buyer.hbs");
const WELCOME_SET_PASSWORD_MONTH_SP_PATH = getFilePath("welcome-set-password-month.hbs");
const WELCOME_SET_PASSWORD_YEAR_SP_PATH = getFilePath("welcome-set-password-year-sp.hbs");
const WELCOME_SET_PASSWORD_YEAR_BUYER_PATH = getFilePath("welcome-set-password-year-buyer.hbs");
const PASSWORD_CHANGED_SUCCESS_PATH = getFilePath("success-password-changed.hbs");
const FOUNDATIONAL_BUYER_COMPLETE_PATH = getFilePath("foundational-buyer-complete.hbs");
const FOUNDATIONAL_SP_COMPLETE_PATH = getFilePath("foundational-sp-complete.hbs");
const SUBSCRIPTION_RENEWED_PATH = getFilePath("subscription-renewed.hbs");
const BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION_MAIL_PATH = getFilePath("buyer-trial-subscription-notification.hbs");
const SP_TRIAL_SUBSCRIPTION_NOTIFICATION_MAIL_PATH = getFilePath("sp-trial-subscription-notification.hbs");
const SEND_OTP_PATH = getFilePath("send-otp.hbs");
const WELCOME_SET_PASSWORD_TRIAL_8W_SP_PATH = getFilePath("welcome-set-password-8w-sp.hbs");
const WELCOME_SET_PASSWORD_TRIAL_8W_BYER_PATH = getFilePath("welcome-set-password-8w-byer.hbs");
const SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS_PATH = getFilePath("susbscription-cancelled-after-attempts.hbs");
const SET_COMPANY_USER_PASSWORD_PATH = getFilePath("setPasswordByCompanyAdmin.hbs");
const COMPANY_USER_REMOVE_PATH = getFilePath("companyUserRemove.hbs");
const COMPANY_UPDATES_TO_FOLLOWERS_PATH = getFilePath("companyUpdateToFollowers.hbs");
const SENDING_FOLLOW_MAIL_PATH = getFilePath("sendingFollowMail.hbs");
const COMPANY_PROFILE_COMPLETION_PATH = getFilePath("company-Profile-Completion.hbs");
const BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS_PATH = getFilePath("buyer-opportunity-services-matches-sps.hbs");
const WELCOME_SET_PASSWORD_TRIAL_6M_SP_PATH = getFilePath("welcome-set-password-6m-sp.hbs");
const WELCOME_SET_PASSWORD_TRIAL_6M_BYER_PATH = getFilePath("welcome-set-password-6m-byer.hbs");

const THANK_YOU_TEMPLATE = Handlebars.compile<ThankYouContext>(
  THANK_YOU_TEMPLATE_PATH,
);
const COMPLETE_SETUP_ACCOUNT_TEMPLATE =
  Handlebars.compile<CompleteSignupContext>(
    COMPLETE_SETUP_ACCOUNT_TEMPLATE_PATH,
  );
const REJECT_REGISTRATION_REQUEST_TEMPLATE =
  Handlebars.compile<RejectRegistrationRequestContext>(
    REJECT_REGISTRATION_REQUEST_TEMPLATE_PATH,
  );
const PAYMENT_FAILURE_NOTIFICATION_TEMPLATE =
  Handlebars.compile<RejectRegistrationRequestContext>(
    PAYMENT_FAILURE_NOTIFICATION_TEMPLATE_PATH,
  );

const RESET_PASSWORD_TEMPLATE = Handlebars.compile<ResetPasswordContext>(
  RESET_PASSWORD_TEMPLATE_PATH,
);
const USER_EDIT_RESET_PASSWORD_TEMPLATE = Handlebars.compile<ResetPasswordContext>(
  USER_EDIT_RESET_PASSWORD_TEMPLATE_PATH,
);
const OPPORTUNITY_INTRESTED = Handlebars.compile<opportunityIntrested>(
  SEND_OPPORTUNITY_INTRESTED,
);
const CONTACT_US = Handlebars.compile<ContactUsContext>(
  CONTACT_US_PATH,
);

const SET_PASSWORD =
  Handlebars.compile<ResetPasswordContext>(SET_PASSWORD_PATH);

const FORGOT_PASSWORD = Handlebars.compile<ForgotPasswordContext>(FORGOT_PASSWORD_PATH)
const SUCCESS_FORGOT_PASSWORD = Handlebars.compile<ForgotPasswordContext>(SUCCESS_FORGOT_PASSWORD_PATH)
const PRIMARY_EMAIL_CHANGED = Handlebars.compile<ThankYouContext>(PRIMARY_EMAIL_CHANGED_PATH)

const SUBSCRIPTION_NOTIFICATION = Handlebars.compile<SubscriptionNotificationContext>(SUBSCRIPTION_NOTIFICATION_MAIL_PATH);
const SUBSCRIPTION_CANCELLATION = Handlebars.compile<SubscriptionNotificationContext>(SUBSCRIPTION_CANCELLATION_PATH);
const PREMIUM_SP = Handlebars.compile<ThankYouContext>(PREMIUM_SP_PATH);
const PREMIUM_BUYER = Handlebars.compile<ThankYouContext>(PREMIUM_BUYER_PATH);
const WELCOME_SET_PASSWORD_MONTH_BUYER = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_MONTH_BUYER_PATH);
const WELCOME_SET_PASSWORD_MONTH_SP = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_MONTH_SP_PATH);
const WELCOME_SET_PASSWORD_YEAR_SP = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_YEAR_SP_PATH);
const WELCOME_SET_PASSWORD_YEAR_BUYER = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_YEAR_BUYER_PATH);
const PASSWORD_CHANGED_SUCCESS = Handlebars.compile<ThankYouContext>(PASSWORD_CHANGED_SUCCESS_PATH);
const FOUNDATIONAL_BUYER_COMPLETE = Handlebars.compile<ResetPasswordContext>(FOUNDATIONAL_BUYER_COMPLETE_PATH);
const FOUNDATIONAL_SP_COMPLETE = Handlebars.compile<ResetPasswordContext>(FOUNDATIONAL_SP_COMPLETE_PATH);
const SUBSCRIPTION_RENEWED = Handlebars.compile<SubscriptionRenewalContext>(SUBSCRIPTION_RENEWED_PATH);
const BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION = Handlebars.compile<SubscriptionNotificationContext>(BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION_MAIL_PATH);
const SP_TRIAL_SUBSCRIPTION_NOTIFICATION = Handlebars.compile<SubscriptionNotificationContext>(SP_TRIAL_SUBSCRIPTION_NOTIFICATION_MAIL_PATH);
const SEND_OTP = Handlebars.compile<SendOtpContext>(SEND_OTP_PATH);
const WELCOME_SET_PASSWORD_TRIAL_8W_SP = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_TRIAL_8W_SP_PATH);
const WELCOME_SET_PASSWORD_TRIAL_8W_BYER = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_TRIAL_8W_BYER_PATH);
const SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS = Handlebars.compile<ThankYouContext>(SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS_PATH);
const SET_COMPANY_USER_PASSWORD = Handlebars.compile<SetUserPasswordContext>(SET_COMPANY_USER_PASSWORD_PATH);
const COMPANY_USER_REMOVE = Handlebars.compile<CompanyUserRemove>(COMPANY_USER_REMOVE_PATH);
const COMPANY_UPDATES_TO_FOLLOWERS = Handlebars.compile<CompanyUpdatesToFollowers>(COMPANY_UPDATES_TO_FOLLOWERS_PATH);
const SENDING_FOLLOW_MAIL = Handlebars.compile<SendingFollowEmail>(SENDING_FOLLOW_MAIL_PATH);
const COMPANY_PROFILE_COMPLETION = Handlebars.compile<SendingFollowEmail>(COMPANY_PROFILE_COMPLETION_PATH);
const BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS = Handlebars.compile<SendingFollowEmail>(BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS_PATH);
const WELCOME_SET_PASSWORD_TRIAL_6M_SP = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_TRIAL_6M_SP_PATH);
const WELCOME_SET_PASSWORD_TRIAL_6M_BYER = Handlebars.compile<ResetPasswordContext>(WELCOME_SET_PASSWORD_TRIAL_6M_BYER_PATH);
// 5. Create html that matches the provided type
export const getHtml = ({ type, context }: TemplateType) => {
  switch (type) {
    case EMAIL_TEMPLATE.THANK_YOU:
      return THANK_YOU_TEMPLATE(context as ThankYouContext);
    case EMAIL_TEMPLATE.COMPLETE_SETUP_ACCOUNT:
      return COMPLETE_SETUP_ACCOUNT_TEMPLATE(context as CompleteSignupContext);
    case EMAIL_TEMPLATE.REJECT_REGISTRATION_REQUEST:
      return REJECT_REGISTRATION_REQUEST_TEMPLATE(
        context as RejectRegistrationRequestContext,
      );
    case EMAIL_TEMPLATE.PAYMENT_FAILURE_NOTIFICATION: {
      return PAYMENT_FAILURE_NOTIFICATION_TEMPLATE(
        context as PaymentFailureNotificationContext,
      );
    }
    case EMAIL_TEMPLATE.RESET_PASSWORD: {
      return RESET_PASSWORD_TEMPLATE(context as ResetPasswordContext);
    }
    case EMAIL_TEMPLATE.USER_EDIT_RESET_PASSWORD: {
      return USER_EDIT_RESET_PASSWORD_TEMPLATE(context as ResetPasswordContext);
    }
    case EMAIL_TEMPLATE.SET_PASSWORD: {
      return SET_PASSWORD(context as ResetPasswordContext);
    }
    case EMAIL_TEMPLATE.OPPORTUNITY_INTRESTED: {
      return OPPORTUNITY_INTRESTED(context as opportunityIntrested);
    }
    case EMAIL_TEMPLATE.FORGOT_PASSWORD: {
      return FORGOT_PASSWORD(context as ForgotPasswordContext)
    }
    case EMAIL_TEMPLATE.SUCCESS_FORGOT_PASSWORD: {
      return SUCCESS_FORGOT_PASSWORD(context as ForgotPasswordContext)
    }
    case EMAIL_TEMPLATE.PRIMARY_EMAIL_CHANGED: {
      return PRIMARY_EMAIL_CHANGED(context as ThankYouContext)
    }
    case EMAIL_TEMPLATE.CONTACT_US: {
      return CONTACT_US(context as ContactUsContext)
    }
    case EMAIL_TEMPLATE.SUBSCRIPTION_NOTIFICATION: {
      return SUBSCRIPTION_NOTIFICATION(context as SubscriptionNotificationContext)
    }
    case EMAIL_TEMPLATE.SUBSCRIPTION_CANCELLATION: {
      return SUBSCRIPTION_CANCELLATION(context as SubscriptionNotificationContext)
    }
    case EMAIL_TEMPLATE.PREMIUM_SP: {
      return PREMIUM_SP(context as ThankYouContext)
    }
    case EMAIL_TEMPLATE.PREMIUM_BUYER: {
      return PREMIUM_BUYER(context as ThankYouContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_MONTH_BUYER: {
      return WELCOME_SET_PASSWORD_MONTH_BUYER(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_MONTH_SP: {
      return WELCOME_SET_PASSWORD_MONTH_SP(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_YEAR_SP: {
      return WELCOME_SET_PASSWORD_YEAR_SP(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_YEAR_BUYER: {
      return WELCOME_SET_PASSWORD_YEAR_BUYER(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.PASSWORD_CHANGED_SUCCESS: {
      return PASSWORD_CHANGED_SUCCESS(context as ThankYouContext)
    }
    case EMAIL_TEMPLATE.FOUNDATIONAL_BUYER_COMPLETE: {
      return FOUNDATIONAL_BUYER_COMPLETE(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.FOUNDATIONAL_SP_COMPLETE: {
      return FOUNDATIONAL_SP_COMPLETE(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.SUBSCRIPTION_RENEWED: {
      return SUBSCRIPTION_RENEWED(context as SubscriptionRenewalContext)
    }
    case EMAIL_TEMPLATE.BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION: {
      return BUYER_TRIAL_SUBSCRIPTION_NOTIFICATION(context as SubscriptionNotificationContext)
    }
    case EMAIL_TEMPLATE.SP_TRIAL_SUBSCRIPTION_NOTIFICATION: {
      return SP_TRIAL_SUBSCRIPTION_NOTIFICATION(context as SubscriptionNotificationContext)
    }
    case EMAIL_TEMPLATE.SEND_OTP: {
      return SEND_OTP(context as SendOtpContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_8W_SP: {
      return WELCOME_SET_PASSWORD_TRIAL_8W_SP(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_8W_BYER: {
      return WELCOME_SET_PASSWORD_TRIAL_8W_BYER(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS: {
      return SUBSCRIPTION_CANCELLED_AFTER_ATTEMPTS(context as ThankYouContext)
    }
    case EMAIL_TEMPLATE.SET_COMPANY_USER_PASSWORD: {
      return SET_COMPANY_USER_PASSWORD(context as SetUserPasswordContext)
    }
    case EMAIL_TEMPLATE.COMPANY_USER_REMOVE: {
      return COMPANY_USER_REMOVE(context as SetUserPasswordContext)
    }
    case EMAIL_TEMPLATE.COMPANY_UPDATES_TO_FOLLOWERS: {
      return COMPANY_UPDATES_TO_FOLLOWERS(context as CompanyUpdatesToFollowers)
    }
    case EMAIL_TEMPLATE.SENDING_FOLLOW_MAIL: {
      return SENDING_FOLLOW_MAIL(context as SendingFollowEmail)
    }
    case EMAIL_TEMPLATE.COMPANY_PROFILE_COMPLETION: {
      return COMPANY_PROFILE_COMPLETION(context as SendingFollowEmail)
    }
    case EMAIL_TEMPLATE.BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS: {
      return BUYER_OPPORTUNITY_SERVICES_MATCHES_SPS(context as SendingFollowEmail)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_6M_SP: {
      return WELCOME_SET_PASSWORD_TRIAL_6M_SP(context as ResetPasswordContext)
    }
    case EMAIL_TEMPLATE.WELCOME_SET_PASSWORD_TRIAL_6M_BYER: {
      return WELCOME_SET_PASSWORD_TRIAL_6M_BYER(context as ResetPasswordContext)
    }
    /* add your HandlebarsTemplateDelegate in step 4 here    
        case NEW_TEMPLATE:
          return NEW_TEMPLATE(context)
        */
  }
};
