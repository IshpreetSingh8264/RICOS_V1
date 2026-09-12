import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { GetDisasterNewsDto, ChatWithLLMDto } from './news.dto';
import {
  DisasterNewsResponse,
  NewsDetailResponse,
  LLMChatResponse,
} from './news.types';

@Controller('news')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * GET /news/disaster
   * Get disaster news for user's location
   * 
   * Query Params:
   * - location (optional): Override user's location from DB
   * 
   * Returns: List of bundled disaster news with sources
   */
  @Get('disaster')
  async getDisasterNews(
    @Request() req,
    @Query() query: GetDisasterNewsDto,
  ): Promise<DisasterNewsResponse> {
    // Try both 'sub' and 'userId' fields from JWT payload
    const userId = req.user.sub || req.user.userId || req.user.id;
    
    if (!userId) {
      throw new HttpException(
        'User ID not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    return await this.newsService.getDisasterNews(
      userId, 
      query.location,
      query.latitude,
      query.longitude,
      query.refresh === 'true',
    );
  }

  /**
   * GET /news/detail/:slug
   * Get detailed information about a specific news article by slug
   * 
   * Params:
   * - slug: URL-friendly identifier for the news article
   * 
   * Returns: Detailed news with full articles from all sources
   */
  @Get('detail/:slug')
  async getNewsDetail(
    @Request() req,
    @Param('slug') slug: string,
  ): Promise<NewsDetailResponse> {
    const userId = req.user.sub || req.user.userId || req.user.id;
    
    if (!userId) {
      throw new HttpException(
        'User ID not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    if (!slug || slug.trim() === '') {
      throw new HttpException('Slug is required', HttpStatus.BAD_REQUEST);
    }
    
    return await this.newsService.getNewsBySlug(userId, slug);
  }

  /**
   * POST /news/:slug/chat
   * Chat with LLM about news legitimacy and details
   * 
   * Params:
   * - slug: URL-friendly identifier for the news article
   * 
   * Body:
   * - message: User's question or message
   * - conversationHistory (optional): Previous conversation context
   * 
   * Returns: LLM response about news analysis
   */
  @Post(':slug/chat')
  async chatAboutNews(
    @Request() req,
    @Param('slug') slug: string,
    @Body() chatDto: ChatWithLLMDto,
  ): Promise<LLMChatResponse> {
    if (!slug || slug.trim() === '') {
      throw new HttpException('Slug is required', HttpStatus.BAD_REQUEST);
    }
    
    return await this.newsService.chatWithLLM(slug, chatDto);
  }

  /**
   * POST /news/cache/clear
   * Clear news cache (admin/maintenance endpoint)
   * 
   * Returns: Success message
   */
  @Post('cache/clear')
  async clearCache(): Promise<{ success: boolean; message: string }> {
    this.newsService.clearCache();
    return {
      success: true,
      message: 'News cache cleared successfully',
    };
  }

  /**
   * GET /news/health
   * Health check for news service
   * 
   * Returns: Service status
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
