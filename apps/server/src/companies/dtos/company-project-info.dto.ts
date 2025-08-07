import { Project } from "../types";

export class CompanyProjectInfoDto {
  projects: Project[];
  id: number;
  UniqueFormId? : string;
}
