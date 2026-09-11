import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { donationAPI, type RecipientOrg } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  Heart,
  Building2,
  Shield,
  Users,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Star,
} from 'lucide-react';

const DonatePage = () => {
  const [recipients, setRecipients] = useState<RecipientOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedRecipient, setSelectedRecipient] = useState<{
    type: 'ngo' | 'govt' | 'volunteer' | 'ricos';
    id?: string;
    name: string;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ricos_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await donationAPI.getRecipientOrgs(token);
      if (response.success) {
        setRecipients(response.organizations || []);
      } else {
        setError('Failed to load organizations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!selectedRecipient || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please select a recipient and enter a valid amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) throw new Error('Authentication required');

      const response = await donationAPI.createDonation(token, {
        amount: Number(amount),
        recipient_type: selectedRecipient.type,
        recipient_id: selectedRecipient.id,
        message: message || undefined,
      });

      if (response.success) {
        setSuccess(true);
        setAmount('');
        setMessage('');
        setSelectedRecipient(null);

        setTimeout(() => {
          alert(`Redirecting to payment page...\nDonation ID: ${response.donation_id}\n\n(This is a dummy payment integration)`);
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process donation');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'ngo':
        return <Heart className="text-red-400" size={22} />;
      case 'govt':
        return <Shield className="text-blue-400" size={22} />;
      case 'volunteer':
        return <Users className="text-green-400" size={22} />;
      default:
        return <Building2 className="text-purple-400" size={22} />;
    }
  };

  const suggestedAmounts = [100, 500, 1000, 5000];

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="space-y-1">
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Heart className="text-red-400" size={28} />
            Make a Donation
          </h1>
          <p className="text-slate-400">Support disaster response teams and help save lives</p>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
            <p className="text-green-400 text-sm font-medium">
              Thank you for your donation! Processing payment...
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Org selection */}
          <div className="lg:col-span-2 space-y-6">

            {/* RICOS Direct — Featured Card */}
            <motion.div variants={fadeInUp}>
              <div className="relative overflow-hidden rounded-xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-6">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
                {/* Recommended badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full">
                    <Star size={10} />
                    Recommended
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
                    <Building2 className="text-blue-400" size={28} />
                  </div>
                  <div className="flex-1 pr-24">
                    <h3 className="text-xl font-bold text-white mb-1">Donate to RICOS</h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      Your donation goes directly to our disaster response fund, helping us coordinate
                      relief efforts and support all responder organizations.
                    </p>
                    <button
                      onClick={() => setSelectedRecipient({ type: 'ricos', name: 'RICOS' })}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedRecipient?.type === 'ricos'
                          ? 'bg-blue-500 text-white shadow-glow'
                          : 'bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/40 hover:border-blue-400'
                      }`}
                    >
                      {selectedRecipient?.type === 'ricos' ? (
                        <>
                          <CheckCircle size={16} />
                          Selected
                        </>
                      ) : (
                        'Select RICOS'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Other Organizations */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-lg font-semibold text-white mb-4">
                Or Donate to Specific Organizations
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-blue-400" size={32} />
                </div>
              ) : recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-slate-700/50 bg-slate-900/60 text-center">
                  <Building2 className="text-slate-600 mb-3" size={40} />
                  <p className="text-slate-400 font-medium">No organizations available at the moment</p>
                  <p className="text-slate-500 text-sm mt-1">You can still donate to RICOS above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipients.map((org, i) => {
                    const isSelected = selectedRecipient?.id === org.id;
                    return (
                      <motion.button
                        key={org.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        onClick={() => setSelectedRecipient({ type: org.type, id: org.id, name: org.name })}
                        className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500/60 bg-blue-500/10 shadow-glow-sm'
                            : 'border-slate-700/50 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/60'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-slate-800/80 rounded-lg flex-shrink-0">
                            {getOrgIcon(org.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm">{org.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {org.description || `${org.type.toUpperCase()} Organization`}
                            </p>
                            {org.activeGroups > 0 && (
                              <p className="text-xs text-blue-400 mt-2 font-medium">
                                {org.activeGroups} active response groups
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right — Donation Details Panel */}
          <motion.div variants={fadeInUp} className="space-y-4">
            {/* Form Card */}
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 to-pink-400" />
              <h2 className="text-lg font-bold text-white mb-5">Donation Details</h2>

              <div className="space-y-5">
                {/* Donating To */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5">Donating to</p>
                  <p className={`font-semibold text-sm ${selectedRecipient ? 'text-white' : 'text-slate-500 italic'}`}>
                    {selectedRecipient?.name || 'Please select a recipient'}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    className="input-dark w-full"
                  />
                  {/* Quick select amounts */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {suggestedAmounts.map((s) => (
                      <button
                        key={s}
                        onClick={() => setAmount(s.toString())}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                          amount === s.toString()
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500'
                        }`}
                      >
                        ₹{s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Message <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Add a message of support..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="input-dark w-full resize-none"
                  />
                </div>

                {/* Donate Button */}
                <button
                  onClick={handleDonate}
                  disabled={submitting || !selectedRecipient || !amount}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-glow-red"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart size={18} />
                      Donate ₹{amount || '0'}
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  Secure payment powered by dummy payment gateway
                </p>
              </div>
            </div>

            {/* Info card */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <p className="text-sm text-blue-300 leading-relaxed">
                <span className="font-bold text-blue-200">100% of your donation</span> goes directly
                to the selected organization to support their disaster response efforts.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DonatePage;
