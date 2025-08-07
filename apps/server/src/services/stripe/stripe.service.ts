import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private stripe;
  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get("XDS_STRIPE_PRIVATE_KEY") as string,
      {
        apiVersion: this.configService.get("XDS_STRIPE_API_VERSION"),
      },
    );
  }

  public constructEventFromPayload(
    signature: string,
    payload: Buffer,
    endpointSecret: string,
  ) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCustomerMetadata(customerId: string, updatedData: any) {
    return this.stripe.customers.update(customerId, { metadata: updatedData });
  }

  updateEmail(customerId: string, email: string) {
    return this.stripe.customers.update(customerId, { email });
  }

  updateName(customerId: string, name: string) {
    return this.stripe.customers.update(customerId, { name });
  }

  getProducts() {
    return this.stripe.prices.list();
  }

  getSubscriptionDetails(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  cancelSubscription(subscriptionId: string) {
    try {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      throw new BadRequestException();
    }
  }

  // getCheckoutForm(poductId: string, userEmail: string, token: string) {
  //   const frontendUrl = this.configService.get(
  //     "XDS_FRONTEND_BASE_URL",
  //   ) as string;
  //   let successUrl = `${frontendUrl}/billing-finish`;
  //   let cancelsUrl = `${frontendUrl}/billing-payment`;
  //   if (token && token != "") {
  //     successUrl = `${frontendUrl}/password?token=${token}`;
  //     cancelsUrl = `${frontendUrl}/password?token=${token}`;
  //   }
  //   const taxId = this.configService.get("XDS_STRIPE_TAX_KEY") as string;
  //   return this.stripe.checkout.sessions.create({
  //     mode: "subscription",
  //     customer_email: userEmail,
  //     line_items: [{ price: poductId, quantity: 1 }],
  //     // line_items: [{ price: poductId, quantity: 1, tax_rates: [taxId] }],
  //     automatic_tax: { enabled: true },
  //     success_url: successUrl,
  //     cancel_url: cancelsUrl,
  //   });
  // }

  getCheckoutForm(poductId: string, userEmail: string, token: string) {
    let isEnableTax = true;
    const envValOfTaxEnabling = process.env.XDS_STRIPE_ENABLE_TAX;
    if(envValOfTaxEnabling && envValOfTaxEnabling == "0") {
      isEnableTax = false;
    }
    const frontendUrl = this.configService.get(
      "XDS_FRONTEND_BASE_URL",
    ) as string;
    let successUrl = `${frontendUrl}/billing-finish`;
    let cancelsUrl = `${frontendUrl}/billing-payment`;
    if (token && token != "") {
      successUrl = `${frontendUrl}/password?token=${token}`;
      cancelsUrl = `${frontendUrl}/password?token=${token}`;
    }
    const taxId = this.configService.get("XDS_STRIPE_TAX_KEY") as string;
    return this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      line_items: [{ price: poductId, quantity: 1 }],
      phone_number_collection: {
        enabled: true
      },
      tax_id_collection: {
        enabled: true
      },
      allow_promotion_codes: true,  // This enables the coupon input field
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelsUrl,
      automatic_tax: { 
        enabled: isEnableTax 
      },
      // line_items: [{ price: poductId, quantity: 1, tax_rates: [taxId] }],
      // custom_fields: [
      //   {
      //     key: 'engraving',
      //     label: {
      //       type: 'custom',
      //       custom: 'Personalized engraving',
      //     },
      //     type: 'text',
      //     optional: true,
      //   }
      // ],
    });
  }

  // stripe.subscriptions.update(
  //   'sub_example_subscription_id',
  //   {
  //     items: [{
  //       id: 'si_example_subscription_item_id',
  //       price: 'price_example_yearly_price_id', // New yearly price ID
  //     }],
  //   },
  // );

  async getFailedCharges() {
    const failedCharges = await this.stripe.charges.list({
      // created: {
      //   gte: 1721788800
      // }

    });
    return failedCharges.data;
  }

  async getFailureReason(chargeId: string) {
    const failureDetails = await this.stripe.charges.retrieve(chargeId);
    return failureDetails;
  }

  async getCustomerAddress(stripeCustomerId: string) {
    const theCustomer: any = await this.stripe.customers.retrieve(stripeCustomerId);
    const address = theCustomer.address;
    return address;
  }


  // async getSingleProductCheckoutPage() {
  //   return this.stripe.checkout.sessions.create({
  //     mode: "payment", // Set mode to "payment" for one-time payments
  //     customer_email: "kajay@aapthitech.com",
  //     line_items: [
  //       {
  //         price_data: {
  //           currency: "usd", // Set the currency
  //           product_data: {
  //             name: "Test Product", // Name of the product being purchased
  //           },
  //           unit_amount: 20000, // Amount in cents (2000 cents = $20.00)
  //         },
  //         quantity: 1,
  //       },
  //     ],
  //     success_url: "http://localhost:3000/home",
  //     cancel_url: "http://localhost:3000/home",
  //   });
  // }

  // async getPurchasedProductDetails() {
  //   const lineItems = await this.stripe.checkout.sessions.listLineItems("cs_test_a1kfkjYUFVTByLkFnbzlyu21YzAIuFgkB3XoEYxlMQr2J6GxzBXx65ed5j", { limit: 1 });
  //   return lineItems;
  // }

  // async updateSubscription() {
  //   const updatedSubscription = await this.stripe.subscriptions.update("sub_1Q0hCQG2uA9Z5F54LJia9aF8", {
  //     cancel_at_period_end: false, // Remove the scheduled cancellation
  //   });
  // }

}
