import { PartialType } from '@nestjs/swagger';
import { CreateCompanyAdminDto } from './create-company-admin.dto';

export class UpdateCompanyAdminDto extends PartialType(CreateCompanyAdminDto) {}
