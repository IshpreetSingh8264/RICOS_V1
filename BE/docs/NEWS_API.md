# News API Documentation

## Overview
Disaster news API powered by Google News scraping (Selenium + undetected-chromedriver) with LLM chat support.

## Environment Setup
```env
OPENROUTER_API_KEY=your_key_here
NEWS_SCRAPER_LIMIT=24
NEWS_SCRAPER_TIMEOUT_MS=90000
```

Python dependencies required for scraping:
```bash
pip install selenium undetected-chromedriver
```

Get keys:
- OpenRouter: https://openrouter.ai/keys

## Endpoints

### 1. GET /news/disaster
Get disaster news for location.

**Headers:** `Authorization: Bearer <JWT>`

**Query Params:**
- `location` (optional): Override user's location

**Response:**
```json
{
  "success": true,
  "location": { "state": "Maharashtra", "city": "Mumbai" },
  "totalResults": 3,
  "bundledNews": [
    {
      "slug": "flooding-in-mumbai",
      "title": "Heavy flooding in Mumbai",
      "description": "Description...",
      "content": "Full content...",
      "urlToImage": "url",
      "publishedAt": "2025-11-15T...",
      "totalArticles": 2,
      "sources": [
        { "name": "Times of India", "logo": "url", "url": "article_url" }
      ]
    }
  ]
}
```

### 2. GET /news/detail/:slug
Get specific news details.

**Headers:** `Authorization: Bearer <JWT>`

**Response:**
```json
{
  "success": true,
  "news": { /* BundledNews object */ }
}
```

### 3. POST /news/:slug/chat
Chat with LLM about news article.

**Headers:** `Authorization: Bearer <JWT>`

**Body:**
```json
{
  "message": "Is this news legitimate?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "LLM response...",
  "conversationId": "userId-slug"
}
```

### 4. POST /news/cache/clear
Clear news cache.

**Headers:** `Authorization: Bearer <JWT>`

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared"
}
```

### 5. GET /news/health
Health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T..."
}
```

## Frontend Integration

### Fetch Disaster News
```typescript
const response = await fetch('http://localhost:8080/news/disaster', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

### Chat with LLM
```typescript
const response = await fetch(`http://localhost:8080/news/${slug}/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'Your question' })
});
const data = await response.json();
```

## Features
- ✅ Location-based disaster news
- ✅ Google News scraping (location-specific + nationwide)
- ✅ News bundling (similar articles grouped)
- ✅ Source logos
- ✅ 15-minute caching
- ✅ LLM chat for legitimacy analysis
- ✅ Conversation history

## Testing
```bash
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1
python3 test_news_api.py
```

Default test credentials:
- Email: john@example.com
- Password: SecurePass123

## Notes
- Cache duration: 15 minutes
- Disaster keywords: 30+ terms (earthquake, flood, etc.)
- LLM model: Claude 3.5 Sonnet via OpenRouter
- News source: https://news.google.com/home?hl=en-IN&gl=IN&ceid=IN:en
