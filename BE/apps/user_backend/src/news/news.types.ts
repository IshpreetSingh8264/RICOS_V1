export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
    logo?: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
  slug?: string;
}

export interface BundledNews {
  slug: string;
  title: string;
  description: string;
  content: string;
  urlToImage: string | null;
  publishedAt: string;
  sources: Array<{
    name: string;
    logo: string;
    url: string;
  }>;
  totalArticles: number;
}

export interface DisasterNewsResponse {
  success: boolean;
  location: {
    state: string;
    city?: string;
  };
  totalResults: number;
  bundledNews: BundledNews[];
}

export interface NewsDetailResponse {
  success: boolean;
  news: BundledNews;
  fullArticles?: NewsArticle[];
}

export interface LLMChatRequest {
  message: string;
}

export interface LLMChatResponse {
  success: boolean;
  response: string;
  conversationId: string;
}

// Disaster keywords for filtering
export const DISASTER_KEYWORDS = [
  'disaster',
  'emergency',
  'earthquake',
  'flood',
  'cyclone',
  'hurricane',
  'tsunami',
  'landslide',
  'fire',
  'wildfire',
  'storm',
  'drought',
  'famine',
  'epidemic',
  'pandemic',
  'accident',
  'explosion',
  'collapse',
  'evacuation',
  'rescue',
  'relief',
  'casualties',
  'damage',
  'crisis',
  'warning',
  'alert',
  'calamity',
  'tornado',
  'avalanche',
  'volcano',
  'heatwave',
  'coldwave',
  'blizzard',
  'protest',
  'demonstration',
  'rally',
  'unrest',
  'clash',
  'curfew',
  'riot',
  'violence',
  'conflict',
  'war',
  'battle',
  'airstrike',
  'attack',
  'terror',
  'eviction',
  'shutdown',
  'strike',
  'standoff',
  'border tension',
  'security alert',
  'stampede',
  'industrial accident',
  'chemical leak',
  'gas leak',
  'building collapse',
  'bridge collapse',
];

// News source logos mapping
export const NEWS_SOURCE_LOGOS: Record<string, string> = {
  'The Times of India': 'https://static.toiimg.com/photo/msid-97838303.cms',
  'NDTV': 'https://drop.ndtv.com/ndtv/images/ndtv_logo.png',
  'India Today': 'https://www.indiatoday.in/sites/all/themes/india_today/images/it-logo-amp.png',
  'The Hindu': 'https://www.thehindu.com/theme/images/th-online/logo-the-hindu-new.svg',
  'Hindustan Times': 'https://www.hindustantimes.com/images/app-images/ht2023/logos/HT-logo.svg',
  'CNN': 'https://cdn.cnn.com/cnn/.e/img/4.0/logos/CNN_logo_social.png',
  'BBC News': 'https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif',
  'Reuters': 'https://www.reuters.com/pf/resources/images/reuters/logo-vertical-default.svg',
  'Al Jazeera': 'https://www.aljazeera.com/wp-content/uploads/2023/03/aj-logo.png',
  'The Guardian': 'https://assets.guim.co.uk/images/guardian-logo-160x60.gif',
  'default': 'https://via.placeholder.com/150x60?text=News',
};
