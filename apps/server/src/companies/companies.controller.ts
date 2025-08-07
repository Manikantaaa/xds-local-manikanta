import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Delete,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
  HttpException,
  Req,
  HttpCode,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { $Enums, ASSET_TYPE, Prisma, ROLE_CODE, Users } from "@prisma/client";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { Roles } from "src/common/decorators/roles.decorator";
import { CompanyGeneralInfoResponseDto } from "./dtos/company-general-info.response.dto";
import { CompanyGeneralInfoDto } from "./dtos/company-general-info.dto";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { AssetsService } from "src/assets/assets.service";
import { CompaniesOperation } from "./companies.operation";
import { CompanyInformationForAdmin } from "./dtos/company-info-admin.response.dto";
import { Public } from "src/common/decorators/public.decorator";
import { TopReportsDto } from "./dtos/top-reports.dto";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { Parser } from "json2csv";
import { decodeEmail, formatDate, getRoleString, getTheExpiryDetails, getThumbnails, getUserTypeString } from "src/common/methods/common-methods";
import { CompanyProjectInfoDto } from "./dtos/company-project-info.dto";
import { Contacts } from "./types";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { portfolioAlbumDto } from "./dtos/portfolio-album-dto";
import { LoggedInUser, ThumbnailRequestDto } from "./dtos/login-user.dto";

@ApiBearerAuth()
@ApiTags("companies")
@Controller("companies")
export class CompaniesController {
  constructor(
    private readonly logger: Logger,
    private readonly companiesService: CompaniesService,
    private readonly gcsService: GoogleCloudStorageService,
    private readonly assetsService: AssetsService,
    private readonly companiesOps: CompaniesOperation,
  ) { }

  @Get("/export-profileperc-excel-data")
  @ApiOperation({
    summary: 'Export profile completion status report to Excel',
    description: 'This endpoint allows an admin or authorized user to export a report of user profile completion statuses in Excel format. The report includes details on how much of each user’s profile is completed, helping administrators track user progress and ensure that profiles are up to date. This operation is useful for reporting and analysis purposes, providing a clear overview of the current status of user profiles. The response will generate and download an Excel file containing the profile completion data.'
  })
  async exportspProfilePercfileToCsv(
    @Res() res: Response,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const parser = new Parser({
        fields: [
          "Date Created",
          "User Name",
          "Company Name",
          "Company Email",
          "Type",
          "Contact Name",
          "Profile Completion %",
        ],
      });
      const companies = await this.companiesService.getserviceProviderCompanies();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calculateProfileCompletion = (company: any) => {
        const profile = company.user.companies[0];
        if (company.user.isPaidUser) {
          return (
            profile.aboutProfilePerc +
            profile.certificationsProfilePerc +
            profile.contactsProfilePerc +
            profile.generalInfoProfilePerc +
            profile.ourWorkAlbumsProfilePerc +
            profile.ourWorkProjectProfilePerc +
            profile.servicesProfilePerc
          );
        } else {
          return (
            (profile.aboutProfilePerc != 0 ? 30 : profile.aboutProfilePerc) +
            (profile.generalInfoProfilePerc != 0 ? 40 : profile.generalInfoProfilePerc) +
            (profile.servicesProfilePerc != 0 ? 30 : profile.servicesProfilePerc)
          );
        }
      };

      const sortedCompanies = companies.sort((a, b) => {
        const sumA = calculateProfileCompletion(a);
        const sumB = calculateProfileCompletion(b);
        return sumB - sumA; // Sort in descending order
      });

      const finalResult: Array<{ [key: string]: string }> = [];
      if (sortedCompanies.length > 0) {
        sortedCompanies.forEach((item) => {
          const profile = item.user.companies[0];
          let profileCompletion: number;
          if (item.user.isPaidUser) {
            profileCompletion =
              profile.generalInfoProfilePerc +
              profile.ourWorkAlbumsProfilePerc +
              profile.ourWorkProjectProfilePerc +
              profile.servicesProfilePerc +
              profile.contactsProfilePerc +
              profile.aboutProfilePerc +
              profile.certificationsProfilePerc;
          } else {
            profileCompletion =
              (profile.generalInfoProfilePerc != 0 ? 40 : profile.generalInfoProfilePerc) +
              (profile.aboutProfilePerc != 0 ? 30 : profile.aboutProfilePerc) +
              (profile.servicesProfilePerc != 0 ? 30 : profile.servicesProfilePerc);
          }
          const company = {
            "Date Created": formatDate(profile.createdAt),
            "User Name": item.user.firstName + ' ' + item.user.lastName,
            "Company Name": profile?.name,
            "Company Email": item.user.email,
            "Type": getUserTypeString(item.user.userType, item.user.trialDuration),
            "Contact Name": item.user.firstName,
            "Profile Completion %": profileCompletion.toString(),
              };
          finalResult.push(company);
        });
      }
      if (finalResult.length > 0) {
        const csv = parser.parse(finalResult);
        if (!res) {
          throw new BadRequestException();
        }
        res.header("Content-Type", "text/csv");
        res.attachment("companyProfile.csv");
        return res.send(csv);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }
  
  @Get('list-export-report')
  @ApiOperation({
    summary: 'Retrieve exported reports based on a list',
    description: 'This endpoint allows an admin or authorized user to retrieve exported reports that are generated based on a specific list.'
  })
  async findExportListReport(@CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser && loggedUser?.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        return this.companiesService.findExportList($Enums.EXPORT_TYPE.export);
      } else {
        return new CustomResponse(HttpStatus.FORBIDDEN, true, 'access denied');
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }

  }

