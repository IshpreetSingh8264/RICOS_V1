import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, formatErrorMessage } from '@/lib/api';
import type { GovtSignupData } from '@/lib/api';
import { stepForward, stepBackward } from '@/lib/motion-variants';

const STEPS = ['Agency Info', 'Contact Details', 'Point of Contact', 'Operational & Terms'];

const GovernmentSignupForm = () => {
  const navigate = useNavigate();
  const { logout, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    const storedPassword = sessionStorage.getItem('signup_password');
    if (!storedEmail || !storedPassword) {
      if (!shouldRedirect) setShouldRedirect(true);
      return;
    }
    setEmail(storedEmail);
    setPassword(storedPassword);
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [shouldRedirect, logout, navigate]);

  const [formData, setFormData] = useState({
    agencyName: '',
    department: '',
    governmentLevel: '',
    serviceIDNumber: '',
    departmentCode: '',
    officialEmail: '',
    officialContact: '',
    alternateContact: '',
    hqAddress: '',
    inchargeName: '',
    designation: '',
    inchargeContact: '',
    inchargeEmail: '',
    jurisdictionArea: '',
    resourceTypes: '',
    deploymentCapacity: '',
    bankAccountNumber: '',
    acceptTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.agencyName.trim()) newErrors.agencyName = 'Agency name is required';
      if (!formData.department.trim()) newErrors.department = 'Department is required';
      if (!formData.governmentLevel) newErrors.governmentLevel = 'Government level is required';
      if (!formData.serviceIDNumber.trim()) newErrors.serviceIDNumber = 'Official ID is required';
      if (!formData.departmentCode.trim()) newErrors.departmentCode = 'Department code is required';
    } else if (step === 1) {
      if (!formData.officialEmail.trim()) newErrors.officialEmail = 'Official email is required';
      if (!formData.officialContact.trim()) newErrors.officialContact = 'Official contact is required';
      if (!formData.hqAddress.trim()) newErrors.hqAddress = 'HQ address is required';
    } else if (step === 2) {
      if (!formData.inchargeName.trim()) newErrors.inchargeName = 'In-charge name is required';
      if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
      if (!formData.inchargeContact.trim()) newErrors.inchargeContact = 'Contact is required';
      if (!formData.inchargeEmail.trim()) newErrors.inchargeEmail = 'Email is required';
    } else if (step === 3) {
      if (!formData.jurisdictionArea.trim()) newErrors.jurisdictionArea = 'Jurisdiction area is required';
      if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Bank account number is required';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection('forward');
    setCurrentStep(s => s + 1);
  };

  const goBack = () => {
    setDirection('backward');
    setCurrentStep(s => s - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsLoading(true);
    setSubmitError('');

    try {
      const jurisdictionArea = formData.jurisdictionArea.split(',').map(a => a.trim()).filter(Boolean);
      const resourceTypes = formData.resourceTypes.split(',').map(t => t.trim()).filter(Boolean);

      const signupData: GovtSignupData = {
        agency_name: formData.agencyName,
        department: formData.department,
        govt_level: formData.governmentLevel,
        official_id: formData.serviceIDNumber,
        department_code: formData.departmentCode || formData.serviceIDNumber,
        email,
        password,
        hq_address: formData.hqAddress,
        incharge_name: formData.inchargeName,
        incharge_mobile: formData.inchargeContact,
        incharge_email: formData.inchargeEmail,
        control_room_number: formData.officialContact || undefined,
        jurisdiction_area: jurisdictionArea,
        resource_types: resourceTypes.length > 0 ? resourceTypes : undefined,
        resource_capacity: formData.deploymentCapacity ? parseInt(formData.deploymentCapacity, 10) : undefined,
        bank_account_number: formData.bankAccountNumber,
      };

      const response = await authAPI.signupGovt(signupData);
      localStorage.setItem('ricos_token', response.access_token);
      localStorage.setItem('ricos_user_type', response.user_type);
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_password');

      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        navigate('/', { replace: true });
      } else {
        throw new Error('Failed to log in after signup');
      }
    } catch (error) {
      console.error('Government signup error:', error);
      setSubmitError('Failed to complete registration: ' + formatErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariant = direction === 'forward' ? stepForward : stepBackward;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 mesh-bg flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">RICOS</h1>
          <p className="text-slate-400 text-sm">Government Agency Registration</p>
        </div>

        {/* Step Progress */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                  i < currentStep ? 'bg-blue-500 text-white' :
                  i === currentStep ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400' :
                  'bg-slate-800 border border-slate-700 text-slate-500'
                }`}>
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${i < currentStep ? 'bg-blue-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((step, i) => (
              <span key={step} className={`text-xs font-medium transition-colors duration-300 ${i === currentStep ? 'text-blue-400' : i < currentStep ? 'text-slate-400' : 'text-slate-600'}`}>
                {step}
              </span>
            ))}
          </div>
          <div className="mt-4 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              variants={slideVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6 md:p-8"
            >
              {/* Step 1: Agency Info */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Agency Information</h2>
                    <p className="text-slate-400 text-sm mt-1">Official government agency details</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Agency Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.agencyName ? 'border-red-500/70' : ''}`}
                        value={formData.agencyName} onChange={(e) => handleChange('agencyName', e.target.value)} />
                      {errors.agencyName && <p className="text-red-400 text-xs mt-1">{errors.agencyName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Department <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.department ? 'border-red-500/70' : ''}`}
                        value={formData.department} onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="e.g. Disaster Management" />
                      {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Government Level <span className="text-red-400">*</span></label>
                      <select className={`select-dark ${errors.governmentLevel ? 'border-red-500/70' : ''}`}
                        value={formData.governmentLevel} onChange={(e) => handleChange('governmentLevel', e.target.value)}>
                        <option value="">Select level</option>
                        <option value="central">Central</option>
                        <option value="state">State</option>
                        <option value="district">District</option>
                        <option value="local">Local</option>
                      </select>
                      {errors.governmentLevel && <p className="text-red-400 text-xs mt-1">{errors.governmentLevel}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Official ID Number <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.serviceIDNumber ? 'border-red-500/70' : ''}`}
                        value={formData.serviceIDNumber} onChange={(e) => handleChange('serviceIDNumber', e.target.value)}
                        placeholder="Government official ID" />
                      {errors.serviceIDNumber && <p className="text-red-400 text-xs mt-1">{errors.serviceIDNumber}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Department Code <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.departmentCode ? 'border-red-500/70' : ''}`}
                        value={formData.departmentCode} onChange={(e) => handleChange('departmentCode', e.target.value)}
                        placeholder="Department identification code" />
                      {errors.departmentCode && <p className="text-red-400 text-xs mt-1">{errors.departmentCode}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Contact Details</h2>
                    <p className="text-slate-400 text-sm mt-1">Official communication channels</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Official Email <span className="text-red-400">*</span></label>
                      <input type="email" className={`input-dark ${errors.officialEmail ? 'border-red-500/70' : ''}`}
                        value={formData.officialEmail} onChange={(e) => handleChange('officialEmail', e.target.value)}
                        placeholder="name@gov.in" />
                      {errors.officialEmail && <p className="text-red-400 text-xs mt-1">{errors.officialEmail}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Official Contact <span className="text-red-400">*</span></label>
                      <input type="tel" className={`input-dark ${errors.officialContact ? 'border-red-500/70' : ''}`}
                        value={formData.officialContact} onChange={(e) => handleChange('officialContact', e.target.value)} />
                      {errors.officialContact && <p className="text-red-400 text-xs mt-1">{errors.officialContact}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Alternate Contact</label>
                      <input type="tel" className="input-dark" value={formData.alternateContact}
                        onChange={(e) => handleChange('alternateContact', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Headquarters Address <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.hqAddress ? 'border-red-500/70' : ''}`}
                        value={formData.hqAddress} onChange={(e) => handleChange('hqAddress', e.target.value)} />
                      {errors.hqAddress && <p className="text-red-400 text-xs mt-1">{errors.hqAddress}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Point of Contact */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Point of Contact / In-charge</h2>
                    <p className="text-slate-400 text-sm mt-1">Primary official responsible for RICOS coordination</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">In-charge Full Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.inchargeName ? 'border-red-500/70' : ''}`}
                        value={formData.inchargeName} onChange={(e) => handleChange('inchargeName', e.target.value)} />
                      {errors.inchargeName && <p className="text-red-400 text-xs mt-1">{errors.inchargeName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Designation <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.designation ? 'border-red-500/70' : ''}`}
                        value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} />
                      {errors.designation && <p className="text-red-400 text-xs mt-1">{errors.designation}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">In-charge Contact <span className="text-red-400">*</span></label>
                      <input type="tel" className={`input-dark ${errors.inchargeContact ? 'border-red-500/70' : ''}`}
                        value={formData.inchargeContact} onChange={(e) => handleChange('inchargeContact', e.target.value)} />
                      {errors.inchargeContact && <p className="text-red-400 text-xs mt-1">{errors.inchargeContact}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">In-charge Email <span className="text-red-400">*</span></label>
                      <input type="email" className={`input-dark ${errors.inchargeEmail ? 'border-red-500/70' : ''}`}
                        value={formData.inchargeEmail} onChange={(e) => handleChange('inchargeEmail', e.target.value)} />
                      {errors.inchargeEmail && <p className="text-red-400 text-xs mt-1">{errors.inchargeEmail}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Operational & Terms */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Operational Details & Terms</h2>
                    <p className="text-slate-400 text-sm mt-1">Jurisdiction, resources, and agreement</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Jurisdiction Area <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.jurisdictionArea ? 'border-red-500/70' : ''}`}
                        value={formData.jurisdictionArea} onChange={(e) => handleChange('jurisdictionArea', e.target.value)}
                        placeholder="State / District / Region (comma-separated)" />
                      {errors.jurisdictionArea && <p className="text-red-400 text-xs mt-1">{errors.jurisdictionArea}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Resource Types Available</label>
                      <input type="text" className="input-dark" value={formData.resourceTypes}
                        onChange={(e) => handleChange('resourceTypes', e.target.value)}
                        placeholder="Rescue teams, Medical units, Shelter camps (comma-separated)" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Deployment Capacity</label>
                        <input type="number" className="input-dark" value={formData.deploymentCapacity}
                          onChange={(e) => handleChange('deploymentCapacity', e.target.value)}
                          placeholder="Number of personnel" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Bank Account Number <span className="text-red-400">*</span></label>
                        <input type="text" className={`input-dark ${errors.bankAccountNumber ? 'border-red-500/70' : ''}`}
                          value={formData.bankAccountNumber} onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                          placeholder="Government account number" />
                        {errors.bankAccountNumber && <p className="text-red-400 text-xs mt-1">{errors.bankAccountNumber}</p>}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${errors.acceptTerms ? 'bg-red-500/5 border-red-500/40' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <input type="checkbox" id="acceptTerms" className="w-4 h-4 mt-0.5 accent-blue-500"
                      checked={formData.acceptTerms} onChange={(e) => handleChange('acceptTerms', e.target.checked)} />
                    <label htmlFor="acceptTerms" className="cursor-pointer text-sm text-slate-300">
                      I accept the <span className="text-blue-400">Terms and Conditions</span> and <span className="text-blue-400">Privacy Policy</span>. I confirm the accuracy of this registration. <span className="text-red-400">*</span>
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="text-red-400 text-xs -mt-3">{errors.acceptTerms}</p>}

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="px-6 md:px-8 pb-6 pt-2 flex gap-3 border-t border-slate-800">
            {currentStep === 0 ? (
              <button type="button" onClick={() => navigate('/signup/responder-type')}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all">
                Back
              </button>
            ) : (
              <button type="button" onClick={goBack}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all">
                Previous
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button type="button" onClick={goNext}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-sm">
                Next Step
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-glow-sm">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Agency Account'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GovernmentSignupForm;
