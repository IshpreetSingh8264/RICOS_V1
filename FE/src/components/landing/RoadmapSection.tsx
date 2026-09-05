import { motion, useScroll } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useState, useRef, useEffect, useCallback } from 'react';

const statusColors: Record<string, string> = {
  'Coming Soon': 'bg-green-100 text-green-700 border-green-200',
  'In Development': 'bg-blue-100 text-blue-700 border-blue-200',
  Planned: 'bg-purple-100 text-purple-700 border-purple-200',
  Research: 'bg-orange-100 text-orange-700 border-orange-200',
};

interface RoadmapItemProps {
  item: {
    icon: React.ReactElement;
    title: string;
    description: string;
    status: string;
  };
  index: number;
  hoveredDot: number | null;
  onDotHover: (index: number | null) => void;
  fadeInUp: any;
}

const RoadmapItemComponent = ({ item, index, hoveredDot, onDotHover, fadeInUp }: RoadmapItemProps) => {
  const [itemRef, itemInView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <motion.div
      ref={itemRef}
      variants={fadeInUp}
      initial="hidden"
      animate={itemInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`flex flex-col md:flex-row gap-8 items-center ${
        index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Content Card */}
      <motion.div 
        className="flex-1"
        animate={{
          scale: hoveredDot === index ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-6 transition-all duration-500 border-2 bg-slate-900 ${
          hoveredDot === index 
            ? 'border-primary shadow-2xl shadow-primary/20 scale-105' 
            : 'border-slate-700 hover:border-primary/20 hover:shadow-xl'
        }`}>
          <div className="flex items-start gap-4">
            <motion.div 
              className="shrink-0 p-3 bg-primary/10 text-primary rounded-lg"
              animate={{
                scale: hoveredDot === index ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {item.icon}
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h3 className="text-xl font-bold text-white">
                  {item.title}
                </h3>
                <Badge
                  variant="outline"
                  className={statusColors[item.status]}
                >
                  {item.status}
                </Badge>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timeline Dot with Pulse Effect */}
      <div className="hidden md:block relative shrink-0 z-10">
        <motion.div
          className="relative"
          onMouseEnter={() => onDotHover(index)}
          onMouseLeave={() => onDotHover(null)}
        >
          {/* Outer glow ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={itemInView ? { 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            } : { scale: 0, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="absolute inset-0 w-8 h-8 -m-1 bg-primary rounded-full blur-md"
          />

          {/* Hover ripple effect */}
          {hoveredDot === index && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="absolute inset-0 w-8 h-8 -m-1 bg-primary rounded-full"
            />
          )}

          {/* Main dot */}
          <motion.div
            initial={{ scale: 0 }}
            animate={itemInView ? { 
              scale: hoveredDot === index ? 1.4 : 1,
            } : { scale: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1 + 0.3,
              type: "spring",
              stiffness: 200,
            }}
            className={`w-6 h-6 rounded-full border-4 border-white shadow-lg cursor-pointer relative ${
              itemInView ? 'bg-primary' : 'bg-slate-600'
            }`}
            style={{
              boxShadow: itemInView 
                ? '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)' 
                : 'none',
            }}
          >
            {/* Inner glow dot */}
            <motion.div
              animate={{
                scale: itemInView ? [1, 1.2, 1] : 1,
                opacity: itemInView ? [0.8, 1, 0.8] : 0.5,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="absolute inset-1 bg-white rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </motion.div>
  );
};

const RoadmapSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [isPathHovered, setIsPathHovered] = useState(false);
  const [containerHeight, setContainerHeight] = useState(1000);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"]
  });

  const handleDotHover = useCallback((index: number | null) => {
    setHoveredDot(index);
  }, []);

  useEffect(() => {
    // Measure the container height and update SVG path
    const updateHeight = () => {
      if (sectionRef.current) {
        const height = sectionRef.current.offsetHeight;
        setContainerHeight(height);
      }
    };

    // Initial measurement
    updateHeight();

    // Update on window resize
    window.addEventListener('resize', updateHeight);
    
    // Use ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(updateHeight);
    if (sectionRef.current) {
      resizeObserver.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const roadmapItems = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      title: 'Live Drone Feed Integration',
      description: 'Integrate aerial surveillance and real-time drone video feeds for comprehensive situational awareness.',
      status: 'Coming Soon',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Predictive AI for High-Risk Zones',
      description: 'Machine learning algorithms to identify and predict high-risk areas before incidents occur.',
      status: 'In Development',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Supply Chain & Asset Tracking',
      description: 'Real-time tracking of relief supplies, medical equipment, and emergency assets across the response network.',
      status: 'Planned',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      title: 'Offline-First Mesh Networking',
      description: 'Enable communication and coordination even when internet connectivity is limited or unavailable.',
      status: 'Research',
    },
  ];

  return (
    <section className="py-24 bg-black">
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
            <Badge className="mb-4 px-4 py-1">Future Roadmap</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              The Future of Crisis Response is Smart
            </h2>
            <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto">
              We are constantly innovating to bring you the most advanced crisis coordination
              tools. Here's what's coming next.
            </p>
          </motion.div>

          {/* Roadmap Timeline */}
          <div ref={sectionRef} className="relative">
            {/* Animated SVG Path */}
            <div className="hidden md:block absolute left-1/2 top-0 h-full pointer-events-none z-0" style={{ transform: 'translateX(-50%)' }}>
              <svg 
                width="4" 
                height={containerHeight}
                className="overflow-visible"
                style={{ minHeight: '100%' }}
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradient for the path */}
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
                  </linearGradient>
                  
                  {/* Glow filter for hover effect */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Background path (full) - visible gray line */}
                <motion.path
                  ref={pathRef}
                  d={`M 2 0 L 2 ${containerHeight}`}
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Animated progress path - bright colored line */}
                <motion.path
                  d={`M 2 0 L 2 ${containerHeight}`}
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    pathLength: scrollYProgress,
                    filter: isPathHovered ? 'url(#glow)' : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                    transition: 'filter 0.3s ease',
                  }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />

                {/* Interactive overlay for hover detection */}
                <motion.path
                  d={`M 2 0 L 2 ${containerHeight}`}
                  stroke="transparent"
                  strokeWidth="30"
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setIsPathHovered(true)}
                  onMouseLeave={() => setIsPathHovered(false)}
                />
              </svg>
            </div>

            {/* Roadmap Items */}
            <div className="space-y-12 md:space-y-24">
              {roadmapItems.map((item, index) => {
                return (
                  <RoadmapItemComponent 
                    key={index} 
                    item={item} 
                    index={index}
                    hoveredDot={hoveredDot}
                    onDotHover={handleDotHover}
                    fadeInUp={fadeInUp}
                  />
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700">
              <p className="text-lg text-slate-300 mb-4">
                Want to contribute to our roadmap or suggest new features?
              </p>
              <button className="text-primary font-semibold hover:underline">
                Get in Touch →
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default RoadmapSection;
