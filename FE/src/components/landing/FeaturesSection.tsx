import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Map, Zap, Video, Bell, Shield, BarChart3, Globe, Radio } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';

const features = [
  {
    icon: <Map size={24} />,
    title: 'Unified Geospatial Dashboard',
    description: 'A single common operational picture for all organizations. See incidents, resources, and public SOS requests on one live map.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.2)',
  },
  {
    icon: <Zap size={24} />,
    title: 'AI-Based Resource Routing',
    description: 'Dispatch the closest, most qualified team to any incident. Our AI eliminates guesswork and optimizes every response.',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'rgba(139,92,246,0.2)',
  },
  {
    icon: <Video size={24} />,
    title: 'Live Ground-Truth & NLP Chat',
    description: 'Receive live video from volunteers on the ground. Break language barriers with multilingual NLP-powered communication.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.2)',
  },
  {
    icon: <Bell size={24} />,
    title: 'Public SOS Portal',
    description: 'Citizens submit geotagged help requests that feed directly into the operational dashboard, prioritized by AI.',
    gradient: 'from-orange-500 to-red-500',
    glow: 'rgba(249,115,22,0.2)',
  },
  {
    icon: <Shield size={24} />,
    title: 'Role-Based Access Control',
    description: 'Government, NGO, and volunteer views are tailored to each role. Everyone sees exactly what they need.',
    gradient: 'from-sky-500 to-blue-500',
    glow: 'rgba(14,165,233,0.2)',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Resource & Inventory Tracking',
    description: 'Real-time visibility into relief supplies, donations, and field team deployments across all districts.',
    gradient: 'from-amber-500 to-yellow-500',
    glow: 'rgba(245,158,11,0.2)',
  },
  {
    icon: <Globe size={24} />,
    title: 'Multi-Language Support',
    description: 'Punjabi, English — RICOS speaks the language of crisis response across all of Punjab.',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'rgba(236,72,153,0.2)',
  },
  {
    icon: <Radio size={24} />,
    title: 'Offline-Resilient Architecture',
    description: 'Works in low-bandwidth flood zones. Critical coordination data syncs the moment connectivity returns.',
    gradient: 'from-lime-500 to-green-500',
    glow: 'rgba(132,204,22,0.2)',
  },
];

const FeaturesSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" id="features">
      {/* Section glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              A Complete Toolkit for{' '}
              <span className="gradient-text">Crisis Management</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              Every tool your team needs to coordinate an effective disaster response — unified in one platform.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative glass-card p-5 glass-card-hover cursor-default"
                style={{ '--glow-color': feature.glow } as React.CSSProperties}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${feature.glow}, transparent 70%)` }}
                />
                {/* Icon */}
                <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} bg-opacity-20 text-white mb-4 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-snug">{feature.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom highlights */}
          <motion.div variants={fadeInUp} className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Real-Time Updates', 'Cross-Platform', 'Secure & Reliable', 'Infinitely Scalable'].map((tag, i) => (
              <div
                key={i}
                className="text-center py-2.5 px-4 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs font-medium text-blue-300"
              >
                {tag}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
