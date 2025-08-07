export class CreateMyopportunityDto {
  id?: number;
  companyId: string;
  uniqueFormId?: string;
  deletdFilePaths?: string;;
  name: string;
  description: string;
  oppStatus: string;
  industryId: string;
  platforms: string[];
  technologies: string;
  approxEndDateCondition: string;
  expiryDate: string;
  approxStartDateCondition: string;
  showCompanyName: boolean | null;
  showContactPerson: boolean | null;
  approxStartDate: string | null;
  approxEndDate: string | null;
  staffMonths: string;
  contactPersonName: string | null;
  isReceiveEmailEnabled: boolean | null;
  servicesselected: string[] | [];
  capabilitiesSelected: string[] | [];
  dbInputFiles: {
    map(arg0: (file: { fileUrl: any; }) => any): unknown; type: string, fileUrl: string 
};
  combinedservices: { serviceId: number; capabilityId: string | null };
}
