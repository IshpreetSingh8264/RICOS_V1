import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, Users, ArrowRight } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';

const responderTypes = [
  {
    type: 'ngo',
    title: 'NGO',
    subtitle: 'Non-Governmental Organization',
    description: 'Relief organizations providing humanitarian aid, food, shelter, and medical support during crises.',
    icon: <Building2 size={26} />,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.2)',
  },
  {
    type: 'government',
    title: 'Government Agency',
    subtitle: 'Official Authority',
    description: 'Police, Fire, NDMA, Health Departments, and all official government response bodies.',
    icon: <Shield size={26} />,
    gradient: 'from-orange-500 to-red-500',
    glow: 'rgba(249,115,22,0.2)',
  },
  {
    type: 'volunteer',
    title: 'Volunteer Group',
    subtitle: 'Community Organization',
    description: 'Community-led groups and volunteers coordinating grassroots disaster response and relief.',
    icon: <Users size={26} />,
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.2)',
  },
];

const ResponderTypePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(59,130,246,0.08), transparent 60%)',
        }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-xl"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <img src="/images/logo.svg" alt="RICOS" className="w-14 h-14 mx-auto mb-4" />
          <div className="text-xs text-slate-500 mb-4">Rapid Incident Coordination Suite</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Select Responder Type</h1>
          <p className="text-slate-400 text-sm">Choose the type of organization you represent</p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 mb-6">
          {responderTypes.map((r, i) => (
            <motion.button
              key={r.type}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/signup/responder/${r.type}`)}
              className="group relative glass-card p-5 text-left transition-all duration-300 hover:border-blue-500/40 w-full"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 20% 50%, ${r.glow}, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${r.gradient} text-white shrink-0 shadow-sm`}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base font-bold text-white">{r.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {r.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                </div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div variants={fadeInUp} className="text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            ← Back to Account Type Selection
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResponderTypePage;
