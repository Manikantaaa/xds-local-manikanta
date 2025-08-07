import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from "@nestjs/common";
import { CompaniesRepository } from "./companies.repository";
import {
  CertificateAndDiligence,
  CompanyAddresses,
  Contacts,
  Project,
  UpdatedGeneralInfoText,
  CompanyPlatforms,
  GameEngines,
} from "./types";
import { XdsContext } from "src/common/types/xds-context.type";
import { $Enums, ASSET_TYPE } from "@prisma/client";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { ExcelUsers } from "src/common/types/common-interface";
import { UsersService } from "src/users/users.service";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { ServiceprovidersService } from "src/serviceproviders/serviceproviders.service";
import { ServiceProvidersRepository } from "src/serviceproviders/serviceproviders.repository";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { portfolioAlbumDto } from "./dtos/portfolio-album-dto";
import admin from "firebase-admin";
import { CompaniesOperation } from "./companies.operation";
import { MailerService } from "src/mailer/mailer.service";
import { toLocalISOString } from "src/common/methods/common-methods";


interface ContactWithUrl extends Contacts {
  fullprofileUrl: string;
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly logger: Logger,
    private readonly companiesRepo: CompaniesRepository,
    private readonly userService: UsersService,
    private readonly serviceProviderService: ServiceprovidersService,
    private readonly serviceProviderRepo: ServiceProvidersRepository,
    private readonly gcsService: GoogleCloudStorageService,
    private readonly mailerService: MailerService
  ) { }

  async findFirstByUserIdOrThrow(xdsContext: XdsContext, userId: number) {
    const company = await this.companiesRepo.findFirst({ userId });

    if (!company) {
      this.logger.error("company not found", {
        xdsContext,
        userId,
      });
      throw new BadRequestException(`Company not found`);
    }
    return company;
  }

  async updateProfileStatus(companyId: number, status = true) {
    return await this.companiesRepo.updateProfileStatus(companyId, status);
  }

  async updateGeneralInfoText(
    xdsContext: XdsContext,
    isPaidUser: boolean,
    {
      companyId,
      name,
      website,
      shortDescription,
      companySize,
      oldName,
      oldSlug,
    }: UpdatedGeneralInfoText,
  ) {
    let slug = undefined;
    if (name != oldName) {
      slug = await this.companiesRepo.checkSlugExistAndUpdate(name);
      if (oldSlug) {
        await this.companiesRepo.insertOldSlug(companyId, oldSlug);
      }
    }
    let updateData: {
      name: string;
      website: string;
      companySize: number;
      shortDescription?: string;
      generalInfoProfilePerc?: number;
      slug?: string;
    } = {
      name,
      website,
      companySize,
      generalInfoProfilePerc: 20,
      ...(slug && { slug }),
    }
    // if (isPaidUser) {
      updateData.shortDescription = shortDescription;
    // }
    const res = this.companiesRepo.update(companyId, updateData);
    return res;
  }

  createLogo(userId: number, companyId: number, logoUrl: string) {
    return this.companiesRepo.update(companyId, {
      logoAsset: {
        create: {
          userId,
          assetType: ASSET_TYPE.image,
          url: logoUrl,
        },
      },
    });
  }

  createBanner(userId: number, companyId: number, bannerUrl: string) {
    return this.companiesRepo.update(companyId, {
      bannerAsset: {
        create: {
          userId,
          assetType: ASSET_TYPE.image,
          url: bannerUrl,
        },
      },
    });
  }

  async findFirstByUserId(userId: number) {
    const company = await this.companiesRepo.findFirst({ userId });
    return company;
  }

  // async findAll() {
  //   const companies = await this.companiesRepo.findAll();
  //   return companies;
  // }

  async findCompanies(searchVal: string) {
    const companies = await this.companiesRepo.findUsers(searchVal);
    return companies;
  }

  async findCompaniesByEmail(email: string) {
    const companies = await this.companiesRepo.findCompaniesByEmail(email);
    return companies;
  }

  // async getCompaniesCount(searchVal: string) {
  //   const companies = await this.companiesRepo.getCompaniesCount(searchVal);
  //   return companies;
  // }

  async findCompanyById(id: number) {
    const company = await this.companiesRepo.findById(id);
    return company;
  }

  async findSingleCompanyById(id: number) {
    const company = await this.companiesRepo.findSingleCompanyById(id);
    return company;
  }

  async getCompanyAboutById(id: number) {
    const company = await this.companiesRepo.getCompanyAboutById(id);
    return company;
  }

  async findCompanyProfileStatus(id: number) {
    const company = await this.companiesRepo.findCompanyProfileStatus(id);
    return company;
  }

  async uploadRateCard(ratecardPath: string, userId: number, companyId: number, fileName: string, tokenDate: string) {
    const company = await this.serviceProviderRepo.uploadRateCard(ratecardPath, userId, companyId, fileName, tokenDate);
    return company;
  }

  async setCompanyArchieveStatus(id: number, status: number) {
    const companyDetails = await this.companiesRepo.findById(id);
    if (companyDetails) {
      if (status == 1) {
        const company = await this.userService.updateIsArchieveToTrue(companyDetails.user?.id);
        return company;
      } else {
        const company = await this.userService.updateIsArchieveToFalse(companyDetails.user?.id);
        return company;
      }
    } else {
      throw new BadRequestException("company not found")
    }
  }

  async deleteCompany(id: number) {
    const theCompanyDetails = await this.companiesRepo.findById(id);
    if (theCompanyDetails) {
      return await this.userService.deleteUser(theCompanyDetails.user?.id);
    } else {
      throw new BadRequestException("company not found");
    }

  }

  async getTopViewedProfiles() {
    const topViewedProfiles = await this.companiesRepo.getTopViewedProfiles();
    return topViewedProfiles;
  }

  async getMostActiveBuyers() {
    return await this.companiesRepo.getMostActiveBuyers();
  }

  async getserviceProviderCompanies() {
    return await this.companiesRepo.getserviceProviderCompanies();
  }

  async getTopViewedSponsersProfiles() {
    return await this.companiesRepo.getTopViewedSponsersProfiles();
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async parseCsvBuffer(fileBuffer: Buffer, type: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const results: any[] = [];
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null); // Signal the end of the stream

      // Parse CSV from the readable stream
      bufferStream
        .pipe(csvParser())
        .on("data", (data) => {
          if (type === "removespacs") {
            if (Object.keys(data).length !== 0) {
              const modifiedData: string[] = [];
              for (const key in data) {
                if (data.hasOwnProperty(key)) {
                  const modifiedKey: any = key.replace(/\s+/g, ''); // Remove spaces from the key
                  modifiedData[modifiedKey] = data[key];
                }
              }
              results.push(modifiedData);
            }
          } else {
            if (Object.keys(data).length !== 0) {
              results.push(data);
            }
          }

        })
        .on("end", () => {
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  async createSingleCompany(postData: any) {

    const allUsersFromCsv: ExcelUsers[] = [];
    const emailsArray: string[] = [];
    const theUser: ExcelUsers = {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      companyWebUrl: "",
      linkedInUrl: "",
      role: "buyer",
      companyDescription: "",
      companySize: null,
      services: [],
    };
    let isError = false;
    theUser.firstName = postData.firstName;
    theUser.lastName = postData.lastName;
    theUser.linkedInUrl = postData.linkedInUrl;
    let theMail: string = postData.email;
    theMail = theMail.trim();
    theMail = theMail.replace(/\s/g, '');
    theUser.email = theMail.toLowerCase();
    if (!emailsArray.includes(theMail)) {
      emailsArray.push(theMail);
    }
    if (allUsersFromCsv.length > 0) {
      allUsersFromCsv.forEach((element) => {
        if (theMail == element.email) {
          isError = true;
          throw new BadRequestException("Duplicated Companies");
        }
      });
    }
    theUser.companyName = postData.companyName;
    theUser.companyWebUrl = postData.companyWebUrl;
    // check the provided company size exist in our DB
    const companySize = postData.companySize;
    if (companySize != null && companySize != 'NA') {
      const checkCompanySize =
        await this.serviceProviderService.findCompanyBySize(
          companySize.trim(),
        );
      if (checkCompanySize.list?.id) {
        theUser.companySize = checkCompanySize.list.id;
      } else {
        throw new BadRequestException(
          "Some of the company did not provided company size correct",
        );
      }
    }
    theUser.companyDescription = postData.companyDescription;
    let services = postData.services;
    const serviceIds: number[] = [];
    if (services == 'NA') {
      theUser.services = [];
    } else {
      if (services.length > 3) {
        throw new BadRequestException(
          "Some of the company given more than 3 services",
        );
      }
      for (const service of services) {
        const getServiceDetails =
          await this.serviceProviderService.findServiceByName(
            service.trim(),
          );
        if (getServiceDetails && getServiceDetails.list?.id) {
          serviceIds.push(getServiceDetails.list.id);
        } else {
          throw new BadRequestException(
            "Some of the company did not provided company services correct",
          );
        }
      }
      theUser.services = serviceIds;

    }
    let formattedRole: string = postData.role.replace(/\s/g, "");
    formattedRole = formattedRole.replace(/_/g, "");
    formattedRole = formattedRole.toLowerCase();
    if (formattedRole == "admin") {
      theUser.role = "admin";
    } else if (formattedRole == "serviceprovider") {
      theUser.role = "service_provider";
    } else if (formattedRole == "buyer") {
      theUser.role = "buyer";
    } else {
      throw new BadRequestException(
        "Role of some user in not provided as required",
      );
    }
    if (isError) {
      throw new BadRequestException("The File is not in correct format");
    } else {
      allUsersFromCsv.push(theUser);
    }

    if (allUsersFromCsv.length > 0) {
      if (emailsArray.length > 0) {
        const matchedUsers = await this.companiesRepo.findAllUsersByMail(emailsArray);
        const matchedSubUsers = await this.companiesRepo.findAllSubUsersByMail(emailsArray);
        if (matchedUsers.length > 0 || matchedSubUsers.length > 0) {
          throw new BadRequestException("The email address cannot be used at this time. Please check the address and try again.");
        } else {
          try {
            for (const user of allUsersFromCsv) {
              await this.userService.createCompanyFromExcel(user);
            }
            return {
              status: 'success',
            };
          } catch (err) {
            throw new BadRequestException("Error in importing csv data");
          }
        }
      }
    } else {
      throw new BadRequestException("There are no records to insert");
    }
  }



  async importCsvData(excelData: any[]) {
    const keysToCheck: string[] = [
      "First Name",
      "Last Name",
      "Linkedin Profile",
      "Company Email",
      "Company Name",
      "Company Website",
      "Company Size",
      "Company Description",
      "Services",
      "Role"
    ];
    const allUsersFromCsv: ExcelUsers[] = [];
    const emailsArray: string[] = [];
    for (const item of excelData) {
      const allKeysExist = keysToCheck.every(async (key) =>
        Object.prototype.hasOwnProperty.call(item, key),
      );
      if (allKeysExist) {
        const theUser: ExcelUsers = {
          firstName: "",
          lastName: "",
          email: "",
          companyName: "",
          companyWebUrl: "",
          linkedInUrl: "",
          role: "buyer",
          companyDescription: "",
          companySize: null,
          services: [],
        };
        let isError = false;
        for (const key of Object.keys(item)) {
          if (keysToCheck.includes(key)) {
            if (!item[key] || item[key] == "") {
              isError = true;
              throw new BadRequestException(
                "The File is not in correct format, some of the Fields are not provided",
              );
            } else {
              if (key == "First Name") {
                theUser.firstName = item[key];
              } else if (key == "Last Name") {
                theUser.lastName = item[key];
              } else if (key == "Linkedin Profile") {
                theUser.linkedInUrl = item[key];
              } else if (key == "Company Email") {
                let theMail: string = item[key];
                theMail = theMail.trim();
                theMail = theMail.replace(/\s/g, '');
                theUser.email = theMail.toLowerCase();
                if (!emailsArray.includes(theMail)) {
                  emailsArray.push(theMail);
                }
                if (allUsersFromCsv.length > 0) {
                  allUsersFromCsv.forEach((element) => {
                    if (theMail == element.email) {
                      isError = true;
                      throw new BadRequestException("Duplicated Companies");
                    }
                  });
                }
              } else if (key == "Company Name") {
                theUser.companyName = item[key];
              } else if (key == "Company Website") {
                theUser.companyWebUrl = item[key];
              } else if (key == "Company Size") {
                // check the provided company size exist in our DB
                if (item[key] == "NA") {
                  theUser.companySize = null;
                } else {
                  const companySize: string = item[key];
                  const checkCompanySize =
                    await this.serviceProviderService.findCompanyBySize(
                      companySize.trim(),
                    );
                  if (checkCompanySize.list?.id) {
                    theUser.companySize = checkCompanySize.list.id;
                  } else {
                    throw new BadRequestException(
                      "Some of the company did not provided company size correct",
                    );
                  }
                }
              } else if (key == "Company Description") {
                theUser.companyDescription = item[key];
              } else if (key == "Services") {
                let services = item[key];
                const serviceIds: number[] = [];
                if (services == 'NA') {
                  theUser.services = [];
                } else {
                  if (services.includes(",")) {
                    services = services.split(",");
                    if (services.length > 3) {
                      throw new BadRequestException(
                        "Some of the company given more than 3 services",
                      );
                    }
                    for (const service of services) {
                      const getServiceDetails =
                        await this.serviceProviderService.findServiceByName(
                          service.trim(),
                        );
                      if (getServiceDetails && getServiceDetails.list?.id) {
                        serviceIds.push(getServiceDetails.list.id);
                      } else {
                        throw new BadRequestException(
                          "Some of the company did not provided company services correct",
                        );
                      }
                    }
                    theUser.services = serviceIds;
                  } else {
                    const getServiceDetails =
                      await this.serviceProviderService.findServiceByName(
                        services,
                      );
                    if (getServiceDetails && getServiceDetails.list?.id) {
                      serviceIds.push(getServiceDetails.list.id);
                      theUser.services = serviceIds;
                    } else {
                      throw new BadRequestException(
                        "Some of the company did not provided company services correct",
                      );
                    }
                  }
                }
              } else if (key == "Role") {
                let formattedRole: string = item[key].replace(/\s/g, "");
                formattedRole = formattedRole.replace(/_/g, "");
                formattedRole = formattedRole.toLowerCase();
                if (formattedRole == "admin") {
                  theUser.role = "admin";
                } else if (formattedRole == "serviceprovider") {
                  theUser.role = "service_provider";
                } else if (formattedRole == "buyer") {
                  theUser.role = "buyer";
                } else {
                  throw new BadRequestException(
                    "Role of some user in not provided as required",
                  );
                }
              }
            }
          }
        }

        if (isError) {
          throw new BadRequestException("The File is not in correct format");
        } else {
          allUsersFromCsv.push(theUser);
        }
      } else {
        throw new BadRequestException("The File is not in correct format");
      }
    }
    if (allUsersFromCsv.length > 0) {
      if (emailsArray.length > 0) {
        const matchedUsers = await this.companiesRepo.findAllUsersByMail(emailsArray);
        const matchedSubUsers = await this.companiesRepo.findAllSubUsersByMail(emailsArray);
        if (matchedUsers.length > 0 || matchedSubUsers.length > 0) {
          throw new BadRequestException("Company email already exists in the system");
        } else {
          try {
            for (const user of allUsersFromCsv) {
              await this.userService.createCompanyFromExcel(user);
            }
            return allUsersFromCsv.length;
          } catch (err) {
            throw new BadRequestException("Error in importing csv data");
          }
        }
      }
    } else {
      throw new BadRequestException("There are no records to insert");
    }
  }

  async findCompaniesBySearch(searchString: string) {
    return this.companiesRepo.findCompaniesBySearch(searchString);
  }

  async setFoundingSponcers(
    id: number,
    val: number,
  ): Promise<CustomResponse<string>> {
    if (val == 1) {
      const countOfFoundingSponcers: number =
        await this.companiesRepo.getCountOfFoundingSponcers();
      if (countOfFoundingSponcers > 6) {
        return new CustomResponse(
          HttpStatus.BAD_REQUEST,
          false,
          "limit_exceeded",
        );
      } else {
        await this.companiesRepo.update(id, { isFoundingSponcer: true });
        return new CustomResponse(HttpStatus.OK, false, "updated");
      }
    } else if (val == 0) {
      await this.companiesRepo.update(id, { isFoundingSponcer: false });
      return new CustomResponse(HttpStatus.OK, true, "updated");
    } else {
      throw new BadRequestException();
    }
  }

  async updateFileUrls(
    fileUrls: { type: ASSET_TYPE; fileUrl: string; active: boolean }[],
    id: number,
  ) {
    try {
      // delete the urls before insert/in case of update
      await this.companiesRepo.deletePreviousFiles(id, 1);
      const formattedFiles = fileUrls.map((item) => {
        const fileType: ASSET_TYPE = item.type;
        return {
          companyId: id,
          type: fileType,
          fileUrl: item.fileUrl,
          idSelect: item.active,
        };
      });
      return await this.companiesRepo.addCompanyFileUrls(formattedFiles);
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async updateSLogoUrls(
    params: { indexValues: { companyWebsiteUrl: string; signedUrl: string; filename: string; indexId: string, selectedFile: boolean }[], uniqueFormId: string, deletedFilePaths: string[], fileType: $Enums.PartnerFilesTypes },
  ) {
    try {
      // delete the urls before insert/in case of update
      await this.companiesRepo.deleteSlogoFiles(params.fileType);
      const formattedFiles = params.indexValues.map((item) => {
        return {
          fileUrl: item.signedUrl,
          fileName: item.filename,
          fileIndex: item.indexId.toString(),
          isSelected: item.selectedFile,
          fileType: params.fileType,
          companyWebsiteUrl: item.companyWebsiteUrl
        };
      });
      await this.companiesRepo.deleteTempFiles(params.deletedFilePaths, params.uniqueFormId, "AddDeletedFiles");
      await this.companiesRepo.deleteTempFiles(params.indexValues.map((item) => item.signedUrl), params.uniqueFormId, "DeleteSavedFiles");
      return await this.companiesRepo.addSponcersFileUrls(formattedFiles);
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async deleteProjectByCompanyId(id: number) {
    try {
      const portfolioProjects =
        await this.companiesRepo.getAllPortfolioProjectsIdByCompanyId(id);
      if (portfolioProjects.length > 0) {
        for (const project of portfolioProjects) {
          await this.companiesRepo.deletePreviousFiles(project.id, 2);
          await this.companiesRepo.deletePlatformsOpted(project.id);
        }
      }
      await this.companiesRepo.deletePortfolioProjectById(id);
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async deleteSingleProjectById(id: number, companyId: number) {
    try {
      const checkUserAccess = await this.companiesRepo.checkUserPortfolioAccess(id, companyId)
      if (checkUserAccess.length <= 0 || !checkUserAccess) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.companiesRepo.deletePreviousFiles(id, 2);
      await this.companiesRepo.deletePlatformsOpted(id);
      await this.companiesRepo.deleteSingleProjectById(id);
      await this.companiesRepo.updateIsSavedOurworkFlag(companyId);
    } catch (error) {
      throw new HttpException(error.message, error.status, { cause: new Error(error) });
    }
  }

  async addPortfolioProjets(projects: Project[], id: number) {
    for (const project of projects) {
      const projectDataToInsert = {
        companyId: id,
        name: project.name,
        completionDate: new Date(project.projectCDate),
        description: project.description,
      };
      try {
        const addedProject = await this.companiesRepo.addProject(projectDataToInsert);
        if (addedProject) {
          const formattedFiles: {
            portfolioProjectId: number;
            type: ASSET_TYPE;
            fileUrl: string;
            thumbnail: string;
          }[] = [];
          for (const file of project.fileUrls) {
            const fileType: ASSET_TYPE = file.type;
            const singleFile = {
              portfolioProjectId: addedProject.id,
              type: fileType,
              fileUrl: file.fileUrl,
              thumbnail: file.thumbnail,
            };
            formattedFiles.push(singleFile);
          }
          const allPlatforms: {
            platformId: number;
            portfolioProjectId: number;
          }[] = [];
          for (const id of project.platforms) {
            const aPlatform = {
              platformId: id,
              portfolioProjectId: addedProject.id,
            };
            allPlatforms.push(aPlatform);
          }

          await this.companiesRepo.addPortfolioProjectFileUrls(formattedFiles);
          await this.companiesRepo.addPlatformsOptedForProject(allPlatforms);
        } else {
          throw new BadRequestException();
        }
      } catch (err) {
        throw new BadRequestException();
      }
    }
  }

  async addSingleProject(project: Project, id: number, UniqueFormId: string) {
    const projectDataToInsert = {
      companyId: id,
      name: project.name,
      completionDate: new Date(project.projectCDate),
      description: project.description,
      testimonial_name: project.testimonial.name,
      testimonial_company: project.testimonial.companyname,
      testimonial_title: project.testimonial.title,
      testimonial_feedback: project.testimonial.message,
    };
    try {
      const addedProject =
        await this.companiesRepo.addProject(projectDataToInsert);
      if (addedProject) {
        if(addedProject.testimonial_company != null && addedProject.testimonial_company != '') {
            await this.serviceProviderRepo.announcementUpdates(addedProject.companyId, addedProject.id, "Testimonial", null);
        }
        const formattedFiles: {
          portfolioProjectId: number;
          type: ASSET_TYPE;
          fileUrl: string;
          thumbnail: string;
        }[] = [];
        for (const file of project.fileUrls) {
          const fileType: ASSET_TYPE = file.type;
          const singleFile = {
            portfolioProjectId: addedProject.id,
            type: fileType,
            fileUrl: file.fileUrl,
            thumbnail: file.thumbnail,
          };
          formattedFiles.push(singleFile);
        }
        if (formattedFiles.length > 0) {
          //update the Temporary File Table
          const fileUrlsArray = formattedFiles.map(file => file.fileUrl);
          await this.companiesRepo.deleteTempFiles(fileUrlsArray, UniqueFormId, 'DeleteSavedFiles');
          await this.companiesRepo.addPortfolioProjectFileUrls(formattedFiles);
          // if files added then insert notifications and send push notifications
          await this.companiesRepo.checkNotificationAndSend(id, "Projects")
        }
        const allPlatforms: {
          platformId: number;
          portfolioProjectId: number;
        }[] = [];
        for (const id of project.platforms) {
          const aPlatform = {
            platformId: id,
            portfolioProjectId: addedProject.id,
          };
          allPlatforms.push(aPlatform);
        }
        await this.companiesRepo.addPlatformsOptedForProject(allPlatforms);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async updateSingleProject(project: Project, deletdFilePaths: string[], UniqueFormId: string, id: number, projectId: number) {
    const projectDataToInsert = {
      companyId: id,
      name: project.name,
      id: projectId,
      completionDate: new Date(project.projectCDate),
      description: project.description,
      testimonial_name: project.testimonial.name,
      testimonial_company: project.testimonial.companyname,
      testimonial_title: project.testimonial.title,
      testimonial_feedback: project.testimonial.message,
    };
    try {
      const addedProject =
        await this.companiesRepo.updateProject(projectDataToInsert);
      if (addedProject) {
        if(addedProject.testimonial_company != null && addedProject.testimonial_company != '') {
          await this.serviceProviderRepo.announcementUpdates(addedProject.companyId, addedProject.id, "Testimonial", null, 'update');
        }
        const formattedFiles: {
          portfolioProjectId: number;
          type: ASSET_TYPE;
          fileUrl: string;
          thumbnail: string;
        }[] = [];
        for (const file of project.fileUrls) {
          const fileType: ASSET_TYPE = file.type;
          const singleFile = {
            portfolioProjectId: addedProject.id,
            type: fileType,
            fileUrl: file.fileUrl,
            thumbnail: file.thumbnail,
          };
          formattedFiles.push(singleFile);
        }

        const projectFiles = await this.companiesRepo.getPortfolioProjectFiles(projectId);
        const sortedProjectFileNames = projectFiles.map(item => item.fileUrl).sort((a, b) => a.localeCompare(b));
        const sortedPostProjectFileNames = project.fileUrls.map((item: any) => item.fileUrl).sort((a, b) => a.localeCompare(b));
        if (sortedPostProjectFileNames.length > sortedProjectFileNames.length) {
          await this.companiesRepo.checkNotificationAndSend(id, "Projects");
        } else {
          if (sortedPostProjectFileNames.length == sortedProjectFileNames.length) {
            for (let i = 0; i < sortedPostProjectFileNames.length; i++) {
              if (sortedProjectFileNames[i] != sortedPostProjectFileNames[i]) {
                await this.companiesRepo.checkNotificationAndSend(id, "Projects");
                break;
              }
            }
          }
        }

        await this.companiesRepo.deletePreviousFiles(projectId, 2);
        if (formattedFiles.length > 0) {
          //update the Temporary File Table
          const fileUrlsArray = formattedFiles.map(file => file.fileUrl);
          await this.companiesRepo.deleteTempFiles(fileUrlsArray, UniqueFormId, 'DeleteSavedFiles');
          await this.companiesRepo.deleteTempFiles(deletdFilePaths, UniqueFormId, 'AddDeletedFiles');
          await this.companiesRepo.addPortfolioProjectFileUrls(formattedFiles);
        }
        const allPlatforms: {
          platformId: number;
          portfolioProjectId: number;
        }[] = [];
        for (const id of project.platforms) {
          const aPlatform = {
            platformId: id,
            portfolioProjectId: addedProject.id,
          };
          allPlatforms.push(aPlatform);
        }
        await this.companiesRepo.deletePlatformsOpted(projectId);
        await this.companiesRepo.addPlatformsOptedForProject(allPlatforms);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async updateAbout(companyId: number, about: string, profilePdfPath: string, profilePdfName: string, deletedFilePath: string) {
    const aboutProfilePerc = 16;
    await this.companiesRepo.deleteTempFiles(profilePdfPath, 'profilePdfFormId', 'DeleteSavedFiles');
    if (deletedFilePath != '') {
      await this.companiesRepo.deleteTempFiles(deletedFilePath, 'profilePdfFormId', 'AddDeletedFiles');
    }
    const earlierDoc = await this.companiesRepo.getAboutDoc(companyId);
    if (profilePdfPath && profilePdfPath != earlierDoc?.profilePdfPath) {
      await this.companiesRepo.checkNotificationAndSend(companyId, "About");
    }
    const isUpdated = await this.companiesRepo.update(companyId, { about, aboutProfilePerc, profilePdfPath, profilePdfName });
    return isUpdated;
  }

  async createCertificateAndDiligence(postData: any) {
    const locations: CompanyAddresses[] = [];
    let countryIds: string = '';

    await this.checkDifferenceAndSendNotifications(postData);

    for (const location of postData.locations) {
      countryIds += location.countryId + ', ';
      const loc: CompanyAddresses = {
        company_id: postData.companyId,
        location_name: location.location_name,
        address1: location.address1,
        address2: location.address2,
        state: location.state,
        city: location.city,
        zipcode: location.zipcode,
        countryId: +location.countryId,
      };
      locations.push(sanitizeData(loc));
      // locations.push(loc);
    }
    const companyPlatforms: CompanyPlatforms[] = [];
    // if(postData.platform.length > 0) {
    for (const platforms of postData.platform) {
      const companyPlatform: CompanyPlatforms = {
        companyId: postData.companyId,
        platformId: +platforms,
        isActive: true,
        isDelete: false,
      }
      companyPlatforms.push(companyPlatform);
    }
    // }
    try {
      const locationsCount = await this.companiesRepo.deleteCompanyLocations(postData.companyId);
      await this.companiesRepo.addCompanyLocations(locations);
      // if(companyPlatforms.length > 0) {
      await this.companiesRepo.addCompanyPlatforms(companyPlatforms, postData.companyId);
      // }

      if (postData.gameEngines && postData.gameEngines.length > 0) {
        const companyGameEngines: GameEngines[] = [];
        if (postData.gameEngines.length > 0) {
          for (const gameEngine of postData.gameEngines) {
            const companyPlatform: GameEngines = {
              companyId: postData.companyId,
              gameEngineName: gameEngine.name,
              isChecked: gameEngine.isChecked,
              isDelete: false,
            }
            companyGameEngines.push(companyPlatform);
          }
        }
        await this.companiesRepo.addGameEngines(companyGameEngines)
      }

      countryIds = countryIds.slice(0, -2);
      await this.companiesRepo.addCountryToCompanyTable(postData.companyId, countryIds);
      const certificateInfo: CertificateAndDiligence = {
        companyId: postData.companyId,
        foundingYear: new Date(postData.foundedYear),
        founderName: postData.founderName,
        foundingDescription: postData.foundingStoryDescription,
        workModel: postData.workModel,
        certifications: postData.certifications,
        Security: postData.security,
        tools: postData.tools,
      };
      // if (JSON.parse(certificateInfo.Security) == '' || JSON.parse(certificateInfo.certifications) == '' || JSON.parse(certificateInfo.tools) == '') {
      //   await this.companiesRepo.updateProfileStatus(certificateInfo.companyId, false);
      // }
      const getcertifivationsdata = await this.companiesRepo.getDiligenceAndSecurity(certificateInfo.companyId);
      if (locationsCount.length < postData.locations.length || certificateInfo.Security !== getcertifivationsdata?.Security || certificateInfo.certifications !== getcertifivationsdata?.certifications || certificateInfo.tools !== getcertifivationsdata?.tools) {
        await this.companiesRepo.justJoined(certificateInfo.companyId, 4);
      }
      if (postData.id && postData.id != "") {
        await this.companiesRepo.updateCertificateAndDiligence(
          certificateInfo,
          postData.id,
        );
      } else {
        await this.companiesRepo.addCertificateAndDiligence(certificateInfo);
      }

      return HttpStatus.CREATED;
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async addCapabilities(
    services: number[],
    capabilities: number[],
    id: number,
  ) {
    try {
      if (id) {

        const serviceAndCapabilities = await this.companiesRepo.getOptedServiceAndCapabilities(id);
        const serivcesArr = Array.from(new Set(serviceAndCapabilities.filter(item => item.serviceId).map(item => item.serviceId))).sort();
        const capabilitiesArr = Array.from(new Set(serviceAndCapabilities.filter(item => item.capabilityId).map(item => item.capabilityId))).sort();

        if (serivcesArr.length != services.length || capabilitiesArr.length != capabilities.length) {
          await this.companiesRepo.checkNotificationAndSend(id, "Services");
        } else {
          let isNotificationSaved = 0;
          for (let i = 0; i < services.length; i++) {
            if (serivcesArr[i] != services[i]) {
              await this.companiesRepo.checkNotificationAndSend(id, "Services");
              isNotificationSaved = 1;
              break;
            }
          }
          if (isNotificationSaved == 0) {
            for (let i = 0; i < capabilities.length; i++) {
              if (capabilitiesArr[i] != capabilities[i]) {
                await this.companiesRepo.checkNotificationAndSend(id, "Services");
                break;
              }
            }
          }
        }

        await this.companiesRepo.deleteCapabilitiesByCompanyId(id);
        if (capabilities.length > 0) {
          const formattedCapabilities = await Promise.all(
            capabilities.map(async (item) => {
              const serviceId = await this.companiesRepo.getServiceByCapability(item);
              return {
                companyId: id,
                capabilityId: item,
                serviceId: serviceId ? (services.includes(serviceId) ? serviceId : 0) : 0,
              };
            })
          );
          await this.companiesRepo.addCapabilities(formattedCapabilities);
        }
        if (services.length > 0) {
          const formattedServices = services.map((item) => {
            return {
              companyId: id,
              serviceId: item,
            };
          });
          await this.companiesRepo.addServices(formattedServices);
        }
        if (capabilities.length > 0 || services.length > 0) {
          await this.companiesRepo.updateSaveStatus(id);
        }
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async addContacts(contacts: Contacts[], id: number) {
    if (id) {
      const companyContacts = await this.companiesRepo.getAllContacts(id);
      if (contacts.length > companyContacts.length) {
        await this.companiesRepo.checkNotificationAndSend(id, "Contacts");
      }
      await this.companiesRepo.deleteContactsByCompanyId(id);

      if (contacts.length > 0) {
        const formattedContacts = contacts.map((item: Contacts) => {
          const sanitizedData = sanitizeData(item);
          // const sanitizedData = item;
          return {
            companyId: id,
            countryId: +item.countryId,
            name: sanitizedData.name,
            email: sanitizedData.email,
            title: sanitizedData.title,
            linkedInUrl: sanitizedData.linkedInUrl,
            profilePic: sanitizedData.profilePic,
            calendarLink: sanitizedData.calendarLink,
          };
        });
        const fileUrlsArray = formattedContacts.map(file => file.profilePic);
        await this.companiesRepo.deleteTempFiles(fileUrlsArray, 'Contactprofileimages', 'DeleteSavedFiles');
        await this.companiesRepo.addContacts(formattedContacts);
      }
    } else {
      throw new BadRequestException();
    }
  }

  async getContacts(id: number) {
    const data = await this.companiesRepo.getAllContacts(id);
    const updatedContacts = await Promise.all(data.map(async (contact): Promise<ContactWithUrl> => {
      let fullprofileUrl: string = "";
      if (contact.profilePic) {
        fullprofileUrl = await this.gcsService.getSignedUrl(contact.profilePic);
      }
      return {
        ...contact,
        fullprofileUrl
      };
    }));
    return updatedContacts;
  }

  async getDiligenceAndSecurity(id: number) {
    return await this.companiesRepo.getDiligenceAndSecurity(id);
  }

  async getServiceAndCapabilities() {
    return await this.companiesRepo.getServiceAndCapabilities();
  }

  async getPortfolioProjectDetails(id: number) {
    return await this.companiesRepo.getPortfolioProjectDetails(id);
  }
  async getPortfolioAlbumDetails(id: number) {
    return await this.companiesRepo.getPortfolioAlbumDetails(id);
  }
  async updatePortfolioAlbumsDetails(id: number, postData: { id: number, reOrderingId: number }) {
    return await this.companiesRepo.updatePortfolioAlbumsDetails(id, postData);
  }
  async updatePortfolioProjectsDetails(id: number, postData: { id: number, reOrderingId: number }) {
    return await this.companiesRepo.updatePortfolioProjectsDetails(id, postData);
  }
  async getPortfolioAlbumDetailsByAlbumId(id: number, companyId: number) {
    return await this.companiesRepo.getPortfolioAlbumDetailsByAlbumId(id, companyId);
  }

  async getSinglePortfolioProjectDetails(id: number, compayId: number) {
    return await this.companiesRepo.getSinglePortfolioProjectDetails(id, compayId);
  }

  async getCapabilities(id: number) {
    return await this.companiesRepo.getCapabilities(id);
  }
  async getOpportunityCapabilitiesAndServices(id: number, companyId: number) {
    return await this.companiesRepo.getOpportunityCapabilities(id, companyId);
  }

  async getServices(id: number) {
    return await this.companiesRepo.getServices(id);
  }

  async removeProfileFile(fileName: string) {
    return await this.companiesRepo.removeProfileFile(fileName);
  }


  async getSponcersUrls(type: $Enums.PartnerFilesTypes) {
    const fileUrls = await this.companiesRepo.getsponcersLogos(type);
    const imageUrls: {
      fileUrl: string;
      fileName: string;
      fileIndex: string;
      selectedIndex: boolean;
      signedUrl: string;
      companyWebsiteUrl: string | null;
    }[] = [];
    for (const item of fileUrls) {
      const signedUrl = await this.gcsService.getSignedUrl(item.fileUrl);
      const fileDetais = {
        fileUrl: item.fileUrl,
        fileName: item.fileName,
        fileIndex: item.fileIndex.toString(),
        selectedIndex: item.isSelected,
        signedUrl: signedUrl,
        companyWebsiteUrl: item.companyWebsiteUrl
      };
      imageUrls.push(fileDetais);
    }
    return imageUrls;
  }

  async getCompanyPortfolio(id: number) {
    const fileUrls = await this.companiesRepo.getCompanyPortfolio(id);
    const imageUrls: {
      id: number;
      fileUrl: string;
      signedUrl: string;
      // thumbnailSignedUrl: string;
      isSelected: boolean;
    }[] = [];
    const videoUrls: { id: number; fileUrl: string; isSelected: boolean }[] =
      [];
    for (const item of fileUrls) {
      if (item.type == "image") {
        const signedUrl = await this.gcsService.getSignedUrl(item.fileUrl);
        // const lastDotIndex = item.fileUrl.lastIndexOf('.');
        // const nameWithoutExtension = item.fileUrl.substring(0, lastDotIndex);
        // const fileExtension = item.fileUrl.substring(lastDotIndex);
        // const thumbnailFileName = nameWithoutExtension + '_thumbnail' + fileExtension;
        // const thumbnailUrl = await this.gcsService.getSignedUrl(thumbnailFileName);
        const fileDetais = {
          id: item.id,
          type: item.type,
          fileUrl: item.fileUrl,
          signedUrl: signedUrl,
          // thumbnailSignedUrl : thumbnailUrl,
          isSelected: item.idSelect,
        };
        imageUrls.push(fileDetais);
      } else if (item.type == "video") {
        const fileDetais = {
          id: item.id,
          type: item.type,
          fileUrl: item.fileUrl,
          isSelected: item.idSelect,
        };
        videoUrls.push(fileDetais);
      }
    }
    const data = {
      imageUrls: imageUrls,
      videoUrls: videoUrls,
    };
    return data;
  }


  async addOrUpdateCounts(loggedId: number, viewedId: number) {
    const existingLoggedUser =
      await this.companiesRepo.checkUserExistOrNot(loggedId);
    if (existingLoggedUser && existingLoggedUser.id) {
      try {
        await this.companiesRepo.updateVisitedCount(
          loggedId,
          existingLoggedUser.pageVisitedCount,
        );
      } catch (error) {
        throw new BadRequestException();
      }
    } else {
      try {
        await this.companiesRepo.addvisitingCount(loggedId);
      } catch (error) {
        throw new BadRequestException();
      }
    }
    const existingViewedUser =
      await this.companiesRepo.checkUserExistOrNot(viewedId);
    if (existingViewedUser && existingViewedUser.id) {
      try {
        await this.companiesRepo.updateViewedCount(
          viewedId,
          existingViewedUser.pageViewedCount,
        );
      } catch (error) {
        throw new BadRequestException();
      }
    } else {
      try {
        await this.companiesRepo.addViewedCount(viewedId);
      } catch (error) {
        throw new BadRequestException();
      }
    }
    if (existingLoggedUser && existingViewedUser) {
      try {
        await this.companiesRepo.recentViewedProfiles(loggedId, viewedId);
      } catch (error) {
        throw new BadRequestException();
      }
    }
  }

  async reportACompany(companyId: number) {
    try {
      const company = await this.companiesRepo.findById(companyId)
      if (company) {
        await this.companiesRepo.update(companyId, {
          isFlagged: true
        });
        return await this.userService.setTheUserToFlagged(company.userId);
      } else {
        throw new BadRequestException("invalid company Id");
      }
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async addReportDescription(postData: { loggedCompanyId: number, reportedCompanyId: number, description: string }) {
    try {
      return this.companiesRepo.addFlaggedUsersDetails(postData);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateTour(companyId: number) {
    return this.companiesRepo.updateTourStatus(companyId);
  }

  async getTempFiles() {
    return this.companiesRepo.getTempFiles();
  }

  async deleteTempFiles(fileName: string, formId: string, type: "AddDeletedFiles" | "DeleteSavedFiles") {
    return await this.companiesRepo.deleteTempFiles(fileName, formId, type)
  }

  async createPortfolioAlbum(postData: portfolioAlbumDto) {
    return await this.companiesRepo.createNewPortfolioAlbum(postData);
  }
  async deleteAlbumById(albumId: number, companyId: number) {
    return await this.companiesRepo.deleteAlbumByRepo(albumId, companyId);
  }

  async getuserscount() {
    return await this.companiesRepo.getuserscount();
  }

  async getLineChartUsers(timelineType: string) {
    let userType;
    let freeuserData = [];
    let oneYearUsersData = [];
    let monthlyUsersData = [];
    let paidusersData = [];
    let paidyearlyData = [];
    let paidmonthlyData = [];
    let canceledUsersdata = [];
    let dayName = [];
    try {
      if (timelineType === 'thisweek') {
        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        for (let i = 0; i <= currentDate.getDay(); i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          date.setHours(23, 59, 59, 999);
          userType = await this.companiesRepo.getLineChartUsers(startOfWeek, date);
          freeuserData.push(userType.data[0].freeUsers.length);
          oneYearUsersData.push(userType.data[0].oneYearUsers.length);
          monthlyUsersData.push(userType.data[0].monthlyUsers.length);
          paidusersData.push(userType.data[0].paidusers.length);
          paidyearlyData.push(userType.data[0].paidyearlyusers.length);
          paidmonthlyData.push(userType.data[0].paidmonthlyusers.length);
          canceledUsersdata.push(userType.data[0].canceledUsers.length);
          const day = date.toLocaleDateString('en-US', { weekday: 'long' });
          dayName.push(day);
        }
      }
      else if (timelineType === 'thismonth') {
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setMonth(currentDate.getMonth());
        startOfWeek.setDate(1);
        startOfWeek.setHours(0, 0, 0, 0);
        for (let i = 0; i < currentDate.getDate(); i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          date.setHours(23, 59, 59, 999);
          userType = await this.companiesRepo.getLineChartUsers(startOfWeek, date);
          freeuserData.push(userType.data[0].freeUsers.length);
          oneYearUsersData.push(userType.data[0].oneYearUsers.length);
          monthlyUsersData.push(userType.data[0].monthlyUsers.length);
          paidusersData.push(userType.data[0].paidusers.length);
          paidyearlyData.push(userType.data[0].paidyearlyusers.length);
          paidmonthlyData.push(userType.data[0].paidmonthlyusers.length);
          canceledUsersdata.push(userType.data[0].canceledUsers.length);
          const dateformat = new Date(date);
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthIndex = dateformat.getMonth();
          const monthName = monthNames[monthIndex];
          const day = dateformat.getDate();
          const dateString = `${monthName} ${day.toString().padStart(2, '0')}`;
          dayName.push(dateString);
        }
      }
      else if (timelineType === 'lastthreemonths') {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate);
        startOfMonth.setMonth(currentDate.getMonth() - 2);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = currentDate;
        const differenceInMilliseconds = endOfMonth.getTime() - startOfMonth.getTime();
        const differenceInDays = Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));
        const daysInMonth = differenceInDays;
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - differenceInDays);
        for (let i = 0; i <= daysInMonth; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          date.setHours(23, 59, 59, 999);
          userType = await this.companiesRepo.getLineChartUsers(startOfWeek, date);
          freeuserData.push(userType.data[0].freeUsers.length);
          oneYearUsersData.push(userType.data[0].oneYearUsers.length);
          monthlyUsersData.push(userType.data[0].monthlyUsers.length);
          paidusersData.push(userType.data[0].paidusers.length);
          paidyearlyData.push(userType.data[0].paidyearlyusers.length);
          paidmonthlyData.push(userType.data[0].paidmonthlyusers.length);
          canceledUsersdata.push(userType.data[0].canceledUsers.length);
          const dateformat = new Date(date);
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthIndex = dateformat.getMonth();
          const monthName = monthNames[monthIndex];
          const day = dateformat.getDate();
          const dateString = `${monthName} ${day.toString().padStart(2, '0')}`;
          dayName.push(dateString);
        }
      } else if (timelineType === 'allusers') {
        const startDate = new Date(2024, 0, 1); // January 1, 2000
        startDate.setHours(0, 0, 0, 0);

        // Set end date to the current date
        const currentDate = new Date();
        const endYear = currentDate.getFullYear();
        const endMonth = currentDate.getMonth();

        // Iterate through all months from the start date
        for (
          let year = startDate.getFullYear(), month = 0;
          year < endYear || (year === endYear && month <= endMonth);
          month++
        ) {
          if (month > 11) {
            month = 0; // Reset month to January
            year++; // Move to the next year
          }

          const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0); // First day of the month
          const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of the month

          // Fetch data for the current month range
          const userType = await this.companiesRepo.getLineChartUsers(startOfMonth, endOfMonth);

          // Push the data into the respective arrays
          freeuserData.push(userType.data[0]?.freeUsers.length || 0);
          oneYearUsersData.push(userType.data[0]?.oneYearUsers.length || 0);
          monthlyUsersData.push(userType.data[0]?.monthlyUsers.length || 0);
          paidusersData.push(userType.data[0]?.paidusers.length || 0);
          paidyearlyData.push(userType.data[0]?.paidyearlyusers.length || 0);
          paidmonthlyData.push(userType.data[0]?.paidmonthlyusers.length || 0);
          canceledUsersdata.push(userType.data[0]?.canceledUsers.length || 0);

          // Format the date for the month and add it to `dayName`
          const monthNames = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
          ];
          const monthName = monthNames[month];
          dayName.push(`${monthName} ${year}`);
        }

      }
      const userTypeArr = [{ 'freeUsers': freeuserData, 'oneYearUsers': oneYearUsersData, 'monthlyUsers': monthlyUsersData, 'paidusers': paidusersData, 'paidyearlyusers': paidyearlyData, 'paidmonthlyusers': paidmonthlyData, 'days': dayName, 'subscriptionCanceledUsers': canceledUsersdata }];
      return {
        data: userTypeArr,
      }
    } catch (error) {
      throw new BadRequestException(error);
    }

  }

  async addOrUpdateBuyerStats(buyerId: number, providerId: number) {
    let isSuchRecordExist = await this.companiesRepo.checkBuyerStatExist(buyerId, providerId);
    if (isSuchRecordExist) {
      const isUpdated = await this.companiesRepo.updateStatById(isSuchRecordExist.id, isSuchRecordExist.visitCounts);
      return isUpdated;
    } else {
      isSuchRecordExist = await this.companiesRepo.checkBuyerStatById(buyerId);
      if(isSuchRecordExist) {
        const updatedBuyerStat = await this.companiesRepo.updateBuyerStatById(isSuchRecordExist.id, providerId);
        return updatedBuyerStat;
      } else {
        const addedBuyerStat = await this.companiesRepo.addBuyerStat(buyerId, providerId);
        return addedBuyerStat;
      }
    }
  }

  async buyerContacted(buyerId: number, providerId: number) {
    if (buyerId && providerId) {
      const isSuchRecordExist = await this.companiesRepo.checkBuyerStatExist(buyerId, providerId);
      if (isSuchRecordExist) {
        return this.companiesRepo.buyerContactedProvider(buyerId, providerId);
      } else {
        return this.companiesRepo.addBuyerStatContact(buyerId, providerId);
      }

    }
  }

  async checkUserPortfolioAccess(portfolioId: number, companyId: number) {
    return await this.companiesRepo.checkUserPortfolioAccess(portfolioId, companyId);
  }

  async companyContactedSp(spCompanyId: number, contactingCompanyId: number, type : string) {
    if (spCompanyId && contactingCompanyId) {
      const isExist = await this.companiesRepo.checkExistanceOfContactStat(spCompanyId, contactingCompanyId);
      if (isExist && isExist.id) {
        await this.companiesRepo.updateCompanyContactStat(isExist.id, isExist.clickCounts, isExist.meetingClickCounts, type);
      } else {
        await this.companiesRepo.addNewCompanyContactStat(spCompanyId, contactingCompanyId, type);
      }
    }
  }

  async getCompanyContactStats() {
    const allContactStats = await this.companiesRepo.getCompanyContactStats();
    const finalResult = [];
    let maxUpdatedDate = new Date("2000-01-01");
    for (let item of allContactStats) {
      if (finalResult.length < 1) {
        const theFormattedObj = {
          id: item.id,
          totalCounts: item.clickCounts,
          totalMeetLinkCounts: item.meetingClickCounts,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          providingCompany: {
            id: item.providingCompany.id,
            name: item.providingCompany.name,
            userName: item.providingCompany.user.firstName + " " + item.providingCompany.user.lastName
          },
          contactingCompany: [
            {
              id: item.contactingCompany.id,
              name: item.contactingCompany.name,
              clickCount: item.clickCounts,
              meetLinkCounts: item.meetingClickCounts,
              role: item.contactingCompany.user.userRoles[0].roleCode,
              userName: item.contactingCompany.user.firstName + " " + item.contactingCompany.user.lastName,
              updatedAt: item.updatedAt
            }
          ]
        }
        finalResult.push(theFormattedObj);
      } else {
        let matched = false;
        for (let mItem of finalResult) {
          if (mItem.providingCompany.id == item.providingCompany.id) {
            matched = true;
            maxUpdatedDate = item.updatedAt;
            if (mItem.updatedAt > item.updatedAt) {
              maxUpdatedDate = mItem.updatedAt;
            }
            mItem.updatedAt = maxUpdatedDate;
            mItem.totalCounts = mItem.totalCounts + item.clickCounts;
            mItem.totalMeetLinkCounts = mItem.totalMeetLinkCounts + item.meetingClickCounts;
            mItem.contactingCompany.push({
              id: item.contactingCompany.id,
              name: item.contactingCompany.name,
              clickCount: item.clickCounts,
              meetLinkCounts: item.meetingClickCounts,
              role: item.contactingCompany.user.userRoles[0].roleCode,
              userName: item.contactingCompany.user.firstName + " " + item.contactingCompany.user.lastName,
              updatedAt: item.updatedAt
            })
          }
        }
        if (!matched) {
          const theFormattedObj = {
            id: item.id,
            totalCounts: item.clickCounts,
            totalMeetLinkCounts: item.meetingClickCounts,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            providingCompany: {
              id: item.providingCompany.id,
              name: item.providingCompany.name,
              userName: item.providingCompany.user.firstName + " " + item.providingCompany.user.lastName
            },
            contactingCompany: [
              {
                id: item.contactingCompany.id,
                name: item.contactingCompany.name,
                clickCount: item.clickCounts,
                meetLinkCounts: item.meetingClickCounts,
                role: item.contactingCompany.user.userRoles[0].roleCode,
                userName: item.contactingCompany.user.firstName + " " + item.contactingCompany.user.lastName,
                updatedAt: item.updatedAt
              }
            ]
          }
          finalResult.push(theFormattedObj);
        }
      }
    }
    return finalResult;
  }

  async getCompaniesToCsv(companies: any[]) {
    try {
      if (companies.length > 0) {

        const companyNames = await this.companiesRepo.findAll(companies);
        if (companyNames) {
          return {
            data: companyNames,
            success: true,
          };
        } else {
          throw new HttpException(companyNames, HttpStatus.FORBIDDEN);
        }
      } else {
        return {
          data: 'No companies in this csv',
          success: false,
        }
      }

    } catch (e) {
      throw new HttpException(e.message, e.status, { cause: new Error(e) });
    }


  }
  getEventsCount() {
    try {
      return this.companiesRepo.getActiveEventsCount();
    } catch (e) {
      throw new HttpException(e.message, e.status, { cause: new Error(e) });
    }
  }

  imagePublicMigration(tableName: string, startId: number, endId: number) {
    return this.companiesRepo.imagePublicMigration(tableName, startId, endId);
  }

  findExportList(exportType: $Enums.EXPORT_TYPE) {
    return this.companiesRepo.findListExportExceedUsers(exportType);
  }
  findCompanyBySlug(slug: string) {
    return this.companiesRepo.findCompanyBySlug(slug);
  }
  findCompanySlugById(id: number) {
    return this.companiesRepo.findCompanySlugById(id);
  }
  createCompanyGroups(companyid: number) {
    return this.companiesRepo.createCompanyGroups(companyid);
  }

  async followUnfollowCompanies(ispaidUser: boolean, userType: string, companyId: number, followCompanyId: number, isActive: boolean) {
    const isFollowExist = await this.companiesRepo.isFollowDetailsExist(companyId, followCompanyId);
    let followDetails;
    if (isFollowExist && isFollowExist.id) {
      const data = {
        isActive: isActive
      }
      followDetails = await this.companiesRepo.updateFollowDetails(isFollowExist.id, data);
    } else {
      followDetails = await this.companiesRepo.createFollowDetails(companyId, followCompanyId);
    }
    if (followDetails && followDetails.isActive) {
      const expiryEndDate = new Date();
      expiryEndDate.setUTCHours(0, 0, 0, 0);
      expiryEndDate.setUTCDate(expiryEndDate.getUTCDate() + 1);
      let year = expiryEndDate.getUTCFullYear();
      let month = String(expiryEndDate.getUTCMonth() + 1).padStart(2, '0');
      let day = String(expiryEndDate.getUTCDate()).padStart(2, '0');
      const expiryEndDateString = `${year}-${month}-${day}`;

      const expiryStartDate = new Date(expiryEndDate);
      expiryStartDate.setUTCDate(expiryStartDate.getUTCDate() - 7);
      year = expiryStartDate.getUTCFullYear();
      month = String(expiryStartDate.getUTCMonth() + 1).padStart(2, '0');
      day = String(expiryStartDate.getUTCDate()).padStart(2, '0');
      const expiryStartDateString = `${year}-${month}-${day}`;

      const whereClause = {
        notificationById: companyId,
        notificationToId: followCompanyId,
        type: 3,
        AND: [
          { createdAt: { gte: new Date(expiryStartDateString) } },
          { createdAt: { lt: new Date(expiryEndDateString) } }
        ]
      }
      const notificationWithinWeek = await this.companiesRepo.getFollowNotificationWithingWeek(whereClause);
      if (!notificationWithinWeek) {
        const data = {
          notificationById: companyId,
          notificationToId: followCompanyId,
          notificationDescription: "Congratulations! A Buyer is following you. 🏆",
          type: 3,
          isRead: false,
          isMailSent: false,
        }
        await this.companiesRepo.addGeneralNotification(data);
        let theUrl = "";
        theUrl = theUrl + process.env.XDS_RUN_ENVIRONMENT + `/users/${followCompanyId}/notifications`;
        const notificationRef = admin.database().ref(theUrl).push();
        await notificationRef.set({
          companyId: companyId,
          toCompany: followCompanyId,
          descirption: "Congratulations! A Buyer is following you. 🏆",
          timestamp: new Date().toISOString(),
        });
        const companyDetails = await this.findCompanyById(followCompanyId);
        if (companyDetails?.user && (ispaidUser || userType == "buyer")) {
          this.mailerService.sentFollowMail(companyDetails?.user.email, companyDetails.user.firstName, companyDetails.name);
        }
      }
    }
    return followDetails;
  }

  async getFollowDetails(userRole: string) {
    if (userRole == "service_provider") {
      const followindDetails = await this.companiesRepo.getSpFollowingDetails();
      return followindDetails;
    } else {
      const followindDetails = await this.companiesRepo.getBuyerFollowingDetails();
      return followindDetails;
    }
  }

  async getAllNotifications(companyId: number, date: string) {
    const followNotifications = await this.companiesRepo.getFollowNotifications(companyId);
    const generalNotifications = await this.companiesRepo.getGeneralNotifications(companyId);
    const adminNotifications = await this.companiesRepo.adminNotifications(companyId, date);
    let pinnedNot = [];
    let notPinnedNot = [];
    const todaysDate = new Date(toLocalISOString(date));
    for (const pinNotification of adminNotifications) {
      if (pinNotification.startDate && pinNotification.endDate && todaysDate >= pinNotification.startDate && todaysDate <= pinNotification.endDate) {
        pinnedNot.push(pinNotification);
      } else {
        notPinnedNot.push(pinNotification);
      }
    }
    const allNotification = [...followNotifications, ...generalNotifications, ...notPinnedNot];
    const sortedAllNotifications = allNotification.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    pinnedNot = pinnedNot.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pinnedNotifications = [...pinnedNot, ...sortedAllNotifications]
    return pinnedNotifications;
  }

  async turnNotificationsToRead(companyId: number) {
    const whereClause = {
      notificationToId: companyId
    }
    const adminWhereClause = {
      notificationCompanyId: companyId
    }
    const dataToUpdate = {
      isRead: true
    }
    await this.companiesRepo.updateFollowNotifications(whereClause, dataToUpdate);
    await this.companiesRepo.updateGeneralNotifications(whereClause, dataToUpdate);
    await this.companiesRepo.updateAdminNotifications(adminWhereClause, dataToUpdate);
  }

  async checkDifferenceAndSendNotifications(postData: any) {
    let isNotificationSaved = 0;
    const platforms = await this.companiesRepo.getOptedPlatforms(postData.companyId);
    let platformArr = platforms.map(item => item.platformId);
    let postPlatformArr = postData.platform;
    if (platformArr.length == postPlatformArr.length) {
      platformArr = platformArr.sort()
      postPlatformArr = postPlatformArr.sort();
      for (let i = 0; i < platformArr.length; i++) {
        if (+platformArr[i] != +postPlatformArr[i]) {
          await this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
          isNotificationSaved = 1;
          break;
        }
      }
    } else {
      this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
      isNotificationSaved = 1;
    }

    if (isNotificationSaved == 0) {
      const gameEngines = await this.companiesRepo.getGameEngines(postData.companyId);
      if (gameEngines.length == postData.gameEngines.length) {
        let gameEnginesArr = gameEngines.sort((a, b) => a.gameEngineName.localeCompare(b.gameEngineName));
        let postGameEngines: any = JSON.stringify(postData.gameEngines);
        postGameEngines = JSON.parse(postGameEngines);
        let postGameEnginesArr = postGameEngines.sort((a: any, b: any) => a.name.localeCompare(b.name));
        for (let i = 0; i < postGameEnginesArr.length; i++) {
          if (gameEnginesArr[i].gameEngineName != postGameEnginesArr[i].name) {
            await this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
            isNotificationSaved = 1;
            break;
          } else {
            if (gameEnginesArr[i].isChecked != postGameEnginesArr[i].isChecked) {
              await this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
              isNotificationSaved = 1;
              break;
            }
          }
        }
      } else {
        this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
        isNotificationSaved = 1;
      }
    }

    if (isNotificationSaved == 0) {
      const companyLocations = await this.companiesRepo.getCompaniesAddresses(postData.companyId);
      if (postData.locations.length > companyLocations.length) {
        this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
        isNotificationSaved = 1;
      }
    }

    if (isNotificationSaved == 0) {
      const diligenceInformation = await this.companiesRepo.getDiligenceAndSecurity(postData.companyId);
      const x = 10;
      if (diligenceInformation) {
        if (diligenceInformation.certifications != postData.certifications) {
          this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
          isNotificationSaved = 1;
        }
        if (isNotificationSaved == 0) {
          if (diligenceInformation.Security != postData.security) {
            this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
            isNotificationSaved = 1;
          }
        }
        if (isNotificationSaved == 0) {
          if (diligenceInformation.tools != postData.tools) {
            this.companiesRepo.checkNotificationAndSend(postData.companyId, "Diligence");
            isNotificationSaved = 1;
          }
        }
      }
    }

  }

  async callCheckNotificationAndSend(companyId: number, section: string = "") {
    await this.companiesRepo.checkNotificationAndSend(companyId, section);
  }

  async addProfileCounts(spId: number, loggedUserId: number) {
    await this.companiesRepo.addProfileCount(spId, loggedUserId);

  }
}
