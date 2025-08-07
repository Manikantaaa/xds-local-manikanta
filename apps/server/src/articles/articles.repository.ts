import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { toLocalISOString } from "src/common/methods/common-methods";
import { PrismaService } from "src/prisma/prisma.service";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

interface SignedUrlAddedDto extends CreateArticleDto {
    signedUrl?: string,
}
@Injectable()
export class ArticleRepository {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly gcsService: GoogleCloudStorageService,
    ) { }

    async create(createEventDto: CreateArticleDto) {
        try {
            if (createEventDto.startDate != '' && createEventDto.endDate != '') {
                createEventDto.startDate = toLocalISOString(createEventDto.startDate);
                createEventDto.endDate = toLocalISOString(createEventDto.endDate);
            }
            //Delete From TempTable
            await this.prismaService.temporaryUploadedFiles.deleteMany({
                where: {
                    fileName: createEventDto.logoPath,
                    formUniqueId: "ArticleLogos",
                }
            });
            const getDisplayOrder = await this.prismaService.latestArticles.aggregate({
                _max: {
                    displayOrder: true,
                },
            });
            const currentDisplayOrder = getDisplayOrder._max.displayOrder ? getDisplayOrder._max.displayOrder : 0;
            const InsertedData = await this.prismaService.latestArticles.create({
                data: {
                    title: createEventDto.title,
                    postName: createEventDto.postName,
                    categoryId: +createEventDto.categoryId,
                    logoPath: createEventDto.logoPath,
                    webUrl: createEventDto.webUrl,
                    displayOrder: currentDisplayOrder + 1,
                    EndDate: createEventDto.endDate,
                    StartDate: createEventDto.startDate,
                    description: createEventDto.description,
                    isActive: true,
                    isDelete: false,
                }
            });

            return {
                success: true,
                message: "successfully created",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async createCategory(categoryName: string) {
        try {
            const categoryId = await this.prismaService.articleCategory.create({
                data: {
                    categoryName: categoryName,
                    isActive: true,
                }
            })
            return categoryId.id;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    async getAllarticles(type: string) {
        try {
            const currentDate = new Date().toLocaleDateString('en-US');
            let whereClouse: any = {
                isDelete: false,
                isArchieve: true,
                AND: {
                    isActive: true,
                    StartDate: {
                        lte: toLocalISOString(currentDate),
                    },
                    EndDate: {
                        gte: toLocalISOString(currentDate),
                    },
                }
            }
            if (type == '') {
                delete (whereClouse?.isArchieve);
                delete (whereClouse?.AND);
            } else if (type == 'archived') {
                delete (whereClouse?.AND);
            }
            const response = await this.prismaService.latestArticles.findMany({
                where: whereClouse,
                select: {
                    postName: true,
                    id: true,
                    title: true,
                    isActive: true,
                    isArchieve: true,
                    webUrl: true,
                    logoPath: true,
                    StartDate: true,
                    EndDate: true,
                    description: true,
                    displayOrder: true,
                    categoryId: true,
                    updatedAt: true,
                    ArticleCategory: {
                        select: {
                            categoryName: true,
                        }
                    }
                },
                orderBy: {
                    displayOrder: 'asc',
                }
            });
            if (response) {
                for (const data of response) {
                    if (data.logoPath) {
                        const signedUrl = await this.gcsService.getSignedUrl(
                            data.logoPath,
                        );
                        (data as unknown as SignedUrlAddedDto).signedUrl = signedUrl;
                    }
                }
            }
            return response;
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async getArticleById(id: number) {
        try {
            return await this.prismaService.latestArticles.findFirst({
                where: {
                    id: id,
                },
                select: {
                    title: true,
                    isActive: true,
                    isArchieve: true,
                    webUrl: true,
                    logoPath: true,
                    StartDate: true,
                    EndDate: true,
                    categoryId: true,
                    ArticleCategory: {
                        select: {
                            categoryName: true,
                        }
                    }
                }
            })
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async updateArticleById(id: number, updateArticleDto: CreateArticleDto) {
        try {
            // if(updateArticleDto.startDate != '' && updateArticleDto.endDate != ''){
            updateArticleDto.startDate = toLocalISOString(updateArticleDto.startDate);
            updateArticleDto.endDate = toLocalISOString(updateArticleDto.endDate);
            // }
            const data = await this.prismaService.latestArticles.updateMany({
                where: {
                    id: id,
                    categoryId: updateArticleDto.categoryId
                },
                data: {
                    title: updateArticleDto.title,
                    description: updateArticleDto.description,
                    logoPath: updateArticleDto.logoPath,
                    webUrl: updateArticleDto.webUrl,
                    StartDate: updateArticleDto.startDate,
                    EndDate: updateArticleDto.endDate,
                    postName: updateArticleDto.postName,
                },
            });
            // await this.prismaService.temporaryUploadedFiles.deleteMany({
            //     where:{
            //         fileName: updateArtcleDto.logoPath,
            //     }
            // })
            return {
                success: true,
                message: 'updated successfully',
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async deleteAtricle(id: number) {
        try {
            return await this.prismaService.latestArticles.delete({
                where: {
                    id: id,
                }
            })
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }

    }

    async findOne(id: number) {
        try {
            const response = await this.prismaService.latestArticles.findFirst({
                where: {
                    id: id,
                }
            });
            if (response) {
                if (response.logoPath) {
                    const signedUrl = await this.gcsService.getSignedUrl(
                        response.logoPath,
                    );
                    (response as unknown as SignedUrlAddedDto).signedUrl = signedUrl;
                }
            }
            return response;
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }

    }

    async getAllCategories() {
        try {
            return await this.prismaService.articleCategory.findMany({
                where: {
                    isActive: true,
                    isDelete: false
                },
                select: {
                    id: true,
                    categoryName: true,
                },
                orderBy: {
                    id: 'asc',
                }
            })
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async updateDisplayOrder(postData: { id: number, displayOrder: number }[]) {
        try {
            await this.prismaService.$transaction(async (prisma) => {
                for (const item of postData) {
                    await prisma.latestArticles.update({
                        where: { id: Number(item.id) },
                        data: { displayOrder: item.displayOrder },
                    });
                }
            });
            return {
                success: true,
                message: "Order updated successfully",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }
    async updateArticleStatus(id: number) {
        try {
            const data = await this.getArticleById(id);

            if (!data) {
                throw new Error('Article not found');
            }

            if (data.categoryId == 1 && !data.isActive) {
                // Extract the date range of the current article
                const currentStartDate = data.StartDate;
                const currentEndDate = data.EndDate;

                // Fetch all other articles (excluding the current one)
                const allArticles = await this.prismaService.latestArticles.findMany({
                    where: {
                        categoryId: 1,
                        isActive: true,
                        id: {
                            not: id,

                        },
                    },
                });

                // Check if the date range overlaps with any other article
                const isOverlapping = allArticles.some(({ StartDate, EndDate }) => {
                    return (currentStartDate <= EndDate && currentEndDate >= StartDate);
                });

                if (isOverlapping) {
                    throw new HttpException(
                        `Cannot update the article. The date range (${currentStartDate.toDateString()} to ${currentEndDate.toDateString()}) overlaps with another Main Article's range.`, HttpStatus.BAD_GATEWAY
                    );
                }
            }

            await this.prismaService.latestArticles.update({
                where: {
                    id: id,
                },
                data: {
                    isActive: !data?.isActive,
                }
            })
            return {
                success: true,
                message: "Order updated successfully",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async archiveArticle(id: number) {
        try {
            const data = await this.getArticleById(id);

            const updateddata = await this.prismaService.latestArticles.update({
                where: {
                    id: id,
                },
                data: {
                    isArchieve: !data?.isArchieve,
                }
            });
            return updateddata.id;
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }
    async checkArticleDates(id: number, categoryId: number, startDaate: string, endDaate: string) {
        try {
            let start = toLocalISOString(startDaate);
            // start.setDate(start.getDate()-1);

            let end = toLocalISOString(endDaate);
            // end.setDate(end.getDate()-1);
            return await this.prismaService.latestArticles.findMany({
                where: {
                    id: { not: id },
                    isActive: true,
                    isDelete: false,
                    categoryId: +categoryId,
                    StartDate: {
                        lte: end,
                    },
                    EndDate: {
                        gte: start,
                    },
                },
            });
        } catch (err) {
            throw new HttpException(err.message, err.status, { cause: new Error(err) });
        }
    }
}