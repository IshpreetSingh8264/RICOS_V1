import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Newspaper, ImageOff } from 'lucide-react';
import type { BundledNews } from '@/lib/api';

interface NewsCardProps {
  news: BundledNews;
  onClick: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/40 hover:shadow-glow-sm transition-all duration-200 group backdrop-blur-sm"
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-800 overflow-hidden">
        {news.urlToImage && !imageError ? (
          <img
            src={news.urlToImage}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        {/* Article Count Badge */}
        {news.totalArticles > 1 && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Newspaper className="w-3 h-3" />
            {news.totalArticles} articles
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Date */}
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(news.publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          {news.title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-sm line-clamp-3">
          {news.description}
        </p>

        {/* Sources */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {news.sources.slice(0, 3).map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded text-xs text-slate-300"
                >
                  {source.logo ? (
                    <img
                      src={source.logo}
                      alt={source.name}
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span>{source.name}</span>
                </div>
              ))}
              {news.sources.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{news.sources.length - 3} more
                </span>
              )}
            </div>
            
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsCard;
