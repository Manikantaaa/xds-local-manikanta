import { Test, TestingModule } from '@nestjs/testing';
import { CompanyReportsService } from './company-reports.service';

describe('CompanyReportsService', () => {
  let service: CompanyReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyReportsService],
    }).compile();

    service = module.get<CompanyReportsService>(CompanyReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
