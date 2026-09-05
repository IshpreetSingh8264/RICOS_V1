import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Building2, Lightbulb, Shield } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';

const contributions = [
  {
    icon: <Building2 size={22} />,
    title: 'Resilient Infrastructure',
    description: 'RICOS builds a robust unified digital backbone for crisis communication, strengthening community response capabilities.',
  },
  {
    icon: <Lightbulb size={22} />,
    title: 'Innovative Technology',
    description: 'Leveraging AI, NLP, and live video to create novel solutions for public safety and crisis management at scale.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Community Safety',
    description: 'By creating a single source of truth and coordinated response, we strengthen resilience and save lives.',
  },
];

const SDGMissionSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden" id="sdg-mission">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Header + SDG badge — horizontal */}
          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="md:max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
                UN SDG Alignment
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Innovating for a{' '}
                <span className="gradient-text">Resilient Future</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Aligned with{' '}
                <span className="text-orange-400 font-semibold">SDG 9: Industry, Innovation & Infrastructure</span>
                {' '}— building the crisis response infrastructure of tomorrow.
              </p>
            </div>

            {/* SDG badge */}
            <div className="flex items-center gap-4 glass-card px-6 py-4 shrink-0">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
                9
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5 uppercase tracking-wider">SDG Goal</div>
                <div className="text-sm font-semibold text-white">Industry, Innovation</div>
                <div className="text-sm font-semibold text-white">& Infrastructure</div>
              </div>
            </div>
          </motion.div>

          {/* Contributions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contributions.map((item, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className="glass-card p-6 h-full glass-card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">{item.icon}</div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quote */}
          <motion.div variants={fadeInUp} className="mt-8">
            <div className="glass-card p-6 text-center border-blue-500/20">
              <p className="text-slate-300 text-sm md:text-base italic max-w-3xl mx-auto">
                "By connecting stakeholders and leveraging cutting-edge technology, RICOS is
                building the resilient crisis response infrastructure of tomorrow — one coordinated response at a time."
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SDGMissionSection;
