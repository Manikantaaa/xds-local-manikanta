export type service = { id: number; serviceName: string };

export type regionsresponse = {
  name: string;
  checked: boolean;
  Country: {
    id: number;
    name: string;
    checked: boolean;
  }[];
};

export type companysizeresponse = {
  id: number;
  size: string;
};


export type ApiResponse = {
  slug: string,
  id: number;
  userId: number;
  name: string;
  website: string;
  shortDescription: string;
  companySize: number;
  about: string;
  logoAssetId: number;
  bannerAssetId: number;
  isFoundingSponcer: boolean;
  isArchieve: boolean;
  isDelete: boolean;
  status: number;
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
  CompanyContacts: [
    {
      name: string;
      email: string;
    },
  ];
  CompanyGameEngines: [
    {
      gameEngineName: string,
    }
  ],
  CompanyPlatformExperience:[{
    platforms: string,
  }],
  sPBuyerCompanyRatings: [{
    prefferedPartner: string;
    avgPerformanceRating: number;
  }],
  sPBuyerprojectcompanyId:[{
    overallRating: number,
  }],
  followedCompanies:[
    {
      companyId: number;
    }
  ]
  success: boolean;
  statusCode: number;
};

export interface SelectedEvent {
  id: number;
  name: string;
}

export type SearchValueTypes = {
  InputsearchValue?: string;
  servicesearchValue?: { [serviceName: string]: string[] } | string;
  selectedCapabilities?: string;
  countrySearchValue?: string;
  companySizeSearchValue?: string;
  currentSelectedEvents: SelectedEvent[];
  selectedPlatforms?: SelectedPlatformsType[];
};
export type ServiceProvidersListProps = {
  isPremiumUsersOnly: boolean;
  searchValues: SearchValueTypes | undefined;
  updatedAddtoProps: boolean | undefined;
  onVisibilityChange: (isVisible: boolean) => void;
  sendselectedCompanies: (companies: number[]) => void;
  onFilterChange: (filerchnaged: boolean) => void;
  setsortCustomColumn: (columnOrder: string) => void;
  setsortCustomColumnField: (columnName: string) => void;
  //onCapabilityChange: (selectedServiceCapabilities: { [serviceName: string]: string[] }) => void;
  // onSearchChange: (selectedServices: { [serviceName: string]: string[] }) => void;
  // updateSponseredService: (sponsoredServices: { serviceName: string, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number }) => void;
  sortCustomColumn: string;
  sortCustomColumnField: string;
  clearAddtoCompanies: boolean;
  generateLinkUser: boolean;
};

export interface ShuffleListPostData {
  listIds?: number[];
  needsSuffle: number;
  recordsPerPage: number,
}

export interface sponsoredServices {
  id: number,
  defafultImg: string,
  sponseredLogoImg: string,
  serviceTitle: string,
  Companies: {
    id: number,
    name: string,
    slug: string,
  },
  Services: {
    id: number,
    serviceName: string,
  }
}

export interface SelectedEvent {
  id: number;
  name: string;
}

export interface ServicessidenavbarProps {
  onSearchChange: (selectedServices: { [serviceName: string]: string[] }) => void;
  onCapabilityChange: (selectedServiceCapabilities: { [serviceName: string]: string[] }) => void;
  onRegionChange: (selectedCountries: string[]) => void;
  onEventChange?: (selectedEvents: SelectedEvent[]) => void;
  onCompanysizeChange: (selectedCompanySizes: string[]) => void;
  handlePlatformChange: (selectedPlatforms: SelectedPlatformsType[]) => void;
  SelectedEvents: SelectedEvent[];
  setCurrentSelectedEvents: (selectedEvent: SelectedEvent[]) => void;
}

export type UpdatedServicessidenavbarProps = ServicessidenavbarProps & {
  removedsearchvalues?: { [serviceName: string]: string[] };
  removedregionsearchvalues?: string[];
  removedcompanysizesearchvalues?: string[];
  removedEventsValues?: number[];
  removedPlatformValues?: SelectedPlatformsType[];
  handleCapabilityChangeValues: { serviceName: string, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number } | undefined;
};

export type SelectedPlatformsType = {
  id: number,
  name: string,
}


export type MobileViewServiceProviderSideBarProps = {
  openServiceModal: boolean;
  setOpenServiceModal: React.Dispatch<React.SetStateAction<boolean>>;
  onSearchChange: (selectedServices: { [serviceName: string]: string[] }) => void;
  onCapabilityChange: (selectedServiceCapabilitiesforsearch: { [serviceName: string]: string[] }) => void;
  onRegionChange: (selectedCountries: string[]) => void;
  onEventChange?: (selectedEvents: SelectedEvent[]) => void;
  handlePlatformChange: (selectedPlatforms: SelectedPlatformsType[]) => void;
  onCompanysizeChange: (selectedCompanySizes: string[]) => void;
  removedsearchvalues?: { [serviceName: string]: string[] };
  removedregionsearchvalues?: string[];
  removedcompanysizesearchvalues?: string[];
  removedEventsValues?: number[];
  removedPlatformValues?: SelectedPlatformsType[];
  handleCapabilityChangeValues: { serviceName: string, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number } | undefined;
  setCurrentSelectedEvents: (selectedEvent: SelectedEvent[]) => void;
};