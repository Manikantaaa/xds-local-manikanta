import { SOW_STATUS } from "@prisma/client";

export type ReportItem = {
    buyerId: number;
    companyId: number;
    nonDiscloser: string | null;
    masterService: string | null;
    securityStatus: string | null;
    prefferedPartner: string | null;
    sowStatus: SOW_STATUS;
    updatedAt: Date;
    sPBuyerRating:{
          name: string;
          user:{
              id: number;
              firstName: string;
              lastName: string;
              userType: string;
              trialDuration: string;
              userRoles:[
                {roleCode: string}
              ]
          }
      }
  };