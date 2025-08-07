import { Injectable } from '@nestjs/common';
import { CreateCompanyReportDto } from './dto/create-company-report.dto';
import { UpdateCompanyReportDto } from './dto/update-company-report.dto';
import { CompanyReportsRepository } from './company-reports.repository';
@Injectable()
export class CompanyReportsService {
  constructor(
    private readonly CompanyReportsRepository: CompanyReportsRepository,
  ){}
  create(createCompanyReportDto: CreateCompanyReportDto) {
    return 'This action adds a new companyReport';
  }

  findAll() {
    return this.CompanyReportsRepository.findAll();
  }
  findStatistics() {
    return this.CompanyReportsRepository.findStaticsData();
  }
  findListsData() {
    return this.CompanyReportsRepository.findListsData();
  }
  getStripeData() {
    return this.CompanyReportsRepository.getStripeData();
  }
  getMailchimpData(type: "listCount" | "listPercent" | "listsData") {
    return this.CompanyReportsRepository.getMailchimpData(type);
  }

  findOne(id: number) {
    return `This action returns a #${id} companyReport`;
  }

  update(id: number, updateCompanyReportDto: UpdateCompanyReportDto) {
    return `This action updates a #${id} companyReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} companyReport`;
  }
}
