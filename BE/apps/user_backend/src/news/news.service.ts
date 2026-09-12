import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import {
  NewsArticle,
  BundledNews,
  DisasterNewsResponse,
  NewsDetailResponse,
  LLMChatResponse,
  LLMChatRequest,
  DISASTER_KEYWORDS,
  NEWS_SOURCE_LOGOS,
} from './news.types';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private newsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private newsDetailCache: Map<string, { data: NewsDetailResponse; timestamp: number }> = new Map();
  private inFlightNewsRequests: Map<string, Promise<DisasterNewsResponse>> = new Map();
  private inFlightDetailRequests: Map<string, Promise<NewsDetailResponse>> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000;
  private readonly runExecFile = promisify(execFile);
  private readonly NEWS_CACHE_FILE = resolve(process.cwd(), 'data', 'news-cache.json');

  constructor(private prisma: PrismaService) {}

  private async getUserLocation(
    userId: string,
    providedLocation?: string,
  ): Promise<{ state: string; city?: string }> {
    // Priority 1: If location string is provided, use it
    if (providedLocation) {
      return { state: providedLocation };
    }

    // Priority 2: Try to fetch user location from database
    try {
      const allUser = await this.prisma.allUsers.findUnique({
        where: { id: userId },
        include: { 
          user: true,
          ngo: true,
          government: true,
          volunteer: true,
        },
      });

      if (!allUser) {
        this.logger.warn(`User ${userId} not found in all_users table`);
        return { state: 'India' }; // Default fallback
      }

      // Check user type and get location accordingly
      if (allUser.user_type === 'user' && allUser.user) {
        if (allUser.user.state) {
          return { 
            state: allUser.user.state, 
            city: allUser.user.city || undefined 
          };
        }
      } else if (allUser.user_type === 'ngo' && allUser.ngo) {
        // For NGO, parse operational_areas or use registered location
        const areas = allUser.ngo.operational_areas;
        if (areas) {
          return { state: areas.split(',')[0].trim() };
        }
      } else if (allUser.user_type === 'govt' && allUser.government) {
        // For government, use jurisdiction_area
        const jurisdiction = allUser.government.jurisdiction_area;
        if (jurisdiction) {
          return { state: jurisdiction.split(',')[0].trim() };
        }
      } else if (allUser.user_type === 'volunteer' && allUser.volunteer) {
        // For volunteer, use operational_areas
        const areas = allUser.volunteer.operational_areas;
        if (areas) {
          return { state: areas.split(',')[0].trim() };
        }
      }

      // If no location found, use default
      this.logger.warn(`No location found for user ${userId}, using default: India`);
      return { state: 'India' };
    } catch (error) {
      this.logger.error(`Error fetching user location: ${error.message}`);
      return { state: 'India' }; // Fallback to default
    }
  }

  private isDisasterRelated(text: string): boolean {
    const lower = text.toLowerCase();
    return DISASTER_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private bundleNews(articles: NewsArticle[]): BundledNews[] {
    const bundles: Map<string, BundledNews> = new Map();
    const processed: Set<number> = new Set();

    articles.forEach((article, index) => {
      if (processed.has(index)) return;
      const slug = article.slug || this.generateSlug(article.title);
      const bundle: BundledNews = {
        slug,
        title: article.title,
        description: article.description,
        content: article.content,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        totalArticles: 1,
        sources: [{
          name: article.source.name,
          logo: NEWS_SOURCE_LOGOS[article.source.name] || NEWS_SOURCE_LOGOS['default'],
          url: article.url,
        }],
      };

      articles.forEach((otherArticle, otherIndex) => {
        if (otherIndex <= index || processed.has(otherIndex)) return;
        if (this.areLikelySameStory(article, otherArticle)) {
          if (!bundle.urlToImage && otherArticle.urlToImage) {
            bundle.urlToImage = otherArticle.urlToImage;
          }
          bundle.sources.push({
            name: otherArticle.source.name,
            logo: NEWS_SOURCE_LOGOS[otherArticle.source.name] || NEWS_SOURCE_LOGOS['default'],
            url: otherArticle.url,
          });
          bundle.totalArticles++;
          processed.add(otherIndex);
        }
      });

      processed.add(index);
      bundles.set(slug, bundle);
    });

    return Array.from(bundles.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  private normalizeCacheKey(
    location: { state: string; city?: string },
    latitude?: number,
    longitude?: number,
  ): string {
    const normState = (location.state || 'India').toLowerCase().trim();
    const normCity = (location.city || '').toLowerCase().trim();

    const latNum = Number(latitude);
    const lonNum = Number(longitude);

    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      const latGrid = latNum.toFixed(1);
      const lonGrid = lonNum.toFixed(1);
      return `news-geo-${latGrid}-${lonGrid}-${normState}`;
    }

    return `news-loc-${normState}-${normCity}`;
  }

  private getLatestCachedResult(): DisasterNewsResponse | null {
    let latest: { data: DisasterNewsResponse; timestamp: number } | null = null;
    for (const cached of this.newsCache.values()) {
      if (!latest || cached.timestamp > latest.timestamp) {
        latest = cached as { data: DisasterNewsResponse; timestamp: number };
      }
    }
    return latest?.data || null;
  }

  private async readPersistentNewsCache(): Promise<Record<string, { data: DisasterNewsResponse; timestamp: number }>> {
    try {
      if (!existsSync(this.NEWS_CACHE_FILE)) {
        return {};
      }
      const raw = await readFile(this.NEWS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      this.logger.warn(`Failed reading persistent news cache: ${error.message}`);
      return {};
    }
  }

  private async writePersistentNewsCache(
    cache: Record<string, { data: DisasterNewsResponse; timestamp: number }>,
  ): Promise<void> {
    try {
      const dir = resolve(process.cwd(), 'data');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.NEWS_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      this.logger.warn(`Failed writing persistent news cache: ${error.message}`);
    }
  }

  private async getPersistentCacheEntry(
    cacheKey: string,
  ): Promise<{ data: DisasterNewsResponse; timestamp: number } | null> {
    const fileCache = await this.readPersistentNewsCache();
    const entry = fileCache[cacheKey];
    if (!entry) return null;
    this.newsCache.set(cacheKey, entry);
    return entry;
  }

  private async setPersistentCacheEntry(
    cacheKey: string,
    entry: { data: DisasterNewsResponse; timestamp: number },
  ): Promise<void> {
    const fileCache = await this.readPersistentNewsCache();
    fileCache[cacheKey] = entry;
    await this.writePersistentNewsCache(fileCache);
  }

  private async clearPersistentNewsCache(): Promise<void> {
    await this.writePersistentNewsCache({});
  }

  private async runGoogleNewsScraper(location: {
    state: string;
    city?: string;
  }): Promise<any[]> {
    const scriptPath = resolve(process.cwd(), 'scripts', 'google_news_scraper.py');
    const venvPython = resolve(process.cwd(), '.venv', 'bin', 'python3');
    const pythonBin = process.env.NEWS_SCRAPER_PYTHON || (existsSync(venvPython) ? venvPython : 'python3');
    const scrapeLimit = process.env.NEWS_SCRAPER_LIMIT || '24';
    const scrapeTimeoutMs = Number(process.env.NEWS_SCRAPER_TIMEOUT_MS || '90000');
    const args = ['--state', location.state, '--limit', scrapeLimit];

    if (location.city) {
      args.push('--city', location.city);
    }

    const { stdout, stderr } = await this.runExecFile(pythonBin, [scriptPath, ...args], {
      timeout: scrapeTimeoutMs,
      maxBuffer: 1024 * 1024,
    });

    if (stderr?.trim()) {
      this.logger.warn(`Google News scraper stderr: ${stderr.trim().slice(0, 500)}`);
    }

    const parsed = JSON.parse(stdout || '{}');
    if (!parsed?.success || !Array.isArray(parsed?.articles)) {
      throw new Error(parsed?.error || 'Google News scraper returned invalid response');
    }

    return parsed.articles;
  }

  private async runArticleContentScraper(url: string): Promise<{
    finalUrl?: string;
    title?: string;
    description?: string;
    image?: string;
    publishedAt?: string;
    content?: string;
  } | null> {
    const scriptPath = resolve(process.cwd(), 'scripts', 'fetch_article_content.py');
    const venvPython = resolve(process.cwd(), '.venv', 'bin', 'python3');
    const pythonBin = process.env.NEWS_SCRAPER_PYTHON || (existsSync(venvPython) ? venvPython : 'python3');

    try {
      const { stdout } = await this.runExecFile(pythonBin, [scriptPath, '--url', url], {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
      const parsed = JSON.parse(stdout || '{}');
      if (!parsed?.success) return null;
      return parsed;
    } catch (error) {
      this.logger.warn(`Article scrape failed for ${url}: ${error.message}`);
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/$/, '');
    } catch {
      return url.toLowerCase().trim();
    }
  }

  private tokenOverlapScore(a: string, b: string): number {
    const stopwords = new Set([
      'the', 'a', 'an', 'in', 'on', 'for', 'to', 'of', 'and', 'with', 'at', 'by', 'from', 'is', 'are',
    ]);
    const toTokens = (input: string) =>
      new Set(
        input
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((token) => token.length > 2 && !stopwords.has(token)),
      );

    const t1 = toTokens(a);
    const t2 = toTokens(b);
    if (t1.size === 0 || t2.size === 0) return 0;

    let intersection = 0;
    t1.forEach((token) => {
      if (t2.has(token)) intersection++;
    });
    return intersection / Math.min(t1.size, t2.size);
  }

  private areLikelySameStory(article: NewsArticle, otherArticle: NewsArticle): boolean {
    const sameUrl = this.normalizeUrl(article.url) === this.normalizeUrl(otherArticle.url);
    if (sameUrl) return true;

    const levSimilarity = this.calculateSimilarity(article.title, otherArticle.title);
    const tokenSimilarity = this.tokenOverlapScore(article.title, otherArticle.title);

    return levSimilarity > 0.58 || tokenSimilarity > 0.68 || (levSimilarity > 0.45 && tokenSimilarity > 0.45);
  }

  private parsePublishedAt(rawValue?: string): string {
    const raw = (rawValue || '').trim();
    if (!raw) return new Date().toISOString();

    const lower = raw.toLowerCase();
    const now = new Date();

    const relative = lower.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/);
    if (relative) {
      const count = Number(relative[1]);
      const unit = relative[2];
      const d = new Date(now);
      if (unit === 'minute') d.setMinutes(d.getMinutes() - count);
      if (unit === 'hour') d.setHours(d.getHours() - count);
      if (unit === 'day') d.setDate(d.getDate() - count);
      if (unit === 'week') d.setDate(d.getDate() - count * 7);
      if (unit === 'month') d.setMonth(d.getMonth() - count);
      return d.toISOString();
    }

    if (lower === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }

    const hasExplicitYear = /\b\d{4}\b/.test(raw);

    const normalizeParsedDate = (value: Date): string => {
      const nowMs = Date.now();
      const maxFutureSkewMs = 6 * 60 * 60 * 1000;
      const parsed = new Date(value);

      if (!hasExplicitYear) {
        while (parsed.getTime() > nowMs + maxFutureSkewMs) {
          parsed.setFullYear(parsed.getFullYear() - 1);
        }
      }

      if (parsed.getTime() > nowMs + maxFutureSkewMs) {
        return new Date(nowMs).toISOString();
      }

      return parsed.toISOString();
    };

    const dayMonthNoYear = raw.match(/^\s*(\d{1,2})\s+([A-Za-z]{3,9})\s*$/);
    if (dayMonthNoYear) {
      const withYear = `${dayMonthNoYear[1]} ${dayMonthNoYear[2]} ${now.getFullYear()}`;
      const parsed = Date.parse(withYear);
      if (!Number.isNaN(parsed)) {
        return normalizeParsedDate(new Date(parsed));
      }
    }

    const direct = Date.parse(raw);
    if (!Number.isNaN(direct)) {
      const parsedDate = new Date(direct);
      if (!hasExplicitYear && parsedDate.getFullYear() < now.getFullYear() - 1) {
        parsedDate.setFullYear(now.getFullYear());
      }
      return normalizeParsedDate(parsedDate);
    }

    const monthDate = Date.parse(`${raw} ${now.getFullYear()}`);
    if (!Number.isNaN(monthDate)) {
      return normalizeParsedDate(new Date(monthDate));
    }

    return now.toISOString();
  }

  private prioritizeArticles(
    articles: NewsArticle[],
    location: { state: string; city?: string },
  ): NewsArticle[] {
    const locationTokens = [location.state, location.city, 'india']
      .filter(Boolean)
      .map((v) => (v || '').toLowerCase());

    const now = Date.now();
    const scored = articles.map((article) => {
      const text = `${article.title} ${article.description} ${article.content}`.toLowerCase();
      const locationHits = locationTokens.filter((token) => token && text.includes(token)).length;
      const recencyHours = Math.max(
        0,
        (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60),
      );
      const recencyScore = Math.max(0, 72 - recencyHours);
      const priorityScore = locationHits * 20 + recencyScore;
      return { article, priorityScore };
    });

    return scored
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map((item) => item.article);
  }

  async getDisasterNews(
    userId: string,
    providedLocation?: string,
    latitude?: number,
    longitude?: number,
    forceRefresh = false,
  ): Promise<DisasterNewsResponse> {
    try {
      const latitudeNum = Number(latitude);
      const longitudeNum = Number(longitude);
      const hasValidCoordinates = Number.isFinite(latitudeNum) && Number.isFinite(longitudeNum);

      // If coordinates provided, use them directly without reverse geocoding
      let location: { state: string; city?: string };
      let useCoordinates = false;
      
      if (hasValidCoordinates) {
        location = await this.getUserLocation(userId, providedLocation);
        useCoordinates = true;
        this.logger.log(`Using GPS coordinates: ${latitudeNum}, ${longitudeNum}`);
      } else {
        // Fall back to getting location from database or provided string
        location = await this.getUserLocation(userId, providedLocation);
      }
      
      const cacheKey = this.normalizeCacheKey(location, latitudeNum, longitudeNum);
      const cached = this.newsCache.get(cacheKey);

      if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      if (!forceRefresh && !cached) {
        const persistentCached = await this.getPersistentCacheEntry(cacheKey);
        if (persistentCached && Date.now() - persistentCached.timestamp < this.CACHE_DURATION) {
          return persistentCached.data;
        }
      }

      const inFlightRequest = this.inFlightNewsRequests.get(cacheKey);
      if (inFlightRequest) {
        this.logger.log(`Using in-flight news request for cache key: ${cacheKey}`);
        return inFlightRequest;
      }

      const requestPromise = (async (): Promise<DisasterNewsResponse> => {
        this.logger.log(
          `Running Google News scraper for state=${location.state}, city=${location.city || 'N/A'}`,
        );
        const scrapedArticles = await this.runGoogleNewsScraper(location);
        const articles = this.parseScrapedGoogleNewsResults(scrapedArticles, location.state);
        const prioritized = this.prioritizeArticles(articles, location);
        this.logger.log(`Google News scraper returned ${articles.length} parsed results`);
        const bundledNews = this.bundleNews(prioritized);

        const result: DisasterNewsResponse = {
          success: true,
          location,
          totalResults: bundledNews.length,
          bundledNews,
        };

        const entry = { data: result, timestamp: Date.now() };
        this.newsCache.set(cacheKey, entry);
        await this.setPersistentCacheEntry(cacheKey, entry);
        return result;
      })();

      this.inFlightNewsRequests.set(cacheKey, requestPromise);
      try {
        return await requestPromise;
      } finally {
        this.inFlightNewsRequests.delete(cacheKey);
      }
    } catch (error) {
      this.logger.error('Error fetching news:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      const staleCached = this.getLatestCachedResult();
      if (staleCached) {
        this.logger.warn('Returning stale cached news due to scraper/provider error');
        return staleCached;
      }

      return {
        success: true,
        location: { state: providedLocation || 'India' },
        totalResults: 0,
        bundledNews: [],
      };
    }
  }

  private parseScrapedGoogleNewsResults(results: any[], location: string): NewsArticle[] {
    return results
      .filter((result: any) => result?.title && result?.url)
      .filter((result: any) =>
        this.isDisasterRelated(
          `${result.title || ''} ${result.description || ''} ${result.content || ''} ${location}`,
        ),
      )
      .map((result: any, idx: number) => {
        const articleUrl = result.originalUrl || result.url;
        let sourceName = result.source || 'Google News';
        try {
          sourceName = result.source || new URL(articleUrl).hostname.replace('www.', '').split('.')[0];
        } catch {
          sourceName = result.source || 'Google News';
        }

        const publishedAt = this.parsePublishedAt(result.publishedAt);

        return {
          source: {
            id: `google-news-${idx}`,
            name: sourceName,
            logo: NEWS_SOURCE_LOGOS[sourceName] || NEWS_SOURCE_LOGOS['default'],
          },
          author: result.author || sourceName,
          title: result.title,
          description: result.description || result.title,
          url: articleUrl,
          urlToImage: result.image || null,
          publishedAt,
          content: result.content || result.description || '',
          slug: this.generateSlug(result.title),
        };
      });
  }

  private findBundleInCache(slug: string): BundledNews | null {
    for (const cached of this.newsCache.values()) {
      if (cached.data?.bundledNews) {
        const bundle = cached.data.bundledNews.find((b: BundledNews) => b.slug === slug);
        if (bundle) return bundle;
      }
    }
    return null;
  }

  private async hydrateBundleDetail(bundle: BundledNews): Promise<NewsDetailResponse> {
    const now = Date.now();
    const cachedDetail = this.newsDetailCache.get(bundle.slug);
    if (cachedDetail && now - cachedDetail.timestamp < this.CACHE_DURATION) {
      return cachedDetail.data;
    }

    const inFlightDetail = this.inFlightDetailRequests.get(bundle.slug);
    if (inFlightDetail) {
      return inFlightDetail;
    }

    const detailPromise = (async (): Promise<NewsDetailResponse> => {
      const sourceUrls = Array.from(new Set(bundle.sources.map((s) => s.url).filter(Boolean))).slice(0, 4);
      const fetched = await Promise.all(
        sourceUrls.map(async (url, idx) => {
          const scraped = await this.runArticleContentScraper(url);
          const sourceName = bundle.sources[idx]?.name || 'News Source';
          return {
            source: {
              id: `full-${idx}`,
              name: sourceName,
              logo: NEWS_SOURCE_LOGOS[sourceName] || NEWS_SOURCE_LOGOS['default'],
            },
            author: sourceName,
            title: scraped?.title || bundle.title,
            description: scraped?.description || bundle.description,
            url: scraped?.finalUrl || url,
            urlToImage: scraped?.image || bundle.urlToImage || null,
            publishedAt: scraped?.publishedAt || bundle.publishedAt,
            content: scraped?.content || '',
            slug: bundle.slug,
          } as NewsArticle;
        }),
      );

      const withContent = fetched.filter((a) => (a.content || '').trim().length > 120);
      const bestArticle =
        withContent.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))[0] || fetched[0] || null;

      const enrichedBundle: BundledNews = {
        ...bundle,
        description: bestArticle?.description || bundle.description,
        content: bestArticle?.content || bundle.content,
        urlToImage: bestArticle?.urlToImage || bundle.urlToImage,
        publishedAt: bestArticle?.publishedAt || bundle.publishedAt,
      };

      const detail: NewsDetailResponse = {
        success: true,
        news: enrichedBundle,
        fullArticles: fetched,
      };

      this.newsDetailCache.set(bundle.slug, { data: detail, timestamp: Date.now() });
      return detail;
    })();

    this.inFlightDetailRequests.set(bundle.slug, detailPromise);
    try {
      return await detailPromise;
    } finally {
      this.inFlightDetailRequests.delete(bundle.slug);
    }
  }

  async getNewsBySlug(userId: string, slug: string): Promise<NewsDetailResponse> {
    try {
      const bundle = this.findBundleInCache(slug);
      if (bundle) {
        this.logger.log(`Hydrating full article detail for slug: ${slug}`);
        return await this.hydrateBundleDetail(bundle);
      }

      // If not in cache, return error - user should call /disaster first
      throw new HttpException(
        'News not found in cache. Please fetch disaster news first.',
        HttpStatus.NOT_FOUND,
      );
    } catch (error) {
      this.logger.error('Error fetching news detail:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch news', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async chatWithLLM(slug: string, request: LLMChatRequest): Promise<LLMChatResponse> {
    try {
      this.logger.log(`[Chat] Starting for slug: ${slug}`);

      const bundle = this.findBundleInCache(slug);
      if (!bundle) {
        throw new HttpException(
          'News not found in cache. Please fetch disaster news first.',
          HttpStatus.NOT_FOUND,
        );
      }

      const newsDetail = await this.hydrateBundleDetail(bundle);
      
      this.logger.log(`[Chat] News found: ${newsDetail.news.title}`);

      const fullArticlesContext = (newsDetail.fullArticles || [])
        .map((article, idx) => {
          const snippet = (article.content || '').slice(0, 2500);
          return `\nArticle ${idx + 1} (${article.source.name})\nTitle: ${article.title}\nURL: ${article.url}\nContent:\n${snippet}`;
        })
        .join('\n\n');
      
      // Build comprehensive context for the LLM
      const newsContext = `
News Article: ${newsDetail.news.title}

Description: ${newsDetail.news.description}

Full Content: ${newsDetail.news.content}

Published: ${new Date(newsDetail.news.publishedAt).toLocaleString()}

Sources (${newsDetail.news.totalArticles} articles):
${newsDetail.news.sources.map((s, idx) => `${idx + 1}. ${s.name} - ${s.url}`).join('\n')}

Full article extracts from selected sources:
${fullArticlesContext || 'No extended article text available.'}

You are an AI assistant analyzing this disaster/emergency news. Answer the user's questions based on this article. Assess the legitimacy, provide context, and help users understand the situation. Be factual and cite the sources when relevant.
`;

      this.logger.log(`[Chat] Calling OpenRouter API...`);
      
      // Check if OpenRouter API key is configured
      const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
      if (!openRouterKey || openRouterKey === 'YOUR_NEW_API_KEY_HERE') {
        throw new HttpException(
          'OpenRouter API key not configured. Please set a valid OPENROUTER_API_KEY in environment.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'stepfun/step-3.5-flash:free',
          messages: [
            {
              role: 'system',
              content: newsContext,
            },
            {
              role: 'user',
              content: request.message,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
            'X-Title': 'RICOS News Assistant',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`[Chat] OpenRouter API responded successfully`);
      
      const reply = response.data.choices[0].message.content;

      return {
        success: true,
        response: reply,
        conversationId: slug,
      };
    } catch (error) {
      this.logger.error(`[Chat] Error occurred:`, error.message);
      
      // Log more details for debugging
      if (error.response) {
        this.logger.error(`[Chat] API Error Status: ${error.response.status}`);
        this.logger.error(`[Chat] API Error Data:`, JSON.stringify(error.response.data));
      } else if (error.request) {
        this.logger.error(`[Chat] No response received from API`);
      }
      
      // Return user-friendly error
      if (error instanceof HttpException) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new HttpException(
          'OpenRouter authentication failed (401). Please update OPENROUTER_API_KEY in BE/.env and restart backend.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw new HttpException(
        'Failed to process chat request. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async clearCache(): Promise<{ success: boolean; message: string }> {
    this.newsCache.clear();
    this.newsDetailCache.clear();
    this.inFlightNewsRequests.clear();
    this.inFlightDetailRequests.clear();
    await this.clearPersistentNewsCache();
    return { success: true, message: 'Cache cleared' };
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
}
