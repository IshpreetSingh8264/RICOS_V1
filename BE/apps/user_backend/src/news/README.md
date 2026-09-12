# Disaster News Module

## Overview
The Disaster News Module provides real-time disaster-related news aggregation and AI-powered legitimacy analysis for the RICOS application. It fetches disaster news from Google News using Selenium with undetected-chromedriver, intelligently bundles similar articles from different sources, and uses LLM to help users verify news authenticity.

## Features

### 1. **Intelligent News Bundling**
- Automatically groups similar news from different sources
- Uses Levenshtein distance algorithm for similarity detection
- Prevents duplicate news in the feed
- Shows all sources reporting the same story

### 2. **Location-Based Filtering**
- Uses user's location from database (state, city)
- Filters news relevant to user's area
- Supports manual location override
- Focuses on disaster-related content

### 3. **Disaster Detection**
- 30+ disaster keywords (earthquake, flood, cyclone, etc.)
- Context-aware filtering
- Analyzes title, description, and content

### 4. **LLM Integration**
- Powered by OpenRouter (Claude 3.5 Sonnet)
- Analyzes news legitimacy and credibility
- Multi-turn conversation support
- Provides detailed fact-checking

### 5. **Performance Optimization**
- 15-minute caching per location
- Reduces API calls
- Fast response times

### 6. **Source Logos**
- Pre-configured logos for major news sources
- Fallback for unknown sources
- Visual source identification

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    News Module                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Controller │  │   Service    │  │    Types     │ │
│  │              │  │              │  │              │ │
│  │ - Routes     │→ │ - Business   │→ │ - Interfaces │ │
│  │ - Auth       │  │   Logic      │  │ - DTOs       │ │
│  │ - Validation │  │ - External   │  │ - Constants  │ │
│  └──────────────┘  │   APIs       │  └──────────────┘ │
│                    │ - Caching    │                    │
│                    └──────┬───────┘                    │
└───────────────────────────┼────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
       ┌─────────────┐            ┌──────────────┐
       │ Google News │            │  OpenRouter  │
       │             │            │     LLM      │
       │ - Scraped   │            │ - Analysis   │
       │   News Data │            │              │
       └─────────────┘            └──────────────┘
              │
              ▼
       ┌─────────────┐
       │ PostgreSQL  │
       │ User Data   │
       └─────────────┘
```

## File Structure

```
news/
├── news.module.ts       # Module definition
├── news.controller.ts   # API endpoints
├── news.service.ts      # Business logic
├── news.types.ts        # TypeScript interfaces
└── news.dto.ts          # Data transfer objects
```

## API Endpoints

### 1. GET `/news/disaster`
Get disaster news for user's location.

**Query Parameters:**
- `location` (optional): Override location

**Response:** List of bundled disaster news

### 2. GET `/news/detail/:slug`
Get detailed news by slug.

**Parameters:**
- `slug`: News identifier

**Response:** Full news details from all sources

### 3. POST `/news/:slug/chat`
Chat with LLM about news.

**Parameters:**
- `slug`: News identifier

**Body:**
- `message`: User's question
- `conversationHistory`: Previous messages

**Response:** LLM analysis and response

### 4. POST `/news/cache/clear`
Clear news cache (admin endpoint).

### 5. GET `/news/health`
Health check endpoint.

## Configuration

### Environment Variables

```env
# Required
OPENROUTER_API_KEY=your_openrouter_key

# Optional
APP_URL=http://localhost:3000
```

### Get API Keys

**Scraper dependencies:**
1. Install Python package `selenium`
2. Install Python package `undetected-chromedriver`
3. Ensure Chrome is installed on host machine

**OpenRouter:**
1. Visit https://openrouter.ai/keys
2. Create account
3. Add credits
4. Generate API key

## Algorithms

### News Bundling Algorithm

```typescript
1. For each article:
   - Generate slug from title
   - Extract keywords
   - Create initial bundle

2. Find similar articles:
   - Calculate Levenshtein distance
   - If similarity > 60%:
     - Add to same bundle
     - Aggregate sources
     - Update article count

3. Sort by publish date
4. Return bundled results
```

### Disaster Detection

```typescript
1. Extract text from:
   - Title
   - Description
   - Content

2. Check against keywords:
   - disaster, earthquake, flood, etc.
   - 30+ disaster-related terms

