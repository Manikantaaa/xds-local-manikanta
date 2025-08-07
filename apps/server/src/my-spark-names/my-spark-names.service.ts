import { Injectable } from '@nestjs/common';
import { SparkNameUpdateItemDto } from './dto/update-my-spark-name.dto';
import { MysparkRepository } from './my-spark-names.repository';

@Injectable()
export class MySparkNamesService {
  constructor(private  mySparkRepo: MysparkRepository) {}


  async getSparkNamesByCompanyId(companyId: number) {
   return this.mySparkRepo.getSparkNamesByCompanyId(companyId)
  }

  async updateSparkNames(companyId: number, update: SparkNameUpdateItemDto) {
   return this.mySparkRepo.updateSparkNames(companyId,update)
  }
 

}