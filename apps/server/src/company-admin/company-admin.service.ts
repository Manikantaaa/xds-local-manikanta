import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { CompaniesAdminRepository } from './company-admin.repository';
import { UpdateGroupPermissionDto } from './dto/group-permission.dto';
import admin from "firebase-admin";
import { Prisma } from '@prisma/client';
import e from 'express';
@Injectable()
export class CompanyAdminService {
  constructor(
    private readonly CompanyAdminRepo: CompaniesAdminRepository
  ) { }
  createCompanyUser(PostData: any, CompanyId: number) {
    return this.CompanyAdminRepo.creatCompanyUser(PostData, CompanyId);
  }

  updateCompanyAdminUser(PostData: {teamandstudio: string; groupId: string}, userId: number, companyId: number) {
    return this.CompanyAdminRepo.updateCompanyAdminUser(PostData, userId, companyId);
  }
  checkUserLimit(CompanyId: number) {
    return this.CompanyAdminRepo.checkCompanyUserLimit(CompanyId);
  }
  checkUserEmail(email: string) {
    return this.CompanyAdminRepo.checkCompanyUserEmail(email);
  }
  async deleteCompanyUser(userId: number, companyId: number, email: string) {
    const currentUser = await admin.auth().getUserByEmail(email);
    if (currentUser && currentUser.uid) {
      await admin.auth().deleteUser(currentUser.uid);
      return this.CompanyAdminRepo.deletCompanyUser(userId, companyId, email);
    } else {
      throw new BadRequestException("User not found in firebase");
    }
    
  }
  assignUserToGroup(userId: number[], groupId: number, companyId: number) {
    return this.CompanyAdminRepo.assignUserToGroup(userId, groupId, companyId)
  }
  removeUserFromGroup(userId: number, groupId: number, companyId: number) {
    return this.CompanyAdminRepo.removeUserFromGroup(userId, groupId, companyId)
  }

  updateGroupPermissions(permissionData: UpdateGroupPermissionDto[], groupId: number, companyId: number) {
    return this.CompanyAdminRepo.updateGroupPermission(permissionData, groupId, companyId);
  }
  async findGroupPermissions(groupId: number, companyId: number, userType: string) {
    const permissionData = await this.CompanyAdminRepo.findGroupPersmissions(groupId,  companyId, userType);
    const defaultDataAdding = permissionData.map((page) => {
      if (!page.permissions || page.permissions.length == 0) {
        page.permissions = [];
        page.permissions.push({ canDelete: false, canRead: false, canWrite: false, pageId: page.id })
      }
      return page;
    });

    return defaultDataAdding;
  }
  findAllPages() {
    return this.CompanyAdminRepo.findAllPages();
  }
  createCompanyGroup(PostData: any, CompanyId: number) {
    return this.CompanyAdminRepo.createCompanyGroup(PostData, CompanyId);
  }

  updateGroup(PostData: any, groupId: number, CompanyId: number) {
    return this.CompanyAdminRepo.updateCompanyGroup(PostData, groupId, CompanyId);
  }

  findCompanyAdminGroups(companyId: number) {
    return this.CompanyAdminRepo.findGroupByCompany(companyId);
  }
  findGroupUser(groupId: number, companyId: number) {
    return this.CompanyAdminRepo.findGroupUser(groupId, companyId);
  }

  findCompanyUsers(companyId: number, isAdmin: boolean = false) {
    return this.CompanyAdminRepo.findUsersByCompany(companyId, isAdmin);
  }
  findCompanyUserById(userId: number, companyId: number) {
    return this.CompanyAdminRepo.findCompanyUserById(userId, companyId);
  }

  createGroupsforAllUser(){
    return this.CompanyAdminRepo.createGroupsforAllUser()
  }
  createPermissionsAllgroups(){
    return this.CompanyAdminRepo.createPermissionsForall()
  }
  newPagePermissionsForall(pageId: number){
    return this.CompanyAdminRepo.NewPagePermissionsForall(pageId);
  }
  getInviteeById(id: number){
    return this.CompanyAdminRepo.getInviteeById(id)
  }
  async updateArchiveStatusAdminUser(id: number, type: string, email: string = ""){
    if(type == 'delete' && email != "") {
      const currentUser = await admin.auth().getUserByEmail(email);
      if (currentUser && currentUser.uid) {
        await admin.auth().deleteUser(currentUser.uid);
      } else {
        throw new BadRequestException("User not found in firebase");
      }
    }
    return this.CompanyAdminRepo.updateArchiveStatusAdminUser(id, type, email);
  }
  getGroupName(id: number, companyId: number){
    return this.CompanyAdminRepo.getGroupName(id, companyId);
  }

  create(createCompanyAdminDto: CreateCompanyAdminDto) {
    return 'This action adds a new companyAdmin';
  }

  findAll() {
    return `This action returns all companyAdmin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} companyAdmin`;
  }

  update(id: number, updateCompanyAdminDto: UpdateCompanyAdminDto) {
    return `This action updates a #${id} companyAdmin`;
  }

  remove(id: number) {
    return `This action removes a #${id} companyAdmin`;
  }

  // checkPermissions(id: number ) {
  //   return this.CompanyAdminRepo.checkPermissions(id);
  // }

  findUsers(search: string, filterVal: Prisma.CompanyAdminUserWhereInput[], userRole: string) {
    const users = this.CompanyAdminRepo.findUsers(search, filterVal, userRole);
    return users;
  }
  findCompanyUser(userId: number) {
    const users = this.CompanyAdminRepo.findCompanyUser(userId);
    return users;
  }

  findRegularUsers(search: string, filterVal: Prisma.UsersWhereInput[], userRole: string) {
    const users = this.CompanyAdminRepo.findRegularUsers(search, filterVal, userRole);
    return users;
  }
}