  @Get('list-share-report')
  @ApiOperation({
    summary: 'Retrieve the shared list report',
    description: 'This endpoint allows an admin or authorized user to retrieve the report of items that have been shared from the system.'
  })
  async findShareListReport(@CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser && loggedUser?.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        return this.companiesService.findExportList($Enums.EXPORT_TYPE.sharelink);
      } else {
        return new CustomResponse(HttpStatus.FORBIDDEN, true, 'access denied');
      }
    } catch (error) {
      throw new BadRequestException();
    }

  }

  @Get('get-company-by-slug/:slug')
  @ApiOperation({
    summary: 'Retrieve company details by slug',
    description: 'This endpoint allows users to retrieve the details of a company using its unique slug identifier. The slug is typically a user-friendly, URL-safe string that represents the company. This operation is useful for fetching specific company information for display purposes or further processing. The response will include comprehensive details about the company associated with the provided slug.'
  })
  async findCompanyBySlug(
    @Param('slug') slug: string
  ) {
    try {
      return this.companiesService.findCompanyBySlug(slug);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }
  
  @Get('get-company-slug-by-id/:id')
  @ApiOperation({
    summary: 'Retrieve company slug using company ID',
    description: 'This endpoint allows users to retrieve the slug associated with a specific company by its unique identifier (ID). The slug is a user-friendly, URL-safe string that represents the company, often used in URLs for navigation. This operation is useful for obtaining the slug for a given company ID, enabling easier access to company-related resources. The response will return the slug corresponding to the provided company ID.'
  })
  async findCompanySlugById(
    @Param('id', ParseIntPipe) id: number
  ) {
    try {
      return this.companiesService.findCompanySlugById(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  // @Public()
  // @Get('table/:tableName/:startId/:endId')
  // async imagePublicMigration(@Param("tableName") tableName: string, @Param("startId") startId: number, @Param("endId") endId: number) {
  //   return await this.companiesService.imagePublicMigration(tableName, +startId, +endId);
  // }

  @Public()
  @ApiExcludeEndpoint()
  @Get('deletetemporaryfiles')
  async deleteTempFiles() {
    try {
      //  const tempFiles = await this.companiesService.getTempFiles();
      //  tempFiles.forEach(async (files) => {
      //  await this.gcsService.removeFile(files.fileName);
      //  await this.companiesService.deleteTempFiles(files.fileName, files.formUniqueId, 'DeleteSavedFiles');
      //  });
    } catch (error) {
      console.log(error);
    }

  }

  @Get("get-service-capabilities")
  @ApiOperation({
    summary: 'Retrieve services and capabilities',
    description: 'This endpoint allows users to retrieve the capabilities and features offered by the service. It provides a list of available functionalities to help users understand and utilize the services effectively.'

  })
  async getServiceAndCapabilities() {
    try {
      const data = await this.companiesService.getServiceAndCapabilities();
      return new CustomResponse(HttpStatus.OK, true, data);
    } catch (err) {
      throw new BadRequestException();
    }
  }

  @Get("get-sponcers-logo-urls/:type")
  @ApiOperation({
    summary: 'Retrieve sponsors logo URLs',
    description: 'This endpoint allows users to retrieve the URLs of logos for all sponsors associated with the service. The response will include a list of logo URLs, enabling users to display or use the sponsors’ branding in their applications or websites.'
  })
  async getSponcersLogoFiles(@CurrentUser() loggedUser: LoggedInUser, @Param("type") type: $Enums.PartnerFilesTypes) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const companyImageAndVideoUrls =
        await this.companiesService.getSponcersUrls(type);
      return new CustomResponse(HttpStatus.OK, true, companyImageAndVideoUrls);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("export-excel-data")
  @ApiOperation({
    summary: 'Export company data to Excel',
    description: 'This endpoint allows users to export company data in Excel format. The exported file will include detailed information about all companies, making it easier for users to analyze and manage company-related data outside the application.'
  })
  async exportDataToCsv(
    @Res() res: Response,
    @CurrentUser() loggedUser: LoggedInUser,
    @Query("search") searchVal: string,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const parser = new Parser({
        fields: [
          "Date Created",
          "Last Updated",
          "Company",
          "Website",
          "Primary Contact",
          "Role",
          "Type",
          "Expiry Date",
          "Status",
        ],
      });
      const companies =
        await this.companiesService.findCompaniesBySearch(searchVal);
      const finalResult: Array<{ [key: string]: string }> = [];
      if (companies.length > 0) {
        companies.forEach((item) => {
          const company = {
            "Date Created": formatDate(item.createdAt),
            "Last Updated": formatDate(item.updatedAt),
            "Company": item.name,
            "Website": item.website,
            "Primary Contact": item.user.firstName + item.user.lastName,
            "Role": getRoleString(item.user.userRoles[0].roleCode),
            "Type": getUserTypeString(item.user.userType, item.user.trialDuration),
            "Expiry Date": getTheExpiryDetails(item.user.accessExpirationDate),
            "Status": item.isArchieve ? "Archive" : "Live",
          };
          finalResult.push(company);
        });
      }
      if (finalResult.length > 0) {
        const csv = parser.parse(finalResult);
        if (!res) {
          throw new BadRequestException();
        }
        res.header("Content-Type", "text/csv");
        res.attachment("companies.csv");
        return res.send(csv);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put("/:companyId")
  @ApiOperation({
    summary: 'Update profile completion status',
    description: 'This endpoint allows updating the profile completion status of a specific company using the company ID.'
  })
  async UpdateProfileCompleteStatus(
    @Param("companyId", ParseIntPipe) companyId: number,
    @CurrentUser() loggedUser: LoggedInUser
  ) {
    try {
      if (loggedUser?.companies[0].id !== +companyId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, true, 'access denied');
      }
      return await this.companiesService.updateProfileStatus(+companyId);

    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Roles(ROLE_CODE.service_provider)
  @Put(":companyId/general-info")
  @ApiOperation({
    summary: 'Update company general information',
    description: 'This endpoint allows updating the general information of a specific company by providing the necessary details.'
  })
  async updateCompanyGeneralInfo(
    @GetXdsContext() xdsContext: XdsContext,
    @CurrentUser() user: Users,
    @Param("companyId", ParseIntPipe) companyId: number,
    @Body() companyGeneralInfoDto: CompanyGeneralInfoDto,
  ) {
    try{
      const company = await this.companiesService.findFirstByUserIdOrThrow(
        xdsContext,
        user.id,
      );

      if (company.id !== +companyId) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (+companyId !== company.id) {
        this.logger.error("access denied", {
          xdsContext,
          userCompanyId: company.id,
          requestedCompanyId: companyId,
        });
        throw new ForbiddenException("Access Denied");
      }

      if (company.companySize != companyGeneralInfoDto.companySize) {
        this.companiesService.callCheckNotificationAndSend(+companyId, "size")
      }

      const res = await this.companiesOps.updateCompanyGeneralInfo(xdsContext, {
        userId: user.id,
        isPaidUser: user?.isPaidUser,
        company,
        updatedGeneralInfo: { ...sanitizeData(companyGeneralInfoDto) },
        // updatedGeneralInfo: { ...companyGeneralInfoDto },
      });

      return res;
    }catch (err){
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("buyer-contacted")
  @ApiOperation({
    summary: 'Record buyer contacting a service provider',
    description: 'This endpoint allows the system to log the event when a buyer contacts a specific service provider. By providing the logged company ID and the provider company ID, the system can track and manage interactions between buyers and service providers. This operation is essential for maintaining records of communication and improving customer relationship management.'
  })
  async buyerContacted(
    @Query("loggedCompanyId") loggedCompanyId: number,
    @Query("providerCompanyId") providerCompanyId: number,
    @Query("type") type: string,
    @CurrentUser() loggedUser: LoggedInUser
  ) {
    try {
      // const companyDetails = await this.companiesService.findCompanyById(+spId);
      if (loggedUser?.companies[0].id !== +loggedCompanyId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, true, 'access denied');
      }
      if (loggedCompanyId != providerCompanyId) {
        if(type == "meetingLink") {
          await this.companiesService.companyContactedSp(+providerCompanyId, +loggedCompanyId, type);
        } else {
          if (loggedUser && loggedUser.userRoles[0] && loggedUser.userRoles[0].roleCode == 'buyer') {
            await this.companiesService.buyerContacted(+loggedCompanyId, +providerCompanyId);
          }
          await this.companiesService.companyContactedSp(+providerCompanyId, +loggedCompanyId, type);
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-company-contact-stats")
  @ApiOperation({
    summary: 'Retrieve contact statistics for a company',
    description: 'This endpoint allows users to retrieve statistics related to contacts made with a specific company. It provides insights such as the number of contacts, types of interactions, and trends over time.'
  })
  async getCompanyContactStats(@CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const contactStats = await this.companiesService.getCompanyContactStats();
      return new CustomResponse(HttpStatus.OK, true, contactStats);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("/get-company-contact-stats-csv")
  @ApiOperation({
    summary: 'Download company contact statistics in CSV format',
    description: 'This endpoint allows users to download contact statistics for a company in CSV format, providing a structured way to analyze communication data.'
  })
  async downloadCompanyContactStats(
    @Res() res: Response,
    @Query("type") type: string,
    @CurrentUser() loggedUser: LoggedInUser,) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const contactStats = await this.companiesService.getCompanyContactStats();
      if(type == "contactClicks") {
        const onlyContactClicks = contactStats.filter((item:{totalCounts : number}) => item.totalCounts !== 0);
        const parser = new Parser({
          fields: [
            "Service Provider",
            "Total Clicks Received",
            "Contacted By"
          ],
        });
        const finalResult: Array<{ [key: string]: string }> = [];
        if (onlyContactClicks.length > 0) {
          onlyContactClicks.forEach((item) => {
            const companiesDetails = item.contactingCompany.map((contactCompany) => {
              return contactCompany.userName + `(${contactCompany.clickCount}) - ${getRoleString(contactCompany.role, 1)}`
            }).join(", ");
            const stat = {
              "Service Provider": item.providingCompany?.name,
              "Total Clicks Received": item.totalCounts.toString(),
              "Contacted By": companiesDetails
            };
            finalResult.push(stat);
          });
        }
        if (finalResult.length > 0) {
          const csv = parser.parse(finalResult);
          if (!res) {
            throw new BadRequestException();
          }
          res.header("Content-Type", "text/csv");
          res.attachment("company-contact-stats.csv");
          return res.send(csv);
        } else {
          throw new BadRequestException();
        }
        
      } 
      else {
        const updatedCompanyContactStats = contactStats.map((company) => {
          const filteredContactingCompanies = company.contactingCompany
            .map((contact) => {
              if (contact.meetLinkCounts && contact.meetLinkCounts !== 0) {
                return {
                  ...contact,
                  clickCount: contact.meetLinkCounts,
                };
              }
              return null;
            })
            .filter((contact) => contact !== null);
          if (filteredContactingCompanies.length === 0) {
            return null;
          }
  
          return {
            ...company,
            totalCounts: company.totalMeetLinkCounts,
            contactingCompany: filteredContactingCompanies,
          };
        })
        .filter((company) => company !== null);

        const parser = new Parser({
          fields: [
            "Service Provider",
            "Total Meeting Clicks Received",
            "Meeting Booked By"
          ],
        });
        const finalResult: Array<{ [key: string]: string }> = [];
        if (updatedCompanyContactStats.length > 0) {
          updatedCompanyContactStats.forEach((item) => {
            if (item) {
            const companiesDetails = item.contactingCompany.map((contactCompany) => {
              if(contactCompany) {
                return contactCompany.userName + `(${contactCompany.clickCount}) - ${getRoleString(contactCompany.role, 1)}`
              }
            }).join(", ");
            const stat = {
              "Service Provider": item.providingCompany?.name,
              "Total Meeting Clicks Received": item.totalCounts.toString(),
              "Meeting Booked By": companiesDetails
            };
            finalResult.push(stat);
          }
          });
        }
        if (finalResult.length > 0) {
          const csv = parser.parse(finalResult);
          if (!res) {
            throw new BadRequestException();
          }
          res.header("Content-Type", "text/csv");
          res.attachment("company-meet-link-stats.csv");
          return res.send(csv);
        } else {
          throw new BadRequestException();
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":companyId/get-companyProfile-status")
  @ApiOperation({
    summary: "Find company profile completion percentage",
    description: "This endpoint retrieves the completion percentage of a company's profile, indicating how much of the profile information has been filled out."
  })
  async getCompanyProfileStatus(
    @Param("companyId", ParseIntPipe) id: number,
    @CurrentUser() loggedUser: LoggedInUser
  ): Promise<any | undefined> {
    try {
      // if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      //   throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      // }
      if (loggedUser?.companies[0].id !== +id) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const company = await this.companiesService.findCompanyProfileStatus(+id);
      if (company) {
        return company;
      }
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOkResponse({ type: CompanyGeneralInfoResponseDto })
  @Roles(ROLE_CODE.service_provider)
  @Get(":companyId/general-info")
  @ApiOperation({
    summary: "Retrieve general information about a company",
    description: "This endpoint fetches the general information of a specified company, including key details such as name, address, contact information, and other relevant data."
  })
  async getCompanyGeneralInfo(
    @GetXdsContext() xdsContext: XdsContext,
    @CurrentUser() user: Users,
    @Param("companyId", ParseIntPipe) companyId: number,
  ): Promise<CompanyGeneralInfoResponseDto> {
    try{
      const company = await this.companiesService.findFirstByUserIdOrThrow(
        xdsContext,
        user.id,
      );

      if (+companyId !== company.id) {
        this.logger.error("access denied", {
          xdsContext,
          userCompanyId: company.id,
          requestedCompanyId: companyId,
        });
        throw new ForbiddenException("Access Denied");
      }

      let previewLogoUrl, logoUrl;
      if (company.logoAssetId) {
        const logo = await this.assetsService.findById(company.logoAssetId);
        previewLogoUrl = logo?.url
          ? await this.gcsService.getSignedUrl(logo.url)
          : undefined;

        logoUrl = logo?.url;
      }

      let previewBannerUrl, bannerUrl;
      if (company.bannerAssetId) {
        const banner = await this.assetsService.findById(company.bannerAssetId);
        previewBannerUrl = banner?.url
          ? await this.gcsService.getSignedUrl(banner.url)
          : undefined;

        bannerUrl = banner?.url;
      }
      const name = company.name;
      const website = company.website;
      const shortDescription = company.shortDescription;
      const companySize = (company.companySize) ? company.companySize : undefined;
      return new CompanyGeneralInfoResponseDto({
        name,
        website,
        shortDescription,
        companySize,
        previewLogoUrl,
        previewBannerUrl,
        logoUrl,
        bannerUrl,
      });
    } catch(err){
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("pagination")
  @ApiOperation({
    summary: "Get companies list by pagination",
    description: "This endpoint retrieves a paginated list of companies, allowing users to fetch a specific number of entries per request. Pagination helps in managing large datasets and improves response times."
  })
  @ApiOkResponse({ type: CompanyInformationForAdmin })
  async getUserPerPage(
    @CurrentUser() loggedUser: LoggedInUser,
    @Query("search") searchVal: string,
  ): Promise<
    CustomResponse<{ result: CompanyInformationForAdmin[] }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const companies = await this.companiesService.findCompanies(searchVal);
      // const companiesCount: number = wait this.companiesService.getCompaniesCount(searchVal);
      const companyRespone: CompanyInformationForAdmin[] = [];
      for (const company of companies) {
        const theCompany: CompanyInformationForAdmin =
          new CompanyInformationForAdmin(company);
        companyRespone.push(theCompany);
      }
      return new CustomResponse(HttpStatus.OK, true, {
        // count: companiesCount,
        result: companyRespone,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("top-viewed-profiles")
  @ApiOperation({
    summary: "Retrieve the top viewed profiles",
    description: "This endpoint fetches the profiles that have received the most views, providing insights into popular users or companies. This information can be useful for understanding trends and user engagement."
  })
  async getTopViewedProfiles(
    @CurrentUser() loggedUser: LoggedInUser,
  ): Promise<
    CustomResponse<{ count: number; result: TopReportsDto[] }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const topViewedReports =
        await this.companiesService.getTopViewedProfiles();
      // const countRows: number = await this.companiesService.getTopViewedProfilesCount();
      return new CustomResponse(HttpStatus.OK, true, {
        count: 20,
        result: topViewedReports,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("get-company-profile-stats")
  @ApiOperation({
    summary: "Retrieve statistics of company profiles",
    description: "This endpoint provides various statistics related to company profiles, including completion rates, view counts, and engagement metrics. This data helps in assessing the performance and visibility of company profiles."
  })
  async getserviceProviderCompanies(@CurrentUser() loggedUser: LoggedInUser): Promise<
    CustomResponse<any>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const getspCompanies =
        await this.companiesService.getserviceProviderCompanies();
      return new CustomResponse(HttpStatus.OK, true, {
        result: getspCompanies,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("top-page-visited")
  @ApiOperation({
    summary: "Retrieve the most active buyers",
    description: "This endpoint fetches a list of the most active buyers based on their page visit frequency. It provides insights into buyer engagement and behavior, helping to identify key users within the platform."
  })
  async getMostActiveBuyers(@CurrentUser() loggedUser: LoggedInUser): Promise<
    CustomResponse<{ count: number; result: TopReportsDto[] }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const topPageVisited = await this.companiesService.getMostActiveBuyers();
      return new CustomResponse(HttpStatus.OK, true, {
        count: 6,
        result: topPageVisited,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("export-mostviewed-buyers-data")
  @ApiOperation({
    summary: "Export most viewed buyers data in CSV format",
    description: "This endpoint allows users to download a CSV file containing data on the most viewed buyers. The exported file includes key details about buyer profiles, facilitating further analysis and reporting."
  })
  async exportmostViewedBuyersCsv(
    @Res() res: Response,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const parser = new Parser({
        fields: [
          "Page Visits",
          "Buyer",
          "User",
        ],
      });
      const companies =
        await this.companiesService.getMostActiveBuyers();
      const finalResult: any = [];
      if (companies.length > 0) {
        companies.forEach((item) => {
          const company = {
            "Page Visits": item.pageVisitedCount,
            "Buyer": item.company.user.firstName + item.company.user.lastName,
            "User": item.company.name,
          };
          finalResult.push(company);
        });
      }
      if (finalResult.length > 0) {
        const csv = parser.parse(finalResult);
        if (!res) {
          throw new BadRequestException();
        }
        res.header("Content-Type", "text/csv");
        res.attachment("mostViewedBuyers.csv");
        return res.send(csv);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("top-viewed-sponcers")
  @ApiOperation({
    summary: "Retrieve the top viewed sponsors profiles",
    description: "This endpoint fetches the profiles of the most viewed sponsors, providing insights into their popularity and engagement levels. This information can help identify sponsors that attract significant attention."
  })
  async getTopViewedSponsersProfiles(@CurrentUser() loggedUser: LoggedInUser): Promise<
    CustomResponse<{ result: TopReportsDto[] }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const topViewedReports =
        await this.companiesService.getTopViewedSponsersProfiles();
      return new CustomResponse(HttpStatus.OK, true, {
        result: topViewedReports,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("userscount")
  @ApiOperation({
    summary: "Retrieve user count statistics",
    description: "This endpoint provides a count of users segmented by their subscription type, including free users, monthly users, yearly users, and paid users. This information is useful for understanding user distribution and engagement with the platform."
  })
  async getuserscount(@CurrentUser() loggedUser: LoggedInUser): Promise<
    CustomResponse<{
      result: {
        freeUsers: number;
        oneYearUsers: number;
        monthlyUsers: number;
        paidusers: number;
        paidyearlyusers: number;
        paidmonthlyusers: number;
      }[]
    }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const data = await this.companiesService.getuserscount();
      return new CustomResponse(HttpStatus.OK, true, {
        result: data.data,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get("lineChartUsers/:timelineType")
  @ApiOperation({
    summary: "Retrieve user statistics for a specified timeline",
    description: "This endpoint fetches user statistics over a specified timeline, which can be used to generate line charts. The data helps in visualizing trends and patterns in user engagement over time."
  })
  async getLineChartUsers(@Param("timelineType") timelineType: string, @CurrentUser() loggedUser: LoggedInUser): Promise<
    CustomResponse<{
      result: any
    }>
  > {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const data = await this.companiesService.getLineChartUsers(timelineType);
      return new CustomResponse(HttpStatus.OK, true, {
        result: data.data,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("getEventsCount")
  @ApiOperation({
    summary: "Retrieve the total count of events",
    description: "This endpoint provides the total number of events available in the system. It helps users understand the volume of events and can be useful for analytics and reporting."
  })
  async getEventCout() {
    try {
      const EventsCount = await this.companiesService.getEventsCount()
      if (EventsCount) {
        return { EventsAvailable: EventsCount > 0 };
      } else {
        return { EventsAvailable: false };
      }
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("get-follow-details")
  @ApiOperation({
    summary: "Retrieve follow details for the logged-in user",
    description: "This endpoint fetches the follow details of the logged-in user, including information on who they are following and their followers. This data helps users manage their connections within the platform."
  })
  async getFollowDetails(@CurrentUser() loggedUser: LoggedInUser, @Query("userRole") userRole: string) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const data = await this.companiesService.getFollowDetails(userRole);
      return new CustomResponse(HttpStatus.OK, true, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get("get-all-notifications/:todayDate")
  @ApiOperation({
    summary: "Retrieve all notifications for the logged-in user",
    description: "This endpoint fetches all notifications related to the logged-in user, providing updates on activities, interactions, and other relevant events. It helps users stay informed about important happenings on the platform."
  })
  async getAllNotifications(@Param("todayDate") todayDate: string, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      // if (!loggedUser?.isPaidUser) {
      //   throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      // }
      const secretKey = process.env.EMAIL_SECRET_KEY;
      const date = decodeEmail(todayDate, secretKey);
      const data = await this.companiesService.getAllNotifications(loggedUser.companies[0]?.id, date);
      return new CustomResponse(HttpStatus.OK, true, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get("make-notifications-read")
  @ApiOperation({
    summary: "Mark notifications as read for the logged-in user",
    description: "This endpoint allows the logged-in user to mark their notifications as read. This action helps in managing notification visibility and indicates that the user has acknowledged the alerts."
  })
  async turnNotificationsToRead(@CurrentUser() loggedUser: LoggedInUser) {
    try {
      await this.companiesService.turnNotificationsToRead(loggedUser.companies[0]?.id);
      return new CustomResponse(HttpStatus.OK, true, "updated");
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get(":id/get-sevices-and-capabilities")
  @ApiOperation({
    summary: "Retrieve services and capabilities by ID",
    description: "This endpoint fetches the services and capabilities associated with a specific ID. It provides detailed information about the functionalities and features available, helping users understand what services are offered."
  })
  async getServicesAndCapabilities(@Param("id", ParseIntPipe) id: number) {
    try {
      const capabilities = await this.companiesService.getCapabilities(id);
      const services = await this.companiesService.getServices(id);
      const seen = new Set();
      const uniqueServices = services.filter(service => {
        if (seen.has(service.serviceId)) {
          return false;
        }
        seen.add(service.serviceId);
        return true;
      });
      const servicesAndCapabilities = {
        capabilities: capabilities,
        services: uniqueServices,
      };
      return new CustomResponse(HttpStatus.OK, true, servicesAndCapabilities);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get(":id/get-opportunity-services")
  @ApiOperation({
    summary: "Retrieve services related to a specific opportunity by ID",
    description: "This endpoint fetches the services associated with a specific opportunity identified by the provided ID. It helps users understand the offerings related to that opportunity and aids in decision-making."
  })
  async getSelectedOpporunityServices(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: Users) {
    try {

      const { capabilities, services } =
        await this.companiesService.getOpportunityCapabilitiesAndServices(id, user?.id);
      const servicesAndCapabilities = {
        capabilities: capabilities,
        services: services,
      };
      return new CustomResponse(HttpStatus.OK, true, servicesAndCapabilities);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id")
  @ApiOperation({
    summary: "Find company by ID",
    description: "This endpoint retrieves detailed information about a specific company using its unique identifier (ID). It provides essential data about the company, which can be useful for administrative purposes and record-keeping."
  })
  @ApiOkResponse({ type: CompanyInformationForAdmin })
  async getCompanyById(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const company = await this.companiesService.findSingleCompanyById(id);
      if (company) {
        return company;
      }
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/about-data")
  @ApiOperation({
    summary: "Retrieve about data for a company by ID",
    description: "This endpoint provides detailed 'about' information for a specific company identified by its unique ID. The response includes essential company background information, which can be valuable for administrative review and decision-making."
  }) @ApiOkResponse({ type: CompanyInformationForAdmin })
  async getCompanyAboutById(
    @Param("id", ParseIntPipe) id: number,
  ) {
    try {
      const company = await this.companiesService.getCompanyAboutById(id);
      if (company) {
        return company;
      }
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/archieve")
  @ApiOperation({
    summary: "Archive a company by ID",
    description: "This endpoint allows the user to archive a company identified by its unique ID. Archiving a company removes it from active listings and helps in managing company records efficiently."
  })
  @ApiOkResponse({ type: CompanyGeneralInfoResponseDto })
  async archieveCompany(@Param("id", ParseIntPipe) id: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return new CompanyGeneralInfoResponseDto(
        await this.companiesService.setCompanyArchieveStatus(id, 1),
      );
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/de-archieve")
  @ApiOperation({
    summary: "De-archive a company by ID",
    description: "This endpoint allows the user to de-archive a previously archived company identified by its unique ID. De-archiving restores the company to active status, making it visible in the company listings again."
  })
  @ApiOkResponse({ type: CompanyGeneralInfoResponseDto })
  async unArchieveCompany(@Param("id", ParseIntPipe) id: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return new CompanyGeneralInfoResponseDto(
        await this.companiesService.setCompanyArchieveStatus(id, 2),
      );
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/delete")
  @ApiOperation({
    summary: "Delete a company by ID",
    description: "This endpoint allows the user to delete a company identified by its unique ID. Deleting a company removes all associated data from the system, ensuring it is no longer accessible or visible."
  })
  @ApiOkResponse({ type: CustomResponse<string> })
  async deleteCompany(@Param("id", ParseIntPipe) id: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.companiesService.deleteCompany(id)
      return new CustomResponse(HttpStatus.OK, true, "company deleted successfully");
    } catch (err) {
      console.log(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("import-excel-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({
    summary: "Import data from an Excel file",
    description: "This endpoint allows an admin or authorized user to upload and import data from an Excel file. The file should be uploaded in the request body and will be processed to insert the data into the system. The response will include the number of records imported and a message indicating the result of the operation."
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file to be uploaded for data import.'
        }
      },
      required: ['file'],
    }
  })
  async importDataFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() loggedUser: LoggedInUser
  ): Promise<CustomResponse<{ count: number; message: string }>> {
    if (!file) {
      throw new BadRequestException("File not Supported");
    }
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const result = await this.companiesService.parseCsvBuffer(file.buffer, '');
      const isInsertionSucces =
        await this.companiesService.importCsvData(result);
      if (!isInsertionSucces) {
        throw new BadRequestException("File is not in correct format");
      }
      return new CustomResponse(HttpStatus.OK, true, {
        count: isInsertionSucces,
        message: "Importing success",
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("create-single-company")
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        postData: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'First name of the user' },
            lastName: { type: 'string', description: 'Last name of the user' },
            email: { type: 'string', description: 'Email address of the user' },
            companyName: { type: 'string', description: 'Name of the company' },
            companyWebUrl: { type: 'string', description: 'Website URL of the company' },
            linkedInUrl: { type: 'string', description: 'LinkedIn profile URL of the user or company' },
            role: { type: 'string', enum: ['buyer', 'service_provider'], description: 'Role of the user' },
            companyDescription: { type: 'string', description: 'A brief description of the company' },
            companySize: { type: 'string', description: 'Size of the company, e.g., Small, Medium, Large' },
            services: { type: 'string', description: 'Services offered by the company' }
          },
          required: ['firstName', 'lastName', 'email', 'companyName', 'role']
        }
      }
    }
  })
  async createNewCompany(
    @Body() postData: { postData: any },
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return await this.companiesService.createSingleCompany(postData);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }

  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":id/set-founding-sponcer")
  @ApiOperation({
    summary: "Set a company as a founding sponsor by ID",
    description: "This endpoint allows the user to designate a company identified by its unique ID as a founding sponsor. This action updates the company's status and may affect its visibility and categorization within the platform."
  })
  @ApiOkResponse({ type: CompanyGeneralInfoResponseDto })
  async setFoundingSponcers(
    @Param("id", ParseIntPipe) id: number,
    @Query("type") val: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ): Promise<CustomResponse<string>> {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (val == 1) {
        return await this.companiesService.setFoundingSponcers(id, val);
      } else if (val == 0) {
        return await this.companiesService.setFoundingSponcers(id, val);
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("save-company-files-urls")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({
    summary: 'Upload portfolio files URLs',
    description: 'This endpoint allows users to upload multiple portfolio files by providing their URLs and specifying the type of asset. Each file can be marked as active or inactive. The file URLs can represent different types of assets like images, videos, or documents associated with the company’s portfolio.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ["image", "video", "file"], description: 'Type of asset, e.g., image, video, file' },
              fileUrl: { type: 'string', description: 'URL of the file' },
              active: { type: 'boolean', description: 'Indicates if the file is active' }
            },
            required: ['type', 'fileUrl', 'active']
          }
        }
      },
      required: ['fileUrls']
    }
  })
  async uploadCompanyFilesUrls(
    @Body()
    postData: {
      fileUrls: { type: ASSET_TYPE; fileUrl: string; active: boolean }[];
      id: number;
    },
  ) {
    try {
      const companyDetails = await this.companiesService.findCompanyById(
        +postData.id,
      );
      if (companyDetails && companyDetails.userId) {
        const data = await this.companiesService.updateFileUrls(
          sanitizeData(postData.fileUrls),
          // postData.fileUrls,
          +postData.id,
        );
        return {
          statusCode: HttpStatus.OK,
          success: true,
          data: data,
        };
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("save-sponcers-logo-urls")
  @ApiOperation({
    summary: 'Upload sponsor logo URLs',
    description: 'This endpoint allows users to upload and manage sponsor logo URLs. Users can provide updated logo URLs, delete existing logos, and associate logos with a specific form using a unique identifier. It helps in managing sponsor branding on the platform efficiently.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        indexValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signedUrl: { type: 'string', description: 'The signed URL for the uploaded sponsor logo.' },
              filename: { type: 'string', description: 'The name of the uploaded file.' },
              indexId: { type: 'string', description: 'The unique identifier for the logo index.' },
              selectedFile: { type: 'boolean', description: 'Indicates whether the file is selected.' },
              companyWebsiteUrl: { type: 'string', description: 'Partners Website Url If applicable.' }
            },
          },
          description: 'An array of sponsor logo details and their respective indices.'
        },
        deletedFilePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'An array of file paths for logos that need to be deleted.',
        },
        uniqueFormId: {
          type: 'string',
          description: 'A unique identifier for the form related to the sponsor logos.',
        },
      },
      required: ['indexValues', 'uniqueFormId']
    }
  })
  async uploadSponcerLogoUrls(
    @Body() params: {
      indexValues: any,
      deletedFilePaths: string[],
      uniqueFormId: string,
      fileType: $Enums.PartnerFilesTypes
    },
  ) {
    try {
      const data = await this.companiesService.updateSLogoUrls(
        params
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        data: data,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("add-portfolio-perojects")
  @ApiOperation({
    summary: 'Add new portfolio projects',
    description: 'Allows users to add new projects to their portfolio.'
  })
  async addPortfolioProjets(@Body() postData: CompanyProjectInfoDto, @CurrentUser() loggedUser: LoggedInUser) {
    try {

      if (loggedUser?.companies[0].id !== +postData.id) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.id,
      );

      if (companyDetails && companyDetails.userId) {
        // first delete if projects already there as we are going to reinsert
        await this.companiesService.deleteProjectByCompanyId(companyDetails.id);

        // again reinsert the projects
        await this.companiesService.addPortfolioProjets(
          postData.projects,
          postData.id
        );
        return {
          statusCode: HttpStatus.CREATED,
          success: true,
        };
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Delete(":id")
  async deleteportfolioproject(@Param("id") id: number, @CurrentUser() user: LoggedInUser,) {
    try {
      if ( (!user.isPaidUser&& !user.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      return await this.companiesService.deleteSingleProjectById(+id, user.companies[0].id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put(":id/update-about")
  @ApiBody({
    description: 'Details for updating the company’s "about" section',
    schema: {
      type: 'object',
      properties: {
        about: {
          type: 'string',
          description: 'A brief description or overview of the company',
          example: 'We are a global leader in software development and consulting services.',
        },
        profilePdf: {
          type: 'string',
          description: 'A PDF file representing the company’s profile.',
          example: 'https://example.com/profile.pdf',
        },
        profilePdfName: {
          type: 'string',
          description: 'The name of the PDF file.',
          example: 'Company_Profile.pdf',
        },
        deletedFilePath: {
          type: 'string',
          description: 'The file path of the deleted PDF, if any.',
          example: '/uploads/old_profile.pdf',
        },
      },
      required: ['about'],
    },
  })
  async updateAboutOfCompany(
    @Param("id", ParseIntPipe) id: number,
    @Body("about") aboutDetails: string,
    @Body("profilePdf") profilePdf: string,
    @Body("profilePdfName") profilePdfName: string,
    @Body("deletedFilePath") deletedFilePath: string,
    @CurrentUser() loggedUser: LoggedInUser,
  ): Promise<CustomResponse<string>> {
    try {
      if (loggedUser?.companies[0].id !== +id) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      const companyDetails = await this.companiesService.findCompanyById(id);
      if (companyDetails) {
        const aboutDetail: { desc: string } = sanitizeData({ desc: JSON.parse(aboutDetails) });
        await this.companiesService.updateAbout(id, JSON.stringify(aboutDetail.desc), profilePdf, profilePdfName, deletedFilePath);
        // await this.companiesService.updateAbout(id, aboutDetails);
        return new CustomResponse(HttpStatus.OK, true, "Update Success");
      } else {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post("add-certificate-and-diligence")
  @ApiOperation({
    summary: 'Add a certificate and diligence record',
    description: 'This endpoint allows users to add a certificate and related diligence information for a company.'
  })
  @ApiBody({
    description: 'Certificate and diligence information to be added',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', nullable: true, example: 1 },
        companyId: { type: 'integer', example: 123 },
        foundedYear: { type: 'string', format: 'date', example: '2001-01-01' },
        founderName: { type: 'string', example: 'Jane Doe' },
        foundingStoryDescription: { type: 'string', example: 'The company was founded with a mission to innovate.' },
        workModel: { type: 'string', example: 'Remote' },
        platform: {
          type: 'array',
          items: { type: 'string' },
          example: ['Web', 'Mobile']
        },
        gameEngineArray: {
          type: 'array',
          items: { type: 'string' },
          example: ['Unity', 'Unreal Engine']
        },
        certifications: { type: 'string', example: 'ISO 9001, ISO 27001' },
        security: { type: 'string', example: 'Advanced encryption protocols in place.' },
        tools: { type: 'string', example: 'Jira, Confluence, GitHub' },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              country: { type: 'string', example: 'USA' },
              city: { type: 'string', example: 'San Francisco' }
            }
          },
          example: [{ country: 'USA', city: 'San Francisco' }]
        }
      },
      required: ['companyId', 'foundedYear', 'founderName', 'workModel', 'platform']
    }
  })
  async addCertificateAndDiligence(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() postData: any,
    @CurrentUser() loggedUser: LoggedInUser,
  ): Promise<CustomResponse<string>> {
    try {

      if ((loggedUser?.companies[0].id !== +postData.companyId) || (!loggedUser.isPaidUser&& !loggedUser.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.companyId,
      );
      if (companyDetails) {
        const isSuccessfullyCreated =
          // await this.companiesService.createCertificateAndDiligence(postData);
          await this.companiesService.createCertificateAndDiligence(sanitizeData(postData));
        return new CustomResponse(
          isSuccessfullyCreated,
          true,
          "Data added successfully",
        );
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Post('insert-portfolio-album')
  @ApiOperation({
    summary: 'Insert a new portfolio album',
    description:
      'This endpoint allows users to add a new portfolio album'
  })
  async addportfolioalbum(
    @Body() PostData: portfolioAlbumDto,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if ( (!user.isPaidUser&& !user.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const updatedPostData = {
        ...PostData,
        companyId: ((user.companies) && (user.companies[0].id)) ? user.companies[0].id : 1
      };
      return await this.companiesService.createPortfolioAlbum(sanitizeData(updatedPostData));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Delete('delete-portfolio-album/:albumId')
  async deletePortfolio(
    @Param() albumId: { albumId: number },
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if ( (!user.isPaidUser&& !user.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      const album = albumId.albumId;
      return await this.companiesService.deleteAlbumById(album, user.companies[0].id)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("add-service-capability")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add service capabilities',
    description:
      'This endpoint allows users to associate capabilities with a company. ' +
      'The request body requires the company ID and a list of capability IDs that represent the company’s expertise.'
  })
  @ApiBody({
    description: 'The company ID and a list of capabilities to be added',
    schema: {
      type: 'object',
      properties: {
        companyId: {
          type: 'integer',
          description: 'The unique identifier of the company',
          example: 101
        },
        capabilities: {
          type: 'array',
          items: { type: 'integer' },
          description: 'A list of capability IDs representing the company’s services',
          example: [1, 2, 3]
        }
      },
      required: ['companyId', 'capabilities']
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service capabilities were successfully added to the company.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields.'
  })
  async addServiceAndCapabilities(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() postData: any,
    @CurrentUser() loggedUser: LoggedInUser,
  ): Promise<CustomResponse<string>> {
    try {

      if (loggedUser?.companies[0].id !== +postData.companyId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.companyId,
      );
      if (companyDetails) {
        if (postData.services.length <= 3) {
          await this.companiesService.addCapabilities(
            postData.services.sort(),
            postData.capabilities.sort(),
            postData.companyId,
          );
          return new CustomResponse(
            HttpStatus.CREATED,
            true,
            "capabilities added successfully",
          );
        } else {
          throw new BadRequestException();
        }
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("add-contacts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add contacts for an entity',
    description:
      'This endpoint allows users to add a list of contacts associated with an entity. ' +
      'Each contact includes details like name, title, email, LinkedIn profile, and profile picture URL.'
  })
  @ApiBody({
    description: 'The entity ID and an array of contacts to be added',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'The unique identifier of the entity',
          example: 123,
        },
        contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              countryId: { type: 'string', example: 'US', description: 'Country code of the contact' },
              email: { type: 'string', example: 'john.doe@example.com', description: 'Contact email address' },
              linkedInUrl: {
                type: 'string',
                example: 'https://linkedin.com/in/johndoe',
                description: 'LinkedIn profile URL'
              },
              name: { type: 'string', example: 'John Doe', description: 'Name of the contact' },
              title: { type: 'string', example: 'Software Engineer', description: 'Job title of the contact' },
              profilePic: {
                type: 'string',
                example: 'https://example.com/john.jpg',
                description: 'URL of the contact’s profile picture'
              },
              fullprofileUrl: {
                type: 'string',
                example: 'https://example.com/full-profile/john',
                description: 'URL to the full profile of the contact'
              },
            },
            required: ['countryId', 'email', 'name', 'title'],
          },
          description: 'Array of contact objects with detailed information',
        },
      },
      required: ['id', 'contacts'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contacts were successfully added.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields.'
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addContacts(@Body() postData: any, @CurrentUser() loggedUser: LoggedInUser) {
    try {

      if ((loggedUser?.companies[0].id !== +postData.id) ||  (!loggedUser.isPaidUser&& !loggedUser.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.id,
      );
      if (companyDetails) {
        await this.companiesService.addContacts(
          postData.contacts,
          postData.id,
        );
        return new CustomResponse(
          HttpStatus.CREATED,
          true,
          "contacts added successfully",
        );
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Post("report-a-user")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Report a user',
    description:
      'This endpoint allows a logged-in company to report another company for inappropriate behavior or content. ' +
      'The request must include the logged-in company ID, the reported company ID, and a description of the issue.'
  })
  @ApiBody({
    description: 'Details of the report',
    schema: {
      type: 'object',
      properties: {
        loggedCompanyId: {
          type: 'integer',
          description: 'The ID of the company making the report',
          example: 101,
        },
        reportedCompanyId: {
          type: 'integer',
          description: 'The ID of the company being reported',
          example: 202,
        },
        description: {
          type: 'string',
          description: 'Description of the report',
          example: 'This company has been involved in fraudulent activities.',
        },
      },
      required: ['loggedCompanyId', 'reportedCompanyId', 'description'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The report was successfully submitted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields.',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async reportAUser(@Body() postData: { loggedCompanyId: number, reportedCompanyId: number, description: string }, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if (loggedUser?.companies[0].id !== +postData.loggedCompanyId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (postData.loggedCompanyId != postData.reportedCompanyId) {
        const isSuccessReport = await this.companiesService.reportACompany(postData.reportedCompanyId);
        if (isSuccessReport) {
          const isDescriptionAdded = await this.companiesService.addReportDescription(postData);
          if (isDescriptionAdded) {
            return new CustomResponse(HttpStatus.CREATED, true, "success")
          } else {
            throw new BadRequestException();
          }
        } else {
          throw new BadRequestException();
        }
      } else {
        throw new BadRequestException("Reported by and Reported companies are same");
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get(":id/get-contacts")
  @ApiOperation({
    summary: "Retrieve contacts associated with a company by ID",
    description: "This endpoint fetches the contact information for a specific company identified by its unique ID. It provides users with details of the company's contacts, facilitating communication and relationship management."
  })
  async getContacts(
    @Param("id", ParseIntPipe) companyId: number, @CurrentUser() loggedUser: LoggedInUser
  ): Promise<CustomResponse<Contacts[]>> {
    try {
      if (!loggedUser.isPaidUser&& !loggedUser.isSparkUser) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const contacts = await this.companiesService.getContacts(companyId);
      return new CustomResponse(HttpStatus.OK, true, contacts);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get(":id/get-diligence-security")
  @ApiOperation({
    summary: "Retrieve diligence security information for a company by ID",
    description: "This endpoint fetches the diligence security details for a specific company identified by its unique ID."
  })
  async getDiligenceAndSecurity(@Param("id", ParseIntPipe) companyId: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if ((loggedUser?.companies[0].id !== +companyId) || (!loggedUser.isPaidUser&& !loggedUser.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const securityAndDiligence =
        await this.companiesService.getDiligenceAndSecurity(companyId);
      return new CustomResponse(HttpStatus.OK, true, securityAndDiligence);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get(":id/get-portfolio-projects")
  @ApiOperation({
    summary: "Retrieve portfolio projects for a company by ID",
    description: "This endpoint fetches the portfolio projects associated with a specific company identified by its unique ID, providing an overview of the company's past and current projects."
  })
  async getPortfolioProjectDetails(
    @Param("id", ParseIntPipe) companyId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if ((companyId != Number(user.companies[0].id))|| (!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const portfolioProjects =
        await this.companiesService.getPortfolioProjectDetails(companyId);
      return new CustomResponse(HttpStatus.OK, true, portfolioProjects);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get(":id/get-portfolio-albums")
  @ApiOperation({
    summary: "Retrieve portfolio albums for a company by ID",
    description: "This endpoint fetches the portfolio albums associated with a specific company identified by its unique ID, showcasing the company's work and visual projects."
  })
  async getPortfolioAlbumsDetails(
    @Param("id", ParseIntPipe) companyId: number,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if (user?.companies[0].id !== companyId || (!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const portfolioAlbum =
        await this.companiesService.getPortfolioAlbumDetails(companyId);
      return new CustomResponse(HttpStatus.OK, true, portfolioAlbum);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put(":id/update-portfolio-albums")
  @ApiOperation({
    summary: 'Update portfolio albums',
    description: 'This endpoint allows updating the portfolio albums of a specific company, including reordering album entries.'
  })
  @ApiBody({
    description: 'Details for updating and reordering portfolio albums',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'The ID of the portfolio album entry',
            example: 1,
          },
          reOrderingId: {
            type: 'number',
            description: 'The new order ID for reordering the portfolio entry',
            example: 2,
          },
        },
        required: ['id', 'reOrderingId'],
      },
    },
  })
  async updatePortfolioAlbumsDetails(
    @Param("id", ParseIntPipe) companyId: number,
    @Body() postData: { id: number, reOrderingId: number }[],
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if (user?.companies[0].id !== +companyId ||(!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      postData.forEach(async (item) => {
        const updatData = { id: item.id, reOrderingId: item.reOrderingId };
        await this.companiesService.updatePortfolioAlbumsDetails(+companyId, updatData);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Put(":id/update-portfolio-projects")
  @ApiOperation({
    summary: 'Update portfolio projects',
    description: 'This endpoint allows updating the portfolio projects of a specific company, including reordering project entries.'
  })
  @ApiBody({
    description: 'Details for updating and reordering portfolio projects',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'The ID of the portfolio project entry',
            example: 1,
          },
          reOrderingId: {
            type: 'number',
            description: 'The new order ID for reordering the portfolio project',
            example: 2,
          },
        },
        required: ['id', 'reOrderingId'],
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the company whose portfolio projects are being updated',
    example: 123,
  })
  async updatePortfolioProjectsDetails(
    @Param("id", ParseIntPipe) companyId: number,
    @Body() postData: { id: number, reOrderingId: number }[],
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if ((user?.companies[0].id !== +companyId) || (!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      postData.forEach(async (item) => {
        const updatData = { id: item.id, reOrderingId: item.reOrderingId };
        await this.companiesService.updatePortfolioProjectsDetails(+companyId, updatData);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get(":id/get-portfolio-albums-byid")
  @ApiOperation({
    summary: "Retrieve a specific portfolio album by its ID",
    description: "This endpoint fetches details of a specific portfolio album associated with a company, identified by the company's unique ID and the album ID."
  })
  async getPortfolioAlbumsDetailsById(
    @Param("id", ParseIntPipe) albumId: number,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if ((!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      let companyId = 0;
      if (user?.companies[0].id) {
        companyId = user?.companies[0].id;
      }
      const portfolioAlbum =
        await this.companiesService.getPortfolioAlbumDetailsByAlbumId(albumId, companyId);
      return new CustomResponse(HttpStatus.OK, true, portfolioAlbum);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get(":id/get-single-portfolio-project")
  @ApiOperation({
    summary: "Retrieve a specific portfolio project by ID",
    description: "This endpoint fetches details of a specific portfolio project associated with a company, identified by the project's unique ID."
  })
  async getSinglePortfolioProjectDetails(
    @Param("id", ParseIntPipe) projectId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if ((!user.isPaidUser&& !user.isSparkUser)) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const portfolioProjects =
        await this.companiesService.getSinglePortfolioProjectDetails(projectId, user?.companies[0]?.id);
      return new CustomResponse(HttpStatus.OK, true, portfolioProjects);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }

  @Get(":id/getCompanyPortfolio")
  @ApiOperation({
    summary: "Retrieve the portfolio of a company by ID",
    description: "This endpoint fetches the portfolio details of a company identified by its unique ID."
  })
  async getCompanyPortfolio(@Param("id", ParseIntPipe) companyId: number) {
    try {
      const companyImageAndVideoUrls =
        await this.companiesService.getCompanyPortfolio(companyId);
      const imageUrls = companyImageAndVideoUrls.imageUrls;
      // const imagePromises = imageUrls.map(async (imageUrl) => {
      //   return this.gcsService.getSignedUrl(imageUrl.fileUrl);
      // });

      const videoUrls = companyImageAndVideoUrls.videoUrls;

      // const images = await Promise.all(imagePromises);
      const data = {
        images: imageUrls,
        // allUrls: companyImageAndVideoUrls,
        videoUrls: videoUrls,
      };
      return new CustomResponse(HttpStatus.OK, true, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get("/:id/follow-unfollow")
  @ApiOperation({
    summary: "Follow or unfollow a company by ID",
    description: "This endpoint allows users to follow or unfollow a company identified by its unique ID, enabling personalized updates and notifications based on user preferences."
  })
  async followUnfollowCompaniy(@Param("id", ParseIntPipe) followCompanyId: number, @Query("isActive") isActive: string, @CurrentUser() loggedUser: LoggedInUser) {
    try {

      if (loggedUser.userRoles[0].roleCode != 'buyer') {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }

      let isFollowing = true;
      if (isActive && isActive == "false") {
        isFollowing = false
      }
      const theFollow = await this.companiesService.followUnfollowCompanies(loggedUser.isPaidUser, loggedUser.userRoles[0].roleCode, loggedUser.companies[0].id, followCompanyId, isFollowing);
      if (theFollow) {
        return new CustomResponse(HttpStatus.OK, true, theFollow.isActive);
      } else {
        throw new BadRequestException('failed in adding or updating follow')
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Patch('updatetourstatus/:companyId')
  async UpdateTourStatus(
    @CurrentUser() user: LoggedInUser,
    @Param("companyId", ParseIntPipe) companyId: number,
  ) {
    try {
      if (Number(companyId) === Number(user?.companies[0].id)) {
        this.companiesService.updateTour(companyId);
      } else {
        return { success: false, message: "Unauthorized" };
      }

    } catch (error) {
      return { success: false, message: "Failed to Update" };
    }
  }

  @Post("delete-portfoliofiles")
  @ApiOperation({
    summary: 'Delete portfolio files',
    description:
      'This endpoint allows users to delete portfolio files by specifying the file path. ' +
      'The request should contain the filepath of the file to be deleted.'
  })
  @ApiBody({
    description: 'The filepath of the portfolio file to be deleted',
    schema: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'The URL or path of the portfolio file to be deleted',
          example: '/path/to/portfolio/file.jpg',
        },
      },
      required: ['filepath'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The portfolio file was successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields.',
  })
  async updateDeleteStatus(
    @Body() fileUrl: { filepath: string },
    @CurrentUser() user: Users,
  ) {
    try {

      const fileName = fileUrl.filepath;
      if (fileName) {
        await this.gcsService.removeFile(fileName);
        await this.companiesService.removeProfileFile(fileName);
        return {
          success: true,
          message: `File removed successfully${fileName}`,
        };
      } else {
        return { success: false, message: "File URL is missing" };
      }
    } catch (error) {
      console.error("Error removing file:", error);
      return { success: false, message: "Failed to remove file" };
    }
  }

  @Post("add-single-project")
  @ApiOperation({
    summary: 'Add a single project',
    description:
      'This endpoint allows users to add a new project. The request should include project details such as name, creation date, platforms, description, file URLs, and testimonials.'
  })
  @ApiBody({
    description: 'Details of the project to be added',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'The unique identifier for the project (optional)',
          example: 1,
        },
        project: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the project',
              example: 'Project A',
            },
            projectCDate: {
              type: 'string',
              format: 'date-time',
              description: 'The creation date of the project',
              example: '2024-10-01T10:00:00Z',
            },
            platforms: {
              type: 'array',
              items: { type: 'integer' },
              description: 'An array of platform IDs where the project is available',
              example: [1, 2, 3],
            },
            description: {
              type: 'string',
              description: 'A detailed description of the project',
              example: 'This project showcases the development of a mobile application.',
            },
            fileUrls: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    description: 'The type of the file (e.g., image, video)',
                    example: 'image',
                  },
                  fileUrl: {
                    type: 'string',
                    description: 'The URL of the file',
                    example: 'https://example.com/file.jpg',
                  },
                  thumbmail: {
                    type: 'string',
                    description: 'Optional thumbnail URL for the file',
                    example: 'https://example.com/thumb.jpg',
                  },
                },
                required: ['type', 'fileUrl'],
              },
              description: 'An array of file URLs associated with the project',
            },
            testimonial: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the person giving the testimonial',
                  example: 'Jane Doe',
                },
                title: {
                  type: 'string',
                  description: 'Title of the person giving the testimonial',
                  example: 'CEO',
                },
                companyname: {
                  type: 'string',
                  description: 'Company name of the person giving the testimonial',
                  example: 'Company Inc.',
                },
                message: {
                  type: 'string',
                  description: 'The testimonial message',
                  example: 'This project exceeded our expectations!',
                },
              },
              required: ['name', 'title', 'companyname', 'message'],
            },
          },
          required: ['name', 'projectCDate', 'platforms', 'description', 'fileUrls', 'testimonial'],
        },
      },
      required: ['project'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The project was successfully added.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields.',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addSinglProject(@Body() postData: any, @CurrentUser() loggedUser: LoggedInUser) {
    try {

      if ((loggedUser?.companies[0].id !== +postData.id) || (!loggedUser.isPaidUser&& !loggedUser.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.id,
      );
      try {
        if (companyDetails && companyDetails.id) {
          await this.companiesService.addSingleProject(
            sanitizeData(postData.project),
            // postData.project,
            postData.id,
            postData.UniqueFormId,
          );
          return new CustomResponse(
            HttpStatus.CREATED,
            true,
            "contacts added successfully",
          );
        } else {
          throw new BadRequestException();
        }
      } catch (err) {
       if (err instanceof Prisma.PrismaClientKnownRequestError) {
          throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
        } else if (err instanceof Prisma.PrismaClientValidationError) {
          throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
        } else {
          throw new BadRequestException(err.message);
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Patch(":id/update-single-project")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateSinglProject(
    @Param("id", ParseIntPipe) projectId: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() postData: any,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if ((loggedUser?.companies[0].id !== +postData.id) || (!loggedUser.isPaidUser&& !loggedUser.isSparkUser)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }

      const companyDetails = await this.companiesService.findCompanyById(
        postData.id,
      );
      try {
        if (companyDetails && companyDetails.id) {
          await this.companiesService.updateSingleProject(
            sanitizeData(postData.project),
            // postData.project,
            postData.project.deletdFilePaths,
            postData.UniqueFormId,
            postData.id,
            projectId,
          );
          return new CustomResponse(
            HttpStatus.CREATED,
            true,
            "contacts added successfully",
          );
        } else {
          throw new BadRequestException();
        }
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get("/getbyid/:id/:userId")
  @ApiOperation({
    summary: "Get company details and update visit count",
    description: "This endpoint retrieves details of a company identified by its unique ID and updates the visit count. It also adds or updates statistics related to the buyer identified by the provided user ID."
  })
  async findone(@Param("id") spId: number, @Param("userId") user: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      // const companyDetails = await this.companiesService.findCompanyById(+spId);
      if (loggedUser?.companies[0].id !== +user) {
        return new CustomResponse(HttpStatus.FORBIDDEN, true, 'access denied');
      }
      if (user != spId) {
        this.companiesService.addOrUpdateCounts(+user, +spId);
        this.companiesService.addProfileCounts(spId, loggedUser.id)
        if (loggedUser && loggedUser.userRoles[0] && loggedUser.userRoles[0].roleCode == 'buyer') {
          await this.companiesService.addOrUpdateBuyerStats(+user, +spId);
        }
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  @Get('/getthumnail')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: "Retrieve thumbnail for a video",
    description: "This endpoint fetches the thumbnail image for a video based on the provided URL and video type (VIMEO or YOUTUBE)."
  })
  async findThumbnais(
    @Body() PostData: ThumbnailRequestDto
  ) {
    return getThumbnails(PostData.url, PostData.type);
  }
  // import csv file for selecting companies

  @Post("import-companies-csv")
  @UseInterceptors(FileInterceptor("file"))

  @ApiOperation({
    summary: 'Import companies from CSV file',
    description:
      'This endpoint allows users to import companies by uploading a CSV file. ' +
      'The CSV file must contain the necessary fields for each company.'
  })
  @ApiBody({
    description: 'Upload a CSV file containing company details for import',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // Indicates that the file is being uploaded
          description: 'The CSV file to import companies from',
        },
      },
      required: ['file'],
    },
  })
  @ApiConsumes('multipart/form-data') // Indicates that the endpoint consumes form data
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Companies were successfully imported from the CSV file.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or content.',
  })

  async getCompanies(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() loggedUser: LoggedInUser
  ) {
    if (!file) {
      throw new HttpException('File not Supported', HttpStatus.FORBIDDEN);
    }
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const result = await this.companiesService.parseCsvBuffer(file.buffer, 'removespacs');
      const isInsertionSucces = await this.companiesService.getCompaniesToCsv(result);
      // if (!isInsertionSucces) {
      //   throw new BadRequestException("File is not in correct format");
      // }
      return isInsertionSucces;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, err.status, { cause: new Error(err) });
      }
    }
  }




}
