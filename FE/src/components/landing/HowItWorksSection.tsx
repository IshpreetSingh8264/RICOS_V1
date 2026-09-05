import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { UserPlus, Layers, Radio } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';

const steps = [
  {
    number: '01',
    icon: <UserPlus size={28} />,
    title: 'Register Your Organization',
    description:
      'Government agencies, NGOs, and volunteer groups sign up in minutes. Each role gets a tailored operational view with the exact tools they need.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.25)',
  },
  {
    number: '02',
    icon: <Layers size={28} />,
    title: 'Activate Your Operations',
    description:
      'Define your coverage area, upload resources, and connect teams. RICOS instantly maps your assets alongside live incident data from across the region.',
    gradient: 'from-violet-500 to-blue-500',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    number: '03',
    icon: <Radio size={28} />,
    title: 'Coordinate in Real-Time',
    description:
      'Receive AI-powered dispatch recommendations, respond to SOS requests, track your field teams, and maintain a shared operational picture with every partner.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.25)',
  },
];

const HowItWorksSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden" id="how-it-works">
      {/* Background accent */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(59,130,246,0.08), transparent)',
        }}
      />

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
              Simple Onboarding
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Up and Running in{' '}
              <span className="gradient-text">3 Steps</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              From sign-up to full operational capability — no training required, no complex setup.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px">
              <div className="w-full h-full bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40" />
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="relative group"
              >
                <div className="glass-card p-7 h-full glass-card-hover">
                  {/* Number badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${step.gradient} text-white shadow-sm`}
                      style={{ boxShadow: `0 0 20px ${step.glow}` }}
                    >
                      {step.icon}
                    </div>
                    <span className="text-4xl font-black text-slate-800 tabular-nums">{step.number}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
