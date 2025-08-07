import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiExcludeController, ApiTags } from "@nestjs/swagger";
import { UploadsService } from "./uploads.service";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { Prisma, ROLE_CODE, Users } from "@prisma/client";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { CompaniesService } from "src/companies/companies.service";
import { ALLOWED_IMAGE_FOR_OPPORTUNITY_TYPES, ALLOWED_IMAGE_TYPES_ALBUMS, DEFAULT_VIDEO_THUMBNAIL } from "src/common/constants/file.constant";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { decodeEmail } from "src/common/methods/common-methods";

@ApiBearerAuth()
@ApiTags("uploads")
@ApiExcludeController()
@Controller("uploads")
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly gcsService: GoogleCloudStorageService,
    private readonly companyService: CompaniesService,
  ) { }

  @Roles(ROLE_CODE.service_provider)
  @Put("single")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSingleImage(
    @GetXdsContext() xdsContext: XdsContext,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: LoggedInUser,
    @Body("companyId", ParseIntPipe) companyId: number,
  ) {
    try{
    if (user?.companies[0].id !== +companyId || !file) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    this.uploadsService.validateOrThrow(file);

    const res = await this.gcsService.uploadLogoFile(
      file,
      `user_images/user_${user.id}/original/`,
    );

    return res.fileUrl;
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

  @Put("/uploadRateCard")
  @UseInterceptors(FileInterceptor("file"))
  async uploadRateCard(
    @GetXdsContext() xdsContext: XdsContext,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: LoggedInUser,
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body("userId", ParseIntPipe) userId: number,
    @Body("filaName") fileName: string,
    @Body("pdfType") pdfType: string,
    @Body("token") token?: string,
  ) {
    try{
    if (user?.companies[0].id !== +userId || !file || (!user.isPaidUser && user.userRoles[0].roleCode =="service_provider")) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    this.uploadsService.validateOrThrow(file, ["application/pdf"], pdfType);
    let fileUrl = '';
    let UploadedFileName = '';
    if (fileName) {
      UploadedFileName = fileName;
    }
    if (file) {
      let res = [];
      res[0] = await this.gcsService.uploadFile(
        file,
        `user_images/user_${userId}/rateCard/`,
      );
      fileUrl = res[0].fileUrl;

      if (pdfType == "rateCardPdf") {
        const secretKey = process.env.EMAIL_SECRET_KEY;
        token = token ? decodeEmail(token, secretKey) : '';
        return await this.companyService.uploadRateCard(fileUrl, +userId, +companyId, UploadedFileName, token);
      }
      else {
        await this.uploadsService.updateTemporaryTable('profilePdfFormId', res);
        let singedUrl = '';
        if (fileUrl && fileUrl != '') {
          singedUrl = await this.gcsService.getSignedUrl(
            fileUrl,
          );
        }
        return { singedUrl: singedUrl, fileUrl: fileUrl, fileName: fileName };
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

  @Put("/deleteRateCard")
  @UseInterceptors(FileInterceptor("file"))
  async deleteRateCard(
    @GetXdsContext() xdsContext: XdsContext,
    @CurrentUser() user: LoggedInUser,
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body("userId", ParseIntPipe) userId: number,
  ) {
    try{
      if (user?.companies[0].id !== +userId || !user.isPaidUser && user.userRoles[0].roleCode =="service_provider") {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    let fileUrl = '';
    let UploadedFileName = '';
    return await this.companyService.uploadRateCard(fileUrl, +userId, +companyId, UploadedFileName, "");
    // return res.fileUrl;
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

  @Put("banner")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBannerImage(
    @GetXdsContext() xdsContext: XdsContext,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: LoggedInUser,
    @Body("companyId", ParseIntPipe) companyId: number,
  ) {
    try{
    if (user?.companies[0].id !== +companyId || !file) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    this.uploadsService.validateOrThrow(file);

    const res = await this.gcsService.uploadBannerFile(
      file,
      `user_images/user_${user.id}/original/`,
    );

    return res.fileUrl;
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

  @Put("/upload-advertisment-files")
  @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  async uploadAdvertismentFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @CurrentUser() user?: LoggedInUser,
  ): Promise<CustomResponse<{
    signdeUrls:string[],
    fileUrls: string[],
  } | string>> {
    // Validate all files

    if (user?.companies[0].id !== +companyId) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }

    try {
      const companyDetails =
        await this.companyService.findCompanyById(companyId);
      if (companyDetails) {
        
        files.forEach((file) => {
          this.uploadsService.validateOrThrow(file);
        });
        // Upload all files
        const uploadPromises = files.map((file) =>
          this.gcsService.uploadFileWithOutCropping(
            file,
            `user_images/user_${companyDetails.userId}/banner-advertisement-files/`,
          ),
        );

        const uploadResults = await Promise.all(uploadPromises);
        

        // Extract file URLs from upload results
        await this.uploadsService.updateTemporaryTable('advertismentForm', uploadResults);
        const fileUrls: string[] = uploadResults.map((res) => res.fileUrl);
        const signdeUrl = uploadResults.map((res) => 
        this.gcsService.getSignedUrl(
          res.fileUrl,
        ),
        );
        const signdeUrls = await Promise.all(signdeUrl);
        const data = {
          signdeUrls:signdeUrls,
          fileUrls: fileUrls,
        }
        return new CustomResponse(HttpStatus.OK, true, data);
      } else {
        throw new BadRequestException();
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

  @Post("upload-company-files")
  @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  async uploadMultipleCompanyFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @CurrentUser() user?: LoggedInUser,
  ): Promise<CustomResponse<string[] | string>> {
    // Validate all files

    if (user?.companies[0].id !== +companyId || files.length <= 0) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }

    files.forEach((file) => {
      this.uploadsService.validateOrThrow(file);
    });

    try {
      const companyDetails =
        await this.companyService.findCompanyById(companyId);
      if (companyDetails) {
        // Upload all files
        const uploadPromises = files.map((file) =>
          this.gcsService.uploadFile(
            file,
            `user_images/user_${companyDetails.userId}/company-files/`,
          ),
        );

        const uploadResults = await Promise.all(uploadPromises);

        // Extract file URLs from upload results
        const fileUrls: string[] = uploadResults.map((res) => res.fileUrl);
        return new CustomResponse(HttpStatus.OK, true, fileUrls);
      } else {
        throw new BadRequestException();
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

  // @Post('resizImages')
  // @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  // async resizingImages(
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ): Promise<any> {
  //   const uploadPromises = files.map((file) =>
  //   this.gcsService.resizeImage(
  //     file,
  //   ),
  //   );
  //   let resizedImages = [];
  //   const uploadResults = await Promise.all(uploadPromises);
  //   for (const item of uploadResults) {
  //     const signedImgUrl = await this.gcsService.getSignedUrl(item.fileUrl);
  //     const fileDetails = {
  //       signedImgUrl: signedImgUrl,
  //     };
  //     resizedImages.push(fileDetails);
  //   }
  //   return new CustomResponse(HttpStatus.FORBIDDEN, true, resizedImages);
  // }


  @Post("upload-portfolio-files")
  @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  async uploadMultiplePortfolioFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @CurrentUser() user?: LoggedInUser,
  ): Promise<
    CustomResponse<{ type: string; imgUrl: string; idSelected: boolean }[] | string>
  > {
    if (user?.companies[0].id !== +companyId || files.length <= 0) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    // Validate all files
    files.forEach((file) => {
      this.uploadsService.validateOrThrow(file);
    });

    try {
      const companyDetails =
        await this.companyService.findCompanyById(companyId);
      if (companyDetails) {
        // Upload all files
        const uploadPromises = files.map((file) =>
          this.gcsService.uploadFile(
            file,
            `user_images/user_${companyDetails.userId}/portfolio-project-files/`,
          ),
        );

        const uploadResults = await Promise.all(uploadPromises);

        // Extract file URLs from upload results
        const uploadedFilesWithSignedUrls: {
          type: string;
          imgUrl: string;
          idSelected: boolean;
          signedImgUrl: string;
        }[] = [];
        for (const item of uploadResults) {
          const signedImgUrl = await this.gcsService.getSignedUrl(item.fileUrl);
          // const lastDotIndex = item.fileUrl.lastIndexOf('.');
          // const nameWithoutExtension = item.fileUrl.substring(0, lastDotIndex);
          // const fileExtension = item.fileUrl.substring(lastDotIndex);
          // const thumbnailFileName = nameWithoutExtension + '_thumbnail' + fileExtension;
          // const thumbnailUrl = await this.gcsService.getSignedUrl(thumbnailFileName);
          const fileDetails = {
            type: "imgage",
            imgUrl: item.fileUrl,
            thumbUrl: item.thumbUrl,
            signedImgUrl: signedImgUrl,
            // thumbnailSignedUrl : thumbnailUrl,
            idSelected: false,
          };
          uploadedFilesWithSignedUrls.push(fileDetails);
        }
        return new CustomResponse(
          HttpStatus.OK,
          true,
          uploadedFilesWithSignedUrls,
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
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }

  @Post("upload-portfolio-project-files")
  @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  async uploadMultiplePortfolioProjectFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body('formId') uniqueFormId?: string,
    @Body('existingId') existingId?: string,
    @Body('formtype') formtype?: string,
    @CurrentUser() user?: LoggedInUser,
  ): Promise<CustomResponse<string[] | string | { fileurl: string[], thumbnailurl: string[] }>> {

    if (user?.companies[0].id !== +companyId || files.length <= 0) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    // Validate all files
    files.forEach((file) => {
      this.uploadsService.validateOrThrow(file);
    });

    try {    
      const companyDetails =
        await this.companyService.findCompanyById(companyId);
      if (companyDetails) {

        let filePath = `user_images/user_${companyDetails.userId}/ourwork-projects-files/`;

        if (existingId == undefined || existingId == '0') {
          const lastId = await this.uploadsService.findCompanyLastAlbumId(companyId, "ourwork-projects-files");
          if (lastId.length > 0 && lastId[0] && lastId[0].id > 0) {
            filePath = `user_images/user_${companyId}/${formtype}/${lastId[0].id + 1}/`;
          } else {
            filePath = `user_images/user_${companyId}/${formtype}/${1}/`;
          }
        } else {
          const checkUserAccess = await this.companyService.checkUserPortfolioAccess(Number(existingId), user?.companies[0].id);
          if(checkUserAccess.length <= 0 || !checkUserAccess){
            throw new HttpException('access denied',HttpStatus.FORBIDDEN);
          } 
          filePath = `user_images/user_${companyId}/${formtype}/${existingId}/`;
        }
        // Upload all files
        const uploadPromises = files.map((file) =>
          this.gcsService.uploadFile(
            file,
            filePath,
          ),
        );

        const uploadResults = await Promise.all(uploadPromises);
        if (uniqueFormId) {
          await this.uploadsService.updateTemporaryTable(uniqueFormId, uploadResults)
        }
        // Extract file URLs from upload results
        const fileUrls: string[] = uploadResults.map((res) => res.fileUrl);
        const thumbnails: string[] = uploadResults.map((res) => res.thumbUrl);

        return new CustomResponse(HttpStatus.OK, true, { fileurl: fileUrls, thumbnailurl: thumbnails });
      } else {
        throw new BadRequestException();
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

  @Post("upload-myopportunity-files")
   @UseInterceptors(FilesInterceptor("uplaodinputfiles", 10, { limits: { fileSize: 100 * 1024 * 1024 }}))
  async uploadMultipleMyopportunityFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body('formId') uniqueFormId?: string,
    @CurrentUser() user?: LoggedInUser,
  ) {
    // Validate all files
    if (user?.companies[0].id !== companyId || files.length <= 0) {
      return {
        success: false,
        message: 'acess denied',
        data: [],
      };
    }
    files.forEach((file) => {
      this.uploadsService.validateOrThrow(
        file,
        ALLOWED_IMAGE_FOR_OPPORTUNITY_TYPES,
        "opportunityFiles"
      );
    });

    try {
      // Upload all files
      const uploadPromises = files.map((file) =>
        this.gcsService.uploadFile(
          file,
          `user_images/myopportunities_${companyId}/`,
          true
        ),
      );

      const uploadResults = await Promise.all(uploadPromises);
      if (uniqueFormId) {
        await this.uploadsService.updateTemporaryTable(uniqueFormId, uploadResults)
      }

      const signedurls: { type: string, url: string }[] = [];
      if (uploadResults) {
        for (const fileUpload of uploadResults) {
          const bannersignedUrl = await this.gcsService.getSignedUrl(
            fileUpload.fileUrl,
          );

          const signedurlWithType = { type: fileUpload.contentType, url: bannersignedUrl }
          signedurls.push(signedurlWithType);
        }
      }

      // const fileUrls = uploadResults.map((res) => res.fileUrl);
      // const fileUrls: {type:string, url:string} =  uploadResults.map((res) => {res.contentType, res.fileUrl});
      const fileUrls: { type: string, url: string }[] = uploadResults.map((res) => ({
        type: res.contentType,
        url: res.fileUrl
      }));
      const data = {
        fileUrls,
        signedurls,
      };

      return new CustomResponse(HttpStatus.OK, true, data);
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

  @Post("upload-sponcers-logo-files")
  @UseInterceptors(FilesInterceptor("files")) // 'files' is the field name in the form that contains multiple files
  async uploadSponcersLogoFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body("uniqueFormId") uniqueFormId?: string,
    @Body("formtype") formtype?: string,
    @Body("albumId") albumId?: string,
    @CurrentUser() user?: LoggedInUser,

  ): Promise<CustomResponse<string[] | string>> {
    // Validate all files

    if (user?.companies[0].id !== +companyId || files.length <= 0) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }

    files.forEach((file) => {
      this.uploadsService.validateOrThrow(file, ALLOWED_IMAGE_TYPES_ALBUMS, formtype);
    });

    try {
      const companyDetails =
        await this.companyService.findCompanyById(companyId);
      if (companyDetails) {
        // Upload all files
        let filePath: string = `user_images/user_${companyDetails.id}/sponcers-logo-files/`;

        if (formtype === "album") {
          if (albumId == undefined || albumId == '0') {
            const lastId = await this.uploadsService.findCompanyLastAlbumId(companyId, formtype);
            if (lastId.length > 0 && lastId[0] && lastId[0].id > 0) {
              filePath = `user_images/user_${companyDetails.id}/albums/${lastId[0].id + 1}/`;
            } else {
              filePath = `user_images/user_${companyDetails.id}/albums/${1}/`;
            }
          } else {
            filePath = `user_images/user_${companyDetails.id}/albums/${albumId}/`;
          }

        }else if(formtype === "platinumpartners"){
           filePath = `user_images/user_${companyDetails.id}/platinum-partners-logo-files/`;
        }
        const uploadPromises = files.map((file) =>
          this.gcsService.uploadSponsersLogosFile(
            file,
            filePath,
            formtype
          ),
        );
        const signedurls: string[] = [];
        const uploadResults = await Promise.all(uploadPromises);

        if (uniqueFormId) {
          await this.uploadsService.updateTemporaryTable(uniqueFormId, uploadResults)
        }
        if (uploadResults) {
          for (const fileUpload of uploadResults) {
            if (fileUpload.thumbUrl) {
              const bannersignedUrl = await this.gcsService.getPublicSignedUrl(
                fileUpload.thumbUrl,
              );
              const signedurlWithType = bannersignedUrl;
              signedurls.push(signedurlWithType);
            } else {
              const bannersignedUrl = await this.gcsService.getSignedUrl(
                fileUpload.fileUrl,
              );
              const signedurlWithType = bannersignedUrl;
              signedurls.push(signedurlWithType);
            }
          }
        }
        // Extract file URLs from upload results
        const fileUrls: string[] = uploadResults.map((res) => res.fileUrl);
        const thumbnails: string[] = uploadResults.map((res) => res.thumbUrl);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
          fileUrls,
          signedurls,
          thumbnails,
        };
        return new CustomResponse(HttpStatus.OK, true, data);
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

  @Post("video-thumbnail")
  async videoThumbnail(
    @Body("companyId", ParseIntPipe) companyId: number,
    @Body("youtubeThumb") youtubeThumb: string,
    @Body("formtype") formtype: string,
    @Body("existingId") existingId: string,
    @CurrentUser() user?: LoggedInUser,

  ) {
    if (user?.companies[0].id !== +companyId) {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
    }
    try {
      if (youtubeThumb) {
       const embeddedUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:(?:youtube\.com\/(?:embed\/|live\/|watch\?v=|v\/|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})|img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})|vimeo\.com\/(?:channels\/[A-Za-z0-9]+\/)?(?:videos?\/)?(\d+)|i\.vimeocdn\.com\/video\/(\d+)-[a-z0-9]+(?:_[a-zA-Z0-9]+)?)/;
        const isValidEmbeddedUrl = embeddedUrlRegex.test(youtubeThumb);
        if(!isValidEmbeddedUrl){
          throw new HttpException('Invalid Url',HttpStatus.FORBIDDEN);
        }
        let filePath: string = `user_images/user_${companyId}/videoThumbnails/`;
        const resp = await fetch(youtubeThumb);
        if (!resp.ok) {
          filePath = DEFAULT_VIDEO_THUMBNAIL;

          const signedImgUrl = await this.gcsService.getPublicSignedUrl(filePath);

          return { filepath: filePath, signedImgUrl: signedImgUrl };

        } else {

          if (formtype === "album" || formtype === "ourwork-projects-files") {
            if (existingId == undefined || existingId == '0') {
              const lastId = await this.uploadsService.findCompanyLastAlbumId(companyId, formtype);
              if (lastId.length > 0 && lastId[0] && lastId[0].id > 0) {
                filePath = `user_images/user_${companyId}/${formtype}/${lastId[0].id + 1}/videoThumbnails/`;
              } else {
                filePath = `user_images/user_${companyId}/${formtype}/${1}/videoThumbnails/`;
              }
            } else {
              filePath = `user_images/user_${companyId}/${formtype}/${existingId}/videoThumbnails/`;
            }

          }

          const res = await this.gcsService.videoThumbnail(
            filePath,
            youtubeThumb,
          );
          const signedImgUrl = await this.gcsService.getPublicSignedUrl(res.videoThumbnail);

          return { filepath: res.videoThumbnail, signedImgUrl: signedImgUrl };
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

  @Post("global-imageupload")
  @UseInterceptors(FileInterceptor("sourceImage"))
  async uploadImageCommonMethod(
    @UploadedFile() file: Express.Multer.File,
    @Body('destImagepath') destImagepath: string,
    @CurrentUser() user: LoggedInUser,
    // @Body("companyId", ParseIntPipe) companyId: number,
  ) {

    try{
    if (!file) {
      throw new HttpException('access denied',HttpStatus.FORBIDDEN);
    }
    this.uploadsService.validateOrThrow(file);
    const isValid = ['sponcers-logo-files', 'original', 'ourwork-projects-files', 'rateCard', 'banner-advertisement-files', 'contactprofileimages', 'ArticleLogos', 'sponseredLogoImage', 'sponseredimages', 'platinum-partners-logo-files', 'announcements', 'defaultimages'].includes(destImagepath);
    if(!isValid){
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
    }
    const res = await this.gcsService.uploadFileWithOutCropping(
      file,
      `user_images/user_${user.id}/${destImagepath}/`,
    );
    const fileUrls:any = [];
    fileUrls.push({
      name: res.fileUrl
    });
    if(destImagepath == "contactprofileimages"){
      // Insertin Temp Table
      const fileUrls:any = [];
      fileUrls.push({
        name: res.fileUrl
      });
      await this.uploadsService.updateTemporaryTable("Contactprofileimages", fileUrls);
    }else{
      await this.uploadsService.updateTemporaryTable(destImagepath, fileUrls);
    }
    const fullpath = await this.gcsService.getSignedUrl(res.fileUrl)
    return { fileUrl: res.fileUrl, fullpath: fullpath };
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
