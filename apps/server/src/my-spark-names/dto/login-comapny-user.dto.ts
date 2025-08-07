export class LoggedInCompanyUser{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    linkedInUrl: string;
    approvalStatus: string;
    stripeCustomerId: string;
    stripeSubscriptionId:  string;
    userType:  string;
    accessExpirationDate:  string;
    isPaidUser: boolean;
    isAddedFromCsv: boolean;
    isFlagged: boolean;
    isArchieve: boolean;
    isDelete: boolean;
    status: number;
    createdAt:  string;
    updatedAt:  string;
    userRoles: [
        {
            id: number,
            userId: number,
            roleCode:  string;
            isArchieve: boolean,
            isDelete: boolean,
            status: number,
            createdAt:  string;
            updatedAt:  string;
        }
    ]
    companies: [
        {
            name:  string;
            isTourCompleted: boolean;
            id: number;
            CompanyContacts: [];
        }
    ];
    pagePermissions:[
        {
        id:number;
        groupId:number;
        pageId:number;
        canRead:boolean;
        canWrite:boolean;
        canDelete:boolean;
        createdAt:string;
        updatedAt:string;
        }
    ]
    isCompanyUser: boolean;
    CompanyAdminId: number;
    CompanyAdminEmail: string;
}


