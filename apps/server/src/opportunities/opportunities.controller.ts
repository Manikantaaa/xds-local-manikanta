import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  // Delete,
  InternalServerErrorException,
  Query,
  Logger,
  Req,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { OpportunitiesService } from "./opportunities.service";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
// import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { Public } from "src/common/decorators/public.decorator";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { MailerService } from "src/mailer/mailer.service";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { ROLE_CODE,Prisma } from "@prisma/client";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { Roles } from "src/common/decorators/roles.decorator";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
@ApiBearerAuth()
@ApiTags("Opportunities")
@Controller("opportunities")

export class OpportunitiesController {
  constructor(
    private readonly opportunitiesService: OpportunitiesService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly logger: Logger,
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new opportunity',
    description:
      'This endpoint allows users to create a new opportunity by providing the necessary details.'
  })
  create(@Body() createOpportunityDto: CreateOpportunityDto) {
    // return this.opportunitiesService.create(createOpportunityDto);
  }


  @Post("/addintrestinOpportunity")
  @ApiOperation({
    summary: 'Express interest in an opportunity',
    description: 
      'This endpoint allows users to express interest in a specific opportunity.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'number' },
        opportunityId: { type: 'number' },
        description: { type: 'string' },
        addedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              albumId: { type: 'number' },
              albumName: { type: 'string' },
              type: { type: 'string' },
              checkedCount: { type: 'number' },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    imageFile: { type: 'string' },
                    imagePath: { type: 'string' },
                    isChecked: { type: 'boolean' },
                  },
                  required: ['imageFile', 'imagePath', 'isChecked'],
                },
              },
            },
            required: ['albumId', 'albumName', 'type', 'checkedCount', 'files'],
          },
        },
      },
      required: ['companyId', 'opportunityId', 'description', 'addedFiles'],
    },
  })
  async addintrestinOpportunity(
    @GetXdsContext() xdsContext: XdsContext,
    @Body() createOpportunityDto: {companyId: number, opportunityId: number, description: string, addedFiles: {
      albumId: number;
      albumName: string;
      type: string;
      checkedCount: number;
      files: {
          imageFile: string;
          imagePath: string;
          isChecked: boolean;
      }[];
  }[] },
    @Req() request: Request,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {

      if ((user?.companies[0]?.id !== +createOpportunityDto.companyId) || (user.userRoles[0].roleCode !== "service_provider") || !user.isPaidUser) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      const response =
        await this.opportunitiesService.create(createOpportunityDto);

      const opportunityUser =
        await this.opportunitiesService.findOpportunityDetails(
          createOpportunityDto.opportunityId,
          createOpportunityDto.companyId,
          'addintrest'
        );
        
      const host = `${this.configService.get("XDS_FRONTEND_BASE_URL")}/my-opportunities/${createOpportunityDto.opportunityId}`;

      if (opportunityUser) {
        if (opportunityUser.list?.company.user.email && opportunityUser.list?.isReceiveEmailEnabled) {
          await this.mailerService.opportunityIntrested({
            email: opportunityUser.list?.company.user.email,
            name: opportunityUser.list?.company.user.firstName,
            url: host,
            opportunityName: opportunityUser.list.name,
          });
          this.logger.log("sent Opportunity Intrested email", xdsContext);
        }
      }
      return response;
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


  @Get()
  @ApiOperation({
    summary: 'Retrieve a list of opportunities',
    description: 'This endpoint retrieves all opportunities based on the provided search criteria and pagination options.'
  })
  findAll(
    @Query("services") services: string,
    @Query("search") search: string,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("SortField") SortField: string,
    @Query("sortCustomColumn") sortCustomColumn: string,
    @Query("sortCustomColumnField") sortCustomColumnOrder: string,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if ((user.userRoles[0].roleCode !== "service_provider" || !user.isPaidUser)) {
        return {
          success: false,
          message: "access denied",
          StatusCode: HttpStatus.FORBIDDEN,
        }
      }
      const servicesseach = services ? services.split(",") : [];
      return this.opportunitiesService.findAll(
        servicesseach,
        search,
        page,
        limit,
        SortField,
        sortCustomColumn,
        sortCustomColumnOrder
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

  @Get("getbyid/:id/:companyId")
  @ApiOperation({
    summary: 'Retrieve a published opportunity by ID',
    description: 'This endpoint retrieves a specific published opportunity identified by its ID and associated with a specific company ID.'
  })
  findpublishedOpportunities(@Param("id") id: number, @Param('companyId') companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (Number(user.companies[0].id) != Number(companyId)) {
        if (!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
          return {
            StatusCode: HttpStatus.FORBIDDEN,
            success: true,
            list: null,
            message: "access denied",
          }
        }
        return {
          StatusCode: HttpStatus.FORBIDDEN,
          success: true,
          list: null,
          message: "access denied",
        }

      }
      return this.opportunitiesService.findOpportunityDetails(id, companyId, 'view');
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
  @Get("getOpportunityById/:id/:companyId")
  @ApiOperation({
    summary: 'Retrieve an opportunity by ID',
    description: 'This endpoint retrieves a specific opportunity identified by its ID and associated with a specific company ID.'
  })
  findallOpportunities(@Param("id") id: number, @Param('companyId') companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
        return {
          StatusCode: HttpStatus.FORBIDDEN,
          success: true,
          list: null,
          message: "access denied",
        }
      }
      if (Number(companyId) === Number(user.companies[0].id)) {
        return this.opportunitiesService.findOpportunityDetails(id, companyId, 'edit');
      } else {
        throw new Error();
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

  // @Get(":id")
  // findOne(@Param("id") id: string) {
  //   return this.opportunitiesService.findOne(+id);
  // }

  // @Patch(":id")
  // update(
  //   @Param("id") id: string,
  //   @Body() updateOpportunityDto: UpdateOpportunityDto,
  // ) {
  //   return this.opportunitiesService.update(+id, updateOpportunityDto);
  // }

  // @Delete(":id")
  // remove(@Param("id") id: string) {
  //   return this.opportunitiesService.remove(+id);
  // }
}
