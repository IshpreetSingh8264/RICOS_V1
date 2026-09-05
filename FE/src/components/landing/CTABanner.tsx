import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

const CTABanner = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900" id="demo">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.12), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center"
        >
          {/* Glow ring */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-glow">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Ready to Unify Your{' '}
            <span className="gradient-text">Crisis Response?</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto"
          >
            See RICOS in action. Get instant access and start coordinating
            disaster response across your district today.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-glow-md"
            >
              Get Started Free
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/signup')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent hover:bg-blue-500/10 text-blue-400 font-semibold text-sm rounded-xl border border-blue-500/40 hover:border-blue-400 transition-all duration-200"
            >
              Sign Up as Volunteer
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
            {['Free to Use', 'No Setup Required', 'Operational in Minutes'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
