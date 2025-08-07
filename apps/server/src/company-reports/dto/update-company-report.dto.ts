import { PartialType } from '@nestjs/swagger';
import { CreateCompanyReportDto } from './create-company-report.dto';

export class UpdateCompanyReportDto extends PartialType(CreateCompanyReportDto) {}
