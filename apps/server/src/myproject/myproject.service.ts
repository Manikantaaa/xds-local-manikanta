import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateMyprojectDto } from "./dto/create-myproject.dto";
import { UpdateMyprojectDto } from "./dto/update-myproject.dto";
import { MyProjectRepository } from "./myproject.repository";
import { sanitizeData } from "src/common/utility/sanitizedata";
import { generateToken } from "src/common/methods/common-methods";

@Injectable()
export class MyprojectService {
  constructor(private readonly myProjectRepo: MyProjectRepository) {}
  create(createMylistDto: CreateMyprojectDto, companyId: number, role: string = "") {
    return this.myProjectRepo.CreateMyProject(sanitizeData(createMylistDto), companyId, role);
    // return this.myProjectRepo.CreateMyProject(createMylistDto);
  }

  async findMyProjects(userId: number) {
    const responselist = this.myProjectRepo.findAllMyProjects(userId);
    return responselist;
  }

  findOne(id: number, userId: number) {
    return this.myProjectRepo.findMyProject(id, userId);
  }

  findMyIntrestedProject(id: number, userId: number) {
    return this.myProjectRepo.findMyprojectIntrests(id, userId);
  }

  findMyIntrestedList(id: number) {
    return this.myProjectRepo.findMylistIntrests(id);
  }

  update(id: number, updateMyprojectDto: UpdateMyprojectDto, companyId: number) {
    // return this.myProjectRepo.updateMyProject(id, updateMyprojectDto);
    return this.myProjectRepo.updateMyProject(id, sanitizeData(updateMyprojectDto), companyId);
  }
  remove(id: number, userId: number) {
    return this.myProjectRepo.deletemyProject(id, userId);
  }

  async archiveMyProject(id: number, userId: number) {
    return this.myProjectRepo.archivemyproject(id, userId);
  }
  async shortListCompany(id: number) {
    return this.myProjectRepo.shortlistmyproject(id);
  }
  async removeCompanyFromMyProject(id: number, myProject: number, userId: number) {
    return this.myProjectRepo.removeCompanyFromMyProject(id, myProject, userId);
  }
  async getarchivedMyProjects(userId: number) {
    return this.myProjectRepo.getarchivedMyProjects(userId);
  }

  async getSearchCompanies(searchvalue: string) {
    return this.myProjectRepo.getSeachCompany(searchvalue);
  }

  async getSearchLists(searchvalue: string, userId: number) {
    return this.myProjectRepo.getSearchLists(searchvalue, userId);
  }

  async generateToken(projectId: number, userId: number) {
    const theProjectDetails = await this.myProjectRepo.getProjectById(projectId);
    if(userId == theProjectDetails?.userId) {
      if(theProjectDetails && theProjectDetails.id) {
        const theToken = generateToken();
        return this.myProjectRepo.createProjectsharingDetail(theProjectDetails.id, theToken);
      } else {
        throw new BadRequestException("List not found");
      }
    } else {
      throw new BadRequestException("Unauthorized Access");
    }
  }

  async getProjectIdByToken(token: string) {
    try {
      return await this.myProjectRepo.getProjectIdByToken(token);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async checkTokenAndList(token: string, listId: number) {
    try {
      return await this.myProjectRepo.checkTokenAndList(token, listId);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getListsInProject(projectId: number) {
    try {
      return await this.myProjectRepo.getListsInProject(projectId);
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

}
