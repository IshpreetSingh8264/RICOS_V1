import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const PricingSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const pricingTiers = [
    {
      name: 'Freemium',
      subtitle: 'For Volunteer Teams',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for small volunteer organizations getting started with crisis coordination.',
      features: [
        'Up to 50 volunteers',
        'Basic incident reporting',
        'Mobile app access',
        'Community support',
        'Basic analytics',
      ],
      cta: 'Sign Up Free',
      popular: false,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Professional',
      subtitle: 'For NGOs & Response Teams',
      price: '$499',
      period: '/month',
      description: 'Full-featured platform for professional response organizations.',
      features: [
        'Unlimited team members',
        'AI-based routing',
        'Live video streaming',
        'Multilingual NLP chat',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
      ],
      cta: 'Request Demo',
      popular: true,
      color: 'from-primary to-blue-600',
    },
    {
      name: 'Enterprise',
      subtitle: 'For Government Agencies',
      price: 'Custom',
      period: 'pricing',
      description: 'Tailored solutions for large-scale, multi-agency crisis management.',
      features: [
        'Everything in Professional',
        'Dedicated infrastructure',
        'Custom deployment options',
        'SLA guarantees',
        '24/7 premium support',
        'Training & onboarding',
        'Compliance & security',
        'API access',
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section className="py-24 bg-slate-900" id="pricing">
      <div className="container mx-auto px-4">
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
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1">Pricing Plans</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose the Right Plan for Your Organization
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              From volunteer teams to government agencies, we have a solution that fits your needs and budget.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className={`bg-gradient-to-r ${tier.color} text-white border-0 px-4 py-1`}>
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`p-8 h-full flex flex-col bg-slate-800 border-slate-700 ${
                  tier.popular ? 'border-2 border-primary shadow-xl scale-105' : 'border-2 border-transparent'
                } hover:shadow-2xl transition-all duration-300`}>
                  {/* Header */}
                  <div className="mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tier.color} text-white mb-4`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {tier.subtitle}
                    </p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-white">
                        {tier.price}
                      </span>
                      <span className="text-slate-400">
                        {tier.period}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-primary to-blue-600 hover:opacity-90'
                        : ''
                    }`}
                    variant={tier.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Card className="p-8 bg-black max-w-3xl mx-auto border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">
                All plans include:
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Regular updates</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>99.9% uptime</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-6">
                Questions about pricing? <button className="text-primary hover:underline font-medium">Contact our sales team</button>
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
