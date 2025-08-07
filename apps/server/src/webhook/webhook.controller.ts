import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Public } from "src/common/decorators/public.decorator";
import { PaymentOperation } from "src/payment/payment.operation";
import { StripeService } from "src/services/stripe/stripe.service";
import { STRIPE_EVENT } from "src/common/constants/stripe-event.constant";
import { UsersOperation } from "src/users/users.operation";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeController } from "@nestjs/swagger";
import { Response } from "express";
import { Prisma } from "@prisma/client";

@ApiBearerAuth()
@ApiTags("webhook")
@ApiExcludeController()
@Controller("webhook")
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly paymentOps: PaymentOperation,
    private readonly usersOps: UsersOperation,
  ) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: "Receive Stripe events",
  })
  async handleEvents(
    @Headers("stripe-signature") signature: string,
    @Req() request: { rawBody: Buffer } & Request,
    @Res() res: Response
  ) {
    try{
    const endpointSecret = this.configService.get("XDS_STRIPE_WEBHOOK_SECRET");
    if (!request.rawBody) {
      throw new BadRequestException("Missing raw body in the request");
    }

    try {
      let event;

      if (endpointSecret) {
        // If endpoint secret is available, verify the event
        event = await this.stripeService.constructEventFromPayload(
          signature,
          request.rawBody,
          endpointSecret,
        );
      } else {
        // If no endpoint secret, deserialize the event using JSON.parse
        const eventData = JSON.parse(request.rawBody.toString());
        event = eventData;
      }
      if (event) {
        res.status(200).send();
        switch (event.type) {
          case STRIPE_EVENT.customer.created: {
            await this.usersOps.handleCreatedCustomerStripe(event);
            break;
          }
          case STRIPE_EVENT.invoice.paid: {
            await this.paymentOps.handleSuccessfulPayment(event);
            break;
          }
          case STRIPE_EVENT.invoice.payment_failed: {
            await this.paymentOps.handleFailedPayment(event);
            break;
          }
          case STRIPE_EVENT.customer.subscription.updated: {
            await this.paymentOps.handleSubscriptionUpdates(event);
            break;
          }
          case STRIPE_EVENT.invoice.payment_succeeded: {
            await this.paymentOps.handlePaymentSucceded(event);
            break;
          }
          case STRIPE_EVENT.customer.subscription.deleted: {
            await this.paymentOps.handleCancelSubscription(event);
            break;
          }
          // case STRIPE_EVENT.checkout.session.completed: {
          //   await this.paymentOps.handleSinglePayment(event);
          //   break;
          // }
          // case STRIPE_EVENT.customer.updated: {
          //   await this.paymentOps.handleCustomerUpdate(event);
          //   break;
          // }
          default: {
            console.log(`Unhandled event type ${event.type}.`);
          }
        }
      }

      return;
    } catch (error) {
      console.error("Error processing webhook event:", error);
      throw new BadRequestException("Error processing webhook event");
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
  @Get()
  async runTheMailMessage() {
    try {
      await this.paymentOps.testMailSend();
      return "success";
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
  @Get("update-billing-address")
  async updateTheAddressOfUsers() {
    try{
      await this.usersOps.updateBillingAddress();
    return "success";
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

  // @Public()
  // @Get("update-subscription")
  // async updateSubscription() {
  //   try {
  //     await this.paymentOps.updateSubscription();
  //     return "success";
  //   } catch(err) {
  //     console.log(err);
  //   }
  // }

}
