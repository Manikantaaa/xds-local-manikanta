import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleRepository } from './articles.repository';
import { IsNumberOptions } from 'class-validator';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly articleRepo: ArticleRepository,
  ) { }

  async create(createArtcleDto: CreateArticleDto, categoryName: string) {
    // let checkDate;
    //   if (createArtcleDto != undefined ) {
    //      checkDate  = await this.articleRepo.checkArticleDates(0, createArtcleDto.categoryId, createArtcleDto.startDate, createArtcleDto.endDate);
    //   }
    //   if (checkDate && checkDate.length > 0) {
    //     return {
    //       data: 'Already Article existed those dates.',
    //       success: false,
    //       message:"successfully updated.",
    //      }
    //   }
    if (+createArtcleDto.categoryId == 0 && categoryName != ''){
        createArtcleDto.categoryId = await this.articleRepo.createCategory(categoryName);
    }
    return this.articleRepo.create(createArtcleDto);
  }

  findAll(type: string) {
    return this.articleRepo.getAllarticles(type);
  }

  findOne(id: number) {
    return this.articleRepo.findOne(id);
  }

  async update(id: number, updateArticleDto: CreateArticleDto) {
    // let checkDate;
    //   if (updateArticleDto != undefined ) {
    //      checkDate  = await this.articleRepo.checkArticleDates(id, updateArticleDto.categoryId, updateArticleDto.startDate, updateArticleDto.endDate);
    //   }
    //   if (checkDate && checkDate.length > 0) {
    //     return {
    //       data: 'Already Article existed those dates.',
    //       success: false,
    //       message:"successfully updated.",
    //      }
    //   }
    return this.articleRepo.updateArticleById(id, updateArticleDto);
  }

  remove(id: number) {
    return this.articleRepo.deleteAtricle(id);
  }

  getAllCategories() {
    return this.articleRepo.getAllCategories();
  }

  updateDisplayOrder(postData: { id: number, displayOrder: number }[]) {
    return this.articleRepo.updateDisplayOrder(postData);
  }

  updateArticleStatus(id: number) {
    return this.articleRepo.updateArticleStatus(id);
  }

  async archiveArticle(id: number) {
    return await this.articleRepo.archiveArticle(id);
  }
}
