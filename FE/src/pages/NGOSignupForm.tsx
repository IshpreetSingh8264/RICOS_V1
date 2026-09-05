import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, formatErrorMessage } from '@/lib/api';
import type { NGOSignupData } from '@/lib/api';
import { stepForward, stepBackward } from '@/lib/motion-variants';

const STEPS = ['Organization', 'Contact & Address', 'Admin POC', 'Capabilities & Terms'];

const NGOSignupForm = () => {
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
    ngoName: '',
    registrationNumber: '',
    ngoType: '',
    yearEstablished: '',
    missionStatement: '',
    officialEmail: '',
    officialContact: '',
    alternateContact: '',
    website: '',
    registeredAddress: '',
    operationalAreas: '',
    locationCoordinates: '',
    adminName: '',
    designation: '',
    adminMobile: '',
    adminEmail: '',
    aadharCard: '',
    resourceTypes: '',
    resourceCapacity: '',
    teamStrength: '',
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
      if (!formData.ngoName.trim()) newErrors.ngoName = 'NGO name is required';
      if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
      if (!formData.ngoType) newErrors.ngoType = 'NGO type is required';
      if (!formData.yearEstablished) newErrors.yearEstablished = 'Year of establishment is required';
      if (!formData.missionStatement.trim()) newErrors.missionStatement = 'Mission statement is required';
    } else if (step === 1) {
      if (!formData.officialEmail.trim()) newErrors.officialEmail = 'Official email is required';
      if (!formData.officialContact.trim()) newErrors.officialContact = 'Official contact is required';
      if (!formData.registeredAddress.trim()) newErrors.registeredAddress = 'Registered address is required';
      if (!formData.operationalAreas.trim()) newErrors.operationalAreas = 'Operational areas are required';
    } else if (step === 2) {
      if (!formData.adminName.trim()) newErrors.adminName = 'Admin name is required';
      if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
      if (!formData.adminMobile.trim()) newErrors.adminMobile = 'Admin mobile is required';
      if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required';
      if (!formData.aadharCard.trim()) newErrors.aadharCard = 'Aadhar card is required';
    } else if (step === 3) {
      if (!formData.resourceTypes.trim()) newErrors.resourceTypes = 'Resource types are required';
      if (!formData.teamStrength.trim()) newErrors.teamStrength = 'Team strength is required';
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
      let locationLat: number | undefined;
      let locationLng: number | undefined;
      if (formData.locationCoordinates) {
        const coords = formData.locationCoordinates.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          locationLat = coords[0];
          locationLng = coords[1];
        }
      }

      const operationalAreas = formData.operationalAreas.split(',').map(a => a.trim()).filter(Boolean);
      const resourceTypes = formData.resourceTypes.split(',').map(t => t.trim()).filter(Boolean);

      const signupData: NGOSignupData = {
        ngo_name: formData.ngoName,
        registration_number: formData.registrationNumber,
        ngo_type: formData.ngoType,
        year_established: parseInt(formData.yearEstablished, 10),
        mission_statement: formData.missionStatement || undefined,
        email,
        password,
        official_contact: formData.officialContact,
        alternate_contact: formData.alternateContact || undefined,
        website: formData.website || undefined,
        registered_address: formData.registeredAddress,
        operational_areas: operationalAreas,
        location_lat: locationLat,
        location_lng: locationLng,
        admin_name: formData.adminName,
        admin_designation: formData.designation,
        admin_mobile: formData.adminMobile,
        admin_email: formData.adminEmail,
        aadhar_card: formData.aadharCard,
        resource_types: resourceTypes.length > 0 ? resourceTypes : undefined,
        team_strength: formData.teamStrength ? parseInt(formData.teamStrength, 10) : undefined,
        bank_account_number: formData.bankAccountNumber,
      };

      const response = await authAPI.signupNGO(signupData);
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
      console.error('NGO signup error:', error);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">RICOS</h1>
          <p className="text-slate-400 text-sm">NGO Registration</p>
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
              {/* Step 1: Organization */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Organization Details</h2>
                    <p className="text-slate-400 text-sm mt-1">Tell us about your organization</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">NGO Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.ngoName ? 'border-red-500/70' : ''}`}
                        value={formData.ngoName} onChange={(e) => handleChange('ngoName', e.target.value)} placeholder="Organization name" />
                      {errors.ngoName && <p className="text-red-400 text-xs mt-1">{errors.ngoName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Registration Number <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.registrationNumber ? 'border-red-500/70' : ''}`}
                        value={formData.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} />
                      {errors.registrationNumber && <p className="text-red-400 text-xs mt-1">{errors.registrationNumber}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Type of NGO <span className="text-red-400">*</span></label>
                      <select className={`select-dark ${errors.ngoType ? 'border-red-500/70' : ''}`}
                        value={formData.ngoType} onChange={(e) => handleChange('ngoType', e.target.value)}>
                        <option value="">Select type</option>
                        <option value="relief">Relief</option>
                        <option value="medical">Medical</option>
                        <option value="animal-rescue">Animal Rescue</option>
                        <option value="food">Food Distribution</option>
                        <option value="shelter">Shelter</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.ngoType && <p className="text-red-400 text-xs mt-1">{errors.ngoType}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Year Established <span className="text-red-400">*</span></label>
                      <input type="number" className={`input-dark ${errors.yearEstablished ? 'border-red-500/70' : ''}`}
                        value={formData.yearEstablished} onChange={(e) => handleChange('yearEstablished', e.target.value)} placeholder="e.g. 2005" />
                      {errors.yearEstablished && <p className="text-red-400 text-xs mt-1">{errors.yearEstablished}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Mission Statement <span className="text-red-400">*</span></label>
                      <textarea
                        className={`w-full min-h-[90px] rounded-lg border bg-slate-800/80 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none transition-colors focus:ring-1 focus:ring-blue-500/50 ${errors.missionStatement ? 'border-red-500/70' : 'border-slate-700/60 focus:border-blue-500/60'}`}
                        value={formData.missionStatement} onChange={(e) => handleChange('missionStatement', e.target.value)}
                        placeholder="Brief description of your organization's mission" />
                      {errors.missionStatement && <p className="text-red-400 text-xs mt-1">{errors.missionStatement}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Contact & Address</h2>
                    <p className="text-slate-400 text-sm mt-1">How can we reach your organization?</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Official Email <span className="text-red-400">*</span></label>
                      <input type="email" className={`input-dark ${errors.officialEmail ? 'border-red-500/70' : ''}`}
                        value={formData.officialEmail} onChange={(e) => handleChange('officialEmail', e.target.value)} />
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
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Website</label>
                      <input type="url" className="input-dark" value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Registered Office Address <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.registeredAddress ? 'border-red-500/70' : ''}`}
                        value={formData.registeredAddress} onChange={(e) => handleChange('registeredAddress', e.target.value)} />
                      {errors.registeredAddress && <p className="text-red-400 text-xs mt-1">{errors.registeredAddress}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Operational Areas <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.operationalAreas ? 'border-red-500/70' : ''}`}
                        value={formData.operationalAreas} onChange={(e) => handleChange('operationalAreas', e.target.value)}
                        placeholder="State / District / Pincode (comma-separated)" />
                      {errors.operationalAreas && <p className="text-red-400 text-xs mt-1">{errors.operationalAreas}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Primary Location Coordinates</label>
                      <input type="text" className="input-dark" value={formData.locationCoordinates}
                        onChange={(e) => handleChange('locationCoordinates', e.target.value)} placeholder="Lat, Long (optional)" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Admin POC */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Point of Contact / Admin</h2>
                    <p className="text-slate-400 text-sm mt-1">Primary administrator details</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Admin Full Name <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.adminName ? 'border-red-500/70' : ''}`}
                        value={formData.adminName} onChange={(e) => handleChange('adminName', e.target.value)} />
                      {errors.adminName && <p className="text-red-400 text-xs mt-1">{errors.adminName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Designation <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.designation ? 'border-red-500/70' : ''}`}
                        value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} />
                      {errors.designation && <p className="text-red-400 text-xs mt-1">{errors.designation}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Admin Mobile <span className="text-red-400">*</span></label>
                      <input type="tel" className={`input-dark ${errors.adminMobile ? 'border-red-500/70' : ''}`}
                        value={formData.adminMobile} onChange={(e) => handleChange('adminMobile', e.target.value)} />
                      {errors.adminMobile && <p className="text-red-400 text-xs mt-1">{errors.adminMobile}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Admin Email <span className="text-red-400">*</span></label>
                      <input type="email" className={`input-dark ${errors.adminEmail ? 'border-red-500/70' : ''}`}
                        value={formData.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} />
                      {errors.adminEmail && <p className="text-red-400 text-xs mt-1">{errors.adminEmail}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Aadhar Card <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.aadharCard ? 'border-red-500/70' : ''}`}
                        value={formData.aadharCard} onChange={(e) => handleChange('aadharCard', e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                      {errors.aadharCard && <p className="text-red-400 text-xs mt-1">{errors.aadharCard}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Capabilities & Terms */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Capabilities & Terms</h2>
                    <p className="text-slate-400 text-sm mt-1">Resources, capacity, and agreement</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Type of Resources <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.resourceTypes ? 'border-red-500/70' : ''}`}
                        value={formData.resourceTypes} onChange={(e) => handleChange('resourceTypes', e.target.value)}
                        placeholder="Ambulance, Doctors, Volunteers, Food kits (comma-separated)" />
                      {errors.resourceTypes && <p className="text-red-400 text-xs mt-1">{errors.resourceTypes}</p>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Resource Capacity</label>
                        <input type="text" className="input-dark" value={formData.resourceCapacity}
                          onChange={(e) => handleChange('resourceCapacity', e.target.value)} placeholder="Optional" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Team Strength <span className="text-red-400">*</span></label>
                        <input type="number" className={`input-dark ${errors.teamStrength ? 'border-red-500/70' : ''}`}
                          value={formData.teamStrength} onChange={(e) => handleChange('teamStrength', e.target.value)} placeholder="Number of on-ground personnel" />
                        {errors.teamStrength && <p className="text-red-400 text-xs mt-1">{errors.teamStrength}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Bank Account Number <span className="text-red-400">*</span></label>
                      <input type="text" className={`input-dark ${errors.bankAccountNumber ? 'border-red-500/70' : ''}`}
                        value={formData.bankAccountNumber} onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                        placeholder="Required for fund transfers" />
                      {errors.bankAccountNumber && <p className="text-red-400 text-xs mt-1">{errors.bankAccountNumber}</p>}
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${errors.acceptTerms ? 'bg-red-500/5 border-red-500/40' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <input type="checkbox" id="acceptTerms" className="w-4 h-4 mt-0.5 accent-blue-500"
                      checked={formData.acceptTerms} onChange={(e) => handleChange('acceptTerms', e.target.checked)} />
                    <label htmlFor="acceptTerms" className="cursor-pointer text-sm text-slate-300">
                      I accept the <span className="text-blue-400">Terms and Conditions</span> and <span className="text-blue-400">Privacy Policy</span>. I confirm that the information provided is accurate. <span className="text-red-400">*</span>
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
                ) : 'Create NGO Account'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NGOSignupForm;
