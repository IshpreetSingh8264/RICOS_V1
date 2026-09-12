import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  RefreshCw, 
  MapPin, 
  Loader2, 
  AlertCircle,
  Search,
  ArrowLeft,
  Send,
  MessageSquare,
  Calendar,
  ExternalLink,
  ImageOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import NewsCard from '@/components/dashboard/NewsCard';
import { useAuth } from '@/contexts/AuthContext';
import { newsAPI, formatErrorMessage, type BundledNews } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const NewsPage = () => {
  const { token } = useAuth();
  const [news, setNews] = useState<BundledNews[]>([]);
  const [filteredNews, setFilteredNews] = useState<BundledNews[]>([]);
  const [selectedNews, setSelectedNews] = useState<BundledNews | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ state: string; city: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastAutoLoadKeyRef = useRef<string | null>(null);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Load news when token or coordinates are available
  useEffect(() => {
    if (token) {
      const autoKey = userCoordinates
        ? `${userCoordinates.latitude.toFixed(2)}:${userCoordinates.longitude.toFixed(2)}`
        : 'no-coords';

      if (lastAutoLoadKeyRef.current === autoKey) {
        return;
      }

      lastAutoLoadKeyRef.current = autoKey;
      loadNews();
    }
  }, [token, userCoordinates]);

  // Filter news based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = news.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNews(filtered);
    } else {
      setFilteredNews(news);
    }
  }, [searchQuery, news]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Location error:', error);
          setLocationPermission('denied');
          // Continue without coordinates - will use database location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setLocationPermission('denied');
    }
  };

  const loadNews = async (customLoc?: string) => {
    if (!token) {
      setIsLoading(false);
      setError('Please log in to view news');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use coordinates if available and no custom location
      const lat = !customLoc && userCoordinates ? userCoordinates.latitude : undefined;
      const lng = !customLoc && userCoordinates ? userCoordinates.longitude : undefined;
      const shouldForceRefresh = Boolean(customLoc) || isRefreshing;
      
      const response = await newsAPI.getDisasterNews(token, customLoc, lat, lng, shouldForceRefresh);
      
      if (response.success) {
        setNews(response.bundledNews);
        setFilteredNews(response.bundledNews);
        setLocation(response.location);
      } else {
        setError('Failed to load news');
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNews(customLocation || undefined);
    setIsRefreshing(false);
  };

  const handleLocationSearch = () => {
    if (customLocation.trim()) {
      loadNews(customLocation);
    }
  };

  const handleNewsClick = async (newsItem: BundledNews) => {
    setSelectedNews(newsItem);
    setChatMessages([]);
    setImageError(false);
    setIsExpanded(false);

    if (!token) return;

    try {
      setIsLoadingDetail(true);
      const detail = await newsAPI.getNewsDetail(newsItem.slug, token);
      if (detail?.success && detail.news) {
        setSelectedNews(detail.news);
      }
    } catch (error) {
      console.error('Error loading full news detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToNews = () => {
    setSelectedNews(null);
    setChatMessages([]);
    setInputMessage('');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !selectedNews || !token) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await newsAPI.chatWithLLM(selectedNews.slug, inputMessage, token);
      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from AI');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      {/* Show Chat View when news is selected */}
      {selectedNews ? (
        <div className="flex flex-col h-[calc(100vh-6rem)] -mx-6 -my-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          {/* Chat Header with Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 pb-4 border-b border-slate-700/50 px-6 pt-6 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToNews}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-xl text-sm font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Assistant</h2>
                  <p className="text-xs text-slate-400">Ask me anything about this news</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto space-y-6 pt-6 pb-4 px-32 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* News Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 mt-2 shadow-xl backdrop-blur-sm"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 leading-tight pb-1">
                {selectedNews.title}  
              </h1>
              {isLoadingDetail && (
                <p className="text-xs text-slate-400 mt-2">Fetching full article context...</p>
              )}
            </motion.div>

            {/* News Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 backdrop-blur-sm"
            >
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {selectedNews.description}
              </p>
            </motion.div>

            {/* Collapsible Detailed Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-5 backdrop-blur-sm"
            >
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Image */}
                  {selectedNews.urlToImage && !imageError ? (
                    <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-800 shadow-2xl ring-1 ring-slate-700/50">
                      <img
                        src={selectedNews.urlToImage}
                        alt={selectedNews.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700/50">
                      <ImageOff className="w-16 h-16 text-slate-600" />
                    </div>
                  )}

                  {/* Article Count Badge */}
                  {selectedNews.totalArticles > 1 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      <Newspaper className="w-4 h-4" />
                      Bundled from {selectedNews.totalArticles} articles
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 rounded-lg px-4 py-2 w-fit">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span>{formatDate(selectedNews.publishedAt)}</span>
                  </div>

                  {/* Full Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      {selectedNews.content}
                    </div>
                  </div>

                  {/* Sources */}
                  <div className="border-t border-slate-700/50 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                      Sources ({selectedNews.sources.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedNews.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-200 group shadow-lg hover:shadow-blue-500/20"
                        >
                          {source.logo ? (
                            <img
                              src={source.logo}
                              alt={source.name}
                              className="w-10 h-10 rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                              <Newspaper className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {source.name}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors py-3 px-4 rounded-lg hover:bg-blue-500/10 w-full justify-center mt-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-5 h-5" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-5 h-5" />
                    Show More Details
                  </>
                )}
              </button>
            </motion.div>

            {/* Chat Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 pt-6 border-t border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Conversation</h3>
              </div>

              {chatMessages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center text-slate-400 text-sm py-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 backdrop-blur-sm"
                >
                  <div className="p-4 bg-blue-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="font-medium text-slate-300">Start a conversation</p>
                  <p className="text-xs text-slate-500 mt-1">Ask me anything about this news article</p>
                </motion.div>
              )}

              {chatMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white'
                        : 'bg-gradient-to-br from-slate-800 to-slate-800/80 text-slate-200 border border-slate-700/50 backdrop-blur-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-2 flex items-center gap-1 ${
                      msg.role === 'user' ? 'opacity-80' : 'opacity-60'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isSending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 text-slate-200 rounded-2xl px-5 py-4 border border-slate-700/50 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <span className="text-sm text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </motion.div>
          </div>

          {/* Sticky Chat Input at Bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-4 border-t border-slate-700/50 px-6 shadow-2xl"
          >
            <div className="flex gap-3 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message here..."
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl py-3.5 px-5 pr-12 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-200 shadow-lg disabled:opacity-50"
                  disabled={isSending}
                />
                {inputMessage && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Press Enter
                  </span>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        // Show News List when no news is selected
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Disaster <span className="gradient-text">News & Updates</span>
              </h1>
              <p className="text-slate-400 mt-1">
                Stay informed with AI-powered disaster news
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </motion.div>

        {/* Location Info & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {location && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">
                    {location.city ? `${location.city}, ` : ''}{location.state}
                  </span>
                </div>
              )}
              
              {/* Location Permission Status */}
              {/* {locationPermission === 'granted' && userCoordinates && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Using your current location
                </div>
              )} */}
              {locationPermission === 'denied' && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  Location access denied - using profile location
                </div>
              )}
              {locationPermission === 'prompt' && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Requesting location access...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search different location..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                className="bg-slate-800/80 border border-slate-700/50 focus:border-blue-500/50 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm outline-none transition-colors"
              />
              <button
                onClick={handleLocationSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search news by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/50 focus:border-blue-500/50 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-colors"
          />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-400">Loading disaster news...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex items-center gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h3 className="text-red-500 font-semibold">Error Loading News</h3>
              <p className="text-slate-300 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* News Grid */}
        {!isLoading && !error && filteredNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredNews.map((newsItem, index) => (
              <motion.div
                key={newsItem.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NewsCard
                  news={newsItem}
                  onClick={() => handleNewsClick(newsItem)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && !error && filteredNews.length === 0 && news.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center"
          >
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-slate-400">
              Try adjusting your search query or location
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && news.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center"
          >
            <Newspaper className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No News Available</h3>
            <p className="text-slate-400 mb-4">
              No disaster news found for your location
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </motion.div>
        )}

        {/* Stats */}
        {!isLoading && !error && filteredNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-slate-500 text-sm"
          >
            Showing {filteredNews.length} of {news.length} news articles
          </motion.div>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};

export default NewsPage;
