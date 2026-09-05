import { motion } from 'framer-motion';

const Footer = () => {
  const footerLinks = {
    product: [
      { label: 'Features', id: 'features' },
      { label: 'How It Works', id: 'how-it-works' },
      { label: 'Our Mission', id: 'sdg-mission' },
      { label: 'Get Started', id: 'demo' },
    ],
    company: [
      { label: 'About RICOS', id: '' },
      { label: 'SDG 9 Alignment', id: 'sdg-mission' },
      { label: 'Punjab Flood Response', id: '' },
    ],
    legal: [
      { label: 'Privacy Policy', id: '' },
      { label: 'Terms of Service', id: '' },
    ],
  };

  const scrollToSection = (id: string) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-blue-500/10 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.svg" alt="RICOS" className="w-10 h-10" />
              <span className="text-xl font-bold text-white">RICOS</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Rapid Incident Coordination Suite — unifying crisis response for governments,
              NGOs, and volunteers across Punjab.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                // Facebook
                <path key="fb" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
                // Twitter/X
                <path key="tw" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />,
                // LinkedIn
                <path key="li" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
              ].map((pathEl, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    {pathEl}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-xs hover:text-blue-400 hover:translate-x-1 transition-all duration-200 inline-block"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-xs hover:text-blue-400 hover:translate-x-1 transition-all duration-200 inline-block"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-xs hover:text-blue-400 hover:translate-x-1 transition-all duration-200 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-500">
            © 2026 <span className="font-semibold text-slate-400">RICOS</span>. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built for a safer Punjab — SDG Goal 9
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
