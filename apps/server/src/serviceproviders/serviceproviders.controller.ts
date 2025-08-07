import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  Patch,
  Body,
  BadRequestException,
  HttpStatus,
  Delete,
  Put,
  UnauthorizedException,
  ParseBoolPipe,
  HttpException,
} from "@nestjs/common";
import { ServiceprovidersService } from "./serviceproviders.service";
import { Public } from "src/common/decorators/public.decorator";
import { Exception } from "handlebars";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { $Enums, RATING_STATUS, ROLE_CODE, SECURITY_STATUS, SOW_STATUS, Users,Prisma } from "@prisma/client";
import { CreateServiceproviderDto } from "./dto/create-serviceprovider.dto";
import { CreateRatesByserviceDto } from "./dto/createratebyservice.dto";
import { ProjectPerformanceDto } from "./dto/createbuyerProjectPerformance.dto";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import { decodeEmail, encryptString, generateToken, decodeHtmlEntities, isValidJsonString } from "src/common/methods/common-methods";
import { Announcement } from "src/common/types/common-interface";
import metascraper from 'metadata-scraper';
import { allowedColumnIds } from "src/common/methods/common-methods";

@ApiBearerAuth()
@ApiTags("Serviceproviders")
@Controller("serviceproviders")
export class ServiceprovidersController {
  constructor(
    private readonly serviceprovidersService: ServiceprovidersService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: "Getting service provider companies by search", 
    description: 'This endpoint allows users to search for service provider companies based on specific criteria. The search can be filtered by various parameters such as company name, service type, or location. The response will include a list of companies that match the search criteria, providing relevant details such as company name, services offered, and contact information.'
  })
  findAll(
    @Query("search") searchVal: string,
    @Query("page", ParseIntPipe) start: number = 1,
    @Query("limit", ParseIntPipe) limit: number = 10,
 //   @Query("services") services: string,
  //  @Query("capabilities") capabilities : string,
    @Query("region") region: string,
    @Query("companysize") companysize: string,
    @Query("sortField") sortField: string,
    @Query("sortcolumn") sortColumn: string,
    @Query("sortColumnorder") sortColumnOrder: string,
    @Query("selectedCapabilityId") selectedCapabilityId: string,
    @Query("isPremiumUsersOnly") isPremiumUsersOnly: string,
    @Query("eventsSelected") eventsSelected: string,
    @Query("platform") platforms: string,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
     // const servicesseach = services ? services.split(",") : [];
    //  const capabilitiessearch = capabilities.trim() ? JSON.parse(capabilities) : [];
      const selectedPlatforms = platforms.trim() ? JSON.parse(platforms) : [];
      const eventsSelectedArray = eventsSelected.trim() ? JSON.parse(eventsSelected) : [];
      const selectedCapabilityIdarray = selectedCapabilityId.trim() ? JSON.parse(selectedCapabilityId) : [];
      const companiessizes = companysize ? companysize.split(",") : [];
      const regions = region ? region.split(",") : [];
      const loggedInUser: number = user?.companies[0].id;
      return this.serviceprovidersService.findAll(
        start,
        limit,
        searchVal,
        selectedCapabilityIdarray,
        regions,
        companiessizes,
        sortField,
        sortColumn,
        sortColumnOrder,
        loggedInUser,
        isPremiumUsersOnly,
        eventsSelectedArray,
        selectedPlatforms,
      );
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

  @Post("get-search-filter-stats")
  @ApiOperation({
    summary: "Get search filter statistics",
    description: "This endpoint retrieves statistical data based on a set of search filters. Users can filter results by type, start date, end date, and the place of origin (fromPlace). The response will include relevant statistics that match the given criteria, such as trends or summaries, to help analyze the filtered data."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        fromPlace: { type: 'string' },
      },
    },
  })
  async getSearchFilterStats(@Body() postData: { type: ROLE_CODE | string, startDate: string, endDate: string, fromPlace: string }, @CurrentUser() loggedUser:LoggedInUser,) {
    try{
      if(loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const statsDetails = await this.serviceprovidersService.getSearchFilterStats(postData.type, postData.startDate, postData.endDate, postData.fromPlace);
      return new CustomResponse(HttpStatus.OK, true, statsDetails);
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

  @Get("get-buyers-stats")
  @ApiOperation({
    summary: "Get buyers statistics",
    description: "This endpoint provides statistical insights related to buyers. It retrieves data such as buyer demographics, purchase trends, and other relevant statistics. This information helps analyze buyer behavior and patterns, supporting decision-making and market analysis."
  })
  async getBuyersStats(@CurrentUser() loggedUser:LoggedInUser,) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const statsDetails = await this.serviceprovidersService.getBuyersStats();
      return new CustomResponse(HttpStatus.OK, true, statsDetails);
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

  @Get("get-service-category-stats")
  @ApiOperation({
    summary: "Get Service Category statistics",
    description: "This endpoint provides statistical insights related to sponsored services and categories. It gives the total click counts of each service category and the total number of services."
  })
  async getServiceCategoryStats(@Query("role") role: string, @CurrentUser() loggedUser:LoggedInUser,) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const stats = await this.serviceprovidersService.getServiceCategoryStats(role);
      return new CustomResponse(HttpStatus.OK, true, stats);
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

  @Get("get-service-provider-announcements")
  @ApiOperation({
    summary: "Get the Service Provider Announcements",
    description: "Get the announcemets of the service provider. The response will include the details of the announcements, such as title, description, and any relevant metadata."
  })
  async getServiceProviderannouncements(@CurrentUser() loggedUser:LoggedInUser,) {
    try {
      if((!loggedUser.isPaidUser&&!loggedUser.isSparkUser) && loggedUser.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const announcements = await this.serviceprovidersService.getServiceProviderAnnouncements(loggedUser.companies[0].id); 
      return new CustomResponse(HttpStatus.OK, true, announcements);
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

  @Get("get-announcements-stats")
  @ApiOperation({
    summary: "Get Announcements statistics",
    description: "This endpoint provides statistical insights related to Announcements. This information helps analyze service providers announcements, supporting decision-making and market analysis."
  })
  async getAnnouncementsStats(@CurrentUser() loggedUser:LoggedInUser, @Query("search") searchVal: string,) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const statsDetails = await this.serviceprovidersService.getAnnouncementsStats(searchVal);
      return new CustomResponse(HttpStatus.OK, true, statsDetails);
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

  @Get("get-testmonial-stats")
  @ApiOperation({
    summary: "Get Testimonials statistics",
    description: "This endpoint provides statistical insights related to project testimonial. This information helps analyze service providers testimonials, supporting decision-making and market analysis."
  })
  async getTestmonialsStats(@CurrentUser() loggedUser:LoggedInUser, @Query("search") searchVal: string,) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      const statsDetails = await this.serviceprovidersService.getTestmonialsStats(searchVal);
      return new CustomResponse(HttpStatus.OK, true, statsDetails);
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

  @Get('/linkedin-metaData/:url')
  @ApiOperation({
    summary: "Getting linkedin data for Announcement post",
    description: "By linkedin url we are fetching the linkedin post data tile, description, image for creating announement post"
  })
  async getMeta( @Param("url") url: string, @CurrentUser() loggedUser:LoggedInUser) {
    try {
      if(!loggedUser) {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      if (!url.includes('linkedin.com')) {
        throw new HttpException ( 'Invalid URL.', HttpStatus.FORBIDDEN );
      }
      const metadata = await metascraper({ url });
      const decodedMetadata = Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          key,
          typeof value === 'string' ? decodeHtmlEntities(value) : value,
        ])
      );

      return JSON.stringify(decodedMetadata);
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

  @Get(":id/add-search-string")
  @ApiOperation({
    summary: "Add a search string for a specific entity",
    description: "This endpoint allows adding a search string associated with a specific entity, identified by its ID. The search string can be used for future searches or indexing purposes. This is useful for improving search capabilities and associating custom search terms with the entity."
  })
  async addTheSearchedText(
    @Param("id", ParseIntPipe) userId: number, 
    @Query("search") searchVal: string,
    @Query("fromOpportunity", ParseBoolPipe) fromOpportunity: boolean, 
    @CurrentUser() user: LoggedInUser
  ) {
    try{
    if(+userId == user.id) {
      const addedSearchString = await this.serviceprovidersService.addTheSearchedText(+userId, searchVal, fromOpportunity);
      return new CustomResponse(HttpStatus.OK, true, addedSearchString);
    } else {
      throw new BadRequestException("Access Denied")
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

  @Get(":id/add-checked-service-capabilities")
  @ApiOperation({
    summary: "Add checked service capabilities for a specific entity",
    description: "This endpoint allows adding or updating service capabilities for a specific entity, identified by its ID. These capabilities represent the services the entity can provide, and checking them ensures they are actively offered. The updated capabilities will be associated with the entity and can be used for future service-related operations."
  })
  async addTheCheckedService(
    @Param("id", ParseIntPipe) userId: number, 
    @Query("service") serviceVal: string, 
    @Query("capability") capabilityVal: string,
    @Query("fromOpportunity", ParseBoolPipe) fromOpportunity: boolean,
    @CurrentUser() user: LoggedInUser
  ) {
     try {
          if(+userId == user.id) {
          if(serviceVal && serviceVal != "") {
            await this.serviceprovidersService.addTheServiceText(+userId, serviceVal, fromOpportunity);
          }
          if(capabilityVal && capabilityVal != "") {
            await this.serviceprovidersService.addTheCapabilityText(+userId, capabilityVal, fromOpportunity);
          }   
         return new CustomResponse(HttpStatus.OK, true, "success");
    } else {
      throw new BadRequestException("Access Denied")
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
  

  @Post("")
  @ApiOperation({
    summary: "Find all service providers with filters",
    description: "This endpoint retrieves a list of service providers based on the provided filters. Users can shuffle the results using the `needsSuffle` parameter, specify multiple `listIds` for targeted results, and control pagination with the `recordsPerPage` parameter. The response will return a filtered and paginated list of service providers, helping users find relevant services efficiently."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        needsSuffle: { type: 'number' },
        listIds: {
          type: 'array',
          items: { type: 'number' }
        },
        recordsPerPage: { type: 'number' },
      },
      // required: ['needsSuffle', 'listIds', 'recordsPerPage'],
    },
  })
  async findAllSPs(@Body() postData: {needsSuffle: number, listIds: number[], recordsPerPage: number}, @CurrentUser() loggedUser:LoggedInUser ) {
    try{
      let sPsDetails: any[] = [];
    if(postData.needsSuffle && postData.needsSuffle == 1) {
      
      const shuffledSPsIds = await this.serviceprovidersService.getShuffledServiceProvidersIds();
      let count = shuffledSPsIds.length;
      if(shuffledSPsIds.length > 0) {
        if(shuffledSPsIds.length > postData.recordsPerPage) {
          const toGetDetailsOfList = shuffledSPsIds.slice(0, postData.recordsPerPage);
          sPsDetails = await this.serviceprovidersService.getShuffledServiceProvidersDetails(toGetDetailsOfList, loggedUser.companies[0].id);
        } else {
          sPsDetails = await this.serviceprovidersService.getShuffledServiceProvidersDetails(shuffledSPsIds, loggedUser.companies[0].id);
        }
      }
      return {
        list: sPsDetails,
        shuffledIds: shuffledSPsIds,
        success: true,
        statusCode: HttpStatus.OK,
        totalpages: count,
      }
    } else {
      sPsDetails = await this.serviceprovidersService.getShuffledServiceProvidersDetails(postData.listIds, loggedUser.companies[0].id);
      return {
        list: sPsDetails,
        success: true,
        statusCode: HttpStatus.OK,
        totalpages: 0
      }
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

  @Get("/serviceslist")
  @ApiOperation({
    summary: "Get list of services",
    description: "This endpoint retrieves a comprehensive list of services available in the system. The response includes details about each service, such as the service name, description, and other relevant information. This is useful for displaying all services to users or for further filtering and selection."
  })
  async findAllServices() {
    try {
      return await this.serviceprovidersService.findServiceslist();
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

  @Get("/regionslist")
  @ApiOperation({
    summary: "Get list of regions",
    description: "This endpoint retrieves a list of all available regions. The response includes region details such as region names and IDs, which can be used for filtering or categorization in other operations. It helps users select or view all regions relevant to their search or data needs."
  })
  async findAllRegions() {
    try {
      return await this.serviceprovidersService.findRegionslist();
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

  @Get("/companysizeslist")
  @ApiOperation({
    summary: "Retrieve a list of company sizes",
    description: "This endpoint provides a list of available company sizes that can be used for categorizing businesses. The response includes various size categories such as small, medium, and large, along with their corresponding definitions. This information is useful for users looking to filter or segment companies based on their size."
  })
  async findAllCompanysizes() {
    try {
      return await this.serviceprovidersService.findCompanySizeslist();
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

  @Get("foundingsponsors")
  @ApiOperation({
    summary: "Retrieve founding sponsors",
    description: "This endpoint returns a list of founding sponsors associated with the application or project. It provides details about each sponsor, such as their name, contribution level, and any relevant information that highlights their role in supporting the initiative. This data is useful for understanding the backing behind the project and acknowledging the contributions of sponsors."
  })
  findAllsponsers() {
    try {
      return this.serviceprovidersService.findSponsers();
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

  @Get("getmylist/:userid")
  @ApiOperation({
    summary: "Retrieve user's service provider list",
    description: "This endpoint fetches the list of service providers associated with a specific user, identified by the user ID. The response will include relevant details about the service providers, allowing the user to view and manage their saved or preferred service providers easily."
  })
  findMyListbyId(@Param("userid") userId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
      }
      if(userId && +userId == user.id){
        return this.serviceprovidersService.findMyList(userId);
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  @Get("getmyprojects/:userid")
  @ApiOperation({
    summary: "Get projects for a specific user",
    description: "This endpoint retrieves a list of projects associated with a specific user, identified by their user ID. It returns project details such as project name, status, and relevant timestamps, allowing users to view their active and completed projects. This is useful for users to manage and track their project involvement."
  })
  findMyProjectsById(@Param("userid") userId: number) {
    try {
      return this.serviceprovidersService.findMyProjects(userId);
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

  @Post("/addcompaniestomylist")
  @ApiOperation({
    summary: "Add companies to user's list",
    description: "This endpoint allows a user to add companies to their personal list. The request requires the user's ID (`loggedUserId`), an array of company IDs (`companies`) to be added, and an array of existing list IDs (`mylist`) for reference. Additionally, a new list name (`newlistname`) can be provided to create or update a list of companies. The response will confirm the addition of the companies to the specified list."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loggedUserId: { type: 'number' },
        companies: { 
        type: 'array',
        items: { type: 'number' }
       },
        mylist: { 
        type: 'array',
        items: { type: 'number' }
       },
        newlistname: { 
        type: 'string',
        items: { type: 'number' }
       },
      },
    },
  })
  addCompaniesToMyList(
    @Body() companieses: {
      loggedUserId: number;
      companies: number[];
      mylist: number[];
      newlistname: string;
    }, @CurrentUser() user: LoggedInUser
  ) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider"){
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
      if(companieses && companieses.loggedUserId) {
        if(user && user.id == companieses.loggedUserId) {
          return this.serviceprovidersService.addCompaniesToMyList(companieses, user.companies[0]?.id);
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  @Post("/addListsToMyProjects")
  @ApiOperation({
    summary: "Add lists of companies to a project",
    description: "This endpoint allows a user to add selected lists of companies to a specific project. The user must provide their ID (`loggedUserId`), an array of company IDs (`companies`), an array of list IDs (`mylist`), and the `projectId` where the lists will be added. Optionally, a new list can be created with the `newlistname` parameter. The response will confirm the addition of the lists to the project."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loggedUserId: { type: 'number' },
        companies: { 
        type: 'array',
        items: { type: 'number' }
       },
        mylist: { 
        type: 'array',
        items: { type: 'number' }
       },
        newlistname: { 
        type: 'string',
        items: { type: 'number' }
       },
       projectId: { type: 'number' },
      },
    },
  })
  addListsToMyProjects(
    @Body()
    companieses: {
      loggedUserId: number;
      companies: number[];
      mylist: number[];
      newlistname: string;
      projectId: number;
    }, @CurrentUser() user: LoggedInUser
  ) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider"){
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
      if(companieses && companieses.loggedUserId) {
        if(user && user.id == companieses.loggedUserId) {
          return this.serviceprovidersService.addListsToMyProjects(companieses);
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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

  @Post("/addcompaniestomyproject")
  @ApiOperation({
    summary: "Add companies to my project",
    description: "This endpoint adds the select companies to my projects"
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loggedUserId: { type: 'number' },
        companies: {
          type: 'array',
          items: { type: 'number' },
        },
        mylist: {
          type: 'array',
          items: { type: 'number' },
        },
        newlistname: { type: 'string' },
      },
      required: ['loggedUserId', 'companies', 'mylist', 'newlistname'],
    },
  })
  addCompaniesToMyProject(
    @Body()
    companieses: {
      loggedUserId: number;
      companies: number[];
      mylist: number[];
      newlistname: string;
    },
  ) {
    try {
      const response =
        this.serviceprovidersService.addCompaniesToMyProject(companieses);
      return response;
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

  @Get("/company-size")
  @ApiOperation({
    summary: "Get service provider companies by size",
    description: "This endpoint retrieves service provider companies filtered by their size. The `val` query parameter represents the company size to filter by, such as 'small', 'medium', or 'large'. The response will return a list of companies that match the specified size criteria."
  })
  getCompanySize(@Query("val") val: string) {
    try{
      const company = this.serviceprovidersService.findCompanyBySize(val);
    return company;
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

  @Get("/service-name")
  @ApiOperation({
    summary: "Get service provider companies by filtering services",
    description: "This endpoint retrieves a list of service provider companies based on specified service filters. Users can filter companies by the type of services they offer, allowing them to find relevant providers that match their needs. The response will include a list of companies offering the requested services, along with relevant details such as company name and service capabilities."
  })
  getService(@Query("val") val: string) {
    try{
      const company = this.serviceprovidersService.findServiceByName(val);
    return company;
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

  @Get("/getbyid/:id")
  @ApiOperation({
    summary: "Get service provider company details by ID",
    description: "This endpoint retrieves detailed information about a specific service provider company based on its unique ID. The `id` parameter is required to identify the company, and the response will include the company's details, such as name, services offered, contact information, and other relevant data."
  })
  findone(@CurrentUser() user: LoggedInUser, @Param("id") spId: number) {
    try {
      if (user && !user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode == "service_provider") {
        return this.serviceprovidersService.getSPDetailsForFreeUser(spId, user.id);
      } else {
        return this.serviceprovidersService.findone(spId, user.companies[0].id);
      }
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

  @Get("/get-countries")
  @ApiOperation({
    summary: "Get service provider companies filtered by countries",
    description: "This endpoint retrieves a list of service provider companies filtered by countries. Users can obtain information about service providers based on their country of operation. The response will include companies associated with each country, allowing for a geographically filtered search of service providers."
  })
  async getAllCountries() {
    try {
      return this.serviceprovidersService.getAllCountries();
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

  @Get("/get-platforms")
  @ApiOperation({
    summary: "Get service providers filtered by platforms",
    description: "This endpoint retrieves a list of service provider companies filtered by the platforms they operate on. The response will include companies that offer services on specified platforms, helping users find providers based on platform-specific criteria."
  })
  async getAllPlatforms() {
    try {
      return this.serviceprovidersService.getAllPlatforms();
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

  @Get("/gethomepage/:userId/:todaydate")
  @ApiOperation({
    summary: "Getting homepage data",
    description: "This endpoint retrieves the homepage data for a user on the XDS Spark platform. The current date of articles, fresh and updated companies, just joined companies, my lists, my projects, recently viewed profiles, company admin users, populer buyer, events and etc are displayed."
  })
  async getHomePageApi(
    @Param("userId") userId: number,
    @Param("todaydate") todaydate: string) {
    try {
      const secretKey = process.env.EMAIL_SECRET_KEY;
      const date = decodeEmail(todaydate, secretKey);
      return this.serviceprovidersService.getAllHomePageApis(userId, date);
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

  //Creating buyer notes ----------------------------------------------------------------------------------------------------------

  @Get("/get-all-notes/:companyId")
  @ApiOperation({
    summary: "Get all notes for a specific company in my spark tab",
    description: "This endpoint retrieves all notes associated with a specified company, identified by the `companyId` parameter. Users can access their notes stored in the Spark tab, allowing for efficient organization and management of information relevant to the company. The response will include a list of notes along with their details, helping users to review and utilize the information effectively."
  })
  async getAllNotesFromBuyer(@Param("companyId") companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(user && user.id) {
        if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
          throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
        }
        const buyerNotes = await this.serviceprovidersService.getAllNotesFromBuyer(user.companies[0]?.id, +companyId);
        return {
          buyerNotes: buyerNotes,
          success: true,
          StatusCode: HttpStatus.OK,
        }
      } else {
        throw new UnauthorizedException();
      }
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

  @Post("/add-new-note")
  @ApiOperation({
    summary: "Add a new note for a buyer and company in my spark tab",
    description: "This endpoint allows users to add a new note associated with a specific buyer and company. The request requires the `buyerId` and `companyId` to identify the entities involved, along with a `title` and the content of the `note`. The response will confirm the successful creation of the note and provide details of the newly added entry."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        title: { type: 'string' },
        note: { type: 'string' },
      },
    },
  })
  async saveprojectreview(@Body() createprojectreview: CreateServiceproviderDto, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
      }
      if((user?.companies[0]?.id !== +createprojectreview.buyerId)){
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
      }
      const getCompanyIds = await this.serviceprovidersService.getCompanyById(+createprojectreview.companyId);
      if (getCompanyIds) {
        if(createprojectreview.companyId !== createprojectreview.buyerId){
           const res = await this.serviceprovidersService.saveprojectreview(sanitizeData(createprojectreview));
           if(res) {
              await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, createprojectreview.companyId);
           }
           return res;
        } else {
          return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
        }
      } else {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
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
  
  @Get("/getnotes/:noteId")
  @ApiOperation({
    summary: "Retrieve a specific note by ID in my spark tab",
    description: "This endpoint fetches the details of a specific note using its unique identifier (`noteId`). The response will include the note's content, creation date, last modified date, and any associated metadata. This is useful for viewing or editing an individual note within the application."
  })
  async getbuyerNotes(@Param("noteId") noteId: number, @CurrentUser () user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      return this.serviceprovidersService.getbuyerNotes(+noteId, user?.companies[0]?.id);
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

  @Delete("/:noteId/delete-note")
  @ApiOperation({
    summary: "Delete a specific note in my spark tab",
    description: "This endpoint allows users to delete a note identified by its unique `noteId`. Upon successful deletion, the note will be removed from the database, and the response will confirm the deletion. This is useful for managing notes and ensuring that outdated or unwanted notes are effectively removed."
  })
  async removeNote(@Param("noteId") id: string, @CurrentUser () user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const theNoteCreatedCompany = await this.serviceprovidersService.getCreatedNoteCompany(+id);
      if(theNoteCreatedCompany && theNoteCreatedCompany.sPBuyerNoteId?.id) {
        if(user && user.companies[0].id == theNoteCreatedCompany.sPBuyerNoteId?.id) {
          await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, theNoteCreatedCompany.sPNotecompanyId.id);
          return this.serviceprovidersService.remove(+id);
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  @Put("/:noteId/update-note")
  @ApiOperation({
    summary: "Update a note by ID in my spark tab",
    description: "This endpoint allows users to update an existing note identified by its `noteId`. The request should include the updated note content and any relevant metadata. The response will confirm the successful update of the note, including the updated details. This is useful for modifying notes with new information or corrections."
  })
  async updateNote(@Param("noteId") id: string, @Body() updateNoteData: CreateServiceproviderDto, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const theNoteCreatedCompany = await this.serviceprovidersService.getCreatedNoteCompany(+id);
      if(theNoteCreatedCompany && theNoteCreatedCompany.sPBuyerNoteId?.id) {
        if(user && user.companies[0].id == theNoteCreatedCompany.sPBuyerNoteId?.id && user.companies[0].id == updateNoteData.buyerId) {
          await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, theNoteCreatedCompany.sPNotecompanyId.id);
          return this.serviceprovidersService.updateNote(+id, sanitizeData(updateNoteData));
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  //Creating buyer ratesby service ----------------------------------------------------------------------------------------------------------
  @Post("/add-service-rates")
  @ApiOperation({
    summary: "Add service rates for a company in my spark tab",
    description: "This endpoint allows users to add service rates for a specific company. The request requires the `buyerId` to identify the buyer, the `companyId` for the service provider, and details about the service, including `dayRate`, `monthlyRate`, `discountRate`, and any additional `notes`. The response will confirm the successful addition of the service rates, enabling better management of service pricing."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        service: { type: 'string'},
        dayRate: { type: 'string'},
        montlyRate:{ type: 'string'},
        discountRate: { type:'string'},
        notes: { type:'string'},
      },
    },
  })
  async createratesbyservice(@Body() createserviceRates: CreateRatesByserviceDto, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      if(createserviceRates && createserviceRates.buyerId) {
        const getCompanyIds = await this.serviceprovidersService.getCompanyById(+createserviceRates.companyId);
        if (getCompanyIds) {
          if(user && user.companies[0].id == createserviceRates.buyerId) {
            const res = await this.serviceprovidersService.saveratesbyservice(sanitizeData(createserviceRates));
            await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, createserviceRates.companyId);
            return res;
          } else {
            throw new HttpException('access denied',HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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

  @Get("/getServiceRates/:noteId")
  @ApiOperation({
    summary: "Retrieve service rates by ID in my spark tab",
    description: "This endpoint allows users to retrieve detailed information about a specific service rate identified by its `servicerateId`. The response will include all relevant details associated with the service rate, such as pricing, applicable services, and any additional terms or conditions. This is useful for users seeking to understand the cost structure for specific services."
  })
  async getServiceRates(@Param("noteId") noteId: number) {
    try {
      return this.serviceprovidersService.getServiceRates(+noteId);
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

  @Get("/getAllServiceRates/:companyId")
  @ApiOperation({
    summary: "Retrieve all service rates for a company in my spark tab",
    description: "This endpoint retrieves a list of all service rates associated with a specific company, identified by `companyId`. The response will include details about each service rate, such as service type, pricing, and any applicable terms. This information helps users understand the pricing structure for the company's services."
  })
  async getAllServiceRates(@Param("companyId") companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      return this.serviceprovidersService.getAllServiceRates(user.companies[0]?.id, +companyId);
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

  @Delete("/:serviceId/delete-service-rate")
  @ApiOperation({
    summary: "Delete a service rate by ID in my spark tab",
    description: "This endpoint allows users to delete a specific service rate identified by its `serviceId`. The request will remove the service rate from the database, and the response will confirm the successful deletion. This is useful for managing and maintaining accurate service rates in the system."
  })
  async deleteService(@Param("serviceId") serviceId: string, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const rateAddedByCompany = await this.serviceprovidersService.rateAddedByCompanyGet(+serviceId)
      if(rateAddedByCompany && rateAddedByCompany.sPBuyerRateId?.id) {
        if(user && user.companies[0].id == rateAddedByCompany.sPBuyerRateId?.id) {
          await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, rateAddedByCompany.sPBuyerRateCompanyId.id);
          return this.serviceprovidersService.deleteService(+serviceId);
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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

  @Put("/:serviceId/update-service-rates")
  @ApiOperation({
    summary: "Update service rates for a specific service in my spark tab",
    description: "This endpoint allows users to update the rates associated with a specific service identified by its `serviceId`. The request must include the buyer's ID (`buyerId`), the company ID (`companyId`), and details about the service such as `dayRate`, `monthlyRate`, `discountRate`, and any additional `notes`. The response will confirm the successful update of the service rates, ensuring accurate pricing information."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        service: { type: 'string'},
        dayRate: { type: 'string'},
        montlyRate:{ type: 'string'},
        discountRate: { type:'string'},
        notes: { type:'string'},
      },
    },
  })
  async updateService(@Param("serviceId") id: string, @Body() updateserviceData: CreateRatesByserviceDto, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const rateAddedByCompany = await this.serviceprovidersService.rateAddedByCompanyGet(+id)
      if(rateAddedByCompany && rateAddedByCompany.sPBuyerRateId?.id) {
        if(user && user.companies[0].id == rateAddedByCompany.sPBuyerRateId?.id) {
          await this.serviceprovidersService.addOrUpdateUpdatedAt(user.companies[0].id, rateAddedByCompany.sPBuyerRateCompanyId.id);
          return this.serviceprovidersService.updateService(+id, sanitizeData(updateserviceData));
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  // creating table project performance ---------------------------------------------------------------------------------------------

  @Get("get-all-project-performance-reviews/:companyId")
  @ApiOperation({
    summary: "Retrieve all project performance reviews for a company",
    description: "This endpoint retrieves a list of all performance reviews related to projects associated with a specific company, identified by `companyId`. The response will include detailed information about each review, such as review scores, comments, and relevant project data. This is useful for evaluating project outcomes and performance metrics within the context of the specified company."
  })
  async getAllProjectPerformanceReviews(@Param("companyId") companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(user && user.id) {
        if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode == "service_provider") {
          throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
        }
        const performanceReviews = await this.serviceprovidersService.getAllProjectPerformanceReviews(user.companies[0]?.id, +companyId);
        const allServices = await this.serviceprovidersService.findServiceslist();
        return {
          allServices: allServices.list,
          performanceReviews: performanceReviews,
          success: true,
          StatusCode: HttpStatus.OK,
        }
      } else {
        throw new UnauthorizedException();
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

  @Post("/create-project-performance") 
  @ApiOperation({
    summary: "Create a project performance review",
    description: "This endpoint allows users to create a new performance review for a project. The request requires the logged company ID (`buyerId`), the company's ID (`companyId`), the project name (`projectname`), and an array of services provided, along with performance ratings for quality, on-time delivery, communication, and overall rating. A comment can also be included for additional feedback. The response will confirm the successful creation of the project performance review."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        projectname: { type: 'string'},
        services: {
          type: 'array',
          items: { 
            type: 'object', 
            properties: { 
              serviceId: { type: 'number' } 
            }
          }
        },
        quality:{ type: 'number'},
        onTimeDelivery: { type:'number'},
        communication: { type:'number'},
        overallRating: { type:'number'},
        comment: { type:'string'},
      },
    },
  })
  async createProjectperformances(@Body() projectPerformanceData: {
    buyerId: number;
    companyId: number;
    projectname: string;
    services: [
      { serviceId: number }
    ];
    quality: number;
    onTimeDelivery:number;
    communication: number;
    overallRating: number;
    comment: string;
  }, @CurrentUser() user: LoggedInUser) {
    {
      try {
        if(projectPerformanceData && projectPerformanceData.buyerId) {
          if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
            throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
          }
          const getCompanyIds = await this.serviceprovidersService.getCompanyById(+projectPerformanceData.companyId);
          if (getCompanyIds) {
            if(user && user.companies[0].id == projectPerformanceData.buyerId) {
              if (projectPerformanceData.communication >= 0 && projectPerformanceData.communication <= 5 && projectPerformanceData.onTimeDelivery >= 0 && projectPerformanceData.onTimeDelivery <= 5 && projectPerformanceData.overallRating >= 0 && projectPerformanceData.overallRating <= 5 && projectPerformanceData.quality >= 0 && projectPerformanceData.quality <= 5) {
                return this.serviceprovidersService.createProjectperformance(sanitizeData(projectPerformanceData));
              } else {
                throw new HttpException('Incorrect ratings',HttpStatus.FORBIDDEN);
              }
            } else {
              throw new HttpException('access denied',HttpStatus.FORBIDDEN);
            }
          } else {
            throw new HttpException('access denied',HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
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
  }

  @Get("/getprojectPerformance/:projectId")
  @ApiOperation({
    summary: "Retrieve performance review for a specific project",
    description: "This endpoint retrieves the performance review details for a specific project identified by `projectId`. The response includes information such as quality ratings, on-time delivery scores, communication metrics, overall ratings, and any associated comments. This is useful for assessing the performance of the project and identifying areas for improvement."
  })
  async getprojectPerformance(@Param("projectId") projectId: number) {
    try {
      return this.serviceprovidersService.getprojectPerformance(+projectId);
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

  @Delete("/:projectId/delete-project")
  @ApiOperation({
    summary: "Delete a project by ID",
    description: "This endpoint allows users to delete a specific project identified by its `projectId`. Upon successful deletion, the project will be removed from the database, and the response will confirm the deletion. This action is useful for removing outdated or unnecessary projects from the system."
  })
  async deleteProject(@Param("projectId") projectId: string, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const companyId = user.companies[0].id;
      const checkPerformanceReviewAddedBy = await this.serviceprovidersService.thePerformanceBelongsTo(+projectId);
      if(checkPerformanceReviewAddedBy && checkPerformanceReviewAddedBy.spProject.sPBuyerCompanyId.id){
        if(checkPerformanceReviewAddedBy.spProject.sPBuyerCompanyId.id == companyId) {
          return this.serviceprovidersService.deleteProject(+projectId);
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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

  @Put("/:projectId/update-project")
  @ApiOperation({
    summary: "Update a project by ID",
    description: "This endpoint allows users to update the details of an existing project identified by its `projectId`. The request should include the updated project information such as project name, associated services, performance metrics, and any other relevant details. The response will confirm the successful update of the project, providing the updated project details. This is useful for making changes to project specifications or correcting existing information."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        projectname: { type: 'string'},
        services: {
          type: 'array',
          items: { 
            type: 'object', 
            properties: { 
              serviceId: { type: 'number' } 
            }
          }
        },
        quality:{ type: 'number'},
        onTimeDelivery: { type:'number'},
        communication: { type:'number'},
        overallRating: { type:'number'},
        comment: { type:'string'},
      },
    },
  })
  async updateProject(@Param("projectId") id: string, @Body() updateserviceData: {
    buyerId: number;
    companyId: number;
    projectname: string;
    services: [
      { serviceId: number }
    ];
    quality: number;
    onTimeDelivery:number;
    communication: number;
    overallRating: number;
    comment: string;
    }, @CurrentUser() user: LoggedInUser) 
    
    {
      try {
        if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
          throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
        }
        const companyId = user.companies[0].id;
        const checkPerformanceReviewAddedBy = await this.serviceprovidersService.thePerformanceBelongsTo(+id);
        if(checkPerformanceReviewAddedBy && checkPerformanceReviewAddedBy.spProject.sPBuyerCompanyId.id){
          if(checkPerformanceReviewAddedBy.spProject.sPBuyerCompanyId.id == companyId && checkPerformanceReviewAddedBy.spProject.sPBuyerCompanyId.id == updateserviceData.buyerId) {
            if(updateserviceData.quality >= 0 && updateserviceData.quality <= 5 && updateserviceData.onTimeDelivery >= 0 && updateserviceData.onTimeDelivery <= 5 && updateserviceData.communication >= 0 && updateserviceData.communication <= 5 && updateserviceData.overallRating >= 0 && updateserviceData.overallRating <= 5) {
              return this.serviceprovidersService.updateProject(+id, sanitizeData(updateserviceData));
            }else {
              throw new HttpException('Incorrect ratings',HttpStatus.FORBIDDEN);
            }
          } else {
            throw new HttpException('access denied',HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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

// Overall buyer ratings on sp --------------------------------------------------------------------------------------------------

  @Put("/rating-review-status") 
  @ApiOperation({
    summary: "creating and updating rating and review status",
    description: "This endpoint allows users to update the rating and review status for a specific buyer and company. The request must include the logged ID (`buyerId`), the company's ID (`companyId`), and various attributes such as the preferred partner (`prefferedPartner`), performance rating (`performanceRating`), non-disclosure agreement status (`nonDiscloser`), master service information (`masterService`), and security status (`securityStatus`). The response will confirm the successful update of the rating and review status."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number' },
        companyId: { type: 'number' },
        prefferedPartner: { type: 'string'},
        performanceRating:{ type: 'number'},
        nonDiscloser: { type:'string'},
        masterService: { type:'string'},
        securityStatus: { type:'string'},
        sowStatus: { type: 'string' }
      },
    },
  })
  async createOverallRatings(@Body() overallPerformanceData: {
    buyerId: number;
    companyId: number;
    prefferedPartner: RATING_STATUS;
    performanceRating: number;
    nonDiscloser: RATING_STATUS;
    masterService: RATING_STATUS;
    securityStatus: SECURITY_STATUS;
    sowStatus: SOW_STATUS;
  }, @CurrentUser() user: LoggedInUser) {
    {
      try {
        if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
          throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
        }
        if(overallPerformanceData && overallPerformanceData.buyerId) {
          if(user && user.companies[0].id == overallPerformanceData.buyerId) {
            return this.serviceprovidersService.createOverallRatings(sanitizeData(overallPerformanceData));
          } else {
            throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
          }
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
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
  }
  
  @Get("/getOverallRatings/:companyId")
  @ApiOperation({
    summary: "Retrieve overall ratings for a company",
    description: "This endpoint retrieves the overall ratings for a specified company, identified by `companyId`. The response will include aggregated rating data such as quality, on-time delivery, communication, and overall performance metrics. This information is valuable for assessing the company's performance and understanding customer feedback."
  })
  async getOverallRatings(@Param("companyId") companyId: number, @CurrentUser () user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode == "service_provider") {
        throw new HttpException('access denieded',HttpStatus.UNAUTHORIZED);
      }
      return this.serviceprovidersService.getOverallRatings(+companyId, user.companies[0]?.id);
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
 
  @Get("/getAlbumFilesById/:albumId")
  @ApiOperation({
    summary: "Retrieve files from an album by album ID",
    description: "This endpoint retrieves all files associated with a specific album, identified by the `albumId`. The response will include details of each file, such as file names, types, sizes, and other relevant metadata. This is useful for users to access and manage the contents of their albums efficiently."
  })
  
  async findAlbumImages(@Param("albumId") albumId: string, @CurrentUser() loggedUser: LoggedInUser){
    try{
      if(loggedUser) {
        if(!loggedUser.isPaidUser && !loggedUser.isSparkUser && loggedUser.userRoles[0].roleCode == "buyer") {
          // const checkTheAlbumBelogsTocompany = await this.serviceprovidersService.checkTheAlbumBelogsTocompany(+albumId);
          // if(checkTheAlbumBelogsTocompany) {
          //   const checkTheAlbumIdValid = await this.serviceprovidersService.checkValidityOfAlbumId(+albumId, checkTheAlbumBelogsTocompany.portfolioAlbum.companies.id)
          //   if(checkTheAlbumIdValid) {
              return this.serviceprovidersService.findAlbumImages(albumId);
          //   } else {
          //     throw new HttpException('access denied',HttpStatus.FORBIDDEN);
          //   }
          // }
        } else if(!loggedUser.isPaidUser && loggedUser.userRoles[0].roleCode == "service_provider") {
          throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
        }
        return this.serviceprovidersService.findAlbumImages(albumId);
      }
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

  @Get("/activeevents")
  @ApiOperation({
    summary: "Retrieve active events",
    description: "This endpoint retrieves a list of all currently active events. The response will include details such as event names, dates, locations, and any relevant information about each event. This is useful for users looking to participate in or learn more about ongoing events."
  })
  async findActiveEvents(){
    try {
      return this.serviceprovidersService.findActiveEventsService();
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

  @Get('/find-sponsered-services')
  @ApiOperation({
    summary: "Retrieve sponsored services",
    description: "This endpoint retrieves a list of services that are currently sponsored. It provides details about each sponsored service, including descriptions, benefits, and any promotional information. This is useful for users looking to explore available sponsored services and take advantage of special offerings."
  })
  async findSponseredServices(@Query("currentDate") currentDate: string){
    try {
      const secretKey = process.env.EMAIL_SECRET_KEY;
      currentDate = decodeEmail(currentDate, secretKey);
      return this.serviceprovidersService.findSponseredServices(currentDate);
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
  @Get('update-company-slug')
  @ApiOperation({
    summary: "Update the slug for a company",
    description: "This endpoint allows users to update the URL-friendly slug associated with a specific company. The request requires the company's unique identifier to fetch and update the slug. This is useful for improving SEO and creating user-friendly URLs that represent the company's name or purpose."
  })
  async updateslug(){
    return;
    return await this.serviceprovidersService.updateSlug();
  }

  @Post("get-company-details-by-ids")
  @ApiOperation({
    summary: "Retrieve company details by IDs",
    description: "This endpoint allows users to fetch detailed information about multiple companies based on their IDs. The request should include an array of company IDs, and the response will provide comprehensive details for each company, including name, services offered, contact information, and other relevant data. This is useful for users needing to gather information about specific companies quickly."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyIds: { type: 'array', items: { type: 'number'} },
      },
    },
  })
  async getCompaniesForComparing(
    @Body() postData: {companyIds: number[]},
    @CurrentUser() loggedUser: LoggedInUser
  ) {
    try{
      if(!loggedUser.isPaidUser && !loggedUser.isSparkUser&& loggedUser.userRoles[0].roleCode === "service_provider"){
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      const companyIds = Array.from(new Set(postData.companyIds.slice(0, 5)));
      const companiesDetailsArr = [];
      for(const id of companyIds) {
        const companyDetails = await this.serviceprovidersService.findone(id, loggedUser.id);
        companiesDetailsArr.push(companyDetails.list);
      }
      // const finalItem: any = {};
      // const ids = [];
      // const companyLogoNames = [];
      // const companySiteSizeYears = [];
      // const services = [];
      // const certificates = [];
      // const securities = [];
      // const platforms = [];
      // const gameEngines = [];
      // const toolsAndSws = [];
      // const locations = [];
      // const projects = [];
      // for(let item of companiesDetailsArr) {
      //   if(item && item.id) {
      //     ids.push(item.id);

      //     const nameAndLogo: any = {}
      //     if(item.name) {
      //       nameAndLogo.name = item.name;
      //     }
      //     if(item.logoAsset) {
      //       nameAndLogo.logoAsset = item.logoAsset;
      //     }
      //     companyLogoNames.push(nameAndLogo);

      //     const siteSizeYear: any = {}
      //     if(item.website){
      //       siteSizeYear.website = item.website;
      //     }
      //     if(item.companySizes?.size) {
      //       siteSizeYear.size = item.companySizes?.size
      //     }
      //     if(item.CertificationAndDiligence?.foundingYear) {
      //       siteSizeYear.foundingYear = item.CertificationAndDiligence?.foundingYear
      //     }
      //     companySiteSizeYears.push(siteSizeYear);

      //     if(item.ServicesOpt) {
      //       services.push(item.ServicesOpt);
      //     } else {
      //       services.push([]);
      //     }

      //     if(item.CertificationAndDiligence?.certifications) {
      //       certificates.push(item.CertificationAndDiligence.certifications)
      //     } else {
      //       certificates.push("");
      //     }

      //     if(item.CertificationAndDiligence?.Security) {
      //       securities.push(item.CertificationAndDiligence.Security)
      //     } else {
      //       securities.push("");
      //     }

      //     if(item.CompanyPlatformExperience) {
      //       platforms.push(item.CompanyPlatformExperience);
      //     } else {
      //       platforms.push([]);
      //     }

      //     if(item.CompanyGameEngines) {
      //       gameEngines.push(item.CompanyGameEngines);
      //     } else {
      //       gameEngines.push([]);
      //     }

      //     if(item.CertificationAndDiligence?.tools) {
      //       toolsAndSws.push(item.CertificationAndDiligence.tools);
      //     } else {
      //       toolsAndSws.push("");
      //     }

      //     if(item.CompanyAddress) {
      //       locations.push(item.CompanyAddress);
      //     } else {
      //       locations.push([]);
      //     }

      //     if(item.portfolioProjects) {
      //       projects.push(item.portfolioProjects);
      //     } else {
      //       projects.push([]);
      //     }
          
      //   }
      // }
      // finalItem.ids = ids;
      // finalItem.companyLogoNames = companyLogoNames;
      // finalItem.companySiteSizeYears = companySiteSizeYears;
      // finalItem.ServicesOpt = services;
      // finalItem.certificates = certificates;
      // finalItem.securities = securities;
      // finalItem.platforms = platforms;
      // finalItem.gameEngines = gameEngines;
      // finalItem.toolsAndSws = toolsAndSws;
      // finalItem.locations = locations;
      // finalItem.projects = projects;
      return new CustomResponse(HttpStatus.OK, true, companiesDetailsArr);
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

  @Post('save-user-settings')
  @ApiOperation({
    summary: "Save user settings",
    description: "This endpoint allows users to save their settings, including visibility preferences. The request requires a unique identifier for the user (`id`) and a boolean value (`visible`) that indicates whether certain settings should be visible or hidden. The response will confirm the successful update of the user settings."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id:{ type: 'string'},
        visible:{ type: 'boolean'},
      },
      required: ['id', 'visible'],
    },
  })
  async saveUserSettings(@CurrentUser() user: Users, @Body() postData:any){
    
    try {
      if (isValidJsonString(postData.columnsData)) {
        const parsed = JSON.parse(postData.columnsData);

        const isValidStructure = Array.isArray(parsed) &&
          parsed.every(item =>
            typeof item === 'object' &&
            allowedColumnIds.includes(item.id) &&
            typeof item.visible === 'boolean'
          );

        const ids = parsed.map((item:{id:string}) => item.id);
        const hasDuplicates = new Set(ids).size !== ids.length;

        if (isValidStructure && !hasDuplicates) {
          return this.serviceprovidersService.addUserSettings(user.id, postData.columnsData);
        } else {
          throw new HttpException('Access denied: Invalid or duplicate column data', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Access denied: Malformed JSON', HttpStatus.FORBIDDEN);
      }
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

  @Get('get-user-setting')
  @ApiOperation({
    summary: "Retrieve user settings",
    description: "This endpoint retrieves the settings for a specific user. It provides configuration details such as preferences, notification settings, and any other relevant user-specific settings. The response will include all the user's settings, allowing them to view and manage their preferences effectively."
  })
  async getUserSettings(@CurrentUser() user: Users){
    try {
      return this.serviceprovidersService.getUserSettings(user.id);
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

  @Get('get-platforms-list')
  @ApiOperation({
    summary: "Retrieve the list of platforms",
    description: "This endpoint returns a comprehensive list of platforms available within the system. The response includes details about each platform, such as platform names, IDs, and any relevant metadata. This information is useful for users looking to understand the available platforms for their projects or services."
  })
  async getPlatForms(){
    try {
      return this.serviceprovidersService.getPlatformsList();
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

  @Post('update-average-performance-rating')
  @ApiOperation({
    summary: "Update average performance rating for a company",
    description: "This endpoint allows users to update the average performance rating for a specific company identified by `companyId`. The request must include the company's ID and the new average rating (`avgRating`). This is useful for reflecting updated performance metrics based on recent evaluations or feedback. The response will confirm the successful update of the average performance rating."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId:{ type: 'number'},
        avgRating:{ type: 'number'},
      },
      required: ['companyId', 'avgRating'],
    },
  })
  async updateAveragePerformanceRating(@Body() postData: { companyId: number, avgRating: number }, @CurrentUser() loggedUser: LoggedInUser) {
    if(!loggedUser.isPaidUser && !loggedUser.isSparkUser&& loggedUser.userRoles[0].roleCode === "service_provider") {
      throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
    }
    try {
      await this.serviceprovidersService.addOrUpdateAvgPerformanceRating(loggedUser.companies[0].id, postData);
      return new CustomResponse(HttpStatus.OK, true, "success");
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
  @Get("migrate-avg-performance")
  @ApiExcludeEndpoint()
  async migrationForAvgPerformanceRating() {
    try{
      await this.serviceprovidersService.migrateAvgPerformanceRating();
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
  @Get("migrate-notes-records/:type")
  @ApiExcludeEndpoint()
  async migrationForInsertingNotesRecords(@Param("type") type: string,) {
    try{
      await this.serviceprovidersService.migrationForInsertingRecords(type);
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
  @Get('get-dynamic-data/:todaydate')
  @ApiExcludeEndpoint()
  async getDynamicData( 
  @Param("todaydate") todaydate: string,
  // @Param("mon") mon: string,
  // @Param("year") year: string
  ){
    try{
    const secretKey = process.env.EMAIL_SECRET_KEY;
    const date = decodeEmail(todaydate, secretKey);
    const response = await this.serviceprovidersService.getPublicDynamicData(date);
    return encryptString(JSON.stringify(response), secretKey);
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
  
  @Get('admin/myspark-report/:selectType')
  async getbuyerMysparkReport(@Param("selectType") selectType: $Enums.ROLE_CODE, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      if( loggedUser.userRoles[0].roleCode != "admin") {
      return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
    }
    return await this.serviceprovidersService.getbuyerMysparkReport(selectType);
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


//*******************************************Serviceproviders selected filter list share*********************************************** */

  @Post('generateFiltersLink')
  @ApiOperation({
    summary: "Generating share link with selected filters",
    description: "This endpoint allows users to generate a shareable link containing selected filter criteria. The generated link encapsulates the filter settings, enabling users to easily share or save their filtered preferences for future use or collaboration."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        selectedServiceIds: { type: 'string'},
        selectedSevices: { type: 'string'},
        isPremium: { type: 'string'},
        countrySearchValue: { type: 'string'},
        inputValue: { type: 'string'},
        selctedCompanySize: { type: 'string'},
        selectedEventValues: { type: 'string'},
        regionCheckboxFilter: { type: 'string'},
      },
      required: ['selectedServiceIds', 'selectedSevices', 'isPremium', 'countrySearchValue', 'inputValue', 'selctedCompanySize', 'selectedEventValues', 'regionCheckboxFilter'],
    },
  })
  async generateFiltersShareLink (@Body() postData:{
    selectedServiceIds: string;
    selectedSevices: string;
    isPremium: string;
    countrySearchValue: string;
    inputValue: string;
    selctedCompanySize: string;
    selectedEventValues: string;
    regionCheckboxFilter: string;
}, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      const getMail = await this.serviceprovidersService.checkMail(loggedUser.email);
    if(getMail?.id){
      const theToken = generateToken();
      return await this.serviceprovidersService.generateShareLink(postData, theToken, loggedUser.companies[0].id);
    } else {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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

  @Get('getFilterData/:token')
  @ApiOperation({ 
    summary: "Getting selected filters data by token", 
    description: 'This endpoint retrieves data for selected filters associated with a specific token. It is designed to provide filtered results, allowing users to fetch targeted data based on predefined criteria linked to the token. The response will include detailed information relevant to the applied filters.'
  })
  async getFiltersData(@Param("token") token: string) {
    try{
      return await this.serviceprovidersService.getFiltersData(token);
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

  @Get('checkGenerateFilterLinkUser')
  @ApiOperation({ 
    summary: "Getting selected filters data by token", 
    description: 'This endpoint retrieves data for selected filters associated with a specific token. It is designed to provide filtered results, allowing users to fetch targeted data based on predefined criteria linked to the token. The response will include detailed information relevant to the applied filters.'
  })
  async checkGenerateFilterLinkUser( @CurrentUser() loggedUser: LoggedInUser) {
    try{
      const getMail = await this.serviceprovidersService.checkMail(loggedUser.email);
    if(getMail?.id){
      return {status:true, data: true};
    } else {
      return {status:true, data: false};
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

  @Put("/:sponsoredServiceId/update-sponsored-service")
  @ApiOperation({
    summary: "Count clicks on sponsored service",
    description: "This endpoint counts the no. of times the sponsored service is clicked. The request should include the sponsored service ID (`sponsoredServiceId`). The response will confirm the successful update of the click count."
  })
  async addClickCounts(@Param("sponsoredServiceId") sponsoredServiceId: string, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      // }
      await this.serviceprovidersService.addClickCounts(+sponsoredServiceId, loggedUser.companies[0].id);
      return new CustomResponse(HttpStatus.OK, true, "updated click count");
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

  @Post("add-announcement") 
  @ApiOperation({
    summary: "Create a new announcement",
    description: "This endpoint allows users to create a new announcement. The request should include the announcement details such as title, content, and any relevant metadata. The response will confirm the successful creation of the announcement, providing the created announcement details."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        announcementTitle: { type: 'string' },
        eventDescription: { type: 'string' },
        announcementUrl: { type: 'string'},
        announcementImageUrl: { type: 'string'},
        postExpiryDate:{ type: 'string'},
      },
    },
  })
  async addAnnouncement(@Body() announcementData: Announcement, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      await this.serviceprovidersService.addAnnouncement(sanitizeData(announcementData), user.companies[0].id);
      return new CustomResponse(HttpStatus.CREATED, true, "Announcement created successfully");
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

  @Post("update-announcement-order") 
  @ApiOperation({
    summary: "Order announcements",
    description: "This endpoint allows users to update the order of announcements. The request should include the announcement IDs. The response will confirm the successful update of the announcement order."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number'} },
      },
    },
  })
  async updateAnnouncementOrder(@Body() postData: { ids: number[] }, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      await this.serviceprovidersService.updateAnnouncementOrder(postData.ids, user.companies[0].id);
      return new CustomResponse(HttpStatus.OK, true, "Announcement order updated successfully");
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

  @Put(":id/update-announcement")
  @ApiOperation({
    summary: "Update the Announcement",
    description: "This endpoin will update the Announcement details."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        announcementTitle: { type: 'string' },
        eventDescription: { type: 'string' },
        announcementUrl: { type: 'string' },
        announcementImageUrl: { type: 'string' },
        postExpiryDate: { type: 'string', format: 'date-time' },
      },
      required: [
        'announcementTitle',
        'eventDescription',
        'announcementUrl',
        'announcementImageUrl',
        'postExpiryDate',
      ],
    },
  })
  async updateAnnouncement(@Body() postData: Announcement, @Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      await this.serviceprovidersService.updateAnnouncement(+id, user.companies[0].id, sanitizeData(postData));
      return new CustomResponse(HttpStatus.OK, true, "Announcement updated successfully");
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

  @Put(":id/toggle-archive-status")
  @ApiOperation({
    summary: "Update the archive status",
    description: "This endpoin will toggle the archive status of the service providers announcement."
  })
  async toggleArchiveStatus(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser&& !user.isSparkUser  && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      await this.serviceprovidersService.toggleArchiveStatus(+id, user.companies[0].id)
      return new CustomResponse(HttpStatus.OK, true, "Announcement status updated successfully");
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

  @Put(":id/announcement-stat-click-count")
  @ApiOperation({
    summary: "Add or Update announce click count",
    description: "This endpoin will add or update the announcement click count"
  })
  async addOrUpdateClickCountAnnouncementStat(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      // }
      await this.serviceprovidersService.addOrUpdateClickCountAnnouncementStat(+id, user.companies[0].id)
      return new CustomResponse(HttpStatus.OK, true, "Announcement visit count increment successfull");
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

  @Put(":id/admin-toggle-announcement-status")
  @ApiOperation({
    summary: "Admin Update the archive status",
    description: "This endpoint will toggle the archive status of the service providers announcement by Admin."
  })
  async adminToggleAnnouncementArchiveStatus(@Param("id") id: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      await this.serviceprovidersService.adminToggleAnnouncementArchiveStatus(+id)
      return new CustomResponse(HttpStatus.OK, true, "Announcement order updated successfully");
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

  @ApiOperation({
    summary: "Delete a specific Announcement",
    description: "This endpoint allows the service provier to delete his created announcement."
  })
  @Delete("/:id/delete-announcement")
  async deleteAnnouncement(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      }
      const theAnnouncement = await this.serviceprovidersService.getAnnouncementById(+id);
      if(theAnnouncement && theAnnouncement.companyId) {
        if(user && user.companies[0].id == theAnnouncement.companyId) {
          await this.serviceprovidersService.deleteAnnouncementById(+id);
          return new CustomResponse(HttpStatus.OK, true, "Announcement deleted successfully");
        } else {
          throw new HttpException('access denied',HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
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

  @ApiOperation({
    summary: "Delete a specific Announcement by Admin",
    description: "This endpoint allows the admin to delete his created announcement."
  })
  @Delete("/:id/admin-delete-announcement")
  async adminDeleteAnnouncement(@Param("id") id: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      if(loggedUser && loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException ( 'access denied', HttpStatus.FORBIDDEN );
      }
      await this.serviceprovidersService.deleteAnnouncementById(+id);
      return new CustomResponse(HttpStatus.OK, true, "Announcement deleted successfully");
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

  @Post("announcement-stat-view-count") 
  @ApiOperation({
    summary: "Add or Update Announcement Stat",
    description: "This endpoint allows users to create or update announcements stats. The request should include the announcement IDs."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number'} },
      },
    },
  })
  async addOrUpdateViewCountAnnouncementStat(@Body() postData: { ids: number[] }, @CurrentUser() user: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      // }
      await this.serviceprovidersService.addOrUpdateViewCountAnnouncementStat(postData.ids, user.companies[0].id);
      return new CustomResponse(HttpStatus.OK, true, "Successfully manages stat");
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

  @Post("testmanial-stat-update-hide-count") 
  @ApiOperation({
    summary: "Click count and Update Testimonial staus ad hide Stat",
    description: "This endpoint allows users to update Testimonial status and adding user clicks. The request should include the Testimonial IDs."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'number' },
        type: { type: 'string' },
        toggle: { type: 'boolean' },
      },
    },
  })
  async addOrUpdateViewCountTestMonialStat(@Body() postData: { ids: number, type: string, toggle: boolean }, @CurrentUser() user: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   throw new HttpException('access denied',HttpStatus.UNAUTHORIZED);
      // }
      if(postData.type !== "hide" && postData.type == "click") {
        await this.serviceprovidersService.addOrUpdateViewCountTestMonialStat(postData.ids, user.companies[0].id);
      } else if(postData.type === "hide") {
        await this.serviceprovidersService.addOrUpdateHideTestMonialStat(postData.ids, postData.toggle);
      }
      return new CustomResponse(HttpStatus.OK, true, "Successfully manages stat");
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

}
