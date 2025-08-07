import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Assets, Prisma } from "@prisma/client";

@Injectable()
export class AssetsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findFirst(conditions: Prisma.AssetsWhereInput): Promise<Assets | null> {
    return this.prismaService.assets.findFirst({
      where: {
        ...conditions,
      },
    });
  }

  update(id: number, updatedData: Prisma.AssetsUpdateInput) {
    return this.prismaService.assets.update({
      where: {
        id,
      },
      data: {
        ...updatedData,
      },
    });
  }

  delete(id: number) {
    return this.prismaService.assets.delete({
      where: { id },
    });
  }

  create(data: Prisma.AssetsCreateManyInput) {
    return this.prismaService.assets.create({
      data: {
        ...data,
      },
    });
  }
}
