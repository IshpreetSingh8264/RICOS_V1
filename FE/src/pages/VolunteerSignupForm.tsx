import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, formatErrorMessage } from '@/lib/api';
import type { VolunteerSignupData } from '@/lib/api';
import { stepForward, stepBackward } from '@/lib/motion-variants';

const STEPS = ['Group Info', 'Group Leader', 'Skills & Capabilities', 'Terms'];

const VolunteerSignupForm = () => {
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
    groupName: '',
    groupType: '',
    registrationStatus: '',
    groupSize: '',
    operationalAreas: '',
    socialMediaLink: '',
    leaderName: '',
    leaderContact: '',
    leaderEmail: '',
    leaderAddress: '',
    idProof: '',
    medicalTraining: false,
    firstAidCertified: false,
    vehicleAvailable: false,
    languagesSpoken: '',
    skillset: '',
    acceptTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.groupName.trim()) newErrors.groupName = 'Group name is required';
      if (!formData.groupType) newErrors.groupType = 'Group type is required';
      if (!formData.groupSize.trim()) newErrors.groupSize = 'Group size is required';
      if (!formData.operationalAreas.trim()) newErrors.operationalAreas = 'Operational areas are required';
    } else if (step === 1) {
      if (!formData.leaderName.trim()) newErrors.leaderName = 'Leader name is required';
      if (!formData.leaderContact.trim()) newErrors.leaderContact = 'Leader contact is required';
      if (!formData.leaderEmail.trim()) newErrors.leaderEmail = 'Leader email is required';
      if (!formData.leaderAddress.trim()) newErrors.leaderAddress = 'Leader address is required';
    } else if (step === 2) {
      if (!formData.languagesSpoken.trim()) newErrors.languagesSpoken = 'Languages are required';
      if (!formData.skillset.trim()) newErrors.skillset = 'Skillset is required';
    } else if (step === 3) {
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
      const operationalAreas = formData.operationalAreas.split(',').map(a => a.trim()).filter(Boolean);
      const languagesSpoken = formData.languagesSpoken.split(',').map(l => l.trim()).filter(Boolean);

      const signupData: VolunteerSignupData = {
        group_name: formData.groupName,
        volunteer_type: formData.groupType || 'group',
        group_size: parseInt(formData.groupSize, 10),
        operational_areas: operationalAreas,
        email,
        password,
        social_media_link: formData.socialMediaLink || undefined,
        leader_name: formData.leaderName,
        leader_phone: formData.leaderContact,
        leader_email: formData.leaderEmail,
        id_proof: formData.idProof || undefined,
        has_medical_training: formData.medicalTraining || undefined,
        has_first_aid_cert: formData.firstAidCertified || undefined,
        has_vehicle: formData.vehicleAvailable || undefined,
        languages_spoken: languagesSpoken,
      };

      const response = await authAPI.signupVolunteer(signupData);
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
      console.error('Volunteer signup error:', error);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">RICOS</h1>
          <p className="text-slate-400 text-sm">Volunteer Group Registration</p>
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
              {/* Step 1: Group Info */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Group Information</h2>
                    <p className="text-slate-400 text-sm mt-1">Tell us about your volunteer group</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Group Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.groupName ? 'border-red-500/70' : ''}`}
                        value={formData.groupName} onChange={(e) => handleChange('groupName', e.target.value)} />
                      {errors.groupName && <p className="text-red-400 text-xs mt-1">{errors.groupName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Group Type <span className="text-red-400">*</span></label>
                      <select className={`select-dark ${errors.groupType ? 'border-red-500/70' : ''}`}
                        value={formData.groupType} onChange={(e) => handleChange('groupType', e.target.value)}>
                        <option value="">Select type</option>
                        <option value="community">Community Group</option>
                        <option value="youth">Youth Group</option>
                        <option value="rescue">Rescue Team</option>
                        <option value="medical">Medical Volunteers</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.groupType && <p className="text-red-400 text-xs mt-1">{errors.groupType}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Registration Status</label>
                      <select className="select-dark" value={formData.registrationStatus}
                        onChange={(e) => handleChange('registrationStatus', e.target.value)}>
                        <option value="">Select status</option>
                        <option value="registered">Registered</option>
                        <option value="informal">Informal Group</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Group Size <span className="text-red-400">*</span></label>
                      <input type="number" className={`input-dark ${errors.groupSize ? 'border-red-500/70' : ''}`}
                        value={formData.groupSize} onChange={(e) => handleChange('groupSize', e.target.value)}
                        placeholder="Number of members" />
                      {errors.groupSize && <p className="text-red-400 text-xs mt-1">{errors.groupSize}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Operational Areas <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.operationalAreas ? 'border-red-500/70' : ''}`}
                        value={formData.operationalAreas} onChange={(e) => handleChange('operationalAreas', e.target.value)}
                        placeholder="Areas where group operates (comma-separated)" />
                      {errors.operationalAreas && <p className="text-red-400 text-xs mt-1">{errors.operationalAreas}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Social Media Link</label>
                      <input type="text" className="input-dark" value={formData.socialMediaLink}
                        onChange={(e) => handleChange('socialMediaLink', e.target.value)}
                        placeholder="Facebook, Instagram, or website link (optional)" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Group Leader */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Group Leader</h2>
                    <p className="text-slate-400 text-sm mt-1">Point of contact for your group</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Leader Full Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.leaderName ? 'border-red-500/70' : ''}`}
                        value={formData.leaderName} onChange={(e) => handleChange('leaderName', e.target.value)} />
                      {errors.leaderName && <p className="text-red-400 text-xs mt-1">{errors.leaderName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Leader Contact <span className="text-red-400">*</span></label>
                      <input type="tel" className={`input-dark ${errors.leaderContact ? 'border-red-500/70' : ''}`}
                        value={formData.leaderContact} onChange={(e) => handleChange('leaderContact', e.target.value)} />
                      {errors.leaderContact && <p className="text-red-400 text-xs mt-1">{errors.leaderContact}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Leader Email <span className="text-red-400">*</span></label>
                      <input type="email" className={`input-dark ${errors.leaderEmail ? 'border-red-500/70' : ''}`}
                        value={formData.leaderEmail} onChange={(e) => handleChange('leaderEmail', e.target.value)} />
                      {errors.leaderEmail && <p className="text-red-400 text-xs mt-1">{errors.leaderEmail}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Leader Address <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.leaderAddress ? 'border-red-500/70' : ''}`}
                        value={formData.leaderAddress} onChange={(e) => handleChange('leaderAddress', e.target.value)} />
                      {errors.leaderAddress && <p className="text-red-400 text-xs mt-1">{errors.leaderAddress}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">ID Proof</label>
                      <input type="text" className="input-dark" value={formData.idProof}
                        onChange={(e) => handleChange('idProof', e.target.value)}
                        placeholder="Aadhar, Voter ID, or other government ID (optional)" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Skills & Capabilities */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Skills & Capabilities</h2>
                    <p className="text-slate-400 text-sm mt-1">What can your group bring to disaster response?</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">Capabilities</p>
                    {[
                      { id: 'medicalTraining', label: 'Medical Training Available', field: 'medicalTraining' },
                      { id: 'firstAidCertified', label: 'First-Aid Certified Members', field: 'firstAidCertified' },
                      { id: 'vehicleAvailable', label: 'Vehicle Available for Emergency', field: 'vehicleAvailable' },
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                        <input type="checkbox" id={item.id} className="w-4 h-4 accent-blue-500"
                          checked={formData[item.field as keyof typeof formData] as boolean}
                          onChange={(e) => handleChange(item.field, e.target.checked)} />
                        <label htmlFor={item.id} className="cursor-pointer text-sm text-slate-300">{item.label}</label>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Languages Spoken by Members <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.languagesSpoken ? 'border-red-500/70' : ''}`}
                        value={formData.languagesSpoken} onChange={(e) => handleChange('languagesSpoken', e.target.value)}
                        placeholder="English, Hindi, Punjabi (comma-separated)" />
                      {errors.languagesSpoken && <p className="text-red-400 text-xs mt-1">{errors.languagesSpoken}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Member Skillset <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.skillset ? 'border-red-500/70' : ''}`}
                        value={formData.skillset} onChange={(e) => handleChange('skillset', e.target.value)}
                        placeholder="Rescue, Relief distribution, Medical aid, etc." />
                      {errors.skillset && <p className="text-red-400 text-xs mt-1">{errors.skillset}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Terms */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Review & Accept Terms</h2>
                    <p className="text-slate-400 text-sm mt-1">Almost done — please review and agree to proceed</p>
                  </div>

                  {/* Summary */}
                  <div className="space-y-3">
                    {[
                      { label: 'Group', value: formData.groupName },
                      { label: 'Type', value: formData.groupType },
                      { label: 'Size', value: formData.groupSize + ' members' },
                      { label: 'Leader', value: formData.leaderName },
                    ].map(item => item.value && (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm text-slate-300 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${errors.acceptTerms ? 'bg-red-500/5 border-red-500/40' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <input type="checkbox" id="acceptTerms" className="w-4 h-4 mt-0.5 accent-blue-500"
                      checked={formData.acceptTerms} onChange={(e) => handleChange('acceptTerms', e.target.checked)} />
                    <label htmlFor="acceptTerms" className="cursor-pointer text-sm text-slate-300">
                      I accept the <span className="text-blue-400">Terms and Conditions</span> and <span className="text-blue-400">Privacy Policy</span>. I confirm that my group is committed to emergency response coordination. <span className="text-red-400">*</span>
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
                ) : 'Create Group Account'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VolunteerSignupForm;
