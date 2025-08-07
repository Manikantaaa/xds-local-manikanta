import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateEventDto, createSponseredDto, SpservicePaths } from "./dto/create-event.dto";
import { toLocalISOString } from "src/common/methods/common-methods";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/gcs.service";
import { $Enums } from "@prisma/client";

interface SignedUrlAddedDto extends CreateEventDto {
    signedUrl?: string,
}

interface SignedUrlSpServicesDto extends createSponseredDto {
    defaultSignedUrl: string,
    sponseredSignedUrl?: string,
    sponseredLogoSignedUrl?: string,
}

@Injectable()
export class EventsRepository {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly gcsService: GoogleCloudStorageService,
    ) { }


    async create(createEventDto: CreateEventDto) {

        createEventDto.startDate = toLocalISOString(createEventDto.startDate);
        createEventDto.endDate = toLocalISOString(createEventDto.endDate);

        //Delete From TempTable
        await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
                fileName: createEventDto.eventLogo,
                formUniqueId: "Events",
            }
        });
        const companies = createEventDto.companies;
        delete createEventDto.companies;
        const getDisplayOrder = await this.prismaService.events.aggregate({
            _max: {
                displayOrder: true,
            },
        });
        const currentDisplayOrder = getDisplayOrder._max.displayOrder ? getDisplayOrder._max.displayOrder : 0;
        const InsertedData = await this.prismaService.events.create({
            data: {
                eventName: createEventDto.eventname,
                eventLocation: createEventDto.eventLocation,
                eventLogo: createEventDto.eventLogo,
                eventDescription: createEventDto.eventdescription,
                eventUrl: createEventDto.eventURL,
                displayOrder: currentDisplayOrder + 1,
                eventEndDate: createEventDto.endDate,
                eventStartDate: createEventDto.startDate,
            }
        });

        await this.AddEventAttendees(InsertedData.id, companies)
        return {
            success: true,
            message: "successfully created",
        }
    }

    async AddEventAttendees(id: number, companies: any) {

        // first Delete If exist
        await this.prismaService.eventAttendees.deleteMany({
            where: {
                eventsId: id,
            }
        });
        // add again
        const eventAttendeesData: {
            companyId: number,
            eventsId: number
        }[] = [];
        companies?.map((company_id: number) => {
            eventAttendeesData.push({
                companyId: Number(company_id),
                eventsId: id,
            })
        });
        await this.prismaService.eventAttendees.createMany({
            data: eventAttendeesData,
        });
    }
    async findAllActiveEvents() {

        try {
            const list = await this.prismaService.events.findMany({
                where: {
                    //  isArchieve: false,
                    isDelete: false,
                },
                select: {
                    isArchieve: true,
                    eventName: true,
                    id: true,
                    displayOrder: true,
                },
                orderBy: {
                    displayOrder: "asc",
                }
            });

            return {
                data: list,
                success: true,
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async updateEventsOrder(postData: { qsnData: { id: number, orderId: number } }[]) {
        try {
            await this.prismaService.$transaction(async (prisma) => {
                for (const item of postData) {
                    await prisma.events.update({
                        where: { id: Number(item.qsnData.id) },
                        data: { displayOrder: item.qsnData.orderId },
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
    async updateEventsDisplay(id: number) {
        try {
            const isArchieved = await this.prismaService.events.findFirst({
                select: {
                    isArchieve: true,
                },
                where: {
                    id: Number(id)
                }
            });
            await this.prismaService.events.update({
                where: {
                    id: Number(id),
                },
                data: {
                    isArchieve: !isArchieved?.isArchieve,
                }
            })
            return {
                success: true,
                message: "updated successfully",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }


    }
    async deleteEventWithId(id: number) {
        try {
            await this.prismaService.events.update({
                where: {
                    id: Number(id),
                },
                data: {
                    isDelete: true,
                }
            });
            return {
                success: true,
                message: "successfully Deleted",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async getEventById(id: number) {
        try {
            const data = await this.prismaService.events.findFirst({
                where: {
                    id: Number(id),
                    isDelete: false,
                },
                select: {
                    eventDescription: true,
                    eventLocation: true,
                    eventLogo: true,
                    eventName: true,
                    eventUrl: true,
                    eventStartDate: true,
                    eventEndDate: true,
                    EventAttendees: {
                        where:{
                            Companies : {
                                isArchieve: false,
                                isDelete: false,
                                user:{
                                    approvalStatus: 'completed',
                                    userRoles: {
                                        some: {
                                            roleCode: $Enums.ROLE_CODE.service_provider,
                                        },
                                    },
                                }
                            }
                        },
                        select: {
                            Companies: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    }
                }
            });

            if (data) {
                const signedUrl = await this.gcsService.getSignedUrl(
                    data?.eventLogo,
                );
                (data as unknown as SignedUrlAddedDto).signedUrl = signedUrl;
            }

            return {
                data,
                success: true,
                message: "successfully Fetched",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async getAllEvents(companyId: number, loggedCompanyId: number) {
        try {
            let whereclause: any = {
                isDelete: false,
                isArchieve: false,
                EventAttendees: { some: { companyId: companyId } }
            };
            const selectClause: any = {
                id: true,
                eventDescription: true,
                eventLocation: true,
                eventLogo: true,
                eventName: true,
                eventUrl: true,
                eventStartDate: true,
                eventEndDate: true,
                EventAttendees:{
                    where:{
                        companyId: companyId,
                    },
                    select:{
                        id: true,
                        meetToMatchLink: true,
                    }
                }
            };

            if (companyId === 0) {
                delete (whereclause?.EventAttendees);
                selectClause.EventAttendees = {
                    where: {
                        companyId: loggedCompanyId,
                    },
                    select: {
                        companyId: true,
                        id: true,
                        meetToMatchLink: true,
                    }
                };
            }
            const data = await this.prismaService.events.findMany({
                where: whereclause,
                select: selectClause,
                orderBy: {
                    displayOrder: 'asc',
                }
            });

            if (data) {
                for (const item of data) {
                    if (typeof item.eventLogo === 'string') {
                        const signedUrl = await this.gcsService.getSignedUrl(item.eventLogo);
                        (item as unknown as SignedUrlAddedDto).signedUrl = signedUrl;
                    }
                }
            }

            return {
                data,
                success: true,
                message: "successfully Fetched",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async updateEvent(id: number, updateEventDto: CreateEventDto) {
        try {
            updateEventDto.startDate = toLocalISOString(updateEventDto.startDate);
            updateEventDto.endDate = toLocalISOString(updateEventDto.endDate);

            //check Image Updated or Not
            const isImageUpdated = await this.prismaService.events.findFirst({
                where: {
                    id: id,
                },
                select: {
                    eventLogo: true,
                }
            });

            //updating Temp Table if Image Updated
            if (isImageUpdated && isImageUpdated.eventLogo != updateEventDto.eventLogo) {
                await this.checkIsImageUpdated(isImageUpdated.eventLogo, updateEventDto.eventLogo, "Events");
            }

            const companies = updateEventDto.companies;
            delete updateEventDto.companies;
            await this.prismaService.events.update({
                where: {
                    id: Number(id)
                },
                data: {
                    eventName: updateEventDto.eventname,
                    eventLocation: updateEventDto.eventLocation,
                    eventLogo: updateEventDto.eventLogo,
                    eventDescription: updateEventDto.eventdescription,
                    eventUrl: updateEventDto.eventURL,
                    eventEndDate: updateEventDto.endDate,
                    eventStartDate: updateEventDto.startDate,
                }

            });

            //Inserting Attendees
            await this.AddEventAttendees(id, companies);

            return {
                success: true,
                message: "successfully updated",
            }
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }
    async addAttandee(eventId: number, companyId: number) {
        try {
            await this.prismaService.eventAttendees.create({
                data: {
                    companyId: companyId,
                    eventsId: eventId,
                },
            });
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }
    async romevAttandee(eventId: number, companyId: number) {
        try {
            await this.prismaService.eventAttendees.deleteMany({
                where: {
                    companyId: companyId,
                    eventsId: eventId,
                }
            });
        } catch (error) {
            throw new HttpException(error.message, error.status, { cause: new Error(error) });
        }
    }

    async checkIsImageUpdated(OldeventLogo: string, updatedeventLogo: string, formUniqueId: string) {

        //delete new Image from temp DB, before Inserting In Events Table
        const resp = await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
                fileName: updatedeventLogo,
                formUniqueId: formUniqueId,
            }
        });

        // insert Old Image in Temp table to delete permanantly from Bucket 
        const resp2 = await this.prismaService.temporaryUploadedFiles.create({
            data: {
                fileName: OldeventLogo,
                formUniqueId: formUniqueId,
            }
        });
    }

    async updatingMeetLink(id: number, updateEventDto: {meetLink: string}) {
        return await this.prismaService.eventAttendees.update({
            where:{
                id: id,
            },
             data:{
                meetToMatchLink: updateEventDto.meetLink,
             }
        })

    }
    /*****************Services****************************************************************************************************************** */
    async saveSponseredService(createServiceData: createSponseredDto) {
        if (createServiceData.startDate) {
          createServiceData.startDate = toLocalISOString(createServiceData.startDate);
        }
        if (createServiceData.endDate) {
          createServiceData.endDate = toLocalISOString(createServiceData.endDate);
        }


        //Delete From TempTable
        await this.prismaService.temporaryUploadedFiles.deleteMany({
            where: {
                fileName: createServiceData.defaultServiceImage,
                formUniqueId: SpservicePaths.defaultImage,
            }
        });

        if (createServiceData.sponseredServiceImage) {
            await this.prismaService.temporaryUploadedFiles.deleteMany({
                where: {
                    fileName: createServiceData.sponseredServiceImage,
                    formUniqueId: SpservicePaths.sponseredImage,
                }
            });
        }

        await this.prismaService.sponseredServices.create({
            data: {
                serviceId: Number(createServiceData.service),
                defafultImg: createServiceData.defaultServiceImage,
                sponseredImg: createServiceData.sponseredServiceImage,
                sponseredLogoImg: createServiceData.sponseredServiceLogoImage,
                serviceTitle: createServiceData.companyName,
                companyId: (createServiceData.companies && createServiceData.companies[0] && Number(createServiceData.companies[0])) || null,
                startDate: (createServiceData.startDate) ? createServiceData.startDate : null,
                endDate: (createServiceData.endDate) ? createServiceData.endDate : null,
            }
        })
    }
    async findAllSponseredService() {
        const response = await this.prismaService.sponseredServices.findMany({
            where: {
                isArchieve: false,
                isDelete: false,
            },
            select: {
                id: true,
                endDate: true,
                startDate: true,
                serviceTitle: true,
                defafultImg: true,
                sponseredImg: true,
                Companies: {
                  select: {
                    bannerAsset: {
                      select: {
                        url: true,
                      },
                    }
                  }
                },
                Services: {
                    select: {
                        id: true,
                        serviceName: true,
                    }
                }
            },
            orderBy: {
                Services: {
                    serviceName: "asc",
                }
            }
        })

        if (response) {
            for (const item of response) {
                if (item.defafultImg != "") {

                    if (item.endDate && item.startDate) {
                        const currentDate = new Date().setHours(0, 0, 0, 0);
                        const endDate = new Date(item.endDate).setHours(0, 0, 0, 0);
                        const startDate = new Date(item.startDate).setHours(0, 0, 0, 0);

                        if (currentDate <= endDate && startDate <= currentDate) {
                          if(item.Companies && item.Companies.bannerAsset && item.Companies.bannerAsset.url){
                            const signedUrl = await this.gcsService.getSignedUrl(item.Companies.bannerAsset.url);
                            item.defafultImg = signedUrl;
                          } else {
                            const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                            item.defafultImg = signedUrl;
                          }
                        } else {
                            const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                            item.defafultImg = signedUrl;
                            item.serviceTitle = "";
                        }
                    } else if(item.startDate && !item.endDate) {
                        const currentDate = new Date().setHours(0, 0, 0, 0);
                        const startDate = new Date(item.startDate).setHours(0, 0, 0, 0);
                        if (currentDate >= startDate) {
                          if(item.Companies && item.Companies.bannerAsset && item.Companies.bannerAsset.url){
                            const signedUrl = await this.gcsService.getSignedUrl(item.Companies.bannerAsset.url);
                            item.defafultImg = signedUrl;
                          } else {
                            const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                            item.defafultImg = signedUrl;
                          }
                        } else {
                          const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                          item.defafultImg = signedUrl;
                        }
                    } else {
                        const signedUrl = await this.gcsService.getSignedUrl(item.defafultImg);
                        item.defafultImg = signedUrl;
                        item.serviceTitle = "";
                    }
                    if (item.endDate) {
                        item.endDate = null;
                    }
                    if (item.sponseredImg) {
                        item.sponseredImg = null;
                    }
                }
            }
        }
        return response;
    }

    async getSpserviceById(spServiceId: number) {
        const data = await this.prismaService.sponseredServices.findFirst({
            where: {
                id: Number(spServiceId),
                isArchieve: false,
                isDelete: false,
            },
            include: {
                Services: {
                    select: {
                        serviceName: true,
                        id: true,
                    }
                },
                Companies: {
                    select: {
                        name: true,
                        id: true,
                    }
                }
            }
        });
        if (data) {
            if (typeof data.defafultImg === 'string') {
                const signedUrl = await this.gcsService.getSignedUrl(data.defafultImg);
                (data as unknown as SignedUrlSpServicesDto).defaultSignedUrl = signedUrl;
            }
            if (data.sponseredImg && typeof data.sponseredImg === 'string') {
                const signedUrl = await this.gcsService.getSignedUrl(data.sponseredImg);
                (data as unknown as SignedUrlSpServicesDto).sponseredSignedUrl = signedUrl;
            }
            if (data.sponseredLogoImg && typeof data.sponseredLogoImg === 'string') {
                const signedUrl = await this.gcsService.getSignedUrl(data.sponseredLogoImg);
                (data as unknown as SignedUrlSpServicesDto).sponseredLogoSignedUrl = signedUrl;
            }

            if (data) {
                if(data.startDate && data.endDate){
                    const endDate = new Date(data.endDate).setHours(0,0,0,0);
                    const currentDate = new Date().setHours(0, 0, 0, 0);
                    if (currentDate > endDate && (data?.Companies?.id)) {
                        data.Companies.id = 0;
                        data.Companies.name = "";
                    }
                } 
                
            }
        }
        return data;
    }

    async updateSpservice(spServiceId: number, upateSponseredDto: createSponseredDto) {
        if (upateSponseredDto.startDate) {
            upateSponseredDto.startDate = toLocalISOString(upateSponseredDto.startDate)
        }
        if (upateSponseredDto.endDate) {
          upateSponseredDto.endDate = toLocalISOString(upateSponseredDto.endDate);
        }

        //check Image Updated or Not
        if (upateSponseredDto.defaultServiceImage && upateSponseredDto.defaultServiceImage != "") {
            const isImageUpdated = await this.prismaService.sponseredServices.findFirst({
                where: {
                    id: spServiceId,
                },
                select: {
                    defafultImg: true,
                }
            });
            //updating Temp Table if Image Updated
            if (isImageUpdated && isImageUpdated.defafultImg != upateSponseredDto.defaultServiceImage) {
                await this.checkIsImageUpdated(isImageUpdated.defafultImg, upateSponseredDto.defaultServiceImage, SpservicePaths.defaultImage);
            }
        }
        // if (upateSponseredDto.sponseredServiceImage && upateSponseredDto.sponseredServiceImage != "") {
        //     const isImageUpdated = await this.prismaService.sponseredServices.findFirst({
        //         where: {
        //             id: spServiceId,
        //         },
        //         select: {
        //             sponseredImg: true,
        //         }
        //     });
        //     //updating Temp Table if Image Updated
        //     if (isImageUpdated && isImageUpdated.sponseredImg && isImageUpdated.sponseredImg != upateSponseredDto.sponseredServiceImage) {
        //         await this.checkIsImageUpdated(isImageUpdated.sponseredImg, upateSponseredDto.sponseredServiceImage, SpservicePaths.defaultImage);
        //     }
        // }

        if(upateSponseredDto.companies && upateSponseredDto.companies.length < 1) {
          upateSponseredDto.endDate = "";
          upateSponseredDto.startDate = "";
        }


        await this.prismaService.sponseredServices.update({
            where: {
                id: Number(spServiceId)
            },
            data: {
                serviceId: Number(upateSponseredDto.service),
                defafultImg: upateSponseredDto.defaultServiceImage,
                sponseredImg: upateSponseredDto.sponseredServiceImage,
                sponseredLogoImg: upateSponseredDto.sponseredServiceLogoImage,
                serviceTitle: upateSponseredDto.companyName,
                companyId: (upateSponseredDto.companies && upateSponseredDto.companies[0] && Number(upateSponseredDto.companies[0])) || null,
                startDate: upateSponseredDto.startDate ? upateSponseredDto.startDate : null,
                endDate: upateSponseredDto.endDate ? upateSponseredDto.endDate : null,
            }

        })
    }
    /****************************************************** */
}