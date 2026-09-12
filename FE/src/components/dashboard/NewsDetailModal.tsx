import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  Calendar, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  Loader2,
  ImageOff,
  Newspaper,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { BundledNews } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: BundledNews;
  onSendMessage: (message: string) => Promise<string>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  isOpen,
  onClose,
  news,
  onSendMessage,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await onSendMessage(inputMessage);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
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

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">News Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 space-y-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {news.title}
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {news.description}
          </p>

          {/* Collapsible Content Section */}
          <div>
            {/* Content - Collapsed or Expanded */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Image */}
                {news.urlToImage && !imageError ? (
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-slate-800">
                    <img
                      src={news.urlToImage}
                      alt={news.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-lg bg-slate-800 flex items-center justify-center">
                    <ImageOff className="w-16 h-16 text-slate-600" />
                  </div>
                )}

                {/* Article Count Badge */}
                {news.totalArticles > 1 && (
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    <Newspaper className="w-4 h-4" />
                    Bundled from {news.totalArticles} articles
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(news.publishedAt)}</span>
                </div>

                {/* Full Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {news.content}
                  </div>
                </div>

                {/* Sources */}
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Sources ({news.sources.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {news.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:bg-slate-800 hover:border-slate-600 transition-all group"
                      >
                        {source.logo ? (
                          <img
                            src={source.logo}
                            alt={source.name}
                            className="w-8 h-8 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Newspaper className="w-8 h-8 text-slate-500" />
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

            {/* Read More / Read Less Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors py-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  Read Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Read More
                </>
              )}
            </button>
          </div>

          {/* Chat Section - Integrated at the end */}
          <div className="border-t border-slate-700 pt-6 mt-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Ask Questions About This News</h3>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4 mb-6">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-6 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  Start a conversation by asking questions about this news article
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-200 rounded-lg px-4 py-3 border border-slate-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="sticky bottom-0 bg-slate-900 pt-4 pb-2">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask about this news..."
                  className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !inputMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default NewsDetailModal;
