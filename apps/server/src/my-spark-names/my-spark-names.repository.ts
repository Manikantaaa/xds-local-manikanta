import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SparkNameUpdateItemDto } from "./dto/update-my-spark-name.dto";

@Injectable()
export class MysparkRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

 async getSparkNamesByCompanyId(companyId: number) {
    try{
      const customNames = await this.prisma.mySparkNames.findMany({
      where: { companyId },
      select: { security: true, nda: true, msa: true,ss:true,sows:true,rates:true,performance:true,notes:true },
    });    
    return {
        success:true,
        message: "My SparkNames Fetched successfully",
        data:customNames, 
       StatusCode: HttpStatus.OK,
    }
  }catch (error) {
        return {
          success: false,
          message: "My SparkNames Fetched Failed",
          StatusCode: HttpStatus.BAD_REQUEST,
          error: error,
        };
      }
    }


async updateSparkNames(companyId: number, update: SparkNameUpdateItemDto) {
  try {
    const existing = await this.prisma.mySparkNames.findFirst({
      where: { companyId },
    });
       const { pageId, ...updatableFields } = update;

    let result;
    if (existing) {
      result = await this.prisma.mySparkNames.update({
        where: { id: existing.id },
        data: updatableFields,
      });
    } else {
      result = await this.prisma.mySparkNames.create({
        data: {
          companyId,
          ...updatableFields,
        },
      });
    }

    return {
      success: true,
      message: "My SparkName updated successfully",
      StatusCode: HttpStatus.OK,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: "My SparkName updating Failed",
      StatusCode: HttpStatus.NOT_FOUND,
      error,
    };
  }
}

}
