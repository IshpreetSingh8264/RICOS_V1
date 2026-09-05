import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';

const TargetAudienceSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const audiences = [
    {
      value: 'volunteers',
      label: 'Volunteers & Public',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Be the Eyes on the Ground',
      description: 'Use the lightweight mobile app to stream live video, report incidents, and communicate with teams, even across language barriers.',
      features: [
        'One-tap incident reporting',
        'Live video streaming capability',
        'Multilingual real-time chat',
        'Offline-capable mobile app',
        'GPS location tracking',
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      value: 'government',
      label: 'Command Centers',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Manage Large-Scale Incidents',
      description: 'Manage large-scale incidents from a central dashboard. Coordinate multi-agency responses and make decisions based on verified, real-time data.',
      features: [
        'Centralized command dashboard',
        'Multi-agency coordination tools',
        'Real-time asset tracking',
        'Data-driven decision support',
        'Incident analytics & reporting',
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      value: 'ngos',
      label: 'NGOs & Response Teams',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Break Out of Your Silo',
      description: 'Coordinate directly with government agencies and other NGOs on one map. Receive AI-routed dispatches to maximize your impact.',
      features: [
        'Inter-organization coordination',
        'AI-powered task assignment',
        'Resource sharing capabilities',
        'Collaborative incident response',
        'Impact tracking & metrics',
      ],
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-black" id="who-its-for">
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
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
              A Unified Platform for Every Responder
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-3xl mx-auto px-4">
              Whether you're on the ground, in the command center, or leading a response team,
              RICOS connects you to the ecosystem.
            </p>
          </motion.div>

          {/* Tabbed Content */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Tabs defaultValue="volunteers" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 bg-transparent p-0 h-auto">
                {audiences.map((audience) => (
                  <TabsTrigger
                    key={audience.value}
                    value={audience.value}
                    className="relative flex flex-row items-center justify-center gap-2 sm:gap-2.5 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-semibold rounded-lg sm:rounded-xl border-2 border-slate-700 bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600 hover:text-slate-200 transition-all duration-200 data-[state=active]:bg-slate-300 data-[state=active]:border-slate-300 data-[state=active]:text-black cursor-pointer"
                  >
                    <span className={`inline-flex p-1 sm:p-1.5 rounded-lg ${audience.value === 'volunteers' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : audience.value === 'government' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'} text-white shrink-0`}>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {audience.value === 'volunteers' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        )}
                        {audience.value === 'government' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        )}
                        {audience.value === 'ngos' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        )}
                      </svg>
                    </span>
                    <span className="text-center leading-tight font-bold">{audience.label}</span>
                    {/* Active indicator line */}
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black rounded-full opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300" />
                  </TabsTrigger>
                ))}
              </TabsList>

              {audiences.map((audience) => (
                <TabsContent key={audience.value} value={audience.value}>
                  <Card className="p-4 sm:p-6 md:p-8 lg:p-12 bg-slate-900 border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                      {/* Content */}
                      <div>
                        <div className={`inline-flex p-2 sm:p-3 rounded-xl bg-gradient-to-br ${audience.color} text-white mb-3 sm:mb-4`}>
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={audience.icon.props.children.props.d} />
                          </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                          {audience.title}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                          {audience.description}
                        </p>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {audience.features.map((feature, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center gap-2"
                            >
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-[10px] sm:text-xs md:text-sm text-slate-300">{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Visual */}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[180px] sm:min-h-[220px] md:min-h-[260px] border border-slate-700">
                        {audience.value === 'volunteers' ? (
                          <img 
                            src="/images/volunteers.jpg" 
                            alt="Volunteers helping in disaster rescue"
                            className="w-full h-full object-cover"
                          />
                        ) : audience.value === 'government' ? (
                          <img 
                            src="/images/commmandcenter.jpg" 
                            alt="Command center monitoring disaster response"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img 
                            src="/images/ngo.jpg" 
                            alt="NGO and response teams coordinating disaster relief"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
