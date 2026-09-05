import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const DifferentiatorsSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const differentiators = [
    {
      icon: (
        <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: 'Cross-Organization Integration',
      description: 'We are built to connect Government, NGOs, and the Public in one unified ecosystem.',
      badge: 'Unique',
    },
    {
      icon: (
        <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Driven & NLP-Powered',
      description: 'We combine AI-based routing with multilingual chat to break barriers and optimize response.',
      badge: 'Intelligent',
    },
    {
      icon: (
        <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Real-Time Ground Truth',
      description: 'We integrate live video streaming for unparalleled situational awareness and verified information.',
      badge: 'Live',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="max-w-7xl mx-auto"
        >
          {/* Section Header */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1 text-xs sm:text-sm">Why Choose RICOS?</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
              We Fill the Gap Left by Existing Solutions
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto px-4">
              While others offer fragmented tools like chat apps or internal-only systems,
              RICOS is the only solution that unifies all stakeholders with AI and live data.
            </p>
          </motion.div>

          {/* Differentiators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {differentiators.map((item, index) => (
                <motion.div
                    key={index}
                    variants={fadeInUp}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    className="h-full"
                >
                    <Card className="relative p-5 sm:p-6 md:p-8 h-full bg-slate-800 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-300 group">
                        {/* Content */}
                        <div className="flex flex-col h-full">
                            {/* Icon and Badge */}
                            <div className="flex items-start justify-between mb-4 sm:mb-5">
                                <div className="p-3 sm:p-4 rounded-xl bg-slate-700 text-white group-hover:bg-slate-600 transition-colors duration-300 shrink-0">
                                    {item.icon}
                                </div>
                                <Badge variant="secondary" className="text-xs sm:text-sm py-1 px-2 sm:px-3 bg-slate-700 text-slate-200 border-slate-600">
                                    {item.badge}
                                </Badge>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                                {item.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </Card>
                </motion.div>
            ))}
          </div>

          {/* Comparison */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-black rounded-2xl p-6 md:p-12 border border-slate-700 mx-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Others */}
              <div>
                <h4 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">×</span>
                  Fragmented Solutions
                </h4>
                <ul className="space-y-3">
                  {[
                    { text: 'Chat apps only', icon: (
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )},
                    { text: 'Internal-only systems', icon: (
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )},
                    { text: 'No AI optimization', icon: (
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                      </svg>
                    )},
                    { text: 'Single organization focus', icon: (
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )},
                    { text: 'Limited real-time data', icon: (
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )},
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-slate-300">
                      {item.icon}
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RICOS */}
              <div>
                <h4 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl shrink-0">✓</span>
                  RICOS Advantage
                </h4>
                <ul className="space-y-3">
                  {[
                    { text: 'Complete coordination platform', icon: (
                      <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )},
                    { text: 'Cross-organization integration', icon: (
                      <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )},
                    { text: 'AI-powered routing & NLP', icon: (
                      <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )},
                    { text: 'Unified all stakeholders', icon: (
                      <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )},
                    { text: 'Live video & real-time truth', icon: (
                      <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )},
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-slate-300">
                      {item.icon}
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default DifferentiatorsSection;
