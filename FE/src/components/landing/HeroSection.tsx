import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus, MapPin, Users, AlertTriangle, Activity } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ incidents: 0, responders: 0, districts: 0 });
  const hasAnimated = useRef(false);

  const targets = { incidents: 2400, responders: 340, districts: 36 };

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1800;
    const step = 30;
    const steps = duration / step;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      const progress = Math.min(current / steps, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        incidents: Math.floor(targets.incidents * ease),
        responders: Math.floor(targets.responders * ease),
        districts: Math.floor(targets.districts * ease),
      });
      if (current >= steps) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-14 sm:pt-16">
      {/* Animated mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-mesh-drift"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-5"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.8), transparent 60%)' }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-6"
          >
            <Activity size={12} className="animate-pulse" />
            Live Disaster Response Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-white">Stop Crisis Chaos.</span>
            <br />
            <span className="gradient-text text-glow-blue">
              Start Coordinated Response.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            RICOS unifies Government, NGOs, and Volunteers on one platform —
            real-time maps, AI-powered dispatch, and live coordination to save lives
            during Punjab's worst flood crises.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-14"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-glow-md w-full sm:w-auto justify-center"
            >
              Get Started
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 px-7 py-3.5 bg-transparent hover:bg-blue-500/10 text-blue-400 font-semibold text-sm rounded-xl border border-blue-500/40 hover:border-blue-400 transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <UserPlus size={16} />
              Sign Up as Volunteer
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto mb-14"
          >
            {[
              { value: counts.incidents.toLocaleString(), label: 'Incidents Tracked', icon: <AlertTriangle size={16} /> },
              { value: counts.responders.toLocaleString() + '+', label: 'Active Responders', icon: <Users size={16} /> },
              { value: counts.districts.toLocaleString(), label: 'Punjab Districts', icon: <MapPin size={16} /> },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">{stat.icon}</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white tabular-nums">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-3xl mx-auto"
          >
            {/* Glow under image */}
            <div className="absolute -inset-2 rounded-2xl blur-2xl opacity-20 bg-blue-500" />
            <div className="relative rounded-2xl overflow-hidden border border-blue-500/25 shadow-glass-lg">
              {/* Top bar */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900/80 border-b border-slate-700/50">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <div className="flex-1 mx-4 h-5 bg-slate-800 rounded text-xs text-slate-500 flex items-center px-2">
                  ricos.gov.pk/dashboard
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                  Live
                </div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800">
                <img
                  src="/images/map_landing_page.png"
                  alt="RICOS Unified Geospatial Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 -right-4 glass-card px-3 py-2 text-xs font-medium text-slate-200 shadow-glass"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Real-time Updates
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-3 -left-4 glass-card px-3 py-2 text-xs font-medium text-slate-200 shadow-glass"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                AI Dispatch Active
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
