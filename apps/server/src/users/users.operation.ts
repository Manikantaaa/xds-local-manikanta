import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { UsersService } from "./users.service";
import { StripeService } from "src/services/stripe/stripe.service";
import { UpdatePersonalSettingDto } from "./dtos/update-personal-setting.dto";
import { APPROVAL_STATUS, Users } from "@prisma/client";
import { FirebaseService } from "src/services/firebase/firebase.service";
import { BackupPersonalContactsService } from "./backup-personal-contacts/backup-personal-contacts.service";
import { XdsContext } from "src/common/types/xds-context.type";
import { MailerService } from "src/mailer/mailer.service";
import { getCountryName } from "src/common/methods/common-methods";

@Injectable()
export class UsersOperation {
  constructor(
    private readonly logger: Logger,
    private readonly usersService: UsersService,
    private readonly stripeService: StripeService,
    private readonly backupContactsService: BackupPersonalContactsService,
    private readonly firebaseService: FirebaseService,
    private readonly mailerService: MailerService
  ) {}

  async handleCreatedCustomerStripe(event: Stripe.CustomerCreatedEvent) {
    const customerCreated = event.data.object;
    const email = customerCreated.email;

    const user = await this.usersService.findOneByEmailOrThrow(email as string);

    await this.usersService.updateStripeCustomerIdById(
      user.id as number,
      customerCreated.id,
      APPROVAL_STATUS.completed
    );

    await this.stripeService.updateCustomerMetadata(customerCreated.id, {
      userId: user.id,
    });
  }

  async updatePersonalSetting(
    xdsContext: XdsContext,
    user: Users,
    updatePersonalSettingDto: UpdatePersonalSettingDto,
  ) {
    const updateEmail = await this.usersService.updatePersonalSetting(user.id, {
      firstName: updatePersonalSettingDto.firstName,
      lastName: updatePersonalSettingDto.lastName,
      email: updatePersonalSettingDto.email.trim().toLowerCase(),
      linkedInUrl: updatePersonalSettingDto.linkedInUrl,
    });
    if(updatePersonalSettingDto.companyname && updatePersonalSettingDto.companyname != ""){
      await this.usersService.updateCompanyName(user?.id,updatePersonalSettingDto.companyname);
    }
    
    await this.backupContactsService.upsert(user.id, {
      firstName: updatePersonalSettingDto.backupFirstName,
      lastName: updatePersonalSettingDto.backupLastName,
      email: updatePersonalSettingDto.backupEmail,
    });

    if(user.isPaidUser && user.userType =='paid') {
      await this.stripeService.updateName(
        user.stripeCustomerId as string,
        `${updatePersonalSettingDto.firstName} ${updatePersonalSettingDto.lastName}`,
      );
    }

    if (user.email.trim() !== updatePersonalSettingDto.email.trim().toLowerCase()) {

      // code to send mail when primary email changed
     this.mailerService.primaryEmailChanged({ email: user.email, name: user.firstName});

      this.backupContactsService.saveOldEmail(user?.id,user.email,updatePersonalSettingDto.email)

      this.logger.log("user update primary email", {
        xdsContext,
        newEmail: updatePersonalSettingDto.email,
      });

      if(user.isPaidUser && user.userType == 'paid') {
        await this.stripeService.updateEmail(
          user.stripeCustomerId as string,
          updatePersonalSettingDto.email.trim().toLowerCase(),
        );
      }

      await this.firebaseService.updateEmail(
        user.email,
        updatePersonalSettingDto.email.trim(),
      );
    }
  }

  async updateBillingAddress() {
    return await this.usersService.getSubscribedUsers();
    // for(const user of subscibedUsers) {
    //   if(user.stripeCustomerId && user.stripeCustomerId != "") {
    //     try {
    //       const customerAddress = await this.stripeService.getCustomerAddress(user.stripeCustomerId);
    //       const billingCountryIso = customerAddress.country;
    //       let billingCountry = null;
    //       if(billingCountryIso && billingCountryIso != "") {
    //         billingCountry = getCountryName(billingCountryIso as string);
    //       }
    //       this.usersService.updateCountries(user.id, billingCountry);
    //     } catch(err) {
    //       continue;
    //     }
    //   }
    // }
  }

  async updateCompanyAdminUser( userdata : {firstName: string; LastName: string; email: string}, userId: number, userEmail: string){
    if(userdata.email != userEmail){
      const isEmailExist = await this.usersService.checkEmailExist(userdata.email);
      if(isEmailExist == 0){
        await this.firebaseService.updateEmail(userEmail, userdata.email);
      }
    }
    return await this.usersService.updateCompanyAdminUser(userdata, userId);
  }

  async updateUserDetails(userId: number, postData: {firstName: string, lastName: string, email: string}) {
    const oldmail = await this.usersService.findFirstByUserId(userId);
    postData.email = postData.email.trim().toLowerCase();
    const existingUser = await this.usersService.findOneByEmail(postData.email);
    const existingSubUser = await this.usersService.findSubUserByEmail(postData.email);
    if (existingUser || existingSubUser) {
      const errorMessage = "The email address cannot be used at this time. Please check the address and try again.";
      throw new BadRequestException(errorMessage);
    }
    const res = await this.usersService.updateUserDetails(userId, postData);
    if(res && oldmail) {
      await this.firebaseService.updateEmail(
        oldmail?.email,
        postData.email.trim(),
      );
      if(oldmail.isPaidUser && oldmail.userType == 'paid') {
        await this.stripeService.updateEmail(
          oldmail.stripeCustomerId as string,
          postData.email.trim().toLowerCase(),
        );
      }
    }
    return res;
  }

}
