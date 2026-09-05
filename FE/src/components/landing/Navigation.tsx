import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LogIn, Shield } from 'lucide-react';
import TermsAndConditionsModal from './TermsAndConditionsModal';

interface NavigationProps {
  onLoginClick?: () => void;
}

const Navigation = ({ onLoginClick }: NavigationProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }
  };

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Our Mission', id: 'sdg-mission' },
    { label: 'Terms', id: 'terms', isModal: true },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl shadow-glass border-b border-blue-500/10'
          : 'bg-transparent'
      }`}
      style={{ right: '12px', width: 'calc(100% - 12px)' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1536px] mx-auto">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer z-50 shrink-0 flex items-center gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/images/logo.svg" alt="RICOS" className="w-12 h-12 sm:w-14 sm:h-14" />
          </motion.div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.isModal ? setTermsModalOpen(true) : scrollToSection(link.id)}
                className="relative text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200 nav-link-underline whitespace-nowrap"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400 max-w-[140px] truncate">{user?.name || user?.email}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-slate-300 border border-slate-600/60 rounded-lg hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLoginClick || (() => navigate('/login'))}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-glow"
              >
                <LogIn size={15} />
                Login
              </motion.button>
            )}
          </div>

          {/* Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-slate-300 hover:text-blue-400 transition-colors p-1.5 z-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-blue-500/15 bg-slate-950/95 backdrop-blur-xl"
            >
              <div className="py-3 space-y-0.5">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => link.isModal ? (setTermsModalOpen(true), setMobileMenuOpen(false)) : scrollToSection(link.id)}
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-blue-400 hover:bg-blue-500/5 transition-all duration-200"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="border-t border-blue-500/10 pt-2 mt-1">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-xs text-slate-500 truncate">{user?.name || user?.email}</div>
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { if (onLoginClick) onLoginClick(); else navigate('/login'); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <LogIn size={16} />
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TermsAndConditionsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </motion.nav>
  );
};

export default Navigation;
