import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SOSButton from '@/components/SOSButton';
import {
  AlertCircle,
  MapPin,
  Phone,
  Users,
  Newspaper,
  AlertTriangle,
  Heart,
  Loader2,
  FileText,
  ArrowRight,
  User,
  Mail,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userIncidentAPI, mapAPI, sosAPI, type UserIncident, type SOSReport } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import { getSeverityConfig, getStatusConfig } from '@/lib/dashboard-utils';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myReports, setMyReports] = useState<UserIncident[]>([]);
  const [mySOS, setMySOS] = useState<SOSReport[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<number>(0);
  const [activeResponders, setActiveResponders] = useState<number>(0);
  const [userPincode, setUserPincode] = useState<string | null>(null);
  const [nearbyDisasters, setNearbyDisasters] = useState<any[]>([]);

  useEffect(() => {
    // On mount: fetch base data, then get location and re-fetch with pincode
    fetchDashboardData(null);
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) return;

      const baseUrl = (import.meta.env.VITE_USER_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');

      const userProfile = await fetch(
        `${baseUrl}/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => res.json())
        .catch(() => null);

      const pincode =
        userProfile?.pincode || userProfile?.zip_code || userProfile?.postal_code || null;

      if (pincode) {
        setUserPincode(pincode);
        // Re-fetch with the freshly obtained pincode (avoids stale closure issue)
        fetchDashboardData(pincode);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  // Accept an explicit pincode so we never rely on stale state in the closure
  const fetchDashboardData = async (pincode: string | null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ricos_token');
      if (!token) return;

      const [reportsRes, sosRes, liveMapRes] = await Promise.all([
        userIncidentAPI.getMyIncidents(token).catch(() => ({ success: false, incidents: [], total: 0 })),
        sosAPI.getMyReports(token).catch(() => ({ success: false, reports: [], total: 0 })),
        mapAPI.getLiveMapData(token).catch(() => ({ success: false, responders: [], disaster_areas: [] })),
      ]);

      if (reportsRes.success) setMyReports(reportsRes.incidents || []);
      if (sosRes.success) setMySOS(sosRes.reports || []);

      if (liveMapRes.success) {
        setActiveResponders(liveMapRes.responders?.length || 0);
        const allDisasters = liveMapRes.disaster_areas || [];
        setNearbyIncidents(allDisasters.length);

        if (pincode) {
          const matchingDisasters = allDisasters.filter(
            (disaster: any) => String(disaster.pincode) === String(pincode)
          );
          setNearbyDisasters(matchingDisasters);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'My Reports',
      value: loading ? '...' : myReports.length,
      icon: FileText,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      accent: 'from-emerald-500/20 to-transparent',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Active Incidents',
      value: loading ? '...' : nearbyIncidents,
      icon: MapPin,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      accent: 'from-blue-500/20 to-transparent',
      border: 'border-blue-500/20',
    },
    {
      label: 'Active Responders',
      value: loading ? '...' : activeResponders,
      icon: Users,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      accent: 'from-purple-500/20 to-transparent',
      border: 'border-purple-500/20',
    },
    {
      label: 'Emergency',
      value: '112',
      icon: Phone,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      accent: 'from-orange-500/20 to-transparent',
      border: 'border-orange-500/20',
    },
  ];

  const quickActions = [
    {
      label: 'View Map',
      description: 'Check disaster zones',
      icon: MapPin,
      iconColor: 'text-blue-400',
      route: '/map',
    },
    {
      label: 'Donate',
      description: 'Support responders',
      icon: Heart,
      iconColor: 'text-red-400',
      route: '/user/donate',
    },
    {
      label: 'Latest News',
      description: 'Stay informed',
      icon: Newspaper,
      iconColor: 'text-emerald-400',
      route: '/news',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">
              Welcome, <span className="gradient-text">{user?.name || 'User'}</span>!
            </h1>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-xs font-semibold tracking-wide">
              Regular User
            </span>
          </div>
          <p className="text-slate-400 text-sm">Your personal disaster management dashboard</p>
        </div>
        <div className="flex-shrink-0">
          <SOSButton />
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={fadeInUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={card.iconColor} size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* My Alerts */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-amber-400" size={20} />
            <h2 className="text-lg font-semibold text-white">My Alerts</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-400" size={28} />
            </div>
          ) : nearbyDisasters.length > 0 ? (
            <div className="space-y-3">
              {nearbyDisasters.slice(0, 3).map((disaster: any) => {
                const sevCfg = getSeverityConfig(disaster.severity);
                return (
                  <div
                    key={disaster.report_id}
                    className={`flex items-start gap-3 p-4 ${sevCfg.bg} border ${sevCfg.border} rounded-xl`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${sevCfg.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-slate-300 text-sm">
                          <span className={`font-semibold ${sevCfg.color}`}>{disaster.severity}</span>{' '}
                          disaster in your area
                          {disaster.city && ` — ${disaster.city}`}
                          {disaster.pincode && ` (PIN: ${disaster.pincode})`}
                        </p>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {new Date(disaster.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {nearbyDisasters.length > 3 && (
                <button
                  onClick={() => navigate('/map')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  View all {nearbyDisasters.length} alerts <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : mySOS.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300 text-sm">
                  No disasters in your area (PIN: {userPincode || 'Unknown'}), but you have{' '}
                  <span className="text-blue-400 font-semibold">{mySOS.length}</span> active SOS alert(s).
                </p>
              </div>
              {mySOS.slice(0, 2).map((sos) => {
                const sevCfg = getSeverityConfig(sos.severity);
                return (
                  <div
                    key={sos.id}
                    className={`flex items-start gap-3 p-4 ${sevCfg.bg} border ${sevCfg.border} rounded-xl`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${sevCfg.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-300 text-sm">
                          Your SOS — {sos.severity} | {sos.city || 'Unknown location'}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {new Date(sos.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <AlertCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm">
                {userPincode
                  ? `No active alerts in your area (PIN: ${userPincode}). Stay safe!`
                  : 'No active alerts. Stay safe!'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Reports — always visible */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <FileText className="text-slate-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Recent Reports</h2>
            </div>
            <button
              onClick={() => navigate('/user/my-reports')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-400" size={28} />
            </div>
          ) : myReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-slate-700/50 bg-slate-800/30 text-center">
              <FileText className="text-slate-600 mb-3" size={36} />
              <p className="text-slate-400 text-sm font-medium">No incident reports yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Use the SOS button above to report an emergency
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myReports.slice(0, 3).map((report) => {
                const sevCfg = getSeverityConfig(report.severity);
                const statusCfg = getStatusConfig(report.status);
                return (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all duration-200 cursor-pointer"
                    onClick={() => navigate('/user/my-reports')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {report.is_sos && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-400 font-semibold">
                            SOS
                          </span>
                        )}
                        <span className={`px-2 py-0.5 ${sevCfg.bg} border ${sevCfg.border} rounded text-xs ${sevCfg.color}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-0.5 ${statusCfg.bg} border ${statusCfg.border} rounded text-xs ${statusCfg.color}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {report.city || 'Unknown'}, PIN: {report.pincode || 'N/A'}
                      </p>
                      {report.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{report.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className="group flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all duration-200 text-left"
                >
                  <div className="p-2.5 bg-slate-700/60 group-hover:bg-slate-700 rounded-lg transition-colors">
                    <Icon className={action.iconColor} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{action.label}</p>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </div>
                  <ArrowRight className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Profile Summary */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-slate-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
              <User className="text-slate-500" size={16} />
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm text-white font-medium">{user?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
              <Mail className="text-slate-500" size={16} />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
              <Phone className="text-slate-500" size={16} />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-white font-medium">
                  {user?.phone || (user as any)?.phone_number || 'Not provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
              <Shield className="text-slate-500" size={16} />
              <div>
                <p className="text-xs text-slate-500">Account Type</p>
                <p className="text-sm text-white font-medium">Regular User</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserDashboard;
