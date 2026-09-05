import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, formatErrorMessage } from '@/lib/api';
import type { UserSignupData } from '@/lib/api';
import { stepForward, stepBackward } from '@/lib/motion-variants';

const STEPS = ['Personal', 'Contact & Address', 'Medical & Emergency', 'Language & Terms'];

const UserSignupForm = () => {
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
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    alternatePhone: '',
    currentAddress: '',
    pincode: '',
    city: '',
    state: '',
    country: '',
    liveLocationPermission: false,
    homeLocationCoordinates: '',
    aadharId: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: '',
    disabilities: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    primaryLanguage: '',
    secondaryLanguage: '',
    communicationAssistance: '',
    acceptTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    } else if (step === 1) {
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Address is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
      if (!formData.aadharId.trim()) newErrors.aadharId = 'Aadhar ID is required';
    } else if (step === 2) {
      if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Relationship is required';
      if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (step === 3) {
      if (!formData.primaryLanguage.trim()) newErrors.primaryLanguage = 'Primary language is required';
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
      let homeLat: number | undefined;
      let homeLng: number | undefined;
      if (formData.homeLocationCoordinates) {
        const coords = formData.homeLocationCoordinates.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          homeLat = coords[0];
          homeLng = coords[1];
        }
      }

      const signupData: UserSignupData = {
        full_name: formData.fullName,
        dob: formData.dateOfBirth,
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        alternate_phone: formData.alternatePhone || undefined,
        email,
        password,
        current_address: formData.currentAddress,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        aadhar_id: formData.aadharId,
        blood_group: formData.bloodGroup || undefined,
        medical_conditions: formData.medicalConditions || undefined,
        allergies: formData.allergies || undefined,
        disabilities: formData.disabilities || undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_relation: formData.emergencyContactRelationship,
        emergency_contact_phone: formData.emergencyContactPhone,
        primary_language: formData.primaryLanguage,
        secondary_language: formData.secondaryLanguage || undefined,
        communication_assistance: formData.communicationAssistance === 'yes',
        live_location_permission: formData.liveLocationPermission,
        home_location_lat: homeLat,
        home_location_lng: homeLng,
      };

      const response = await authAPI.signupUser(signupData);
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
      console.error('Signup error:', error);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">RICOS</h1>
          <p className="text-slate-400 text-sm">Civilian Registration</p>
        </div>

        {/* Step Progress */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-blue-500 text-white'
                    : i === currentStep
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}>
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
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
          {/* Progress bar */}
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
              {/* Step 1: Personal */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Personal Details</h2>
                    <p className="text-slate-400 text-sm mt-1">Tell us about yourself</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Full Name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.fullName ? 'border-red-500/70 focus:border-red-500' : ''}`}
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="Your full name"
                      />
                      {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Date of Birth <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        className={`input-dark ${errors.dateOfBirth ? 'border-red-500/70 focus:border-red-500' : ''}`}
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      />
                      {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Gender</label>
                      <select
                        className="select-dark"
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Contact & Address</h2>
                    <p className="text-slate-400 text-sm mt-1">How can we reach you?</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Phone Number <span className="text-red-400">*</span></label>
                      <input
                        type="tel"
                        className={`input-dark ${errors.phoneNumber ? 'border-red-500/70' : ''}`}
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                      />
                      {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Alternate Phone</label>
                      <input
                        type="tel"
                        className="input-dark"
                        value={formData.alternatePhone}
                        onChange={(e) => handleChange('alternatePhone', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Email Address</label>
                      <input
                        type="email"
                        className="input-dark opacity-60 cursor-not-allowed"
                        value={email}
                        disabled
                      />
                      <p className="text-xs text-slate-500">Set during account creation</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Aadhar ID <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.aadharId ? 'border-red-500/70' : ''}`}
                        value={formData.aadharId}
                        onChange={(e) => handleChange('aadharId', e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                      />
                      {errors.aadharId && <p className="text-red-400 text-xs mt-1">{errors.aadharId}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Current Address <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.currentAddress ? 'border-red-500/70' : ''}`}
                        value={formData.currentAddress}
                        onChange={(e) => handleChange('currentAddress', e.target.value)}
                        placeholder="House/Flat, Street, Area"
                      />
                      {errors.currentAddress && <p className="text-red-400 text-xs mt-1">{errors.currentAddress}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Pincode <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.pincode ? 'border-red-500/70' : ''}`}
                        value={formData.pincode}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        placeholder="6-digit pincode"
                      />
                      {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">City <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.city ? 'border-red-500/70' : ''}`}
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                      />
                      {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">State <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.state ? 'border-red-500/70' : ''}`}
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                      />
                      {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Country <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.country ? 'border-red-500/70' : ''}`}
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="India"
                      />
                      {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <input
                        type="checkbox"
                        id="liveLocationPermission"
                        className="w-4 h-4 accent-blue-500"
                        checked={formData.liveLocationPermission}
                        onChange={(e) => handleChange('liveLocationPermission', e.target.checked)}
                      />
                      <label htmlFor="liveLocationPermission" className="cursor-pointer text-sm text-slate-300">
                        Allow live location tracking for emergency response
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Medical & Emergency */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Medical & Emergency</h2>
                    <p className="text-slate-400 text-sm mt-1">Critical information for disaster response</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Blood Group <span className="text-red-400">*</span></label>
                      <select
                        className={`select-dark ${errors.bloodGroup ? 'border-red-500/70' : ''}`}
                        value={formData.bloodGroup}
                        onChange={(e) => handleChange('bloodGroup', e.target.value)}
                      >
                        <option value="">Select blood group</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      {errors.bloodGroup && <p className="text-red-400 text-xs mt-1">{errors.bloodGroup}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Medical Conditions</label>
                      <input
                        type="text"
                        className="input-dark"
                        value={formData.medicalConditions}
                        onChange={(e) => handleChange('medicalConditions', e.target.value)}
                        placeholder="Asthma, heart conditions, etc."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Allergies</label>
                      <input
                        type="text"
                        className="input-dark"
                        value={formData.allergies}
                        onChange={(e) => handleChange('allergies', e.target.value)}
                        placeholder="Any known allergies"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Disabilities / Mobility Limitations</label>
                      <input
                        type="text"
                        className="input-dark"
                        value={formData.disabilities}
                        onChange={(e) => handleChange('disabilities', e.target.value)}
                        placeholder="If any"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Emergency Contact</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Contact Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          className={`input-dark ${errors.emergencyContactName ? 'border-red-500/70' : ''}`}
                          value={formData.emergencyContactName}
                          onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                        />
                        {errors.emergencyContactName && <p className="text-red-400 text-xs mt-1">{errors.emergencyContactName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Relationship <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          className={`input-dark ${errors.emergencyContactRelationship ? 'border-red-500/70' : ''}`}
                          value={formData.emergencyContactRelationship}
                          onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                          placeholder="Parent, Spouse, etc."
                        />
                        {errors.emergencyContactRelationship && <p className="text-red-400 text-xs mt-1">{errors.emergencyContactRelationship}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Contact Phone <span className="text-red-400">*</span></label>
                        <input
                          type="tel"
                          className={`input-dark ${errors.emergencyContactPhone ? 'border-red-500/70' : ''}`}
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                        />
                        {errors.emergencyContactPhone && <p className="text-red-400 text-xs mt-1">{errors.emergencyContactPhone}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Language & Terms */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Language & Terms</h2>
                    <p className="text-slate-400 text-sm mt-1">Communication preferences and agreement</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Primary Language <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className={`input-dark ${errors.primaryLanguage ? 'border-red-500/70' : ''}`}
                        value={formData.primaryLanguage}
                        onChange={(e) => handleChange('primaryLanguage', e.target.value)}
                        placeholder="e.g. Hindi"
                      />
                      {errors.primaryLanguage && <p className="text-red-400 text-xs mt-1">{errors.primaryLanguage}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Secondary Language</label>
                      <input
                        type="text"
                        className="input-dark"
                        value={formData.secondaryLanguage}
                        onChange={(e) => handleChange('secondaryLanguage', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-300">Communication Assistance</label>
                      <select
                        className="select-dark"
                        value={formData.communicationAssistance}
                        onChange={(e) => handleChange('communicationAssistance', e.target.value)}
                      >
                        <option value="">None needed</option>
                        <option value="hearing">Hearing Impairment</option>
                        <option value="visual">Visual Impairment</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${errors.acceptTerms ? 'bg-red-500/5 border-red-500/40' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      className="w-4 h-4 mt-0.5 accent-blue-500"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                    />
                    <label htmlFor="acceptTerms" className="cursor-pointer text-sm text-slate-300">
                      I accept the <span className="text-blue-400">Terms and Conditions</span> and <span className="text-blue-400">Privacy Policy</span>. I consent to sharing my data with RICOS for disaster response coordination. <span className="text-red-400">*</span>
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
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
              >
                Previous
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-sm"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-glow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create User Account'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSignupForm;