3. Return boolean match
```

## Usage Examples

### TypeScript/JavaScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:8080/news';
const token = 'your-jwt-token';

// Get disaster news
const news = await axios.get(`${API_URL}/disaster`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Get news detail
const detail = await axios.get(`${API_URL}/detail/${slug}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Chat with LLM
const chat = await axios.post(
  `${API_URL}/${slug}/chat`,
  {
    message: "Is this news legitimate?",
    conversationHistory: []
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Python

```python
import requests

API_URL = "http://localhost:8080/news"
headers = {"Authorization": f"Bearer {token}"}

# Get disaster news
news = requests.get(f"{API_URL}/disaster", headers=headers)

# Get news detail
detail = requests.get(f"{API_URL}/detail/{slug}", headers=headers)

# Chat with LLM
chat = requests.post(
    f"{API_URL}/{slug}/chat",
    headers=headers,
    json={
        "message": "Is this news legitimate?",
        "conversationHistory": []
    }
)
```

## Performance

### Caching Strategy
- **Duration:** 15 minutes
- **Key:** `news-{state}-{city}`
- **Benefits:** 
  - Reduced API calls
  - Faster response times
  - Lower costs

### Rate Limits
- **Google News scraping:** No direct LLM search quota; compute/browser costs apply
- **OpenRouter:** Varies by model
- **Cache Hit Rate:** ~80% during active usage

## Cost Analysis

### Google News Scraping
- **Pricing:** Infra/browser runtime dependent
- **With Caching:** ~20-30 actual scrape jobs/day in active usage

### OpenRouter (Claude 3.5 Sonnet)
- **Rate:** ~$3 per million tokens
- **Per Chat:** ~500 tokens = $0.0015
- **1000 chats:** ~$1.50
- **Monthly (10k chats):** ~$15

### Total Cost Estimate
- **Development:** FREE (using free tiers)
- **Production (1000 users):** ~$500/month

## Error Handling

### Common Errors

**Scraper dependency missing**
```
Solution: Install `selenium` and `undetected-chromedriver`
```

**User not found**
```
Solution: Ensure user is logged in with valid JWT
```

**No news found**
```
Solution: Try different location or clear cache
```

**LLM service error**
```
Solution: Check OpenRouter credits and API key
```

## Testing

### Manual Testing

```bash
# Run test script
python test_news_api.py
```

### cURL Testing

```bash
# Get disaster news
curl -X GET "http://localhost:8080/news/disaster" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Chat with LLM
curl -X POST "http://localhost:8080/news/SLUG/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Is this legitimate?"}'
```

## Security

### Authentication
- All endpoints require JWT authentication
- Token validation on each request
- User ID extracted from JWT payload

### Data Privacy
- No sensitive data logged
- User location from database only
- News data cached without personal info

### API Keys
- Stored in environment variables
- Never exposed to frontend
- Rotated regularly in production

## Future Enhancements

### Planned Features
1. **Real-time Notifications**
   - WebSocket integration
   - Push notifications for critical disasters

2. **Advanced Filtering**
   - Disaster type selection
   - Severity levels
   - Date range filters

3. **Social Features**
   - Share news
   - Comment on legitimacy
   - Community fact-checking

4. **Analytics**
   - News consumption patterns
   - Popular disaster types
   - Source credibility metrics

5. **Multi-language Support**
   - Hindi, regional languages
   - Automatic translation
   - Language preference

## Maintenance

### Cache Management
```bash
# Clear cache periodically
curl -X POST "http://localhost:8080/news/cache/clear" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Monitoring
- Check logs for API errors
- Monitor scraper failures and runtime
- Track OpenRouter costs
- Review cache hit rates

### Updates
- Update disaster keywords quarterly
- Add new news sources
- Update source logos
- Refresh LLM prompts

## Contributing

### Adding New Features
1. Create feature branch
2. Update types in `news.types.ts`
3. Implement in `news.service.ts`
4. Add endpoint in `news.controller.ts`
5. Update documentation
6. Add tests

### Code Style
- Follow NestJS conventions
- Use TypeScript strict mode
- Add JSDoc comments
- Handle all errors

## Documentation

- **Full API Docs:** `docs/NEWS_API_DOCUMENTATION.md`
- **Quick Start:** `docs/NEWS_API_QUICKSTART.md`
- **Integration Guide:** In API documentation

## Support

For issues or questions:
1. Check documentation
2. Review logs
3. Test with cURL
4. Contact backend team

---

**Version:** 1.0.0  
**Last Updated:** November 15, 2025  
**Maintainer:** Backend Team
