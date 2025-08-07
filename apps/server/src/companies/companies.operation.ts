import { Injectable } from "@nestjs/common";
import { XdsContext } from "src/common/types/xds-context.type";
import { UpdatedGeneralInfoPayload } from "./types";
import { CompaniesService } from "./companies.service";
import { AssetsService } from "src/assets/assets.service";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { MailerService } from "src/mailer/mailer.service";

@Injectable()
export class CompaniesOperation {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly assetsService: AssetsService,
    private readonly gscService: GoogleCloudStorageService,
    private readonly mailerService: MailerService
  ) { }

  async updateCompanyGeneralInfo(
    xdsContext: XdsContext,
    { userId, isPaidUser, company, updatedGeneralInfo }: UpdatedGeneralInfoPayload,
  ) {
    const slugData = await this.companiesService.updateGeneralInfoText(xdsContext, isPaidUser, {
      companyId: company.id,
      name: updatedGeneralInfo.name as string,
      website: updatedGeneralInfo.website as string,
      shortDescription: updatedGeneralInfo.shortDescription as string,
      companySize: +updatedGeneralInfo.companySize,
      oldName: company.name,
      oldSlug: company.slug,
    });

    if (company.logoAssetId) {
      // delete old logo and update a new one
      const logo = await this.assetsService.findById(company.logoAssetId);

      if (logo?.url && logo?.url !== updatedGeneralInfo.logoUrl) {
        // deleting from s3 bucket
        if (updatedGeneralInfo.deletedLogo && updatedGeneralInfo.uniqueFormId) {
          await this.companiesService.deleteTempFiles(updatedGeneralInfo.deletedLogo, updatedGeneralInfo.uniqueFormId, 'AddDeletedFiles');
        }
        // await this.gscService.removeFile(logo.url);
        await this.assetsService.updateUrl(
          logo.id,
          updatedGeneralInfo.logoUrl as string,
        );
      }
    } else {
      // create a new logo
      await this.companiesService.createLogo(
        userId,
        company.id,
        updatedGeneralInfo.logoUrl,
      );
    }
    // if(isPaidUser){
    if (updatedGeneralInfo.bannerUrl == "") {
      await this.companiesService.updateProfileStatus(company.id, false);
    }
    if (company.bannerAssetId) {
      const banner = await this.assetsService.findById(company.bannerAssetId);

      if (banner?.url && banner?.url !== updatedGeneralInfo.bannerUrl) {
        // deleting from s3 bucket 
        if (updatedGeneralInfo.deletedBanner && updatedGeneralInfo.uniqueFormId) {
          await this.companiesService.deleteTempFiles(updatedGeneralInfo.deletedBanner, updatedGeneralInfo.uniqueFormId, 'AddDeletedFiles');
        }
        // delete old banner and update a new one
        // await this.gscService.removeFile(banner?.url);
        if (updatedGeneralInfo.bannerUrl) {
          await this.assetsService.updateUrl(
            banner?.id,
            updatedGeneralInfo.bannerUrl as string,
          );
          if (company.aboutProfilePerc == 0 || company.certificationsProfilePerc == 0 || company.contactsProfilePerc == 0 || company.generalInfoProfilePerc == 0 || company.ourWorkAlbumsProfilePerc == 0 || company.ourWorkProjectProfilePerc == 0 || company.servicesProfilePerc == 0) {
            await this.companiesService.updateProfileStatus(company.id, false);
          } else {
            await this.companiesService.updateProfileStatus(company.id);
          }
        } else {
          // delete old banner
          await this.assetsService.deleteByAssetId(banner?.id);
        }
      }
    } else if (updatedGeneralInfo.bannerUrl) {
      // create a new banner
      await this.companiesService.createBanner(
        userId,
        company.id,
        updatedGeneralInfo.bannerUrl,
      );
      if (company.aboutProfilePerc == 0 || company.certificationsProfilePerc == 0 || company.contactsProfilePerc == 0 || company.generalInfoProfilePerc == 0 || company.ourWorkAlbumsProfilePerc == 0 || company.ourWorkProjectProfilePerc == 0 || company.servicesProfilePerc == 0) {
        await this.companiesService.updateProfileStatus(company.id, false);
      } else {
        await this.companiesService.updateProfileStatus(company.id);
      }
    }
    return slugData.slug;
    // }
  }

  async sentFollowMail(email: string, firstName: string, companyName: string) {
   await this.mailerService.sentFollowMail(email, firstName, companyName);
  }
}
