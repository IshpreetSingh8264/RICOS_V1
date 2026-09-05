import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Eye, EyeOff, AlertCircle, ArrowRight, Shield, Users, MapPin } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => { setEmail(''); setPassword(''); setError(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) setError('Invalid email or password');
      else navigate('/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    sessionStorage.setItem('signup_email', email);
    sessionStorage.setItem('signup_password', password);
    navigate('/signup');
  };

  const stats = [
    { icon: <Shield size={16} />, label: 'Secured Platform' },
    { icon: <Users size={16} />, label: '340+ Responders' },
    { icon: <MapPin size={16} />, label: '36 Districts Covered' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Left Panel — Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(99,102,241,0.08), transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/logo.svg" alt="RICOS" className="w-12 h-12" />
          <div>
            <div className="text-xl font-bold text-white">RICOS</div>
            <div className="text-xs text-slate-500">Rapid Incident Coordination Suite</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Activity size={11} className="animate-pulse" />
            Live Platform
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Coordinating<br />
            <span className="gradient-text">Crisis Response</span><br />
            Across Punjab
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
            RICOS connects government agencies, NGOs, and volunteers on a unified platform
            to save lives during Punjab's flood disasters.
          </p>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 glass-card px-4 py-3 w-fit"
              >
                <span className="text-blue-400">{stat.icon}</span>
                <span className="text-sm text-slate-300 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-slate-600">
          © 2026 RICOS — Built for SDG Goal 9
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 relative">
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(59,130,246,0.08), transparent 60%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src="/images/logo.svg" alt="RICOS" className="w-10 h-10" />
            <span className="text-lg font-bold text-white">RICOS</span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-900/60 border border-blue-500/15 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                  <p className="text-slate-400 text-sm">Sign in to your crisis dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-blue-500/20 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-900/80 border border-blue-500/20 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"
                      >
                        <AlertCircle size={13} className="shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-glow-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>Sign In <ArrowRight size={15} /></>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
                  <p className="text-slate-400 text-sm">First, set up your login credentials</p>
                </div>

                <form onSubmit={handleSignupContinue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-blue-500/20 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-900/80 border border-blue-500/20 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Next:</strong> Choose your account type —
                    User (individual) or Responder (NGO / Government / Volunteer Group)
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"
                      >
                        <AlertCircle size={13} className="shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-glow-sm"
                  >
                    Continue to Account Type
                    <ArrowRight size={15} />
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
