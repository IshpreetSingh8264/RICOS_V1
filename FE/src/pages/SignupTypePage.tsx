import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';

const SignupTypePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    const storedPassword = sessionStorage.getItem('signup_password');
    if (!storedEmail || !storedPassword) { navigate('/login'); return; }
    setEmail(storedEmail);
  }, [navigate]);

  const options = [
    {
      icon: <User size={26} />,
      title: 'User Account',
      subtitle: 'Individual',
      description: 'For individuals seeking help, reporting incidents, or tracking relief efforts in their area.',
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'rgba(59,130,246,0.2)',
      route: '/signup/user',
    },
    {
      icon: <Users size={26} />,
      title: 'Responder Account',
      subtitle: 'Organization',
      description: 'For NGOs, Government Agencies, and Volunteer Groups coordinating crisis response.',
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'rgba(16,185,129,0.2)',
      route: '/signup/responder-type',
    },
  ];

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
          {email && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              <CheckCircle2 size={12} />
              Credentials set for {email}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Choose Account Type</h1>
          <p className="text-slate-400 text-sm">Select the type of account you want to create</p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 mb-6">
          {options.map((opt, i) => (
            <motion.button
              key={i}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(opt.route)}
              className="group relative glass-card p-5 text-left transition-all duration-300 hover:border-blue-500/40 w-full"
              style={{ '--hover-glow': opt.glow } as React.CSSProperties}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 20% 50%, ${opt.glow}, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.gradient} text-white shrink-0 shadow-sm`}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base font-bold text-white">{opt.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {opt.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                </div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div variants={fadeInUp} className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            ← Back to Login
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupTypePage;
