import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class HandledeleteFile {
  constructor(private readonly prismaService: PrismaService) { }

  async deleteTempFiles(fileUrls: string[], formId: string) {
    //  return await this.prismaService.temporaryUploadedFiles.deleteMany({
    //    where: {
    //     formUniqueId: formId,
    //     fileName: {
    //       in: fileUrls,
    //     },
    //   },
    // });
  }
}
