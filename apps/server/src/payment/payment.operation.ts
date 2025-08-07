import { Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import Stripe from "stripe";
import { PaymentService } from "./payment.service";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "src/mailer/mailer.service";
import { StripeService } from "src/services/stripe/stripe.service";
import { ROLE_CODE } from "@prisma/client";
import { getCountryName } from "src/common/methods/common-methods";
@Injectable()
export class PaymentOperation {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly stripeService: StripeService,
  ) {}

  async handleSuccessfulPayment(event: Stripe.InvoicePaidEvent) {
    const invoicePaid = event.data.object;
    const customerEmail = invoicePaid.customer_email;
    const stripeSubscriptionId = invoicePaid.subscription;
    const subscriptionDetails = await this.stripeService.getSubscriptionDetails(
      invoicePaid.subscription as string,
    );
    const periodEnd = subscriptionDetails.current_period_end;
    const expirationDate =
      this.paymentService.calculateAccessExpirationDate(periodEnd);

    const user = await this.usersService.findOneByEmailOrThrow(
      customerEmail as string,
    );

    await this.usersService.updateAccessExpirationDate(
      user.id as number,
      stripeSubscriptionId as string,
      expirationDate,
      true,
    );
    

  }

  async handleFailedPayment(event: Stripe.InvoicePaymentFailedEvent) {
    const invoice = event.data.object;
    // const invoiceId = invoice.id;
    // const invoiceAmount = invoice.amount_due;
    // const customerName = invoice.customer_name;
    // const customerPortalLink = `${this.configService.get("XDS_FRONTEND_BASE_URL")}`;
    
    const customerEmail = invoice.customer_email;
    const user = await this.usersService.findOneByEmailOrThrow(
      customerEmail as string,
    );
    if (invoice.billing_reason === 'subscription_create') {
      // Handle first payment failure
      // await this.mailerService.sendPaymentFailureNotification({
      //   email: customerEmail as string,
      //   name: customerName as string,
      //   invoiceId,
      //   invoiceAmount,
      //   stripeCustomerPortalLink: customerPortalLink,
      // });
    } else if (invoice.billing_reason === 'subscription_cycle') {
      // Handle renewal payment failure
      await this.usersService.paymentFailed(user.id, invoice.charge);
    }
    
  }

  async handleCancelSubscription(
    event: Stripe.SubscriptionScheduleCanceledEvent,
  ) {
    const theSubscriptionDetails = event.data.object;
    const customerId = theSubscriptionDetails.customer;
    if (
      theSubscriptionDetails.canceled_at &&
      theSubscriptionDetails.status == "canceled"
    ) {
      await this.usersService.makeTheUserUnPaid(customerId as string);
    }
  }

  async handlePaymentSucceded(event: Stripe.InvoicePaymentSucceededEvent) {
    const invoicePaid = event.data.object;
    if(invoicePaid.status == 'paid') {
      const customerEmail = invoicePaid.customer_email;
      const stripeSubscriptionId = invoicePaid.subscription;
      const subscriptionDetails = await this.stripeService.getSubscriptionDetails(
        stripeSubscriptionId as string,
      );
      const periodEnd = subscriptionDetails.current_period_end;
      const expirationDate = this.paymentService.calculateAccessExpirationDate(periodEnd);
      const user = await this.usersService.findOneByEmailOrThrow(
        customerEmail as string,
      );

      let message: string = "";
      let isRenewed: boolean = false;
      let amount: number = 0;

      if(invoicePaid.billing_reason == "subscription_create") {
        // new subscription
        message = "New subscription created";
      } else if(invoicePaid.billing_reason == 'subscription_cycle') {
        // subscription renewed
        message = "Subscription Renewed";
        isRenewed = true;
      } else if(invoicePaid.billing_reason =="subscription_update") {
        // subscription updated
        message = "Subscription updated";
      }

      // amount = subscriptionDetails.items.data[0]?.plan.amount || 0;
      amount = invoicePaid.amount_paid || 0;
      amount = amount / 100;

      const billingCountryIso = invoicePaid.customer_address?.country;
      let billingCountry = null;
      if(billingCountryIso && billingCountryIso != "") {
        billingCountry = getCountryName(billingCountryIso as string);
      }

      let isCouponApplied = false;
      if(invoicePaid.discount && invoicePaid.discount.coupon && invoicePaid.discount.coupon.id && invoicePaid.discount.coupon.percent_off) {
        isCouponApplied = true;
      }
      
      await this.usersService.addBillingDetail(
        user.id as number,
        invoicePaid.customer as string,
        stripeSubscriptionId as string,
        subscriptionDetails.items.data[0].plan.interval,
        expirationDate,
        subscriptionDetails.items.data[0].plan.active ? true : false,
        message,
        amount,
        isRenewed,
        invoicePaid.billing_reason ? invoicePaid.billing_reason :'',
        billingCountry.name,
        billingCountry.region,
        isCouponApplied
      );

      let stripeDownloadUrl = "";
      if(invoicePaid.hosted_invoice_url && invoicePaid.hosted_invoice_url != "") {
        stripeDownloadUrl = invoicePaid.hosted_invoice_url as string
      }

      if(invoicePaid.billing_reason == "subscription_create") {
        if(user && user.userRoles[0]?.roleCode) {
          this.mailerService.subscriptionSuccessMail({
            email: user.email as string,
            name: user.firstName as string,
            type: user.userRoles[0].roleCode,
            stripeDownloadUrl: stripeDownloadUrl
          });
        }
      } else if(invoicePaid.billing_reason == 'subscription_cycle') {
        if(user) {
          this.mailerService.subscriptionRenewedMail({
            email: user.email as string,
            name: user.firstName as string,
            stripeDownloadUrl: stripeDownloadUrl
          });
        }
      }
    }
  }

  async handleSubscriptionUpdates(event: Stripe.Event) {
    const currentData = event.data.object as Stripe.Subscription;
    const prevData = event.data.previous_attributes as Stripe.Subscription;
    const customerId = currentData.customer;
    if(customerId) {
      if(prevData.cancel_at_period_end && currentData.status == 'active' && !currentData.cancel_at_period_end) {
        await this.usersService.updateCancellationStatus(customerId as string);
      }
      if(currentData.status == 'active' && currentData.cancel_at_period_end) {
        await this.usersService.updateSubscriptionToCancelled(customerId as string);
        if(currentData.cancellation_details && (currentData.cancellation_details.feedback || currentData.cancellation_details.comment)){
          await this.usersService.updateSubscriptionToCancelled(customerId as string, currentData.cancellation_details.feedback, currentData.cancellation_details.comment);
        }
      }
    }
  }

  async testMailSend(name: string = "Ajay") {
    return await this.mailerService.setNewPassword({email: "kajay@aapthitech.com", password: "123", name: name, userRole: 'buyer'}, "trialUser6months");
  }

  // async handleSinglePayment(event: Stripe.Event) {
  //   const session = event.data.object as Stripe.Checkout.Session;
  //   const itemDetails = this.stripeService.getPurchasedProductDetails();
  //   console.log("session checkout");
  //   console.log(session);
  // }

  // async updateSubscription() {
  //   return await this.stripeService.updateSubscription();
  // }

  async handleCustomerUpdate(event: Stripe.Event) {
    const updatedData = event.data.object as Stripe.Customer;
    const prevData = event.data.previous_attributes as Partial<Stripe.Customer>;
    console.log("updatedData");
    console.log(updatedData);
    console.log("/n/n");
    console.log("prevData");
    console.log(prevData);
  }

}
