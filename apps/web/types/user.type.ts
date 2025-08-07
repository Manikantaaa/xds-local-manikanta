import { RoleCode } from "@/constants/roleCode";

export type APPROVAL_STATUS = "approved" | "completed";
export type USER_TYPE = "init" | "free" | "trial" | "paid";
export type TRIAL_PERIOD = "weekly" | "monthly" | "yearly" | "eightWeeks" | "sixMonths";
export type PASSWORD_STATUS = "init" | "adChanged" | "pwChanged";

export type CompleteSetupTokenUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  approvalStatus: APPROVAL_STATUS;
  companies: { name: string }[]
};

export type UseAccountRegisterProps = {
  token: string;
  password: string;
};

export type UseLoginProps = {
  email: string;
  password: string;
  newpassword?: string;
  checkedTerms?: boolean;
  checkedRemember2f?: string;
  savedUserId?: number;
};

export type Users = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companies: Company[];
  userRoles: Roles[];
  linkedInUrl: string;
  isArchieve: boolean;
  accessExpirationDate: Date;
  createdAt: Date;
  isFlagged?: boolean;
  isPaidUser: boolean;
  userType: USER_TYPE;
  trialDuration: TRIAL_PERIOD;
  isLoggedOnce: boolean;
  lastLoginDate?: Date;
};

export type Company = {
  id: number;
  name: string;
  website: string;
  shortDescription: string;
  companySize: number;
  about: string;
  logoUrl: string;
  bannerUrl: string;
  previewLogoUrl: string;
  previewBannerUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isFoundingSponcer: boolean;
  isArchieve: boolean;
  isDelete: boolean;
  status: number;
  user: Users;
};

export type Roles = {
  id: number;
  userId: number;
  roleCode: string;
};

export interface CustomResponse<T> {
  statusCode: number;
  success: boolean;
  data: T;
}

export interface TopReportsDto {
  id: number;
  pageViewedCount: number;
  pageVisitedCount: number;
  companyId: number;
  status?: number;
  company: {
    name: string;
    website: string;
    user: {
      firstName: string;
      lastName: string;
      userRoles: Roles[];
    };
  };
}

export type OpportunitiesDto = {
  id: 1;
  companyId: 1;
  name: string;
  description: string;
  oppStatus: string;
  approxStartDateCondition: number;
  approxStartDate: Date;
  approxEndDateCondition: number;
  approxEndDate: Date;
  staffMonths: number;
  showCompanyName: boolean;
  showContactPerson: boolean;
  isArchieve: boolean;
  isDelete: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  expiryDate: Date;
  company: {
    name: string;
  };
  industryTypes: {
    name: string;
  };
  PlatformsOpt: [
    {
      platforms: {
        id: number;
        name: string;
      };
    },
  ];
  ServicesOpt: [
    {
      service: {
        id: number;
        serviceName: string;
        groupId: number;
      };
    },
  ];
};

export type ListExcessExportType = {
  createdAt: Date,
  message: string,
  type: string,
  Companies: {
    id: number,
    name: string,
    user: {
      firstName: string,
      lastName: string,
      userRoles: [{
        role: {
          name: string,
        }
      }]
    }
  }
}

export type userPermissionsType = {
  isCompanyUser: boolean,
  canRead: boolean,
  canWrite: boolean,
  canDelete: boolean,
}

export type GroupUsersType = {
  firstName: string;
  LastName: string;
  id: number;
  groups: {
    name: string,
  }
}

export type groupPermissionListType = {
  description: string;
  id: number;
  name: string;
  permissions: { canDelete: boolean; canRead: boolean; canWrite: boolean; pageId: number; }[];
}
export type onlyPermissionsType = {
  canDelete: boolean; canRead: boolean; canWrite: boolean; pageId: number;
}

export type createGroupUser = {
  firstName: string;
  id?: number,
  LastName: string;
  teamandstudio: string;
  email: string;
  groupId: string;
  groups?: {
    name: string;
  },
  createdAt?: Date;
  companies?: {
    id: number,
    user: {
      userRoles:{
        roleCode: string,
      }[],
      firstName: string,
      lastName: string,
      id: number,
    }
  }
}
export type userInvitees = {
  id: number;
  firstName: string;
  LastName: string;
  email: string;
  companyId: number;
  groupId: number;
  isLoggedInOnce: boolean;
  isArchieve: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginDate?: Date;
  companies: {
    id: number;
    name: string;
    website: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      userType:string;
      trialDuration:string;
      userRoles: [
        {
          roleCode: string;
        }
      ]
    },
    CompanyAdminGroups: [
      {
        id: number;
        name: string;
      },
      {
        id: number;
        name: string;
      }
    ]
  },
  groups: {
    name: string;
  }
}

export type mysparkReportTypes = {
  companyId: number;
  userId: number;
  userName: string;
  companyname: string;
  userType: USER_TYPE;
  trialDuration: TRIAL_PERIOD;
  roleCode: string;
  companiesUpdatedCount: number;
  partnerStatus: number;
  average: number;
  rateServicesAverage: number;
  projectPerformanceAverage: number;
  notesAverage: number;
  updatedAt: Date;
};

export type opportunitiesReportTypes = {
  id: number;
  name: string;
  oppStatus: string,
  updatedAt: Date,
  isArchieve: boolean,
  expiryDate: Date,
  company: {
    id: number,
    name: string,
    user:{
      firstName: string,
      lastName: string,
    }
  },
  serviceProvidersIntrests: {
    company:{
      id: number,
      name: string,
    }
  }[],
}
