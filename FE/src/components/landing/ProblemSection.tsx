import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/card';

const ProblemSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const problems = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Information Chaos',
      description: 'Decision-makers lack a single "source of truth" amidst misinformation.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Siloed Teams',
      description: 'Government, NGOs, and volunteers work in isolation, leading to duplicated effort.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Inefficient Routing',
      description: 'The wrong teams are sent to the wrong places, wasting critical time.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: 'Communication Barriers',
      description: 'Critical language barriers and fragmented chat apps slow down coordination.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-slate-900" id="problem">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 max-w-[1536px] mx-auto">
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
            className="text-center mb-10 sm:mb-12 md:mb-16 px-1 sm:px-4"
          >
            <h2 className="text-2xl xs:text-2.5xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 hover:text-primary transition-colors duration-300 leading-tight">
              Crisis Response is Fragmented and Inefficient
            </h2>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              In a crisis, effective coordination is the difference between life and death.
              Today's response is hampered by information chaos, siloed responders, and
              tools that don't talk to each other.
            </p>
          </motion.div>

          {/* Problem Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 px-1 sm:px-4">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl hover:scale-105 transition-all duration-300 bg-slate-800 border-slate-700">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-red-950/50 rounded-lg text-red-400">
                      {problem.icon}
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
