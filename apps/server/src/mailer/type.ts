export type CompleteSetupAccountProps = {
  email: string;
  name: string;
  generatedToken?: string;
};

export type PaymentFailureProps = {
  email: string;
  name: string;
  invoiceId: string;
  invoiceAmount: number;
  stripeCustomerPortalLink: string;
};

export type SubscriptionNotificationProps = {
  email: string;
  name: string;
  date: Date;
  userType?: string;
};
