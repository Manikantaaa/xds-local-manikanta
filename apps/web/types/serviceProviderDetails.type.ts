export type cdDataType = {
    companyId: number;
    foundingYear: string;
    founderName: string;
    foundingDescription: string;
    workModel: string;
    certifications: string;
    Security: string;
    tools: string;
  };
  export type CompanyPlatformExperience = {
    platforms:{
      name: string,
    }
  }
  export type CompanyGameEngines = {
    gameEngineName: string,
  }
  export type CompanyAddressType = {
    location_name: string;
    address1: string;
    address2: string;
    state: string;
    city: string;
    zipcode: string;
    Country: {
      name: string;
    };
  };
  
  export type companyContactTypes = {
    name: string;
    email: string;
    title: string;
    linkedInUrl: string;
    calendarLink: string;
    profilePic: string;
    country: {
      name: string;
    };
  };
 export type ApiResponse = {
    profilePdfPath: string;
    id: number;
    userId: number;
    name: string;
    website: string;
    shortDescription?: string | undefined;
    companySize: number;
    about: string;
    logoAssetId: number;
    bannerAssetId: number;
    isFoundingSponcer: boolean;
    isArchieve: boolean;
    isDelete: boolean;
    status: number;
    addedAnnouncement: boolean;
    user?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      linkedInUrl: string;
      approvalStatus: string;
      stripeCustomerId: string;
      accessExpirationDate: string;
      isArchieve: boolean;
      isDelete: boolean;
      status: string;
      createdAt: string;
      updatedAt: string;
      isPaidUser: boolean;
      // assets?:[{
      //     url:string,
      // }],
      userRoles?: [
        {
          roleCode: string;
        },
      ];
    };
    logoAsset?: {
      url: string | "/16by9 image.png";
    };
    bannerAsset?: {
      url: string | "/16by9 image.png";
    };
    ServicesOpt?: [
      {
        service: {
          serviceName: string;
          groupId: number;
        };
      },
    ];
    companySizes?: {
      size: string;
    };
    CompanyAddress: [
      {
        location_name: string;
        Country: {
          name: string;
        };
      },
    ];
    success: boolean;
    statusCode: number;
  };
  
  export type portfolioAlbumFilesTypes = {
    id: number;
    albumId: number;
    fileUrl: string;
    thumbnail: string;
    type: string;
    fileName: string;
    fileIndex: string;
    isSelected: boolean,
    status: number;
    createdAt: string;
    updatedAt: string;
    isLoaded?: boolean;
  };
  
  export type portfolioTypes = {
    portfolioProjectId: number;
    type?: string;
    fileUrl?: string;
    id: number;
    albumName: string;
    companyId: number;
    status: number;
    createdAt: string;
    updatedAt: string;
    portfolioAlbumFiles: portfolioAlbumFilesTypes[];
    isLoaded?: boolean;
  };
  
  export type companyPortfolioMainTypes = {
    name: string;
    completionDate: string;
    description: string;
    testimonial_name: string;
    testimonial_company: string;
    testimonial_title: string;
    testimonial_feedback: string;
    FileUploads: [{ fileUrl: string; type: string, thumbnail: string }];
    PlatformsOpt: [
      {
        platforms: {
          name: string;
        };
      },
    ];
  };

  export type companyPortfolioTypes = {
    name: string;
    completionDate: string;
    description: string;
    testimonial_name: string;
    testimonial_company: string;
    testimonial_title: string;
    testimonial_feedback: string;
    FileUploads: { fileUrl: string; type: string, thumbnail: string, isLoaded?: boolean }[];
    PlatformsOpt: [
      {
        platforms: {
          name: string;
        };
      },
    ];
  };