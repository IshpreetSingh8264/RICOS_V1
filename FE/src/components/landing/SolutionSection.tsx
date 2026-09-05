import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const SolutionSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const stakeholders = [
    { label: 'Government', color: 'bg-blue-500' },
    { label: 'NGOs', color: 'bg-green-500' },
    { label: 'Public', color: 'bg-purple-500' },
  ];

  return (
    <section className="py-24 bg-black" id="solution">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="max-w-6xl mx-auto"
        >
          {/* Section Header */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 px-4"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Introducing RICOS: Your Common Operational Dashboard
            </h2>
            <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto">
              RICOS is the unified platform built to solve these challenges. We connect
              all stakeholders in one ecosystem, providing real-time ground truth and
              intelligent tools to optimize every phase of the response.
            </p>
          </motion.div>

          {/* Visual Diagram */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative max-w-4xl mx-auto px-4"
          >
            {/* Connection Diagram */}
            <div className="flex flex-col items-center gap-8">
              {/* Stakeholder Silos */}
              <div className="flex flex-col md:flex-row justify-around w-full gap-4">
                {stakeholders.map((stakeholder, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex-1"
                  >
                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 text-center border-2 border-slate-700 hover:scale-105 transition-transform duration-300">
                        <div className={`w-12 h-12 ${stakeholder.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                            <span className="text-white font-bold">{stakeholder.label.charAt(0)}</span>
                        </div>
                        <p className="font-semibold text-white">{stakeholder.label}</p>
                        <p className="text-xs text-slate-400 mt-1">Isolated Operations</p>

                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Connection Lines */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="relative h-12 md:h-16 w-px bg-gradient-to-b from-slate-300 to-primary origin-top"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>

              {/* RICOS Platform */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="relative w-full max-w-sm"
              >
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl p-6 md:p-8 text-center text-white hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl md:text-3xl font-bold mb-2">RICOS</div>
                  <p className="text-xs md:text-sm opacity-90">Common Operational Dashboard</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                </div>
                
                {/* Radiating effect */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl border-4 border-primary"
                />
              </motion.div>

              {/* Benefits */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8"
              >
                {['Real-Time Data', 'AI-Powered Routing', 'Unified Communication'].map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-lg shadow p-4 text-center border border-slate-700 hover:scale-105 hover:border-primary transition-all duration-300"
                  >
                    <p className="text-xs md:text-sm font-medium text-slate-200">{benefit}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
