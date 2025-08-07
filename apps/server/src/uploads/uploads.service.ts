import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  FILE_SIZE_LIMIT_MB,
  PDF_FILE_SIZE_LIMIT_MB,
  PDF_FILE_SIZE_LIMIT_MB_1,
  PDF_FILE_SIZE_LIMIT_MB_2,
} from "src/common/constants/file.constant";
import { PrismaService } from "src/prisma/prisma.service";
@Injectable()
export class UploadsService {
  constructor(private readonly logger: Logger, private readonly Prismaservice: PrismaService,) { }

  validateFileSize(file: Express.Multer.File, maxSizeInMB: number) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException(
        `File size has exceed maximum of ${maxSizeInMB}Mb`,
      );
    }
  }

  validateFileType(file: Express.Multer.File, allowedTypes: string[], formType: string= "") {
    const fileType = file.mimetype;
    const extension = file.originalname.split('.') && file.originalname.split('.')[1] && file.originalname.split('.')[1].toLowerCase();
   
    if (!allowedTypes.includes(fileType) || !ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(`Only supports ${allowedTypes}`);
    }
  }

  validateOrThrow(
    file: Express.Multer.File,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    formtype: string = "defalut",
  ) {
    let SizeLimit = FILE_SIZE_LIMIT_MB
    if (file.mimetype == "application/pdf") {
      if(formtype == "companyPdf") {
        SizeLimit = PDF_FILE_SIZE_LIMIT_MB_1
      } else if(formtype == "opportunityFiles") {
        SizeLimit = PDF_FILE_SIZE_LIMIT_MB_2
      } else {
        SizeLimit = PDF_FILE_SIZE_LIMIT_MB
      }
    }
    this.validateFileSize(file, SizeLimit);
    // if(formtype == 'album'){
      this.validateFileType(file, allowedTypes, formtype);
    // }else{
    //   this.validateFileType(file, allowedTypes, formtype);
    // }
   
  }

  async updateTemporaryTable(formId:string, fileUrls:File[]){
    const uploadFiles:{formUniqueId:string,fileName:string}[] = []
    fileUrls.forEach((file) => {
      const currentFile = {
        formUniqueId:formId,
        fileName:file.name,
      };
      uploadFiles.push(currentFile);
    });
    return await this.Prismaservice.temporaryUploadedFiles.createMany({
      data:uploadFiles,
    });
  }

  async findCompanyLastAlbumId(companyId:number, formtype: string){
    try {
      if(formtype === "album"){
        return this.Prismaservice.portfolioAlbum.findMany({
          where:{
            companyId: companyId,
          },
          select:{
            id:true,
          },
          orderBy:{
            id:"desc"
          },
          take: 1,
        })
      }else{
        return this.Prismaservice.portfolioProjects.findMany({
          where:{
            companyId: companyId,
          },
          select:{
            id:true,
          },
          orderBy:{
            id:"desc"
          },
          take: 1,
        })
      }
    } catch (error) {
      throw error;
    }
  }
}
