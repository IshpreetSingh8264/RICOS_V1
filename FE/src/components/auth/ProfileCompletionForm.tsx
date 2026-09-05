import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileFormProps {
  onComplete?: () => void;
}

const ProfileCompletionForm = ({ onComplete }: ProfileFormProps) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        organization: user.organization || '',
        phone: user.phone || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const steps = [
    {
      title: 'What\'s your name?',
      field: 'name',
      placeholder: 'John Doe',
      type: 'text',
    },
    {
      title: 'Which organization do you represent?',
      field: 'organization',
      placeholder: 'Red Cross, Government Agency, etc.',
      type: 'text',
    },
    {
      title: 'What\'s your phone number?',
      field: 'phone',
      placeholder: '+1 (555) 000-0000',
      type: 'tel',
    },
    {
      title: 'What\'s your role?',
      field: 'role',
      placeholder: 'Coordinator, First Responder, etc.',
      type: 'text',
    },
  ];

  const validateField = (field: string, value: string): boolean => {
    if (!value.trim()) {
      setErrors({ [field]: 'This field is required' });
      return false;
    }

    if (field === 'phone' && !/^[\d\s\+\-\(\)]+$/.test(value)) {
      setErrors({ [field]: 'Please enter a valid phone number' });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    const currentField = steps[currentStep].field;
    const value = formData[currentField as keyof typeof formData];

    if (validateField(currentField, value)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    // Validate all fields
    const allValid = Object.entries(formData).every(([field, value]) => 
      validateField(field, value)
    );

    if (allValid) {
      updateProfile(formData);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors({});
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 mesh-bg px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">RICOS</h1>
          <p className="text-slate-400 text-sm">Complete Your Profile</p>
        </div>

        <div className="glass-card p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <h2 className="text-xl font-bold text-white">
                  Step {currentStep + 1} of {steps.length}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Help us know you better</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5">Completion</p>
                <p className="text-2xl font-bold text-blue-400">{Math.round(progress)}%</p>
              </div>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              />
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 mt-4">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-blue-500' :
                  i < currentStep ? 'w-2 bg-blue-500/50' :
                  'w-2 bg-slate-700'
                }`} />
              ))}
            </div>
          </div>

          {/* Email Display */}
          {currentStep === 0 && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs text-slate-500">Logged in as</p>
                <p className="text-sm font-medium text-slate-300">{user.email}</p>
              </div>
            </motion.div>
          )}

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <label className="block text-base font-semibold text-white mb-3">
                {currentStepData.title}
              </label>
              <input
                id={currentStepData.field}
                type={currentStepData.type}
                placeholder={currentStepData.placeholder}
                value={formData[currentStepData.field as keyof typeof formData] as string}
                onChange={(e) => handleChange(currentStepData.field, e.target.value)}
                className={`input-dark text-base py-3 ${errors[currentStepData.field] ? 'border-red-500/70 focus:border-red-500' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                autoFocus
              />
              {errors[currentStepData.field] && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2"
                >
                  {errors[currentStepData.field]}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-sm flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? (
                'Complete Profile'
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Skip */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSkipping(true);
                updateProfile(formData);
                setTimeout(() => {
                  if (onComplete) onComplete();
                }, 300);
              }}
              disabled={isSkipping}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSkipping ? 'Saving...' : "I'll complete this later"}
            </button>
          </div>
        </div>

        {/* Help */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-center text-sm text-slate-500"
        >
          This information helps us coordinate responses more effectively
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ProfileCompletionForm;
