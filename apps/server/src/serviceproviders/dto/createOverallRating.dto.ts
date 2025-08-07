import { RATING_STATUS, SECURITY_STATUS, SOW_STATUS } from "@prisma/client";

export class CreateOverallratings {
    buyerId: number;
    companyId: number;
    prefferedPartner: RATING_STATUS;
    performanceRating: number;
    nonDiscloser: RATING_STATUS;
    masterService: RATING_STATUS;
    securityStatus: SECURITY_STATUS;
    sowStatus: SOW_STATUS
}
