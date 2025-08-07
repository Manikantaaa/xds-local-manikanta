export class ProjectPerformanceDto {
    buyerId: number;
    companyId: number;
    projectname: string;
    services: [
        {
            serviceId: number,
        },
    ];
    quality: number;
    onTimeDelivery:number;
    communication: number;
    overallRating: number;
    comment: string;
}
