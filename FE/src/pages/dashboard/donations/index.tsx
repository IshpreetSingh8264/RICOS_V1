import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { donationAPI, type Donation } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  Heart,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  AlertTriangle,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const DonationsPage = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ricos_token');
      if (!token) { setError('No authentication token found'); return; }
      const response = await donationAPI.getReceivedDonations(token);
      if (response.success) setDonations(response.donations);
    } catch (err: any) {
      setError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalDonors = new Set(donations.map(d => d.donor_name)).size;
  const recentDonations = donations.slice(0, 5);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/15 text-green-400 border border-green-500/30';
      case 'pending': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-red-500/15 text-red-400 border border-red-500/30';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading donations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Donations</h3>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-3xl font-bold text-white">
            Donations <span className="gradient-text">Received</span>
          </h1>
          <p className="text-slate-400 mt-1">Track donations received through the RICOS platform</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Amount', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: DollarSign, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', accent: 'from-emerald-500 to-transparent', border: 'border-emerald-500/20' },
            { label: 'Total Donations', value: donations.length, icon: TrendingUp, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500 to-transparent', border: 'border-blue-500/20' },
            { label: 'Unique Donors', value: totalDonors, icon: Users, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10', accent: 'from-purple-500 to-transparent', border: 'border-purple-500/20' },
          ].map(({ label, value, icon: Icon, iconColor, iconBg, accent, border }) => (
            <motion.div
              key={label}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-xl border ${border} bg-slate-900/60 backdrop-blur-sm p-5`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={iconColor} size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Donation List */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Donations</h2>
          {donations.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Heart className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No donations received yet</p>
              <p className="text-slate-500 text-sm mt-2">Donations made through RICOS will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDonations.map((donation, index) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-4 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <Heart className="text-red-400" size={16} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{donation.donor_name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar size={12} className="text-slate-500" />
                            <span className="text-xs text-slate-400">
                              {formatDate(donation.created_at)} at {formatTime(donation.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {donation.message && (
                        <div className="ml-11 mt-2 p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-slate-300">{donation.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xl font-bold text-emerald-400">
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </p>
                      <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${getPaymentStatusStyle(donation.payment_status)}`}>
                        {donation.payment_status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Remaining donations */}
              {donations.length > 5 && (
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-white mb-3">All Donations</h3>
                  <div className="space-y-2">
                    {donations.slice(5).map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between py-2 border-b border-slate-800/80 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-white">{donation.donor_name}</p>
                            <p className="text-xs text-slate-500">{formatDate(donation.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-400">
                            ₹{donation.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{donation.payment_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Thank You Note */}
        {donations.length > 0 && (
          <motion.div
            variants={fadeInUp}
            className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-pink-500/5 p-6"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl flex-shrink-0">
                <Heart className="text-red-400" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Thank You to Our Supporters!</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Your generous donations help us respond to disasters and save lives. Every contribution
                  makes a difference in our mission to provide rapid relief and support to affected communities.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default DonationsPage;
