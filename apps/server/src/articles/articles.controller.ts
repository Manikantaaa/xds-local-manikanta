import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { $Enums,Prisma } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { sanitizeData } from 'src/common/utility/sanitizedata';
import { LoggedInUser } from 'src/companies/dtos/login-user.dto';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiBearerAuth()
@ApiTags("Articles")
@Controller('articles')
export class ArticlesController {
  constructor(private readonly artclesService: ArticlesService) {}

  /**************************************** Article starts ********************************************/
  // Creating New article
  @Post()
  @ApiOperation({
    summary: 'Create a new article',
    description: 'This endpoint allows users to create a new article by providing the necessary details along with the category name.'
  })
  @ApiBody({
    description: 'Create a new article with the specified category',
    schema: {
      type: 'object',
      properties: {
        createArtcleDto: {
          type: 'object',
          properties: {
            postName: {
              type: 'string',
              description: 'The postname of the article',
              example: 'Understanding NestJS',
            },
            title: {
              type: 'string',
              description: 'The title of the article',
              example: 'Understanding NestJS',
            },
            content: {
              type: 'string',
              description: 'The content of the article',
              example: 'This article explains the basics of NestJS...',
            },
          
          },
          required: ['title', 'content'], 
        },
        categoryName: {
          type: 'string',
          description: 'The name of the category under which the article is classified',
          example: 'Technology',
        },
      },
      required: ['createArtcleDto', 'categoryName'],
    },
  })
  create(@Body() postData: {createArtcleDto: CreateArticleDto, categoryName: string}, @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      postData.createArtcleDto = sanitizeData(postData.createArtcleDto);
      postData.categoryName = postData.categoryName;
      return this.artclesService.create(postData.createArtcleDto, postData.categoryName);
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
  // Fetching all articles
  @Get()
  @ApiOperation({
    summary: 'Fetch all articles',
    description: 'This endpoint retrieves all articles available to the logged-in user.',
  })
  findAll( @CurrentUser() user: LoggedInUser ) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.findAll('');
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

  @Get('getArchivedArticles')
  @ApiOperation({
    summary: 'Retrieve archived articles',
    description: 'This endpoint retrieves all archived articles available to the logged-in user.',
  })
  findArchivedArticles( @CurrentUser() user: LoggedInUser ) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.findAll('archived');
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

  // Fetching all categories
  @Get('getAllCategories')
  @ApiOperation({
    summary: 'Fetch all categories',
    description: 'This endpoint retrieves a list of all available article categories.',
  })
  getAllCategories( @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.getAllCategories();
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

  // Fecting active articles for front end
  @Get('getAtciveArticles')
  @ApiOperation({
    summary: 'Fetch active articles',
    description: 'This endpoint retrieves all active articles available for the front-end display.',
  })
  findAllActiveArtucles( @CurrentUser() user: LoggedInUser ) {
    try {
      if (!user) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.findAll('active');
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
// Fetching article by id
  @Get(':id')
  @ApiOperation({
    summary: 'Fetch an article by ID',
    description: 'This endpoint retrieves a specific article based on the provided article ID.',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.findOne(+id);
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


// Deleteing article
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an article',
    description: 'This endpoint deletes a specific article based on the provided article ID.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      return this.artclesService.remove(+id);
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

  // updating article data
  @Put(':id')
  @ApiOperation({
    summary: 'Update article data',
    description: 'This endpoint allows updating the details of an article by providing its ID and the new data.',
  })
  updateArticle(@Param('id') id: string, @Body() postData : { createArtcleDto: CreateArticleDto}, @CurrentUser() user: LoggedInUser) {
    try {
      if (user.userRoles[0].roleCode !== $Enums.ROLE_CODE.admin) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      postData.createArtcleDto = sanitizeData(postData.createArtcleDto);
      return this.artclesService.update(+id, postData.createArtcleDto);
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

  // updating articles arder
  @Put("update-article-order/:id")
  @ApiOperation({
    summary: 'Update Article Display Order',
    description: 'This endpoint allows updating the display order of articles by providing the article ID and new order details.',
  })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          displayOrder: { type: 'number' },
        },
        required: ['id', 'displayOrder'],
      },
    },
  })
  async updateEventOrder(
    @Param('id') id: number,
    @Body() postData: { id: number, displayOrder: number }[],
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (postData && postData.length > 0) {
        sanitizeData(postData);
        await this.artclesService.updateDisplayOrder(postData);
        return {
          success: true,
          message: "successfully Updated",
        }
      } else {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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

  // updating show or hide
  @Put("update-article-status/:id")
  @ApiOperation({
    summary: 'Update Article Visibility Status',
    description: 'This endpoint allows updating the visibility status of an article, such as toggling between show or hide.',
  })
  async updateArticleStatus(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.artclesService.updateArticleStatus(+id);
      return {
        success: true,
        message: "successfully Updated",
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

  // updating show or hide
  @Put("archive-article-status/:id")
  @ApiOperation({
    summary: 'Archive or Unarchive Article',
    description: 'This endpoint allows archiving or unarchiving an article by providing its ID to update its status.',
  })
  async archiveArticle(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.artclesService.archiveArticle(+id);
      return {
        success: true,
        message: "successfully Updated",
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

  /**************************************** FrontEnd Api's ******************************************/
  /**************************************** Article ends ********************************************/
}
